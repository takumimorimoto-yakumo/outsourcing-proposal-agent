"use client";

import { Job, CATEGORY_LABELS, JOB_TYPE_LABELS } from "@/types/job";
import { formatBudget } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {job.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {job.client_name || "クライアント不明"}
              {job.client_rating && (
                <span className="ml-2 text-yellow-600">
                  ★ {job.client_rating}
                </span>
              )}
              {job.client_order_history && (
                <span className="ml-2 text-gray-500">
                  発注 {job.client_order_history}件
                </span>
              )}
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {JOB_TYPE_LABELS[job.job_type] || job.job_type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">
            {CATEGORY_LABELS[job.category] || job.category}
          </Badge>
          {job.tags.slice(0, 3).map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-green-700">
            {formatBudget(job.budget_min, job.budget_max)}
          </span>
          {job.remaining_days !== null && (
            <span className="text-orange-600">あと{job.remaining_days}日</span>
          )}
        </div>

        {job.feature_tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {job.feature_tags.slice(0, 4).map((tag, i) => (
              <span
                key={i}
                className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-gray-500">
            {job.proposal_count !== null && (
              <span>当選 {job.proposal_count}人</span>
            )}
            {job.recruitment_count !== null && (
              <span className="ml-2">/ 募集 {job.recruitment_count}人</span>
            )}
          </div>
          <Button size="sm" variant="outline" asChild>
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              詳細を見る
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
