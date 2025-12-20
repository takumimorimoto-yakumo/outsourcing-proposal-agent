"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FileText, Search, PenLine, Send, CheckCircle, History, LayoutDashboard, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  count?: number;
}

interface PipelineSidebarProps {
  counts?: {
    jobs?: number;
    drafts?: number;
    submitted?: number;
    ongoing?: number;
    history?: number;
  };
}

const PIPELINE_STAGES: PipelineStage[] = [
  {
    id: "jobs",
    label: "案件一覧",
    icon: Search,
    href: "/",
  },
  {
    id: "drafts",
    label: "下書き",
    icon: PenLine,
    href: "/drafts",
  },
  {
    id: "submitted",
    label: "応募済み",
    icon: Send,
    href: "/submitted",
  },
  {
    id: "ongoing",
    label: "受注",
    icon: CheckCircle,
    href: "/ongoing",
  },
  {
    id: "history",
    label: "履歴",
    icon: History,
    href: "/history",
  },
];

export function PipelineSidebar({ counts = {} }: PipelineSidebarProps) {
  const pathname = usePathname();

  const getCount = (id: string): number | undefined => {
    return counts[id as keyof typeof counts];
  };

  const isActive = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <FileText className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm">Proposal Generator</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    <span>ダッシュボード</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>パイプライン</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {PIPELINE_STAGES.map((stage) => {
                const Icon = stage.icon;
                const count = getCount(stage.id);
                const active = isActive(stage.href);

                return (
                  <SidebarMenuItem key={stage.id}>
                    <SidebarMenuButton asChild isActive={active}>
                      <Link href={stage.href}>
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{stage.label}</span>
                        {count !== undefined && count > 0 && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {count}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>設定</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"}>
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>設定</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
