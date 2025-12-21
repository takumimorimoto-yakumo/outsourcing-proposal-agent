"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Clock,
  Play,
  ExternalLink,
  RefreshCw,
  Github,
  CheckCircle2,
  XCircle,
  Timer,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Infinity,
} from "lucide-react";
import {
  getGitHubConfig,
  getWorkflowRuns,
  triggerWorkflow,
  GitHubConfig,
  WorkflowRun,
} from "@/lib/api";

interface Subcategory {
  slug: string;
  label: string;
}

interface Category {
  slug: string;
  label: string;
  subcategories: Subcategory[];
}

const JOB_TYPES = [
  { value: "project", label: "プロジェクト" },
  { value: "task", label: "タスク" },
  { value: "competition", label: "コンペ" },
];

const PAGE_OPTIONS = [
  { value: "1", label: "1ページ" },
  { value: "3", label: "3ページ" },
  { value: "5", label: "5ページ" },
  { value: "10", label: "10ページ" },
];

const SCHEDULE_TIMES = [
  { value: "0", label: "9:00 (JST)" },
  { value: "3", label: "12:00 (JST)" },
  { value: "9", label: "18:00 (JST)" },
  { value: "12", label: "21:00 (JST)" },
];

interface AutomationTabProps {
  setMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function AutomationTab({ setMessage }: AutomationTabProps) {
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  // カテゴリデータ（APIから取得）
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 選択状態: カテゴリslug -> 選択されたサブカテゴリslugs (空配列 = カテゴリ全体)
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string[]>>({
    system: [],
    web: [],
  });

  // 展開中のカテゴリ
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["system", "web"]));

  const [triggerJobTypes, setTriggerJobTypes] = useState<string[]>(["project"]);
  const [maxPages, setMaxPages] = useState<string>("3");
  const [fetchDetails, setFetchDetails] = useState<boolean>(true);

  // カテゴリをAPIから取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/categories");
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // GitHub設定読み込み
  useEffect(() => {
    const loadGithubData = async () => {
      try {
        const [config, runsData] = await Promise.all([
          getGitHubConfig(),
          getWorkflowRuns(10),
        ]);
        setGithubConfig(config);
        if (runsData.success) {
          setWorkflowRuns(runsData.runs);
        }
      } catch (err) {
        console.error("GitHub設定読み込みエラー:", err);
      } finally {
        setIsLoadingGithub(false);
      }
    };
    loadGithubData();
  }, []);

  // ワークフロー履歴を更新
  const refreshWorkflowRuns = async () => {
    try {
      const runsData = await getWorkflowRuns(10);
      if (runsData.success) {
        setWorkflowRuns(runsData.runs);
      }
    } catch (err) {
      console.error("履歴更新エラー:", err);
    }
  };

  // カテゴリの選択/解除
  const handleCategoryToggle = (categorySlug: string) => {
    setSelectedCategories((prev) => {
      const newSelection = { ...prev };
      if (categorySlug in newSelection) {
        delete newSelection[categorySlug];
        setExpandedCategories((exp) => {
          const newExp = new Set(exp);
          newExp.delete(categorySlug);
          return newExp;
        });
      } else {
        newSelection[categorySlug] = [];
        setExpandedCategories((exp) => new Set(exp).add(categorySlug));
      }
      return newSelection;
    });
  };

  // サブカテゴリの選択/解除
  const handleSubcategoryToggle = (categorySlug: string, subcategorySlug: string) => {
    setSelectedCategories((prev) => {
      const newSelection = { ...prev };
      if (!(categorySlug in newSelection)) return prev;

      const subs = newSelection[categorySlug];
      if (subs.includes(subcategorySlug)) {
        newSelection[categorySlug] = subs.filter((s) => s !== subcategorySlug);
      } else {
        newSelection[categorySlug] = [...subs, subcategorySlug];
      }
      return newSelection;
    });
  };

  // カテゴリの展開/折りたたみ
  const toggleCategoryExpand = (categorySlug: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug);
      } else {
        newSet.add(categorySlug);
      }
      return newSet;
    });
  };

  // 全サブカテゴリを選択/解除
  const handleSelectAllSubcategories = (categorySlug: string, allSubcategories: Subcategory[]) => {
    setSelectedCategories((prev) => {
      const newSelection = { ...prev };
      if (!(categorySlug in newSelection)) return prev;

      const currentSubs = newSelection[categorySlug];
      if (currentSubs.length === allSubcategories.length) {
        newSelection[categorySlug] = [];
      } else {
        newSelection[categorySlug] = allSubcategories.map((s) => s.slug);
      }
      return newSelection;
    });
  };

  // 案件形式トグル
  const toggleTriggerJobType = (value: string) => {
    setTriggerJobTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  // APIに送信するカテゴリ形式を生成
  const buildCategoryParams = (): string[] => {
    const result: string[] = [];
    for (const [categorySlug, subcategories] of Object.entries(selectedCategories)) {
      if (subcategories.length === 0) {
        result.push(categorySlug);
      } else {
        for (const sub of subcategories) {
          result.push(`${categorySlug}/${sub}`);
        }
      }
    }
    return result;
  };

  // ワークフローをトリガー
  const handleTriggerWorkflow = async (fetchAll: boolean = false) => {
    try {
      setIsTriggering(true);
      setMessage(null);
      // 全件取得の場合は大きな数を指定（0は「取得しない」と解釈される）
      const pagesCount = fetchAll ? 100 : parseInt(maxPages);
      await triggerWorkflow({
        categories: buildCategoryParams(),
        job_types: triggerJobTypes,
        max_pages: pagesCount,
        fetch_details: fetchDetails,
      });
      setMessage({
        type: "success",
        text: fetchAll
          ? "ワークフローをトリガーしました。全ページを取得します。"
          : `ワークフローをトリガーしました。${maxPages}ページ取得します。`,
      });
      setTimeout(refreshWorkflowRuns, 3000);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "ワークフローのトリガーに失敗しました",
      });
    } finally {
      setIsTriggering(false);
    }
  };

  const selectedCategoryCount = Object.keys(selectedCategories).length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 定期実行情報 */}
      <ScheduleCard githubConfig={githubConfig} />

      {/* 手動実行 */}
      <ManualTriggerCard
        githubConfig={githubConfig}
        categories={categories}
        loadingCategories={loadingCategories}
        selectedCategories={selectedCategories}
        expandedCategories={expandedCategories}
        triggerJobTypes={triggerJobTypes}
        maxPages={maxPages}
        fetchDetails={fetchDetails}
        isTriggering={isTriggering}
        selectedCategoryCount={selectedCategoryCount}
        onCategoryToggle={handleCategoryToggle}
        onSubcategoryToggle={handleSubcategoryToggle}
        onToggleCategoryExpand={toggleCategoryExpand}
        onSelectAllSubcategories={handleSelectAllSubcategories}
        onToggleJobType={toggleTriggerJobType}
        onMaxPagesChange={setMaxPages}
        onFetchDetailsChange={setFetchDetails}
        onTrigger={handleTriggerWorkflow}
      />

      {/* 実行履歴 */}
      <WorkflowHistoryCard
        workflowRuns={workflowRuns}
        isLoading={isLoadingGithub}
        onRefresh={refreshWorkflowRuns}
      />
    </div>
  );
}

// 定期実行スケジュールカード
function ScheduleCard({ githubConfig }: { githubConfig: GitHubConfig | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          定期実行スケジュール
        </CardTitle>
        <CardDescription>
          GitHub Actionsによる自動スクレイピングの設定
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <p className="font-medium">毎日 9:00 (JST)</p>
            <p className="text-sm text-muted-foreground">
              システム開発、Web制作カテゴリを自動取得（3ページ）
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-500" />
            有効
          </Badge>
        </div>

        {githubConfig && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>リポジトリ: {githubConfig.repo}</p>
            <p>ワークフロー: {githubConfig.workflow_id}</p>
            <p>
              ステータス:{" "}
              {githubConfig.configured ? (
                <span className="text-green-600">接続済み</span>
              ) : (
                <span className="text-orange-600">GITHUB_TOKEN未設定</span>
              )}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          スケジュールの変更は{" "}
          <code className="bg-muted px-1 rounded">.github/workflows/scheduled-scrape.yml</code>{" "}
          を編集してください
        </p>
      </CardContent>
    </Card>
  );
}

// 手動実行カード
function ManualTriggerCard({
  githubConfig,
  categories,
  loadingCategories,
  selectedCategories,
  expandedCategories,
  triggerJobTypes,
  maxPages,
  fetchDetails,
  isTriggering,
  selectedCategoryCount,
  onCategoryToggle,
  onSubcategoryToggle,
  onToggleCategoryExpand,
  onSelectAllSubcategories,
  onToggleJobType,
  onMaxPagesChange,
  onFetchDetailsChange,
  onTrigger,
}: {
  githubConfig: GitHubConfig | null;
  categories: Category[];
  loadingCategories: boolean;
  selectedCategories: Record<string, string[]>;
  expandedCategories: Set<string>;
  triggerJobTypes: string[];
  maxPages: string;
  fetchDetails: boolean;
  isTriggering: boolean;
  selectedCategoryCount: number;
  onCategoryToggle: (value: string) => void;
  onSubcategoryToggle: (category: string, subcategory: string) => void;
  onToggleCategoryExpand: (value: string) => void;
  onSelectAllSubcategories: (category: string, subcategories: Subcategory[]) => void;
  onToggleJobType: (value: string) => void;
  onMaxPagesChange: (value: string) => void;
  onFetchDetailsChange: (value: boolean) => void;
  onTrigger: (fetchAll: boolean) => void;
}) {
  const isDisabled = isTriggering;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="h-4 w-4" />
          手動でスクレイピング実行
        </CardTitle>
        <CardDescription>
          GitHub Actions経由で今すぐスクレイピングを実行します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!githubConfig?.configured && (
          <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                GitHub Token が設定されていません
              </p>
              <p className="text-xs text-orange-700 dark:text-orange-300">
                手動実行を利用するには、バックエンドの環境変数に <code className="bg-orange-100 dark:bg-orange-800 px-1 rounded">GITHUB_TOKEN</code> を設定してください。
              </p>
            </div>
          </div>
        )}

        {/* カテゴリ選択（階層構造） */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">カテゴリ</Label>
          {loadingCategories ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中...
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((cat) => {
                const isSelected = cat.slug in selectedCategories;
                const isExpanded = expandedCategories.has(cat.slug);
                const selectedSubs = selectedCategories[cat.slug] || [];
                const allSelected = selectedSubs.length === cat.subcategories.length;
                const someSelected = selectedSubs.length > 0 && !allSelected;

                return (
                  <div key={cat.slug} className="space-y-1">
                    {/* カテゴリヘッダー */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleCategoryExpand(cat.slug)}
                        className={`p-0.5 rounded hover:bg-muted ${isDisabled ? "opacity-50" : ""}`}
                        disabled={isDisabled}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      <label
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer
                          transition-colors border flex-1
                          ${isSelected
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-background hover:bg-muted border-transparent"
                          }
                          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onCategoryToggle(cat.slug)}
                          disabled={isDisabled}
                        />
                        <span className="font-medium">{cat.label}</span>
                        {isSelected && selectedSubs.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {selectedSubs.length}/{cat.subcategories.length} 選択
                          </span>
                        )}
                        {isSelected && selectedSubs.length === 0 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            全て
                          </span>
                        )}
                      </label>
                    </div>

                    {/* サブカテゴリ */}
                    {isExpanded && isSelected && (
                      <div className="ml-6 pl-3 border-l-2 border-muted space-y-0.5">
                        <button
                          type="button"
                          onClick={() => onSelectAllSubcategories(cat.slug, cat.subcategories)}
                          className={`
                            text-xs text-muted-foreground hover:text-foreground py-1 px-2
                            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                          disabled={isDisabled}
                        >
                          {allSelected ? "全て解除" : someSelected ? "全て選択" : "個別選択"}
                        </button>

                        <div className="flex flex-wrap gap-1">
                          {cat.subcategories.map((sub) => {
                            const isSubSelected = selectedSubs.includes(sub.slug);
                            const showAsSelected = selectedSubs.length === 0 || isSubSelected;

                            return (
                              <label
                                key={sub.slug}
                                className={`
                                  flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer
                                  transition-colors border
                                  ${showAsSelected
                                    ? selectedSubs.length === 0
                                      ? "bg-muted/50 text-foreground border-muted"
                                      : "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted border-input text-muted-foreground"
                                  }
                                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSubSelected}
                                  onChange={() => onSubcategoryToggle(cat.slug, sub.slug)}
                                  disabled={isDisabled}
                                />
                                {sub.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 案件形式選択 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">案件形式</Label>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((type) => (
              <label
                key={type.value}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer
                  transition-colors border
                  ${triggerJobTypes.includes(type.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={triggerJobTypes.includes(type.value)}
                  onChange={() => onToggleJobType(type.value)}
                  disabled={isDisabled}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* 取得量とオプション */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={maxPages} onValueChange={onMaxPagesChange} disabled={isDisabled}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={fetchDetails}
              onCheckedChange={(c) => onFetchDetailsChange(c === true)}
              disabled={isDisabled}
            />
            詳細も取得
          </label>
        </div>

        {/* 実行ボタン */}
        <div className="flex gap-2">
          <Button
            onClick={() => onTrigger(false)}
            disabled={isTriggering || !githubConfig?.configured || selectedCategoryCount === 0 || triggerJobTypes.length === 0}
            className="flex-1"
          >
            {isTriggering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                トリガー中...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {maxPages}ページ取得
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => onTrigger(true)}
            disabled={isTriggering || !githubConfig?.configured || selectedCategoryCount === 0 || triggerJobTypes.length === 0}
            title="選択カテゴリの全ページを取得"
          >
            <Infinity className="h-4 w-4 mr-1" />
            全件
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ワークフロー履歴カード
function WorkflowHistoryCard({
  workflowRuns,
  isLoading,
  onRefresh,
}: {
  workflowRuns: WorkflowRun[];
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Timer className="h-4 w-4" />
              実行履歴
            </CardTitle>
            <CardDescription>
              GitHub Actionsの実行履歴
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : workflowRuns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Github className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>実行履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workflowRuns.map((run) => (
              <WorkflowRunItem key={run.id} run={run} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ワークフロー実行アイテム
function WorkflowRunItem({ run }: { run: WorkflowRun }) {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* ステータスアイコン */}
        {run.status === "completed" ? (
          run.conclusion === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : run.conclusion === "failure" ? (
            <XCircle className="h-5 w-5 text-red-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-500" />
          )
        ) : run.status === "in_progress" ? (
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        ) : (
          <Clock className="h-5 w-5 text-muted-foreground" />
        )}

        <div>
          <p className="text-sm font-medium">
            Run #{run.run_number}
            <span className="ml-2 text-xs text-muted-foreground">
              ({run.event})
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(run.created_at).toLocaleString("ja-JP")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant={
            run.conclusion === "success"
              ? "default"
              : run.conclusion === "failure"
              ? "destructive"
              : "secondary"
          }
          className="text-xs"
        >
          {run.status === "completed"
            ? run.conclusion === "success"
              ? "成功"
              : run.conclusion === "failure"
              ? "失敗"
              : run.conclusion || "完了"
            : run.status === "in_progress"
            ? "実行中"
            : run.status}
        </Badge>
        <Button variant="ghost" size="icon" asChild>
          <a href={run.html_url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
