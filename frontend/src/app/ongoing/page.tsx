"use client";

import { PipelineLayout } from "@/components/pipeline-layout";
import { CheckCircle } from "lucide-react";

export default function OngoingPage() {
  return (
    <PipelineLayout counts={{ ongoing: 0 }}>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">受注</h1>
      </div>

      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg">進行中の案件はありません</p>
        <p className="text-sm mt-2">受注した案件がここに表示されます</p>
      </div>
    </PipelineLayout>
  );
}
