"use client";

import { useState, useEffect, useCallback } from "react";
import { Job, isExpired } from "@/types/job";
import { fetchJobs, cleanupExpiredJobs } from "@/lib/api";

const JOBS_CACHE_KEY = "proposal-generator-jobs-cache";

export function useJobs() {
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期化: ローカルストレージからキャッシュを読み込み
  useEffect(() => {
    const cachedJobs = localStorage.getItem(JOBS_CACHE_KEY);
    if (cachedJobs) {
      try {
        const parsed = JSON.parse(cachedJobs) as Job[];
        setAllJobs(parsed);
      } catch (e) {
        console.error("Failed to parse cached jobs:", e);
      }
    }
    // バックグラウンドで最新データを取得
    fetchJobsInBackground();
  }, []);

  // バックグラウンドでデータを取得（キャッシュがあればローディング表示なし）
  const fetchJobsInBackground = async () => {
    const hasCache = localStorage.getItem(JOBS_CACHE_KEY) !== null;

    if (!hasCache) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      // 期限切れ案件をDBから削除
      try {
        const cleanupResult = await cleanupExpiredJobs();
        if (cleanupResult.deleted > 0) {
          console.log(`期限切れ案件を${cleanupResult.deleted}件削除しました`);
        }
      } catch (e) {
        console.warn("期限切れ削除をスキップ:", e);
      }

      const result = await fetchJobs(null, ["project", "task", "competition"], 5);
      // クライアント側でも期限切れをフィルタリング
      const activeJobs = result.jobs.filter((job: Job) => !isExpired(job));
      setAllJobs(activeJobs);
      // キャッシュを更新
      localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(activeJobs));
    } catch (err) {
      if (!hasCache) {
        setError("案件の取得に失敗しました。APIサーバーが起動しているか確認してください。");
      }
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 手動リフレッシュ（常にローディング表示）
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 期限切れ案件をDBから削除
      try {
        await cleanupExpiredJobs();
      } catch (e) {
        console.warn("期限切れ削除をスキップ:", e);
      }

      const result = await fetchJobs(null, ["project", "task", "competition"], 5);
      // クライアント側でも期限切れをフィルタリング
      const activeJobs = result.jobs.filter((job: Job) => !isExpired(job));
      setAllJobs(activeJobs);
      // キャッシュを更新
      localStorage.setItem(JOBS_CACHE_KEY, JSON.stringify(activeJobs));
      return activeJobs;
    } catch (err) {
      setError("案件の取得に失敗しました。APIサーバーが起動しているか確認してください。");
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // フィルタリング関数
  const filterJobs = useCallback(
    (selectedCategories: string[], selectedJobTypes: string[]) => {
      return allJobs.filter((job) => {
        const categoryMatch =
          selectedCategories.length === 0 ||
          selectedCategories.includes(job.category || "");
        const jobTypeMatch =
          selectedJobTypes.length === 0 ||
          selectedJobTypes.includes(job.job_type || "");
        return categoryMatch && jobTypeMatch;
      });
    },
    [allJobs]
  );

  return {
    allJobs,
    isLoading,
    isRefreshing,
    error,
    handleRefresh,
    filterJobs,
  };
}
