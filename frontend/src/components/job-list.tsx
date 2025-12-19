"use client";

import { Job } from "@/types/job";
import { JobCard } from "./job-card";
import { Skeleton } from "@/components/ui/skeleton";

interface JobListProps {
  jobs: Job[];
  isLoading: boolean;
}

export function JobList({ jobs, isLoading }: JobListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3 p-4 border rounded-lg">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>案件がありません</p>
        <p className="text-sm mt-2">カテゴリと案件形式を選択して取得してください</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job, index) => (
        <JobCard key={`${job.job_id}-${index}`} job={job} />
      ))}
    </div>
  );
}
