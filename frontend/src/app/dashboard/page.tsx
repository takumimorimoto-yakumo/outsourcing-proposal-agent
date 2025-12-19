"use client";

import { useState, useEffect, useCallback } from "react";
import { PipelineLayout } from "@/components/pipeline-layout";
import { PipelineSummary } from "@/components/pipeline-summary";
import { ScraperSettings } from "@/components/scraper-settings";
import { ScraperProgress } from "@/components/scraper-progress";
import { ScraperStatsPanel } from "@/components/scraper-stats";
import { ScraperHistory } from "@/components/scraper-history";
import {
  startScraper,
  getScraperStatus,
  cancelScraper,
  getScraperStats,
  getScraperHistory,
  type ScraperStatus,
  type ScraperStats,
  type ScraperHistoryItem,
} from "@/lib/api";

export default function DashboardPage() {
  const [status, setStatus] = useState<ScraperStatus | null>(null);
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [history, setHistory] = useState<ScraperHistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, historyData] = await Promise.all([
        getScraperStats(),
        getScraperHistory(),
      ]);
      setStats(statsData);
      setHistory(historyData.history);
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      try {
        const statusData = await getScraperStatus();
        setStatus(statusData);

        // サーバーが実行中になったら isStarting を解除
        if (statusData.is_running) {
          setIsStarting(false);
        }

        if (!statusData.is_running && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
          setIsStarting(false);
          loadData();
        }
      } catch (err) {
        console.error("Failed to get status:", err);
        setIsStarting(false);
      }
    };

    pollStatus();
    loadData();
    intervalId = setInterval(pollStatus, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loadData]);

  const handleStart = async (settings: {
    categories: string[];
    jobTypes: string[];
    maxPages: number;
    fetchDetails: boolean;
    saveToDatabase: boolean;
  }) => {
    try {
      setError(null);
      setIsStarting(true);
      await startScraper({
        categories: settings.categories,
        job_types: settings.jobTypes,
        max_pages: settings.maxPages,
        fetch_details: settings.fetchDetails,
        save_to_database: settings.saveToDatabase,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "開始に失敗しました");
      setIsStarting(false);
    }
  };

  const handleCancel = async () => {
    try {
      await cancelScraper();
    } catch (err) {
      setError(err instanceof Error ? err.message : "キャンセルに失敗しました");
    }
  };

  return (
    <PipelineLayout>
      <div className="p-6 space-y-6">
        {/* パイプラインサマリー */}
        <PipelineSummary />

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* 取得セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ScraperSettings
              isRunning={status?.is_running ?? false}
              isStarting={isStarting}
              onStart={handleStart}
            />
          </div>
          <div>
            <ScraperProgress
              status={status}
              isStarting={isStarting}
              lastResult={history[0] ? {
                count: history[0].count,
                duration: history[0].duration_seconds ?? 0,
                timestamp: history[0].timestamp,
                status: history[0].status,
              } : null}
              onCancel={handleCancel}
            />
          </div>
        </div>

        {/* 統計 */}
        <ScraperStatsPanel stats={stats} />

        {/* 履歴 */}
        <ScraperHistory history={history} />
      </div>
    </PipelineLayout>
  );
}
