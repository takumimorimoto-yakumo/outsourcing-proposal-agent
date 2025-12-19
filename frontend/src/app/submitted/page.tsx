"use client";

import { PipelineLayout } from "@/components/pipeline-layout";
import { Send } from "lucide-react";

export default function SubmittedPage() {
  return (
    <PipelineLayout counts={{ submitted: 0 }}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">応募済み</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Send className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">応募済みの案件はありません</p>
        <p className="text-sm mt-2">提案を送信すると、ここに表示されます</p>
      </div>
    </PipelineLayout>
  );
}
