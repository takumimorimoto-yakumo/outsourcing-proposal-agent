"use client";

import { useState, useMemo } from "react";
import { Job, CATEGORY_LABELS, JOB_TYPE_LABELS } from "@/types/job";
import { formatBudget } from "@/lib/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { JobDetailPopover } from "./job-detail-popover";

type SortKey = "budget" | "remaining_days" | "proposal_count" | "client_rating";
type SortOrder = "asc" | "desc";

interface JobTableProps {
  jobs: Job[];
  isLoading: boolean;
  selectedJobIds: Set<string>;
  onSelectionChange: (selectedIds: Set<string>) => void;
}

function getSortValue(job: Job, key: SortKey): number {
  switch (key) {
    case "budget":
      return job.budget_max ?? job.budget_min ?? 0;
    case "remaining_days":
      return job.remaining_days ?? 999;
    case "proposal_count":
      return job.proposal_count ?? 0;
    case "client_rating":
      return job.client_rating ?? 0;
    default:
      return 0;
  }
}

export function JobTable({
  jobs,
  isLoading,
  selectedJobIds,
  onSelectionChange,
}: JobTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const sortedJobs = useMemo(() => {
    if (!sortKey) return jobs;
    return [...jobs].sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [jobs, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(jobs.map((job) => job.job_id).filter(Boolean) as string[]);
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectJob = (jobId: string | null, checked: boolean) => {
    if (!jobId) return;
    const newSelection = new Set(selectedJobIds);
    if (checked) {
      newSelection.add(jobId);
    } else {
      newSelection.delete(jobId);
    }
    onSelectionChange(newSelection);
  };

  const isAllSelected = jobs.length > 0 && jobs.every((job) => job.job_id && selectedJobIds.has(job.job_id));
  const isSomeSelected = jobs.some((job) => job.job_id && selectedJobIds.has(job.job_id));

  const SortableHeader = ({
    label,
    sortKeyName,
    className,
  }: {
    label: string;
    sortKeyName: SortKey;
    className?: string;
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 hover:bg-transparent"
        onClick={() => handleSort(sortKeyName)}
      >
        {label}
        {sortKey === sortKeyName ? (
          sortOrder === "asc" ? (
            <ArrowUp className="ml-1 h-3 w-3" />
          ) : (
            <ArrowDown className="ml-1 h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
        )}
      </Button>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[300px]">タイトル</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>形式</TableHead>
              <TableHead>予算</TableHead>
              <TableHead>残り</TableHead>
              <TableHead>応募</TableHead>
              <TableHead>クライアント</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(6)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="w-[300px]">タイトル</TableHead>
              <TableHead>カテゴリ</TableHead>
              <TableHead>形式</TableHead>
              <TableHead>予算</TableHead>
              <TableHead>残り</TableHead>
              <TableHead>応募</TableHead>
              <TableHead>クライアント</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                案件がありません
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">
              <Checkbox
                checked={isSomeSelected && !isAllSelected ? "indeterminate" : isAllSelected}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-[300px]">タイトル</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>形式</TableHead>
            <SortableHeader label="予算" sortKeyName="budget" />
            <SortableHeader label="残り" sortKeyName="remaining_days" />
            <SortableHeader label="応募" sortKeyName="proposal_count" />
            <SortableHeader label="評価" sortKeyName="client_rating" />
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedJobs.map((job, index) => {
            const isSelected = job.job_id ? selectedJobIds.has(job.job_id) : false;
            return (
              <TableRow
                key={`${job.job_id}-${index}`}
                data-state={isSelected ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleSelectJob(job.job_id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <JobDetailPopover job={job}>
                    <div className="max-w-[300px] cursor-pointer hover:text-primary">
                      <div className="line-clamp-1" title={job.title}>
                        {job.title}
                      </div>
                      {job.feature_tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {job.feature_tags.slice(0, 2).map((tag, i) => (
                            <span
                              key={i}
                              className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </JobDetailPopover>
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
                  <span className="text-sm text-muted-foreground">
                    {job.proposal_count ?? "-"}/{job.recruitment_count ?? "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-[120px]">
                    <div className="text-sm truncate" title={job.client_name || undefined}>
                      {job.client_name || "-"}
                    </div>
                    {job.client_rating && (
                      <span className="text-xs text-yellow-600">
                        ★{job.client_rating}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" asChild>
                    <a href={job.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
