"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import { Play, Download, ChevronDown, ChevronRight, Settings2, Infinity, Loader2 } from "lucide-react";

interface Subcategory {
  slug: string;
  label: string;
}

interface Category {
  slug: string;
  label: string;
  subcategories: Subcategory[];
}

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

  // カテゴリデータ（APIから取得）
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 選択状態: カテゴリslug -> 選択されたサブカテゴリslugs (空配列 = カテゴリ全体)
  const [selectedCategories, setSelectedCategories] = useState<Record<string, string[]>>({
    system: [],
    web: [],
  });

  // 展開中のカテゴリ
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["system", "web"]));

  const [jobTypes, setJobTypes] = useState<string[]>(["project"]);
  const [maxPages, setMaxPages] = useState<string>("3");
  const [openOnly, setOpenOnly] = useState<boolean>(true);
  const [noProposalsOnly, setNoProposalsOnly] = useState<boolean>(false);
  const [fetchDetails, setFetchDetails] = useState<boolean>(false);
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  // カテゴリをAPIから取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/categories");
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // カテゴリの選択/解除
  const handleCategoryToggle = (categorySlug: string) => {
    setSelectedCategories((prev) => {
      const newSelection = { ...prev };
      if (categorySlug in newSelection) {
        // カテゴリが選択済み → 解除
        delete newSelection[categorySlug];
        // 展開も解除
        setExpandedCategories((exp) => {
          const newExp = new Set(exp);
          newExp.delete(categorySlug);
          return newExp;
        });
      } else {
        // カテゴリを選択（サブカテゴリは未選択 = 全体）
        newSelection[categorySlug] = [];
        // 展開する
        setExpandedCategories((exp) => new Set(exp).add(categorySlug));
      }
      return newSelection;
    });
  };

  // サブカテゴリの選択/解除
  const handleSubcategoryToggle = (categorySlug: string, subcategorySlug: string) => {
    setSelectedCategories((prev) => {
      const newSelection = { ...prev };
      if (!(categorySlug in newSelection)) {
        // カテゴリが選択されていない場合は何もしない
        return prev;
      }

      const subs = newSelection[categorySlug];
      if (subs.includes(subcategorySlug)) {
        // サブカテゴリを解除
        newSelection[categorySlug] = subs.filter((s) => s !== subcategorySlug);
      } else {
        // サブカテゴリを追加
        newSelection[categorySlug] = [...subs, subcategorySlug];
      }
      return newSelection;
    });
  };

  // カテゴリの展開/折りたたみ
  const toggleCategoryExpand = (categorySlug: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categorySlug)) {
        newSet.delete(categorySlug);
      } else {
        newSet.add(categorySlug);
      }
      return newSet;
    });
  };

  // 全サブカテゴリを選択/解除
  const handleSelectAllSubcategories = (categorySlug: string, allSubcategories: Subcategory[]) => {
    setSelectedCategories((prev) => {
      const newSelection = { ...prev };
      if (!(categorySlug in newSelection)) return prev;

      const currentSubs = newSelection[categorySlug];
      if (currentSubs.length === allSubcategories.length) {
        // 全選択済み → 全解除（カテゴリ全体に戻す）
        newSelection[categorySlug] = [];
      } else {
        // 全選択
        newSelection[categorySlug] = allSubcategories.map((s) => s.slug);
      }
      return newSelection;
    });
  };

  const handleJobTypeChange = (value: string, checked: boolean) => {
    if (checked) {
      setJobTypes([...jobTypes, value]);
    } else {
      setJobTypes(jobTypes.filter((t) => t !== value));
    }
  };

  // APIに送信するカテゴリ形式を生成
  const buildCategoryParams = (): string[] => {
    const result: string[] = [];
    for (const [categorySlug, subcategories] of Object.entries(selectedCategories)) {
      if (subcategories.length === 0) {
        // サブカテゴリ未選択 = カテゴリ全体
        result.push(categorySlug);
      } else {
        // 選択されたサブカテゴリのみ
        for (const sub of subcategories) {
          result.push(`${categorySlug}/${sub}`);
        }
      }
    }
    return result;
  };

  const handleStart = (fetchAll: boolean = false) => {
    onStart({
      categories: buildCategoryParams(),
      jobTypes,
      maxPages: fetchAll ? 0 : parseInt(maxPages),
      fetchDetails,
      saveToDatabase: true,
    });
  };

  const selectedCategoryCount = Object.keys(selectedCategories).length;
  const estimatedJobs = parseInt(maxPages) * 30 * Math.max(selectedCategoryCount, 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="h-4 w-4" />
          案件取得
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* カテゴリ（階層選択） */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">カテゴリ</Label>
          {loadingCategories ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              読み込み中...
            </div>
          ) : (
            <div className="space-y-1">
              {categories.map((cat) => {
                const isSelected = cat.slug in selectedCategories;
                const isExpanded = expandedCategories.has(cat.slug);
                const selectedSubs = selectedCategories[cat.slug] || [];
                const allSelected = selectedSubs.length === cat.subcategories.length;
                const someSelected = selectedSubs.length > 0 && !allSelected;

                return (
                  <div key={cat.slug} className="space-y-1">
                    {/* カテゴリヘッダー */}
                    <div className="flex items-center gap-1">
                      {/* 展開ボタン */}
                      <button
                        type="button"
                        onClick={() => toggleCategoryExpand(cat.slug)}
                        className={`p-0.5 rounded hover:bg-muted ${isDisabled ? "opacity-50" : ""}`}
                        disabled={isDisabled}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* カテゴリチェックボックス */}
                      <label
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer
                          transition-colors border flex-1
                          ${isSelected
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-background hover:bg-muted border-transparent"
                          }
                          ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                        `}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleCategoryToggle(cat.slug)}
                          disabled={isDisabled}
                        />
                        <span className="font-medium">{cat.label}</span>
                        {isSelected && selectedSubs.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {selectedSubs.length}/{cat.subcategories.length} 選択
                          </span>
                        )}
                        {isSelected && selectedSubs.length === 0 && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            全て
                          </span>
                        )}
                      </label>
                    </div>

                    {/* サブカテゴリ */}
                    {isExpanded && isSelected && (
                      <div className="ml-6 pl-3 border-l-2 border-muted space-y-0.5">
                        {/* 全選択/解除ボタン */}
                        <button
                          type="button"
                          onClick={() => handleSelectAllSubcategories(cat.slug, cat.subcategories)}
                          className={`
                            text-xs text-muted-foreground hover:text-foreground py-1 px-2
                            ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                          disabled={isDisabled}
                        >
                          {allSelected ? "全て解除" : someSelected ? "全て選択" : "個別選択"}
                        </button>

                        <div className="flex flex-wrap gap-1">
                          {cat.subcategories.map((sub) => {
                            const isSubSelected = selectedSubs.includes(sub.slug);
                            const showAsSelected = selectedSubs.length === 0 || isSubSelected;

                            return (
                              <label
                                key={sub.slug}
                                className={`
                                  flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer
                                  transition-colors border
                                  ${showAsSelected
                                    ? selectedSubs.length === 0
                                      ? "bg-muted/50 text-foreground border-muted"
                                      : "bg-primary text-primary-foreground border-primary"
                                    : "bg-background hover:bg-muted border-input text-muted-foreground"
                                  }
                                  ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                                `}
                              >
                                <input
                                  type="checkbox"
                                  className="sr-only"
                                  checked={isSubSelected}
                                  onChange={() => handleSubcategoryToggle(cat.slug, sub.slug)}
                                  disabled={isDisabled}
                                />
                                {sub.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
              disabled={isDisabled || selectedCategoryCount === 0 || jobTypes.length === 0}
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
              disabled={isDisabled || selectedCategoryCount === 0 || jobTypes.length === 0}
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
