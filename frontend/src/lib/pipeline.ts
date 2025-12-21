/**
 * パイプライン管理ユーティリティ
 * 案件の下書き→応募済み→受注/履歴の流れを管理
 *
 * API版: Supabaseにデータを保存
 */

import { Job, PipelineStatus, isExpired } from "@/types/job";
import {
  getAllPipelineJobs as fetchAllPipelineJobs,
  getPipelineJobsByStatus,
  addToPipeline as apiAddToPipeline,
  changeJobStatus as apiChangeJobStatus,
  removeJobFromAllPipelines,
  getPipelineSummary,
  PipelineJob as ApiPipelineJob,
  PipelineStatus as ApiPipelineStatus,
} from "@/lib/api";

// LocalStorage keys（フォールバック用）
const STORAGE_KEYS = {
  drafts: "proposal-generator-drafts",
  submitted: "proposal-generator-submitted",
  ongoing: "proposal-generator-ongoing",
  history: "proposal-generator-history",
} as const;

export interface PipelineJob extends Job {
  pipeline_status: PipelineStatus;
  added_at: string;
  expired_at?: string;
}

// ステージとAPIステータスのマッピング
const stageToApiStatus: Record<keyof typeof STORAGE_KEYS, ApiPipelineStatus> = {
  drafts: "draft",
  submitted: "submitted",
  ongoing: "ongoing",
  history: "expired", // 履歴は複数のステータスを含むが、デフォルトはexpired
};

const apiStatusToStage: Record<ApiPipelineStatus, keyof typeof STORAGE_KEYS> = {
  draft: "drafts",
  submitted: "submitted",
  ongoing: "ongoing",
  expired: "history",
  rejected: "history",
  completed: "history",
};

// APIからのパイプライン情報（ジョブ詳細なし）
export interface PipelineInfo {
  job_id: string;
  pipeline_status: PipelineStatus;
  added_at: string;
  status_changed_at: string;
  notes: string;
}

/**
 * APIからパイプライン情報を取得（ジョブ詳細なし）
 */
export async function getPipelineJobsAsync(stage: keyof typeof STORAGE_KEYS): Promise<PipelineInfo[]> {
  try {
    const apiStatus = stageToApiStatus[stage];
    let statuses: ApiPipelineStatus[];

    // 履歴は複数のステータスを含む
    if (stage === "history") {
      statuses = ["expired", "rejected", "completed"];
    } else {
      statuses = [apiStatus];
    }

    const allJobs: ApiPipelineJob[] = [];
    for (const status of statuses) {
      const result = await getPipelineJobsByStatus(status);
      if (result.success) {
        allJobs.push(...result.jobs);
      }
    }

    // APIのPipelineJobをPipelineInfoに変換
    return allJobs.map((apiJob) => ({
      job_id: apiJob.job_id,
      pipeline_status: apiJob.pipeline_status as PipelineStatus,
      added_at: apiJob.added_at,
      status_changed_at: apiJob.status_changed_at,
      notes: apiJob.notes || "",
    }));
  } catch (error) {
    console.error("Failed to fetch pipeline jobs from API:", error);
    return [];
  }
}

/**
 * LocalStorageからパイプライン案件を取得（フォールバック）
 */
export function getPipelineJobs(stage: keyof typeof STORAGE_KEYS): PipelineJob[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS[stage]);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * LocalStorageにパイプライン案件を保存（フォールバック）
 */
export function savePipelineJobs(stage: keyof typeof STORAGE_KEYS, jobs: PipelineJob[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS[stage], JSON.stringify(jobs));
}

/**
 * 案件をパイプラインに追加（API版）
 */
export async function addToPipelineAsync(
  job: Job,
  stage: "drafts" | "submitted" | "ongoing"
): Promise<PipelineJob> {
  const apiStatus = stageToApiStatus[stage];
  const jobId = job.job_id || "";

  if (jobId) {
    try {
      await apiAddToPipeline(jobId, apiStatus);
    } catch (error) {
      console.error("Failed to add to pipeline via API:", error);
    }
  }

  // ローカル状態用のオブジェクトを返す
  return {
    ...job,
    pipeline_status: apiStatus as PipelineStatus,
    added_at: new Date().toISOString(),
  };
}

/**
 * 案件をパイプラインに追加（同期版、LocalStorage）
 */
export function addToPipeline(job: Job, stage: "drafts" | "submitted" | "ongoing"): PipelineJob {
  const pipelineJob: PipelineJob = {
    ...job,
    pipeline_status: stage === "drafts" ? "draft" : stage === "submitted" ? "submitted" : "ongoing",
    added_at: new Date().toISOString(),
  };

  const jobs = getPipelineJobs(stage);

  // 重複チェック
  if (!jobs.some((j) => j.job_id === job.job_id)) {
    jobs.unshift(pipelineJob);
    savePipelineJobs(stage, jobs);
  }

  // APIにも非同期で追加（バックグラウンド）
  const jobIdForApi = job.job_id || "";
  if (jobIdForApi) {
    apiAddToPipeline(jobIdForApi, stageToApiStatus[stage]).catch((e) =>
      console.error("Failed to sync pipeline to API:", e)
    );
  }

  return pipelineJob;
}

/**
 * 案件をパイプラインから削除（API版）
 */
export async function removeFromPipelineAsync(jobId: string): Promise<void> {
  try {
    await removeJobFromAllPipelines(jobId);
  } catch (error) {
    console.error("Failed to remove from pipeline via API:", error);
  }
}

/**
 * 案件をパイプラインから削除（同期版、LocalStorage）
 */
export function removeFromPipeline(jobId: string, stage: keyof typeof STORAGE_KEYS): void {
  const jobs = getPipelineJobs(stage);
  const filtered = jobs.filter((j) => j.job_id !== jobId);
  savePipelineJobs(stage, filtered);

  // APIからも非同期で削除（バックグラウンド）
  removeJobFromAllPipelines(jobId).catch((e) =>
    console.error("Failed to sync pipeline removal to API:", e)
  );
}

/**
 * 案件を次のステージに移動（API版）
 */
export async function moveToStageAsync(
  jobId: string,
  toStage: keyof typeof STORAGE_KEYS,
  newStatus?: PipelineStatus
): Promise<void> {
  const apiStatus = newStatus || stageToApiStatus[toStage];
  try {
    await apiChangeJobStatus(jobId, apiStatus as ApiPipelineStatus);
  } catch (error) {
    console.error("Failed to move stage via API:", error);
  }
}

/**
 * 案件を次のステージに移動（同期版、LocalStorage）
 */
export function moveToStage(
  jobId: string,
  fromStage: keyof typeof STORAGE_KEYS,
  toStage: keyof typeof STORAGE_KEYS,
  newStatus?: PipelineStatus
): void {
  const fromJobs = getPipelineJobs(fromStage);
  const job = fromJobs.find((j) => j.job_id === jobId);

  if (!job) return;

  // 元のステージから削除
  removeFromPipeline(jobId, fromStage);

  // 新しいステージに追加
  const updatedJob: PipelineJob = {
    ...job,
    pipeline_status: newStatus || (toStage === "history" ? "expired" : job.pipeline_status),
  };

  const toJobs = getPipelineJobs(toStage);

  // 重複チェック
  if (!toJobs.some((j) => j.job_id === jobId)) {
    toJobs.unshift(updatedJob);
    savePipelineJobs(toStage, toJobs);
  }

  // APIにも非同期で反映（バックグラウンド）
  const apiStatus = newStatus || stageToApiStatus[toStage];
  apiChangeJobStatus(jobId, apiStatus as ApiPipelineStatus).catch((e) =>
    console.error("Failed to sync stage change to API:", e)
  );
}

/**
 * 期限切れ案件を履歴に移動
 */
export function processExpiredJobs(): { movedCount: number } {
  let movedCount = 0;

  // 下書きと応募済みをチェック
  const stages: Array<"drafts" | "submitted"> = ["drafts", "submitted"];

  for (const stage of stages) {
    const jobs = getPipelineJobs(stage);
    const expiredJobs: PipelineJob[] = [];
    const activeJobs: PipelineJob[] = [];

    for (const job of jobs) {
      if (isExpired(job)) {
        expiredJobs.push({
          ...job,
          pipeline_status: "expired",
          expired_at: new Date().toISOString(),
        });
      } else {
        activeJobs.push(job);
      }
    }

    if (expiredJobs.length > 0) {
      // 期限切れを履歴に移動
      const historyJobs = getPipelineJobs("history");
      const newHistoryJobs = [...expiredJobs, ...historyJobs];

      // 重複を除去
      const uniqueHistory = newHistoryJobs.filter(
        (job, index, self) => index === self.findIndex((j) => j.job_id === job.job_id)
      );

      savePipelineJobs("history", uniqueHistory);
      savePipelineJobs(stage, activeJobs);
      movedCount += expiredJobs.length;

      // APIにも非同期で反映
      for (const expiredJob of expiredJobs) {
        const expiredJobId = expiredJob.job_id || "";
        if (expiredJobId) {
          apiChangeJobStatus(expiredJobId, "expired").catch((e) =>
            console.error("Failed to sync expired job to API:", e)
          );
        }
      }
    }
  }

  return { movedCount };
}

/**
 * 全パイプラインの件数を取得（API版）
 */
export async function getPipelineCountsAsync(): Promise<Record<string, number>> {
  try {
    const result = await getPipelineSummary();
    if (result.success) {
      return {
        drafts: result.summary.draft,
        submitted: result.summary.submitted,
        ongoing: result.summary.ongoing,
        history: result.summary.expired + result.summary.rejected + result.summary.completed,
      };
    }
  } catch (error) {
    console.error("Failed to fetch pipeline counts from API:", error);
  }
  return getPipelineCounts();
}

/**
 * 全パイプラインの件数を取得（同期版、LocalStorage）
 */
export function getPipelineCounts(): Record<string, number> {
  return {
    drafts: getPipelineJobs("drafts").length,
    submitted: getPipelineJobs("submitted").length,
    ongoing: getPipelineJobs("ongoing").length,
    history: getPipelineJobs("history").length,
  };
}

/**
 * 案件がパイプラインに存在するかチェック
 */
export function isInPipeline(jobId: string): { exists: boolean; stage?: keyof typeof STORAGE_KEYS } {
  const stages: Array<keyof typeof STORAGE_KEYS> = ["drafts", "submitted", "ongoing", "history"];

  for (const stage of stages) {
    const jobs = getPipelineJobs(stage);
    if (jobs.some((j) => j.job_id === jobId)) {
      return { exists: true, stage };
    }
  }

  return { exists: false };
}
