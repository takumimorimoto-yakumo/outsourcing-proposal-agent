/**
 * パイプライン管理ユーティリティ
 * 案件の下書き→応募済み→受注/履歴の流れを管理
 */

import { Job, PipelineStatus, isExpired } from "@/types/job";

// LocalStorage keys
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

/**
 * LocalStorageからパイプライン案件を取得
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
 * LocalStorageにパイプライン案件を保存
 */
export function savePipelineJobs(stage: keyof typeof STORAGE_KEYS, jobs: PipelineJob[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS[stage], JSON.stringify(jobs));
}

/**
 * 案件をパイプラインに追加
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

  return pipelineJob;
}

/**
 * 案件をパイプラインから削除
 */
export function removeFromPipeline(jobId: string, stage: keyof typeof STORAGE_KEYS): void {
  const jobs = getPipelineJobs(stage);
  const filtered = jobs.filter((j) => j.job_id !== jobId);
  savePipelineJobs(stage, filtered);
}

/**
 * 案件を次のステージに移動
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
    }
  }

  return { movedCount };
}

/**
 * 全パイプラインの件数を取得
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
