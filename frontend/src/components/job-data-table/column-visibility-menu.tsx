"use client";

import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings2, RotateCcw } from "lucide-react";
import { Job } from "@/types/job";
import { ColumnMeta } from "./constants";

interface ColumnVisibilityMenuProps {
  table: Table<Job>;
  availableColumns: ColumnMeta[];
  onReset?: () => void;
}

export function ColumnVisibilityMenu({
  table,
  availableColumns,
  onReset,
}: ColumnVisibilityMenuProps) {
  // 表示切替可能なカラムのみフィルタリング
  const toggleableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide());

  // カラムIDからラベルを取得
  const getColumnLabel = (columnId: string): string => {
    const meta = availableColumns.find((col) => col.id === columnId);
    return meta?.label || columnId;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">カラム</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>表示カラム</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggleableColumns.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {getColumnLabel(column.id)}
            </DropdownMenuCheckboxItem>
          );
        })}
        {onReset && (
          <>
            <DropdownMenuSeparator />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start px-2 font-normal"
              onClick={onReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              デフォルトに戻す
            </Button>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
