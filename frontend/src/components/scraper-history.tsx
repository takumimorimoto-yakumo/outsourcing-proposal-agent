"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ScraperHistoryItem } from "@/lib/api";
import { CATEGORY_LABELS } from "@/types/job";

interface ScraperHistoryProps {
  history: ScraperHistoryItem[];
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
}

function StatusBadge({ status }: { status: ScraperHistoryItem["status"] }) {
  switch (status) {
    case "success":
      return <Badge variant="default">成功</Badge>;
    case "error":
      return <Badge variant="destructive">エラー</Badge>;
    case "cancelled":
      return <Badge variant="secondary">キャンセル</Badge>;
  }
}

export function ScraperHistory({ history }: ScraperHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">取得履歴</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            履歴がありません
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日時</TableHead>
                  <TableHead>カテゴリ</TableHead>
                  <TableHead className="text-right">新規</TableHead>
                  <TableHead className="text-right">更新</TableHead>
                  <TableHead className="text-right">時間</TableHead>
                  <TableHead>ステータス</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item, index) => {
                  const categoryLabel =
                    item.category === "all"
                      ? "全て"
                      : CATEGORY_LABELS[item.category] || item.category;

                  return (
                    <TableRow key={index}>
                      <TableCell className="text-sm">
                        {formatDateTime(item.timestamp)}
                      </TableCell>
                      <TableCell className="text-sm">{categoryLabel}</TableCell>
                      <TableCell className="text-sm text-right">
                        {item.added !== undefined ? `${item.added}件` : `${item.count}件`}
                      </TableCell>
                      <TableCell className="text-sm text-right text-muted-foreground">
                        {item.updated !== undefined ? `${item.updated}件` : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-right">
                        {formatDuration(item.duration_seconds)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
