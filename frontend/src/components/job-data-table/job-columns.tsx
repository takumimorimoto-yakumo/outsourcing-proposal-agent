"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Job, CATEGORY_LABELS, SUBCATEGORY_LABELS, JOB_TYPE_LABELS } from "@/types/job";
import { formatBudget, AIJobScore } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown, Loader2, ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { JobDetailPopover } from "@/components/job-detail-popover";
import { DEFAULT_COLUMN_SIZES, MIN_COLUMN_WIDTH, CHECKBOX_WIDTH } from "./constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ソート可能ヘッダーコンポーネント
function SortableHeader({
  column,
  children,
  className,
}: {
  column: {
    getIsSorted: () => false | "asc" | "desc";
    toggleSorting: (desc?: boolean) => void;
  };
  children: React.ReactNode;
  className?: string;
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(sorted === "asc")}
      className={`h-auto p-0 font-medium text-xs hover:bg-transparent ${className || ""}`}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="ml-1 h-3 w-3" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-1 h-3 w-3" />
      ) : (
        <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
      )}
    </Button>
  );
}

// スコアバーコンポーネント
function ScoreBar({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return "bg-green-500";
    if (s >= 60) return "bg-yellow-500";
    if (s >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full">
        <div
          className={`h-full rounded-full ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-8 text-right">{score}</span>
    </div>
  );
}

// AIスコアセルコンポーネント
function AIScoreCell({
  aiScore,
  isLoading,
}: {
  aiScore: AIJobScore | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">分析中...</span>
      </div>
    );
  }

  if (!aiScore) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const score = aiScore.overall_score;
  const recommendation = aiScore.recommendation;

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-600 bg-green-50";
    if (s >= 60) return "text-yellow-600 bg-yellow-50";
    if (s >= 40) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "highly_recommended":
        return <ThumbsUp className="h-3 w-3 text-green-600" />;
      case "recommended":
        return <ThumbsUp className="h-3 w-3 text-yellow-600" />;
      case "neutral":
        return <AlertCircle className="h-3 w-3 text-orange-600" />;
      case "not_recommended":
        return <ThumbsDown className="h-3 w-3 text-red-600" />;
      default:
        return null;
    }
  };

  const getRecommendationLabel = (rec: string) => {
    switch (rec) {
      case "highly_recommended":
        return "強く推奨";
      case "recommended":
        return "推奨";
      case "neutral":
        return "中立";
      case "not_recommended":
        return "非推奨";
      default:
        return rec;
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            {getRecommendationIcon(recommendation)}
            <span
              className={`text-sm font-medium px-2 py-0.5 rounded ${getScoreColor(score)}`}
            >
              {score}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="w-72 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-sm">AI評価詳細</div>
              <Badge variant="outline" className="text-xs">
                {getRecommendationLabel(recommendation)}
              </Badge>
            </div>
            <ScoreBar score={aiScore.breakdown.skill_match} label="スキル適合" />
            <ScoreBar score={aiScore.breakdown.budget_appropriateness} label="予算妥当性" />
            <ScoreBar score={aiScore.breakdown.competition_level} label="競争優位性" />
            <ScoreBar score={aiScore.breakdown.client_reliability} label="クライアント" />
            <ScoreBar score={aiScore.breakdown.growth_potential} label="成長可能性" />
            {aiScore.reasons.length > 0 && (
              <div className="mt-3 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">推薦理由:</div>
                <ul className="text-xs space-y-1">
                  {aiScore.reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-600">+</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiScore.concerns.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-1">懸念事項:</div>
                <ul className="text-xs space-y-1">
                  {aiScore.concerns.map((concern, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-red-600">-</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// アクションメニューProps
export interface JobActionHandlers {
  aiScoreLoadingIds?: Set<string>;
}

export function getJobColumns(
  aiScores?: Map<string, AIJobScore>,
  actionHandlers?: JobActionHandlers
): ColumnDef<Job>[] {
  return [
    // チェックボックス
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="全て選択"
        />
      ),
      cell: ({ row }) => (
        <div
          className="flex items-center justify-center w-full h-full py-2 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleSelected(!row.getIsSelected());
          }}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="行を選択"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: CHECKBOX_WIDTH,
      minSize: CHECKBOX_WIDTH,
      maxSize: CHECKBOX_WIDTH,
    },

    // AIスコア
    {
      id: "ai_score",
      accessorFn: (row) => {
        const jobId = row.job_id || row.url;
        return aiScores?.get(jobId)?.overall_score ?? 0;
      },
      header: ({ column }) => (
        <SortableHeader column={column}>AIスコア</SortableHeader>
      ),
      cell: ({ row }) => {
        const jobId = row.original.job_id || "";
        const aiScore = aiScores?.get(jobId);
        const isLoading = actionHandlers?.aiScoreLoadingIds?.has(jobId) ?? false;
        return (
          <AIScoreCell
            aiScore={aiScore}
            isLoading={isLoading}
          />
        );
      },
      size: DEFAULT_COLUMN_SIZES.ai_score,
      minSize: MIN_COLUMN_WIDTH,
    },

    // タイトル
    {
      accessorKey: "title",
      header: ({ column }) => (
        <SortableHeader column={column}>タイトル</SortableHeader>
      ),
      cell: ({ row }) => {
        const job = row.original;
        return (
          <JobDetailPopover job={job}>
            <div className="max-w-full cursor-pointer hover:text-primary">
              <div className="line-clamp-1 text-sm font-medium" title={job.title}>
                {job.title}
              </div>
            </div>
          </JobDetailPopover>
        );
      },
      size: DEFAULT_COLUMN_SIZES.title,
      minSize: 200,
    },

    // カテゴリ
    {
      accessorKey: "category",
      header: ({ column }) => (
        <SortableHeader column={column}>カテゴリ</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-xs whitespace-nowrap">
          {CATEGORY_LABELS[row.original.category] || row.original.category}
        </Badge>
      ),
      size: DEFAULT_COLUMN_SIZES.category,
      minSize: MIN_COLUMN_WIDTH,
    },

    // サブカテゴリ
    {
      accessorKey: "subcategory",
      header: ({ column }) => (
        <SortableHeader column={column}>サブカテゴリ</SortableHeader>
      ),
      cell: ({ row }) => {
        const subcategory = row.original.subcategory;
        if (!subcategory) return <span className="text-muted-foreground">-</span>;
        return (
          <span className="text-xs text-muted-foreground">
            {SUBCATEGORY_LABELS[subcategory] || subcategory}
          </span>
        );
      },
      size: DEFAULT_COLUMN_SIZES.subcategory,
      minSize: MIN_COLUMN_WIDTH,
    },

    // タグ（tags + feature_tags を統合）
    {
      id: "all_tags",
      accessorFn: (row) => [...(row.tags || []), ...(row.feature_tags || [])].length,
      header: "タグ",
      cell: ({ row }) => {
        const tags = row.original.tags || [];
        const featureTags = row.original.feature_tags || [];
        const allTags = [...new Set([...featureTags, ...tags])]; // 重複排除、feature_tagsを優先

        if (allTags.length === 0) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
            {allTags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{allTags.length - 3}
              </span>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: DEFAULT_COLUMN_SIZES.all_tags,
      minSize: MIN_COLUMN_WIDTH,
    },

    // 案件形式
    {
      accessorKey: "job_type",
      header: ({ column }) => (
        <SortableHeader column={column}>形式</SortableHeader>
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {JOB_TYPE_LABELS[row.original.job_type] || row.original.job_type}
        </Badge>
      ),
      size: DEFAULT_COLUMN_SIZES.job_type,
      minSize: MIN_COLUMN_WIDTH,
    },

    // 予算
    {
      id: "budget",
      accessorFn: (row) => row.budget_max ?? row.budget_min ?? 0,
      header: ({ column }) => (
        <SortableHeader column={column}>予算</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-green-700 font-medium text-sm whitespace-nowrap">
          {formatBudget(row.original.budget_min, row.original.budget_max)}
        </span>
      ),
      size: DEFAULT_COLUMN_SIZES.budget,
      minSize: MIN_COLUMN_WIDTH,
    },

    // 残り日数
    {
      accessorKey: "remaining_days",
      header: ({ column }) => (
        <SortableHeader column={column}>残り</SortableHeader>
      ),
      cell: ({ row }) => {
        const days = row.original.remaining_days;
        if (days === null) {
          return <span className="text-muted-foreground text-sm">-</span>;
        }
        return (
          <span
            className={`text-sm whitespace-nowrap ${
              days <= 3 ? "text-red-600 font-medium" : "text-orange-600"
            }`}
          >
            {days}日
          </span>
        );
      },
      size: DEFAULT_COLUMN_SIZES.remaining_days,
      minSize: MIN_COLUMN_WIDTH,
    },

    // 応募数
    {
      id: "proposal_count",
      accessorFn: (row) => row.proposal_count ?? 0,
      header: ({ column }) => (
        <SortableHeader column={column}>応募</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.proposal_count ?? "-"}
        </span>
      ),
      size: DEFAULT_COLUMN_SIZES.proposal_count,
      minSize: MIN_COLUMN_WIDTH,
    },

    // 募集人数
    {
      id: "recruitment_count",
      accessorFn: (row) => row.recruitment_count ?? 0,
      header: ({ column }) => (
        <SortableHeader column={column}>募集</SortableHeader>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.recruitment_count ?? "-"}
        </span>
      ),
      size: DEFAULT_COLUMN_SIZES.recruitment_count,
      minSize: MIN_COLUMN_WIDTH,
    },

    // クライアント名
    {
      id: "client_name",
      accessorKey: "client_name",
      header: ({ column }) => (
        <SortableHeader column={column}>クライアント</SortableHeader>
      ),
      cell: ({ row }) => {
        const client_name = row.original.client_name;
        return (
          <div
            className="text-sm truncate max-w-[120px]"
            title={client_name || undefined}
          >
            {client_name || "-"}
          </div>
        );
      },
      size: DEFAULT_COLUMN_SIZES.client_name,
      minSize: MIN_COLUMN_WIDTH,
    },

    // クライアント評価
    {
      id: "client_rating",
      accessorFn: (row) => row.client_rating ?? 0,
      header: ({ column }) => (
        <SortableHeader column={column}>評価</SortableHeader>
      ),
      cell: ({ row }) => {
        const client_rating = row.original.client_rating;
        if (typeof client_rating !== "number") {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <span className="text-yellow-600 text-sm whitespace-nowrap">
            ★{client_rating.toFixed(1)}
          </span>
        );
      },
      size: DEFAULT_COLUMN_SIZES.client_rating,
      minSize: MIN_COLUMN_WIDTH,
    },

    // 発注履歴
    {
      id: "client_order_history",
      accessorFn: (row) => row.client_order_history ?? 0,
      header: ({ column }) => (
        <SortableHeader column={column}>発注数</SortableHeader>
      ),
      cell: ({ row }) => {
        const history = row.original.client_order_history;
        if (typeof history !== "number") {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <span className="text-sm text-muted-foreground">
            {history}件
          </span>
        );
      },
      size: DEFAULT_COLUMN_SIZES.client_order_history,
      minSize: MIN_COLUMN_WIDTH,
    },


    // アクション
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  asChild
                >
                  <a
                    href={row.original.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>案件を開く</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: 48,
      minSize: 48,
      maxSize: 48,
    },
  ];
}
