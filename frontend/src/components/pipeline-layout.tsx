"use client";

import { ReactNode } from "react";
import { PipelineSidebar } from "@/components/pipeline-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface PipelineLayoutProps {
  children: ReactNode;
  counts?: {
    jobs?: number;
    drafts?: number;
    submitted?: number;
    ongoing?: number;
    history?: number;
  };
}

export function PipelineLayout({ children, counts }: PipelineLayoutProps) {
  return (
    <SidebarProvider>
      <PipelineSidebar counts={counts} />
      <SidebarInset>
        <main className="p-6 space-y-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
