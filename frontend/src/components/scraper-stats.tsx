"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import type { ScraperStats } from "@/lib/api";

interface ScraperStatsProps {
  stats: ScraperStats | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "全て",
  system: "システム",
  web: "Web",
  writing: "ライティング",
  design: "デザイン",
  multimedia: "マルチメディア",
  business: "ビジネス",
  translation: "翻訳",
};

export function ScraperStatsPanel({ stats }: ScraperStatsProps) {
  if (!stats) {
    return null;
  }

  const maxCount = Math.max(...Object.values(stats.by_category), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          取得統計
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.today}</p>
            <p className="text-xs text-muted-foreground">今日</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.this_week}</p>
            <p className="text-xs text-muted-foreground">今週</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">累計</p>
          </div>
        </div>

        {Object.keys(stats.by_category).length > 0 && (
          <div className="space-y-2">
            {Object.entries(stats.by_category)
              .filter(([category]) => category !== "all")
              .map(([category, count]) => {
              const percentage = (count / maxCount) * 100;
              const label = CATEGORY_LABELS[category] || category;

              return (
                <div key={category} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20 truncate">
                    {label}
                  </span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium w-12 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
