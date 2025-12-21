"use client";

import { useState, useCallback, useMemo } from "react";
import { Category, JobType } from "@/types/job";
import { JobList } from "@/components/job-list";
import { JobDataTable } from "@/components/job-data-table";
import { PipelineSidebar } from "@/components/pipeline-sidebar";
import { JobFilters } from "@/components/job-filters";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Table, PenLine, Loader2, Brain } from "lucide-react";
import { useJobs, useAIScoring, useProposals } from "@/hooks";

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

export default function Home() {
  // カスタムフック
  const { allJobs, isLoading, isRefreshing, error, handleRefresh, filterJobs } = useJobs();
  const { aiScores, aiScoreLoadingIds, isBatchScoring, handleBatchAIScore } = useAIScoring(allJobs);
  const { addToDrafts } = useProposals(allJobs);

  // ローカル状態
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(["project"]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

  // フィルタリング済みの案件
  const jobs = useMemo(
    () => filterJobs(selectedCategories, selectedJobTypes),
    [filterJobs, selectedCategories, selectedJobTypes]
  );

  // 手動リフレッシュ
  const onRefresh = useCallback(async () => {
    await handleRefresh();
    setSelectedJobIds([]);
  }, [handleRefresh]);

  // 下書きへ追加
  const handleCreateProposals = useCallback(() => {
    addToDrafts(jobs, selectedJobIds);
    setSelectedJobIds([]);
  }, [addToDrafts, jobs, selectedJobIds]);

  // バッチAI評価
  const onBatchAIScore = useCallback(() => {
    handleBatchAIScore(selectedJobIds);
  }, [handleBatchAIScore, selectedJobIds]);

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
                onRefresh={onRefresh}
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
                onClick={onBatchAIScore}
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
              <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
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

// ビューモード切り替えコンポーネント
function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 border rounded-md p-1">
      <Button
        variant={viewMode === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("table")}
        className="h-7 px-2"
      >
        <Table className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === "card" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("card")}
        className="h-7 px-2"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
