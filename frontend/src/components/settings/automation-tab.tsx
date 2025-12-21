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
} from "lucide-react";
import {
  getGitHubConfig,
  getWorkflowRuns,
  triggerWorkflow,
  GitHubConfig,
  WorkflowRun,
} from "@/lib/api";

const SCRAPE_CATEGORIES = [
  { value: "system", label: "システム開発" },
  { value: "web", label: "Web制作" },
  { value: "writing", label: "ライティング" },
  { value: "design", label: "デザイン" },
  { value: "multimedia", label: "マルチメディア" },
  { value: "business", label: "ビジネス" },
  { value: "translation", label: "翻訳" },
];

const JOB_TYPES = [
  { value: "project", label: "プロジェクト" },
  { value: "task", label: "タスク" },
  { value: "competition", label: "コンペ" },
];

interface AutomationTabProps {
  setMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function AutomationTab({ setMessage }: AutomationTabProps) {
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [isLoadingGithub, setIsLoadingGithub] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerCategories, setTriggerCategories] = useState<string[]>(["system", "web"]);
  const [triggerJobTypes, setTriggerJobTypes] = useState<string[]>(["project"]);

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

  // ワークフローをトリガー
  const handleTriggerWorkflow = async () => {
    try {
      setIsTriggering(true);
      setMessage(null);
      await triggerWorkflow({
        categories: triggerCategories,
        job_types: triggerJobTypes,
        max_pages: 0, // 0 = 全ページ取得
        fetch_details: true,
      });
      setMessage({ type: "success", text: "ワークフローをトリガーしました。全ページを取得します。" });
      // 少し待ってから履歴を更新
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

  // カテゴリトグル
  const toggleTriggerCategory = (value: string) => {
    setTriggerCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  };

  // 案件形式トグル
  const toggleTriggerJobType = (value: string) => {
    setTriggerJobTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* 定期実行情報 */}
      <ScheduleCard githubConfig={githubConfig} />

      {/* 手動実行 */}
      <ManualTriggerCard
        githubConfig={githubConfig}
        triggerCategories={triggerCategories}
        triggerJobTypes={triggerJobTypes}
        isTriggering={isTriggering}
        onToggleCategory={toggleTriggerCategory}
        onToggleJobType={toggleTriggerJobType}
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
              システム開発、Web制作カテゴリを自動取得
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
      </CardContent>
    </Card>
  );
}

// 手動実行カード
function ManualTriggerCard({
  githubConfig,
  triggerCategories,
  triggerJobTypes,
  isTriggering,
  onToggleCategory,
  onToggleJobType,
  onTrigger,
}: {
  githubConfig: GitHubConfig | null;
  triggerCategories: string[];
  triggerJobTypes: string[];
  isTriggering: boolean;
  onToggleCategory: (value: string) => void;
  onToggleJobType: (value: string) => void;
  onTrigger: () => void;
}) {
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

        {/* カテゴリ選択 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">カテゴリ</Label>
          <div className="flex flex-wrap gap-2">
            {SCRAPE_CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer
                  transition-colors border
                  ${triggerCategories.includes(cat.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                  }
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={triggerCategories.includes(cat.value)}
                  onChange={() => onToggleCategory(cat.value)}
                />
                {cat.label}
              </label>
            ))}
          </div>
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
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={triggerJobTypes.includes(type.value)}
                  onChange={() => onToggleJobType(type.value)}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* 実行ボタン */}
        <Button
          onClick={onTrigger}
          disabled={isTriggering || !githubConfig?.configured || triggerCategories.length === 0}
          className="w-full"
        >
          {isTriggering ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              トリガー中...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              今すぐ実行
            </>
          )}
        </Button>
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
