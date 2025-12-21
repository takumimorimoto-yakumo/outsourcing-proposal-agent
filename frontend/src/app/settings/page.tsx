"use client";

import { useState, useEffect } from "react";
import { PipelineLayout } from "@/components/pipeline-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Clock, Database, Loader2 } from "lucide-react";
import { getProfile } from "@/lib/api";
import { UserProfile, DEFAULT_USER_PROFILE } from "@/types/profile";
import {
  ProfileTab,
  AutomationTab,
  DataManagementTab,
} from "@/components/settings";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // プロフィール状態
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);

  // プロフィール読み込み
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error("プロフィール読み込みエラー:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  if (isLoading) {
    return (
      <PipelineLayout>
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PipelineLayout>
    );
  }

  return (
    <PipelineLayout>
      <div className="p-6 h-full flex flex-col overflow-hidden">
        {message && (
          <div
            className={`px-4 py-3 rounded-md text-sm mb-4 shrink-0 ${
              message.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* メインタブ */}
        <Tabs defaultValue="profile" className="flex-1 flex flex-col min-h-0">
          <TabsList className="shrink-0 w-fit">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              プロフィール設定
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <Clock className="h-4 w-4" />
              自動取得
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              データ管理
            </TabsTrigger>
          </TabsList>

          {/* プロフィール設定タブ */}
          <TabsContent value="profile" className="flex-1 min-h-0 mt-4">
            <ProfileTab
              profile={profile}
              setProfile={setProfile}
              setMessage={setMessage}
            />
          </TabsContent>

          {/* 自動取得タブ */}
          <TabsContent value="automation" className="flex-1 min-h-0 mt-4 overflow-auto">
            <AutomationTab setMessage={setMessage} />
          </TabsContent>

          {/* データ管理タブ */}
          <TabsContent value="data" className="flex-1 min-h-0 mt-4">
            <DataManagementTab setMessage={setMessage} />
          </TabsContent>
        </Tabs>
      </div>
    </PipelineLayout>
  );
}
