"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  Database,
  AlertTriangle,
  Settings,
  Loader2,
} from "lucide-react";
import { clearSpreadsheet } from "@/lib/api";

const CONFIRM_TEXT = "delete all data";

interface DataManagementTabProps {
  setMessage: (msg: { type: "success" | "error"; text: string } | null) => void;
}

export function DataManagementTab({ setMessage }: DataManagementTabProps) {
  const [isClearing, setIsClearing] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // データベースクリア
  const handleClearDatabase = async () => {
    try {
      setIsClearing(true);
      setMessage(null);
      await clearSpreadsheet();
      setMessage({ type: "success", text: "データベースをクリアしました" });
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "削除に失敗しました",
      });
    } finally {
      setIsClearing(false);
    }
  };

  // ローカルキャッシュクリア
  const handleClearLocalCache = () => {
    localStorage.removeItem("proposal-generator-jobs-cache");
    localStorage.removeItem("proposal-generator-priority-scores");
    setMessage({ type: "success", text: "ローカルキャッシュをクリアしました" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4" />
          データ管理
        </CardTitle>
        <CardDescription>
          データベースに保存されているデータを管理します
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* データベースクリア */}
        <div className="flex items-start justify-between gap-4 p-4 border rounded-lg border-destructive/30 bg-destructive/5">
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              データベースをクリア
            </div>
            <p className="text-sm text-muted-foreground">
              データベースに保存されている全ての案件データを削除します。
              <br />
              <span className="text-destructive font-medium">この操作は取り消せません。</span>
            </p>
          </div>
          <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
            setDeleteDialogOpen(open);
            if (!open) setDeleteConfirmText("");
          }}>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={isClearing}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                削除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  データベースを完全に削除
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    この操作を実行すると、データベースに保存されている
                    <span className="font-semibold text-foreground">全ての案件データ</span>
                    が完全に削除されます。
                  </p>
                  <p className="text-destructive font-medium">
                    この操作は取り消せません。
                  </p>
                  <div className="pt-2">
                    <p className="text-sm mb-2">
                      続行するには <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">{CONFIRM_TEXT}</code> と入力してください：
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder={CONFIRM_TEXT}
                      className="font-mono"
                      autoComplete="off"
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isClearing}>キャンセル</AlertDialogCancel>
                <Button
                  variant="destructive"
                  onClick={handleClearDatabase}
                  disabled={deleteConfirmText !== CONFIRM_TEXT || isClearing}
                >
                  {isClearing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      削除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      完全に削除する
                    </>
                  )}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* ローカルキャッシュクリア */}
        <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="font-medium flex items-center gap-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              ローカルキャッシュをクリア
            </div>
            <p className="text-sm text-muted-foreground">
              ブラウザに保存されている案件のキャッシュデータをクリアします。
              次回アクセス時にデータベースから再取得されます。
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLocalCache}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            クリア
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
