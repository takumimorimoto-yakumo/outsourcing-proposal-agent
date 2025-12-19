"use client";

import { useState } from "react";
import { Job, CATEGORY_LABELS, JOB_TYPE_LABELS, STATUS_LABELS } from "@/types/job";
import { formatBudget } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Calendar, Users, Star, Briefcase } from "lucide-react";

interface JobDetailPopoverProps {
  job: Job;
  children: React.ReactNode;
}

export function JobDetailPopover({ job, children }: JobDetailPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const hasDescription = job.description && job.description.length > 0;
  const tags = job.tags || [];
  const featureTags = job.feature_tags || [];
  const requiredSkills = job.required_skills || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="w-[45vw] max-w-none p-0">
        <div className="p-6 space-y-4 max-h-[90vh] overflow-y-auto">
          {/* ヘッダー */}
          <DialogHeader>
            <DialogTitle className="font-semibold text-base leading-tight">
              {job.title}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[job.category] || job.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {JOB_TYPE_LABELS[job.job_type] || job.job_type}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${
                  job.status === "open"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                {STATUS_LABELS[job.status] || job.status}
              </Badge>
            </div>
          </DialogHeader>

          <Separator />

          {/* 予算・期間 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground text-xs mb-1">予算</div>
              <div className="font-semibold text-green-700">
                {formatBudget(job.budget_min, job.budget_max)}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">残り日数</div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-orange-600" />
                <span className="font-medium text-orange-600">
                  {job.remaining_days !== null ? `${job.remaining_days}日` : "-"}
                </span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">応募状況</div>
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>
                  {job.proposal_count ?? "-"} / {job.recruitment_count ?? "-"}人
                </span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs mb-1">予算タイプ</div>
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{job.budget_type === "fixed" ? "固定" : "時給"}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* クライアント情報 */}
          <div>
            <div className="text-muted-foreground text-xs mb-2">クライアント</div>
            <div className="flex items-center justify-between">
              <span className="font-medium">{job.client_name || "非公開"}</span>
              <div className="flex items-center gap-3 text-sm">
                {job.client_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                    <span>{job.client_rating}</span>
                  </div>
                )}
                {job.client_order_history !== null && (
                  <span className="text-muted-foreground">
                    発注 {job.client_order_history}件
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* タグ */}
          {(tags.length > 0 || featureTags.length > 0) && (
            <>
              <Separator />
              <div className="space-y-2">
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {featureTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {featureTags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 説明文 */}
          <Separator />
          <div>
            <div className="text-muted-foreground text-xs mb-2">説明</div>
            {hasDescription ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {job.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                詳細なし（「詳細も取得」にチェックを入れて案件を取得してください）
              </p>
            )}
          </div>

          {/* 必要スキル */}
          {requiredSkills.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="text-muted-foreground text-xs mb-2">必要スキル</div>
                <div className="flex flex-wrap gap-1">
                  {requiredSkills.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* アクション */}
          <Separator />
          <div className="flex justify-end">
            <Button size="sm" variant="outline" asChild>
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Lancersで見る
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
