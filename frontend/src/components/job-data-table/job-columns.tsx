"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Job, CATEGORY_LABELS, SUBCATEGORY_LABELS, JOB_TYPE_LABELS } from "@/types/job";
import { formatBudget, AIJobScore } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink } from "lucide-react";
import { JobDetailPopover } from "@/components/job-detail-popover";
import { DEFAULT_COLUMN_SIZES, MIN_COLUMN_WIDTH, CHECKBOX_WIDTH } from "./constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SortableHeader, AIScoreCell } from "./cell-components";

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
    createSelectColumn(),
    // AIスコア
    createAIScoreColumn(aiScores, actionHandlers),
    // タイトル
    createTitleColumn(),
    // カテゴリ
    createCategoryColumn(),
    // サブカテゴリ
    createSubcategoryColumn(),
    // タグ
    createTagsColumn(),
    // 案件形式
    createJobTypeColumn(),
    // 予算
    createBudgetColumn(),
    // 残り日数
    createRemainingDaysColumn(),
    // 応募数
    createProposalCountColumn(),
    // 募集人数
    createRecruitmentCountColumn(),
    // クライアント名
    createClientNameColumn(),
    // クライアント評価
    createClientRatingColumn(),
    // 発注履歴
    createClientOrderHistoryColumn(),
    // アクション
    createActionsColumn(),
  ];
}

// チェックボックス列
function createSelectColumn(): ColumnDef<Job> {
  return {
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
  };
}

// AIスコア列
function createAIScoreColumn(
  aiScores?: Map<string, AIJobScore>,
  actionHandlers?: JobActionHandlers
): ColumnDef<Job> {
  return {
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
      return <AIScoreCell aiScore={aiScore} isLoading={isLoading} />;
    },
    size: DEFAULT_COLUMN_SIZES.ai_score,
    minSize: MIN_COLUMN_WIDTH,
  };
}

// タイトル列
function createTitleColumn(): ColumnDef<Job> {
  return {
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
  };
}

// カテゴリ列
function createCategoryColumn(): ColumnDef<Job> {
  return {
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
  };
}

// サブカテゴリ列
function createSubcategoryColumn(): ColumnDef<Job> {
  return {
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
  };
}

// タグ列
function createTagsColumn(): ColumnDef<Job> {
  return {
    id: "all_tags",
    accessorFn: (row) => [...(row.tags || []), ...(row.feature_tags || [])].length,
    header: "タグ",
    cell: ({ row }) => {
      const tags = row.original.tags || [];
      const featureTags = row.original.feature_tags || [];
      const allTags = [...new Set([...featureTags, ...tags])];

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
  };
}

// 案件形式列
function createJobTypeColumn(): ColumnDef<Job> {
  return {
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
  };
}

// 予算列
function createBudgetColumn(): ColumnDef<Job> {
  return {
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
  };
}

// 残り日数列
function createRemainingDaysColumn(): ColumnDef<Job> {
  return {
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
  };
}

// 応募数列
function createProposalCountColumn(): ColumnDef<Job> {
  return {
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
  };
}

// 募集人数列
function createRecruitmentCountColumn(): ColumnDef<Job> {
  return {
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
  };
}

// クライアント名列
function createClientNameColumn(): ColumnDef<Job> {
  return {
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
  };
}

// クライアント評価列
function createClientRatingColumn(): ColumnDef<Job> {
  return {
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
  };
}

// 発注履歴列
function createClientOrderHistoryColumn(): ColumnDef<Job> {
  return {
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
  };
}

// アクション列
function createActionsColumn(): ColumnDef<Job> {
  return {
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
  };
}
