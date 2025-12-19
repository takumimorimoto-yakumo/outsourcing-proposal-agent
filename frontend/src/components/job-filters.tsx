"use client";

import { Category, JobType } from "@/types/job";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Filter, RefreshCw, FolderOpen } from "lucide-react";

interface JobFiltersProps {
  categories: Category[];
  jobTypes: JobType[];
  selectedCategories: string[];
  selectedJobTypes: string[];
  onCategoriesChange: (values: string[]) => void;
  onJobTypesChange: (types: string[]) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export function JobFilters({
  categories,
  jobTypes,
  selectedCategories,
  selectedJobTypes,
  onCategoriesChange,
  onJobTypesChange,
  onRefresh,
  isLoading,
}: JobFiltersProps) {
  const handleCategoryToggle = (value: string) => {
    if (selectedCategories.includes(value)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== value));
    } else {
      onCategoriesChange([...selectedCategories, value]);
    }
  };

  const handleJobTypeToggle = (value: string) => {
    if (selectedJobTypes.includes(value)) {
      onJobTypesChange(selectedJobTypes.filter((t) => t !== value));
    } else {
      onJobTypesChange([...selectedJobTypes, value]);
    }
  };

  // "all"を除いたカテゴリのみ表示用にフィルタ
  const selectableCategories = categories.filter((c) => c.value !== "all");

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            カテゴリ
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedCategories.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>カテゴリを選択</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {selectableCategories.map((category) => (
            <DropdownMenuCheckboxItem
              key={category.value}
              checked={selectedCategories.includes(category.value)}
              onCheckedChange={() => handleCategoryToggle(category.value)}
            >
              {category.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            案件形式
            {selectedJobTypes.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedJobTypes.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>案件形式を選択</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {jobTypes.map((jobType) => (
            <DropdownMenuCheckboxItem
              key={jobType.value}
              checked={selectedJobTypes.includes(jobType.value)}
              onCheckedChange={() => handleJobTypeToggle(jobType.value)}
            >
              {jobType.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        title="保存済みデータを再読み込み"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}
