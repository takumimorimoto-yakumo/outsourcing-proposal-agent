"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from "lucide-react";
import { AIJobScore } from "@/lib/api";

// ソート可能ヘッダーコンポーネント
export function SortableHeader({
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
export function ScoreBar({ score, label }: { score: number; label: string }) {
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

// スコア色取得
function getScoreColor(s: number) {
  if (s >= 80) return "text-green-600 bg-green-50";
  if (s >= 60) return "text-yellow-600 bg-yellow-50";
  if (s >= 40) return "text-orange-600 bg-orange-50";
  return "text-red-600 bg-red-50";
}

// 推奨度アイコン取得
function getRecommendationIcon(rec: string) {
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
}

// 推奨度ラベル取得
function getRecommendationLabel(rec: string) {
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
}

// AIスコアセルコンポーネント
export function AIScoreCell({
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
          <AIScoreTooltipContent aiScore={aiScore} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// AIスコアツールチップ内容
function AIScoreTooltipContent({ aiScore }: { aiScore: AIJobScore }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium text-sm">AI評価詳細</div>
        <Badge variant="outline" className="text-xs">
          {getRecommendationLabel(aiScore.recommendation)}
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
  );
}
