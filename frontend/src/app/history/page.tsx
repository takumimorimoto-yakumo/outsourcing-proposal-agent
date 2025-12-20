"use client";

import { useState, useEffect } from "react";
import { CATEGORY_LABELS, JOB_TYPE_LABELS, PIPELINE_STATUS_LABELS, PipelineStatus } from "@/types/job";
import { formatBudget } from "@/lib/api";
import {
  getPipelineJobs,
  removeFromPipeline,
  savePipelineJobs,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { History, ExternalLink, Trash2, MoreHorizontal, Filter } from "lucide-react";

type FilterType = "all" | "expired" | "submitted" | "rejected" | "completed";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "expired", label: "期限切れ" },
  { value: "submitted", label: "応募済み（結果待ち）" },
  { value: "rejected", label: "落選" },
  { value: "completed", label: "完了" },
];

function getStatusBadge(status: PipelineStatus) {
  switch (status) {
    case "expired":
      return <Badge variant="secondary" className="text-xs">期限切れ</Badge>;
    case "submitted":
      return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">応募済み</Badge>;
    case "rejected":
      return <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">落選</Badge>;
    case "completed":
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">完了</Badge>;
    default:
      return <Badge variant="secondary" className="text-xs">{PIPELINE_STATUS_LABELS[status] || status}</Badge>;
  }
}

export default function HistoryPage() {
  const [history, setHistory] = useState<PipelineJob[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  useEffect(() => {
    const storedHistory = getPipelineJobs("history");
    setHistory(storedHistory);
    setIsLoaded(true);
  }, []);

  const handleRemove = (jobId: string | null) => {
    if (!jobId) return;
    removeFromPipeline(jobId, "history");
    setHistory(history.filter((h) => h.job_id !== jobId));
  };

  const handleClearAll = () => {
    if (!confirm("履歴を全て削除しますか？")) return;
    savePipelineJobs("history", []);
    setHistory([]);
  };

  const formatDate = (ts: string | undefined) => {
    if (!ts) return "-";
    const date = new Date(ts);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredHistory = filter === "all"
    ? history
    : history.filter((h) => h.pipeline_status === filter);

  // 統計
  const stats = {
    total: history.length,
    expired: history.filter((h) => h.pipeline_status === "expired").length,
    submitted: history.filter((h) => h.pipeline_status === "submitted").length,
    rejected: history.filter((h) => h.pipeline_status === "rejected").length,
    completed: history.filter((h) => h.pipeline_status === "completed").length,
  };

  if (!isLoaded) {
    return (
      <PipelineLayout>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">履歴</h1>
          </div>
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            読み込み中...
          </div>
        </div>
      </PipelineLayout>
    );
  }

  if (history.length === 0) {
    return (
      <PipelineLayout counts={{ history: 0 }}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">履歴</h1>
          </div>

          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <History className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">履歴はありません</p>
            <p className="text-sm mt-2">完了・落選・期限切れの案件がここに表示されます</p>
          </div>
        </div>
      </PipelineLayout>
    );
  }

  return (
    <PipelineLayout counts={{ history: history.length }}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">履歴</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{filteredHistory.length}件</span>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                全削除
              </Button>
            )}
          </div>
        </div>

        {/* 統計 */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs py-1">
            合計: {stats.total}件
          </Badge>
          {stats.expired > 0 && (
            <Badge variant="secondary" className="text-xs py-1">
              期限切れ: {stats.expired}件
            </Badge>
          )}
          {stats.submitted > 0 && (
            <Badge variant="outline" className="text-xs py-1 bg-blue-50 text-blue-700 border-blue-200">
              応募済み: {stats.submitted}件
            </Badge>
          )}
          {stats.rejected > 0 && (
            <Badge variant="outline" className="text-xs py-1 bg-red-50 text-red-700 border-red-200">
              落選: {stats.rejected}件
            </Badge>
          )}
          {stats.completed > 0 && (
            <Badge variant="outline" className="text-xs py-1 bg-green-50 text-green-700 border-green-200">
              完了: {stats.completed}件
            </Badge>
          )}
        </div>

        {/* フィルター */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-wrap gap-1">
            {FILTER_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={filter === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(opt.value)}
                className="text-xs"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[350px]">タイトル</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>予算</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>追加日</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((job, index) => (
                <TableRow key={`${job.job_id}-${index}`}>
                  <TableCell className="font-medium">
                    <div className="max-w-[350px]">
                      <div className="line-clamp-1" title={job.title}>
                        {job.title}
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
                    <span className="text-green-700 font-medium text-sm">
                      {formatBudget(job.budget_min, job.budget_max)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.pipeline_status)}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(job.expired_at || job.added_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" asChild>
                        <a href={job.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(job.job_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </PipelineLayout>
  );
}
