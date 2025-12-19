"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Play, Download, ChevronDown, Settings2, Infinity, Loader2 } from "lucide-react";

interface ScraperSettingsProps {
  isRunning: boolean;
  isStarting?: boolean;
  onStart: (settings: {
    categories: string[];
    jobTypes: string[];
    maxPages: number;
    fetchDetails: boolean;
    saveToDatabase: boolean;
  }) => void;
}

const CATEGORIES = [
  { value: "system", label: "システム開発" },
  { value: "web", label: "Web制作" },
  { value: "writing", label: "ライティング" },
  { value: "design", label: "デザイン" },
  { value: "multimedia", label: "マルチメディア" },
  { value: "business", label: "ビジネス" },
  { value: "translation", label: "翻訳" },
];

const JOB_TYPES = [
  { value: "project", label: "プロジェクト" },
  { value: "task", label: "タスク" },
  { value: "competition", label: "コンペ" },
];

const PAGE_OPTIONS = [
  { value: "1", label: "1ページ" },
  { value: "3", label: "3ページ" },
  { value: "5", label: "5ページ" },
  { value: "10", label: "10ページ" },
];

export function ScraperSettings({ isRunning, isStarting = false, onStart }: ScraperSettingsProps) {
  const isDisabled = isRunning || isStarting;
  const [categories, setCategories] = useState<string[]>(["system", "web"]);
  const [jobTypes, setJobTypes] = useState<string[]>(["project"]);
  const [maxPages, setMaxPages] = useState<string>("3");
  const [openOnly, setOpenOnly] = useState<boolean>(true);
  const [noProposalsOnly, setNoProposalsOnly] = useState<boolean>(false);
  const [fetchDetails, setFetchDetails] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  const handleCategoryChange = (value: string, checked: boolean) => {
    if (checked) {
      setCategories([...categories, value]);
    } else {
      setCategories(categories.filter((c) => c !== value));
    }
  };

  const handleJobTypeChange = (value: string, checked: boolean) => {
    if (checked) {
      setJobTypes([...jobTypes, value]);
    } else {
      setJobTypes(jobTypes.filter((t) => t !== value));
    }
  };

  const handleStart = (fetchAll: boolean = false) => {
    onStart({
      categories,
      jobTypes,
      maxPages: fetchAll ? 0 : parseInt(maxPages),  // 0 = 全件取得
      fetchDetails,
      saveToDatabase: true,
    });
  };

  const estimatedJobs = parseInt(maxPages) * 30 * categories.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4" />
          案件取得
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* カテゴリ（複数選択） */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">カテゴリ</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat.value}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer
                  transition-colors border
                  ${categories.includes(cat.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={categories.includes(cat.value)}
                  onChange={(e) => handleCategoryChange(cat.value, e.target.checked)}
                  disabled={isDisabled}
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        {/* 案件形式 */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">案件形式</Label>
          <div className="flex flex-wrap gap-2">
            {JOB_TYPES.map((type) => (
              <label
                key={type.value}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm cursor-pointer
                  transition-colors border
                  ${jobTypes.includes(type.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted border-input"
                  }
                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={jobTypes.includes(type.value)}
                  onChange={(e) => handleJobTypeChange(type.value, e.target.checked)}
                  disabled={isDisabled}
                />
                {type.label}
              </label>
            ))}
          </div>
        </div>

        {/* 取得量とオプション */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={maxPages} onValueChange={setMaxPages} disabled={isDisabled}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">
            約{estimatedJobs}件
          </span>

          <div className="flex gap-2 ml-auto">
            <Button
              onClick={() => handleStart(false)}
              disabled={isDisabled || categories.length === 0 || jobTypes.length === 0}
            >
              {isStarting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  開始中...
                </>
              ) : isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  取得中...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  取得開始
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleStart(true)}
              disabled={isDisabled || categories.length === 0 || jobTypes.length === 0}
              title="選択カテゴリの全ページを取得"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Infinity className="h-4 w-4 mr-1" />
              )}
              全件取得
            </Button>
          </div>
        </div>

        {/* 詳細オプション */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Settings2 className="h-3.5 w-3.5" />
            詳細オプション
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-3">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={openOnly}
                  onCheckedChange={(c) => setOpenOnly(c === true)}
                  disabled={isDisabled}
                />
                募集中のみ
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={noProposalsOnly}
                  onCheckedChange={(c) => setNoProposalsOnly(c === true)}
                  disabled={isDisabled}
                />
                提案なしのみ
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={fetchDetails}
                  onCheckedChange={(c) => setFetchDetails(c === true)}
                  disabled={isDisabled}
                />
                詳細も取得
                {fetchDetails && <span className="text-orange-600">(時間増)</span>}
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
