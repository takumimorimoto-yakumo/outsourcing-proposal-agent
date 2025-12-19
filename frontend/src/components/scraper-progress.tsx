"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { XCircle, Loader2, Clock, CheckCircle2, Database, FolderSearch } from "lucide-react";
import type { ScraperStatus } from "@/lib/api";

interface ScraperProgressProps {
  status: ScraperStatus | null;
  isStarting?: boolean;
  lastResult?: {
    count: number;
    duration: number;
    timestamp: string;
    status: string;
  } | null;
  onCancel: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getPhaseIcon(phase: string) {
  switch (phase) {
    case "fetching":
      return <FolderSearch className="h-4 w-4 animate-pulse text-primary" />;
    case "saving":
      return <Database className="h-4 w-4 animate-pulse text-primary" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getPhaseLabel(phase: string) {
  switch (phase) {
    case "fetching":
      return "取得中";
    case "saving":
      return "保存中";
    case "done":
      return "完了";
    default:
      return "待機中";
  }
}

export function ScraperProgress({ status, isStarting = false, lastResult, onCancel }: ScraperProgressProps) {
  const isRunning = status?.is_running ?? false;
  const isActive = isRunning || isStarting;
  const isFetchAll = status?.estimated_total === 0;
  const progress = status && status.estimated_total > 0
    ? Math.round((status.jobs_fetched / status.estimated_total) * 100)
    : 0;

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className={isActive ? "border-primary bg-primary/5" : ""}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {isActive ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          {isStarting ? "開始中..." : isRunning ? getPhaseLabel(status?.phase ?? "idle") : "進捗"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isStarting ? (
          <div className="space-y-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 animate-pulse" style={{ width: "100%" }} />
            </div>
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">サーバーに接続中...</span>
            </div>
          </div>
        ) : isRunning && status ? (
          <div className="space-y-3">
            {/* プログレスバー */}
            {isFetchAll ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: "100%" }} />
                  </div>
                </div>
              </div>
            ) : (
              <Progress value={progress} className="h-2" />
            )}

            {/* 詳細メッセージ */}
            {status.message && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 px-3 py-2 rounded-md">
                {getPhaseIcon(status.phase)}
                <span className="font-medium">{status.message}</span>
              </div>
            )}

            {/* 統計情報 */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">取得件数</span>
                <span className="font-medium text-primary">{status.jobs_fetched}件</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">経過時間</span>
                <span className="font-medium">{formatTime(status.elapsed_seconds)}</span>
              </div>
              {status.total_categories > 1 && (
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">カテゴリ進捗</span>
                  <span className="font-medium">
                    {status.current_category_index} / {status.total_categories}
                  </span>
                </div>
              )}
              {!isFetchAll && status.total_pages > 0 && (
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">ページ進捗</span>
                  <span className="font-medium">
                    {status.current_page} / {status.total_pages}
                  </span>
                </div>
              )}
              {status.detail_total > 0 && (
                <div className="flex items-center justify-between col-span-2">
                  <span className="text-muted-foreground">詳細取得</span>
                  <span className="font-medium text-primary">
                    {status.detail_current} / {status.detail_total}
                  </span>
                </div>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              className="w-full"
            >
              <XCircle className="h-3 w-3 mr-1" />
              キャンセル
            </Button>
          </div>
        ) : lastResult ? (
          <div className="space-y-3">
            {/* 完了表示 */}
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md ${
              lastResult.status === "success"
                ? "bg-green-500/10 text-green-700"
                : lastResult.status === "cancelled"
                ? "bg-yellow-500/10 text-yellow-700"
                : "bg-red-500/10 text-red-700"
            }`}>
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-medium">
                {lastResult.status === "success" ? "完了" : lastResult.status === "cancelled" ? "キャンセル" : "エラー"}
              </span>
            </div>

            {/* 前回の結果 */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">取得件数</span>
                <span className="font-medium">{lastResult.count}件</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">所要時間</span>
                <span className="font-medium">{formatTime(lastResult.duration)}</span>
              </div>
              <div className="flex items-center justify-between col-span-2">
                <span className="text-muted-foreground">実行日時</span>
                <span className="font-medium">{formatTimestamp(lastResult.timestamp)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            まだ実行されていません
          </div>
        )}
      </CardContent>
    </Card>
  );
}
