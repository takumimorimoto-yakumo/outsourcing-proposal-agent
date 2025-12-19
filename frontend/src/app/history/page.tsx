"use client";

import { PipelineLayout } from "@/components/pipeline-layout";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <PipelineLayout counts={{ history: 0 }}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">履歴</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <History className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">履歴はありません</p>
        <p className="text-sm mt-2">完了・落選した案件がここに表示されます</p>
      </div>
    </PipelineLayout>
  );
}
