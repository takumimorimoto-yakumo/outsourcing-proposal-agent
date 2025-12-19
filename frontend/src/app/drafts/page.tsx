"use client";

import { useState, useEffect } from "react";
import { Job, CATEGORY_LABELS, JOB_TYPE_LABELS } from "@/types/job";
import { formatBudget } from "@/lib/api";
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
import { PenLine, ExternalLink, Trash2 } from "lucide-react";

const DRAFTS_STORAGE_KEY = "proposal-generator-drafts";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Job[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedDrafts = localStorage.getItem(DRAFTS_STORAGE_KEY);
    if (storedDrafts) {
      setDrafts(JSON.parse(storedDrafts));
    }
    setIsLoaded(true);
  }, []);

  const handleRemoveDraft = (jobId: string | null) => {
    if (!jobId) return;
    const newDrafts = drafts.filter((d) => d.job_id !== jobId);
    setDrafts(newDrafts);
    localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(newDrafts));
  };

  if (!isLoaded) {
    return (
      <PipelineLayout>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">提案作成中</h1>
        </div>
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          読み込み中...
        </div>
      </PipelineLayout>
    );
  }

  if (drafts.length === 0) {
    return (
      <PipelineLayout counts={{ drafts: 0 }}>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">提案作成中</h1>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <PenLine className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">作成中の提案はありません</p>
          <p className="text-sm mt-2">案件一覧から提案を作成してください</p>
        </div>
      </PipelineLayout>
    );
  }

  return (
    <PipelineLayout counts={{ drafts: drafts.length }}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">提案作成中</h1>
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
              <TableHead>ステータス</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drafts.map((job, index) => (
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
                    <span className="text-orange-600 text-sm">
                      {job.remaining_days}日
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                    下書き
                  </Badge>
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
                      onClick={() => handleRemoveDraft(job.job_id)}
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
    </PipelineLayout>
  );
}
