"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Job, Category, JobType } from "@/types/job";
import {
  fetchJobs,
  scoreJobWithAI,
  generateProposal,
  AIJobScore,
  GenerateProposalResponse,
} from "@/lib/api";
import { JobList } from "@/components/job-list";
import { JobDataTable } from "@/components/job-data-table";
import { PipelineSidebar } from "@/components/pipeline-sidebar";
import { JobFilters } from "@/components/job-filters";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table, PenLine, Loader2, Brain } from "lucide-react";

type ViewMode = "card" | "table";

const CATEGORIES: Category[] = [
  { value: "all", label: "全て" },
  { value: "system", label: "システム開発・運用" },
  { value: "web", label: "Web制作・Webデザイン" },
  { value: "writing", label: "ライティング・記事作成" },
  { value: "design", label: "デザイン制作" },
  { value: "multimedia", label: "写真・映像・音楽" },
  { value: "business", label: "ビジネス・マーケティング" },
  { value: "translation", label: "翻訳・通訳" },
];

const JOB_TYPES: JobType[] = [
  { value: "project", label: "プロジェクト" },
  { value: "task", label: "タスク" },
  { value: "competition", label: "コンペ" },
];

// ローカルストレージのキー
const DRAFTS_STORAGE_KEY = "proposal-generator-drafts";
const JOBS_CACHE_KEY = "proposal-generator-jobs-cache";
const AI_SCORES_STORAGE_KEY = "proposal-generator-ai-scores";
const GENERATED_PROPOSALS_STORAGE_KEY = "proposal-generator-generated-proposals";

// 生成された提案文の型
interface GeneratedProposal {
  jobId: string;
  jobTitle: string;
  proposal: string;
  characterCount: number;
  qualityScore: number;
  generatedAt: string;
}

export default function Home() {
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(["project"]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  // AI スコアリング関連
  const [aiScores, setAiScores] = useState<Map<string, AIJobScore>>(new Map());
  const [aiScoreLoadingIds, setAiScoreLoadingIds] = useState<Set<string>>(new Set());
  const [proposalLoadingIds, setProposalLoadingIds] = useState<Set<string>>(new Set());
  const [scoredJobIds, setScoredJobIds] = useState<Set<string>>(new Set()); // スコア済みのjob_id
  const isAutoScoringRef = useRef(false); // 自動スコアリング実行中フラグ
  const scoredJobIdsRef = useRef<Set<string>>(new Set()); // Refでも保持（useEffect内で使用）

  // 初期化: ローカルストレージからキャッシュを読み込み
  useEffect(() => {
    // 案件データをキャッシュから復元
    const cachedJobs = localStorage.getItem(JOBS_CACHE_KEY);
    if (cachedJobs) {
      try {
        const parsed = JSON.parse(cachedJobs) as Job[];
        setAllJobs(parsed);
      } catch (e) {
        console.error("Failed to parse cached jobs:", e);
      }
    }

    // AIスコアをローカルストレージから復元
    const cachedAiScores = localStorage.getItem(AI_SCORES_STORAGE_KEY);
    if (cachedAiScores) {
      try {
        const parsed = JSON.parse(cachedAiScores) as Record<string, AIJobScore>;
        const aiScoresMap = new Map<string, AIJobScore>(Object.entries(parsed));
        setAiScores(aiScoresMap);
        // スコア済みのjob_idを記録
        const scoredIds = new Set(Object.keys(parsed));
        setScoredJobIds(scoredIds);
        scoredJobIdsRef.current = scoredIds;
      } catch (e) {
        console.error("Failed to parse cached AI scores:", e);
      }
    }

    // バックグラウンドで最新データを取得
    fetchJobsInBackground();
  }, []);

  // バックグラウンドでデータを取得（キャッシュがあればローディング表示なし）
  const fetchJobsInBackground = async () => {
    const hasCache = localStorage.getItem(JOBS_CACHE_KEY) !== null;

    if (!hasCache) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const result = await fetchJobs(null, ["project", "task", "competition"], 5);
      setAllJobs(result.jobs);
      // キャッシュを更新
      localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(result.jobs));
    } catch (err) {
      if (!hasCache) {
        setError("案件の取得に失敗しました。APIサーバーが起動しているか確認してください。");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 手動リフレッシュ（常にローディング表示）
  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchJobs(null, ["project", "task", "competition"], 5);
      setAllJobs(result.jobs);
      setSelectedJobIds([]);
      // キャッシュを更新
      localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(result.jobs));
    } catch (err) {
      setError("案件の取得に失敗しました。APIサーバーが起動しているか確認してください。");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // AI スコアリングハンドラー
  const handleAIScore = useCallback(async (jobId: string) => {
    if (aiScoreLoadingIds.has(jobId)) return;

    setAiScoreLoadingIds((prev) => new Set(prev).add(jobId));

    try {
      const result = await scoreJobWithAI(jobId);
      if (result.success && result.score) {
        setAiScores((prev) => {
          const newMap = new Map(prev);
          newMap.set(jobId, result.score!);
          // ローカルストレージに保存
          const scoresObj = Object.fromEntries(newMap);
          localStorage.setItem(AI_SCORES_STORAGE_KEY, JSON.stringify(scoresObj));
          return newMap;
        });
        // スコア済みとして記録（stateとref両方）
        scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);
        setScoredJobIds((prev) => new Set(prev).add(jobId));
      } else {
        console.error("AI スコアリング失敗:", result.error);
        // 失敗してもスコア済みとして記録（再試行しないように）
        scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);
        setScoredJobIds((prev) => new Set(prev).add(jobId));
      }
    } catch (err) {
      console.error("AI スコアリングエラー:", err);
      // エラーでもスコア済みとして記録
      scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);
      setScoredJobIds((prev) => new Set(prev).add(jobId));
    } finally {
      setAiScoreLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  }, [aiScoreLoadingIds]);

  // バッチAI評価ハンドラー（選択されたアイテム、または未評価のアイテム全て）
  const [isBatchScoring, setIsBatchScoring] = useState(false);

  const handleBatchAIScore = useCallback(async () => {
    if (isBatchScoring) return;

    // 対象となる案件を決定
    // 選択されている場合は選択されたもの、なければ未評価のもの全て
    let targetJobs: Job[];
    if (selectedJobIds.length > 0) {
      targetJobs = allJobs.filter((job) => {
        const jobId = job.job_id ? String(job.job_id) : "";
        return jobId && selectedJobIds.includes(jobId);
      });
    } else {
      // 未評価のものを対象
      targetJobs = allJobs.filter((job) => {
        const jobId = job.job_id ? String(job.job_id).trim() : "";
        return jobId !== "" && !aiScores.has(jobId);
      });
    }

    if (targetJobs.length === 0) {
      alert("評価対象の案件がありません");
      return;
    }

    setIsBatchScoring(true);
    let successCount = 0;
    let errorCount = 0;

    for (const job of targetJobs) {
      const jobId = job.job_id ? String(job.job_id).trim() : "";
      if (!jobId) continue;

      // 既にスコア済みならスキップ
      if (scoredJobIdsRef.current.has(jobId)) continue;

      // スコア済みとして記録
      scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);

      try {
        setAiScoreLoadingIds((prev) => new Set(prev).add(jobId));

        const result = await scoreJobWithAI(jobId);

        if (result.success && result.score) {
          setAiScores((prev) => {
            const newMap = new Map(prev);
            newMap.set(jobId, result.score!);
            localStorage.setItem(AI_SCORES_STORAGE_KEY, JSON.stringify(Object.fromEntries(newMap)));
            return newMap;
          });
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error(`[BatchAIScore] ${jobId} エラー:`, err);
        errorCount++;
      } finally {
        setScoredJobIds((prev) => new Set(prev).add(jobId));
        setAiScoreLoadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
      }

      // Rate limit対策: 3秒待機
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    setIsBatchScoring(false);
    console.log(`[BatchAIScore] 完了: 成功${successCount}件, 失敗${errorCount}件`);
  }, [allJobs, selectedJobIds, aiScores, isBatchScoring]);

  // 提案文生成ハンドラー
  const handleGenerateProposal = useCallback(async (jobId: string) => {
    if (proposalLoadingIds.has(jobId)) return;

    setProposalLoadingIds((prev) => new Set(prev).add(jobId));

    try {
      const result = await generateProposal(jobId);
      if (result.success && result.proposal) {
        // 対象の案件情報を取得
        const job = allJobs.find((j) => j.job_id === jobId);

        // 生成された提案文を保存
        const generatedProposal: GeneratedProposal = {
          jobId,
          jobTitle: job?.title || "不明",
          proposal: result.proposal.text,
          characterCount: result.proposal.character_count,
          qualityScore: result.metadata?.quality_score || 0,
          generatedAt: new Date().toISOString(),
        };

        // 既存の提案文リストを取得
        const existingJson = localStorage.getItem(GENERATED_PROPOSALS_STORAGE_KEY);
        const existingProposals: GeneratedProposal[] = existingJson
          ? JSON.parse(existingJson)
          : [];

        // 同じjob_idの既存提案を削除して新しいものを追加
        const updatedProposals = existingProposals.filter((p) => p.jobId !== jobId);
        updatedProposals.unshift(generatedProposal);

        // ローカルストレージに保存
        localStorage.setItem(
          GENERATED_PROPOSALS_STORAGE_KEY,
          JSON.stringify(updatedProposals)
        );

        // 下書きページに遷移
        router.push(`/drafts?generated=${jobId}`);
      } else {
        console.error("提案文生成失敗:", result.error);
        alert(`提案文の生成に失敗しました: ${result.error?.message || "不明なエラー"}`);
      }
    } catch (err) {
      console.error("提案文生成エラー:", err);
      alert("提案文の生成中にエラーが発生しました");
    } finally {
      setProposalLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  }, [proposalLoadingIds, allJobs, router]);

  // 選択された案件に対してバッチ提案生成
  const handleBatchGenerateProposal = useCallback(async () => {
    if (selectedJobIds.length === 0) return;

    // 選択された最初の案件に対して実行
    const jobId = selectedJobIds[0];
    await handleGenerateProposal(jobId);
  }, [selectedJobIds, handleGenerateProposal]);

  // 新しい案件に対してAIスコアリングを自動実行
  useEffect(() => {
    // 既に自動スコアリング実行中なら何もしない
    if (isAutoScoringRef.current) return;

    // 案件がない場合は何もしない
    if (allJobs.length === 0) return;

    // スコア未取得の案件を抽出（job_idが存在し、空でないもの）
    const unscoredJobs = allJobs.filter((job) => {
      const jobId = job.job_id ? String(job.job_id).trim() : "";
      return jobId !== "" && !scoredJobIdsRef.current.has(jobId);
    });

    if (unscoredJobs.length === 0) return;

    console.log(`[AutoAIScore] ${unscoredJobs.length}件の新規案件をAI評価中...`);
    console.log(`[AutoAIScore] 対象job_ids:`, unscoredJobs.slice(0, 5).map(j => String(j.job_id)));
    isAutoScoringRef.current = true;

    // Rate limit対策: 1件ずつ順番にスコアリング
    const scoreAllJobs = async () => {
      let successCount = 0;
      let errorCount = 0;

      for (const job of unscoredJobs) {
        const jobId = job.job_id ? String(job.job_id).trim() : "";
        if (!jobId) continue;

        // 既に処理済みならスキップ（refを使ってリアルタイムにチェック）
        if (scoredJobIdsRef.current.has(jobId)) {
          continue;
        }

        // スコア済みとして先に記録（二重実行防止）
        scoredJobIdsRef.current = new Set(scoredJobIdsRef.current).add(jobId);

        try {
          // ローディング状態に追加
          setAiScoreLoadingIds((prev) => new Set(prev).add(jobId));

          const result = await scoreJobWithAI(jobId);

          if (result.success && result.score) {
            setAiScores((prev) => {
              const newMap = new Map(prev);
              newMap.set(jobId, result.score!);
              // ローカルストレージに保存
              const scoresObj = Object.fromEntries(newMap);
              localStorage.setItem(AI_SCORES_STORAGE_KEY, JSON.stringify(scoresObj));
              return newMap;
            });
            console.log(`[AutoAIScore] ${jobId} 完了 (スコア: ${result.score.overall_score})`);
            successCount++;
          } else {
            console.log(`[AutoAIScore] ${jobId} 失敗: ${result.error}`);
            errorCount++;
          }

        } catch (err) {
          console.error(`[AutoAIScore] ${jobId} のスコアリング失敗:`, err instanceof Error ? err.message : err);
          errorCount++;
        } finally {
          // state更新
          setScoredJobIds((prev) => new Set(prev).add(jobId));
          setAiScoreLoadingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(jobId);
            return newSet;
          });
        }

        // Rate limit対策: 3秒待機
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      console.log(`[AutoAIScore] 完了: 成功${successCount}件, 失敗${errorCount}件`);
      isAutoScoringRef.current = false;
    };

    scoreAllJobs();
  }, [allJobs]); // allJobsが変更されたときのみ実行

  // フィルタリング済みの案件
  const jobs = allJobs.filter((job) => {
    // カテゴリフィルター（未選択なら全て表示）
    const categoryMatch =
      selectedCategories.length === 0 ||
      selectedCategories.includes(job.category || "");

    // 案件形式フィルター（未選択なら全て表示）
    const jobTypeMatch =
      selectedJobTypes.length === 0 ||
      selectedJobTypes.includes(job.job_type || "");

    return categoryMatch && jobTypeMatch;
  });

  const handleCreateProposals = () => {
    // 選択された案件を取得
    const selectedJobs = jobs.filter((job) => {
      const jobId = job.job_id ? String(job.job_id) : "";
      return jobId && selectedJobIds.includes(jobId);
    });

    if (selectedJobs.length === 0) return;

    // 既存の下書きを取得
    const existingDraftsJson = localStorage.getItem(DRAFTS_STORAGE_KEY);
    const existingDrafts: Job[] = existingDraftsJson
      ? JSON.parse(existingDraftsJson)
      : [];

    // 重複を避けて新しい案件を追加
    const existingIds = new Set(existingDrafts.map((j) => j.job_id));
    const newDrafts = selectedJobs.filter((j) => !existingIds.has(j.job_id));
    const allDrafts = [...existingDrafts, ...newDrafts];

    // ローカルストレージに保存
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(allDrafts));

    // 選択をリセット
    setSelectedJobIds([]);

    // 提案作成中ページに遷移
    router.push("/drafts");
  };

  const selectedCount = selectedJobIds.length;

  return (
    <SidebarProvider>
      <PipelineSidebar counts={{ jobs: jobs.length }} />
      <SidebarInset className="overflow-hidden">
        <main className="p-6 h-full flex flex-col overflow-hidden">
          {/* フィルター・ボタン統合行 */}
          <div className="flex items-center justify-between gap-4 shrink-0 mb-4">
            <div className="flex items-center gap-2">
              <JobFilters
                categories={CATEGORIES}
                jobTypes={JOB_TYPES}
                selectedCategories={selectedCategories}
                selectedJobTypes={selectedJobTypes}
                onCategoriesChange={setSelectedCategories}
                onJobTypesChange={setSelectedJobTypes}
                onRefresh={handleFetch}
                isLoading={isLoading || isRefreshing}
              />
            </div>

            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Button onClick={handleCreateProposals} size="sm">
                  <PenLine className="h-4 w-4 mr-2" />
                  {selectedCount}件を下書きへ
                </Button>
              )}
              <Button
                onClick={handleBatchAIScore}
                size="sm"
                variant="outline"
                disabled={isBatchScoring || allJobs.length === 0}
              >
                {isBatchScoring ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                {selectedCount > 0 ? `${selectedCount}件をAI評価` : "AI評価"}
              </Button>
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-7 px-2"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "card" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("card")}
                  className="h-7 px-2"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg shrink-0">
              {error}
            </div>
          )}

          <div className="flex-1 min-h-0">
            {viewMode === "table" ? (
              <JobDataTable
                jobs={jobs}
                isLoading={isLoading}
                aiScores={aiScores}
                onSelectionChange={setSelectedJobIds}
                aiScoreLoadingIds={aiScoreLoadingIds}
              />
            ) : (
              <JobList jobs={jobs} isLoading={isLoading} />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
