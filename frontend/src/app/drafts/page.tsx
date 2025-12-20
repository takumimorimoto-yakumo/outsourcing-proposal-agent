"use client";

import { useState, useEffect } from "react";
import { CATEGORY_LABELS, JOB_TYPE_LABELS, isExpired } from "@/types/job";
import { formatBudget } from "@/lib/api";
import {
  getPipelineJobs,
  removeFromPipeline,
  moveToStage,
  processExpiredJobs,
  type PipelineJob,
} from "@/lib/pipeline";
import { PipelineLayout } from "@/components/pipeline-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PenLine, ExternalLink, Trash2, Send, Clock, AlertTriangle } from "lucide-react";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<PipelineJob[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 期限切れ案件を履歴に移動
    const { movedCount } = processExpiredJobs();
    if (movedCount > 0) {
      console.log(`${movedCount}件の期限切れ案件を履歴に移動しました`);
    }

    // 下書き一覧を取得
    const storedDrafts = getPipelineJobs("drafts");
    setDrafts(storedDrafts);
    setIsLoaded(true);
  }, []);

  const handleRemoveDraft = (jobId: string | null) => {
    if (!jobId) return;
    removeFromPipeline(jobId, "drafts");
    setDrafts(drafts.filter((d) => d.job_id !== jobId));
  };

  const handleMoveToSubmitted = (jobId: string | null) => {
    if (!jobId) return;
    moveToStage(jobId, "drafts", "submitted", "submitted");
    setDrafts(drafts.filter((d) => d.job_id !== jobId));
  };

  const formatAddedAt = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isLoaded) {
    return (
      <PipelineLayout>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">下書き</h1>
          </div>
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            読み込み中...
          </div>
        </div>
      </PipelineLayout>
    );
  }

  if (drafts.length === 0) {
    return (
      <PipelineLayout counts={{ drafts: 0 }}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">下書き</h1>
          </div>

          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <PenLine className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">下書きはありません</p>
            <p className="text-sm mt-2">案件一覧から下書きに追加してください</p>
          </div>
        </div>
      </PipelineLayout>
    );
  }

  return (
    <PipelineLayout counts={{ drafts: drafts.length }}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">下書き</h1>
          <span className="text-sm text-muted-foreground">{drafts.length}件</span>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">タイトル</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>形式</TableHead>
                <TableHead>予算</TableHead>
                <TableHead>残り</TableHead>
                <TableHead>追加日</TableHead>
                <TableHead className="w-[140px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((job, index) => {
                const expired = isExpired(job);

                return (
                  <TableRow key={`${job.job_id}-${index}`} className={expired ? "opacity-60" : ""}>
                    <TableCell className="font-medium">
                      <div className="max-w-[350px]">
                        <div className="line-clamp-1 flex items-center gap-2" title={job.title}>
                          {job.title}
                          {expired && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              期限切れ
                            </Badge>
                          )}
                        </div>
                        {job.client_name && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {job.client_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {CATEGORY_LABELS[job.category] || job.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-green-700 font-medium text-sm">
                        {formatBudget(job.budget_min, job.budget_max)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {job.remaining_days !== null ? (
                        <span className={`text-sm flex items-center gap-1 ${
                          job.remaining_days <= 0 ? "text-destructive" :
                          job.remaining_days <= 3 ? "text-orange-600" :
                          "text-muted-foreground"
                        }`}>
                          {job.remaining_days <= 0 ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {job.remaining_days <= 0 ? "終了" : `${job.remaining_days}日`}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {job.added_at ? formatAddedAt(job.added_at) : "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleMoveToSubmitted(job.job_id)}
                                disabled={expired}
                                className="text-primary hover:text-primary"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>応募済みに移動</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button size="icon" variant="ghost" asChild>
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveDraft(job.job_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </PipelineLayout>
  );
}
