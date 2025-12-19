"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, PenLine, Send, CheckCircle } from "lucide-react";
import Link from "next/link";

interface PipelineCounts {
  jobs: number;
  drafts: number;
  submitted: number;
  ongoing: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function PipelineSummary() {
  const [counts, setCounts] = useState<PipelineCounts>({
    jobs: 0,
    drafts: 0,
    submitted: 0,
    ongoing: 0,
  });

  useEffect(() => {
    const loadCounts = async () => {
      // 案件数をAPIから取得
      try {
        const res = await fetch(`${API_BASE_URL}/api/jobs?job_types=project`);
        const data = await res.json();
        setCounts((prev) => ({ ...prev, jobs: data.total || 0 }));
      } catch (e) {
        console.error("Failed to fetch jobs count:", e);
      }

      // 下書き・応募済み・受注はlocalStorageから
      if (typeof window !== "undefined") {
        try {
          const drafts = JSON.parse(localStorage.getItem("proposal-drafts") || "[]");
          const submitted = JSON.parse(localStorage.getItem("proposal-submitted") || "[]");
          const ongoing = JSON.parse(localStorage.getItem("proposal-ongoing") || "[]");
          setCounts((prev) => ({
            ...prev,
            drafts: drafts.length,
            submitted: submitted.length,
            ongoing: ongoing.length,
          }));
        } catch (e) {
          console.error("Failed to load localStorage:", e);
        }
      }
    };

    loadCounts();
  }, []);

  const items = [
    {
      label: "案件",
      count: counts.jobs,
      icon: Search,
      href: "/",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "見込み",
      count: counts.drafts,
      icon: PenLine,
      href: "/drafts",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "提案済",
      count: counts.submitted,
      icon: Send,
      href: "/submitted",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "受注",
      count: counts.ongoing,
      icon: CheckCircle,
      href: "/ongoing",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Link key={item.label} href={item.href}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.bgColor}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{item.count}</p>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
