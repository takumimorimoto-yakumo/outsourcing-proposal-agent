"use client";

import { useMemo, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnResizeMode,
} from "@tanstack/react-table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Job } from "@/types/job";
import { AIJobScore } from "@/lib/api";
import { getJobColumns, JobActionHandlers } from "./job-columns";
import { useJobTableState } from "./use-job-table-state";
import { DraggableTableHead } from "./draggable-header";
import { ColumnVisibilityMenu } from "./column-visibility-menu";
import { CHECKBOX_WIDTH, MIN_COLUMN_WIDTH } from "./constants";

// テーブルは親の高さに合わせる

interface JobDataTableProps {
  jobs: Job[];
  isLoading?: boolean;
  aiScores?: Map<string, AIJobScore>;
  onSelectionChange?: (selectedJobIds: string[]) => void;
  aiScoreLoadingIds?: Set<string>;
}

export function JobDataTable({
  jobs,
  isLoading = false,
  aiScores,
  onSelectionChange,
  aiScoreLoadingIds,
}: JobDataTableProps) {
  const {
    isMounted,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnOrder,
    columnSizing,
    setColumnSizing,
    availableColumns,
    handleDragEnd,
    resetToDefaults,
  } = useJobTableState();

  // アクションハンドラー
  const actionHandlers: JobActionHandlers = useMemo(() => ({
    aiScoreLoadingIds,
  }), [aiScoreLoadingIds]);

  // カラム定義
  const columns = useMemo(
    () => getJobColumns(aiScores, actionHandlers),
    [aiScores, actionHandlers]
  );

  // テーブルインスタンス
  const table = useReactTable({
    data: jobs,
    columns,
    columnResizeMode: "onChange" as ColumnResizeMode,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
      columnOrder,
      columnSizing,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.job_id || row.url,
    defaultColumn: {
      minSize: MIN_COLUMN_WIDTH,
      maxSize: 800,
    },
  });

  // リサイズ中かどうか
  const isResizing = table.getState().columnSizingInfo.isResizingColumn;

  // 選択変更を親に通知
  useEffect(() => {
    if (onSelectionChange) {
      const selectedIds = Object.keys(rowSelection).filter(
        (id) => rowSelection[id]
      );
      onSelectionChange(selectedIds);
    }
  }, [rowSelection, onSelectionChange]);

  // DnD センサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // DnD終了ハンドラー
  const onDragEnd = (event: DragEndEvent) => {
    handleDragEnd(event);
  };

  // ヘッダーグループ取得
  const headerGroups = table.getHeaderGroups();

  // 表示されているカラムのID
  const visibleColumnIds = table.getVisibleLeafColumns().map((col) => col.id);

  // ローディング表示
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="rounded-md border bg-card">
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // SSR時のフォールバック
  if (!isMounted) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="rounded-md border bg-card">
          <div className="h-[400px]" />
        </div>
      </div>
    );
  }

  // テーブルコンテンツのレンダリング
  const renderTableContent = () => (
    <div className={isResizing ? "select-none" : ""}>
      <table className="w-full caption-bottom text-sm border-collapse" style={{ minWidth: "max-content" }}>
        <TableHeader className="sticky top-0 bg-card z-10 shadow-[0_1px_0_hsl(var(--border))]">
          {headerGroups.map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              <SortableContext
                items={visibleColumnIds}
                strategy={horizontalListSortingStrategy}
              >
                {headerGroup.headers.map((header) => {
                  const isCheckbox = header.id === "select";
                  const isSticky = isCheckbox;
                  const leftPosition = 0;

                  return (
                    <DraggableTableHead
                      key={header.id}
                      header={header}
                      isSticky={isSticky}
                      leftPosition={leftPosition}
                    />
                  );
                })}
              </SortableContext>
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={visibleColumnIds.length}
                className="h-24 text-center text-muted-foreground"
              >
                案件がありません
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() ? "selected" : undefined}
                className="hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => {
                  const isCheckbox = cell.column.id === "select";
                  const isSticky = isCheckbox;
                  const columnWidth = isCheckbox ? CHECKBOX_WIDTH : cell.column.getSize();

                  return (
                    <TableCell
                      key={cell.id}
                      style={{
                        width: columnWidth,
                        minWidth: isCheckbox ? CHECKBOX_WIDTH : MIN_COLUMN_WIDTH,
                        maxWidth: columnWidth,
                        ...(isSticky && { left: 0 }),
                      }}
                      className={`
                        py-3
                        ${isSticky ? "sticky bg-card z-[1] shadow-[1px_0_0_hsl(var(--border))]" : ""}
                        ${isCheckbox ? "p-0" : "border-r last:border-r-0"}
                      `}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </table>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div className="flex items-center justify-between shrink-0 mb-3">
        <div className="text-sm text-muted-foreground">
          {jobs.length}件の案件
          {Object.keys(rowSelection).length > 0 && (
            <span className="ml-2 text-primary font-medium">
              ({Object.keys(rowSelection).length}件選択中)
            </span>
          )}
        </div>
        <ColumnVisibilityMenu
          table={table}
          availableColumns={availableColumns}
          onReset={resetToDefaults}
        />
      </div>

      {/* テーブルコンテナ */}
      <div className="flex-1 min-h-0 rounded-md border bg-card overflow-auto scrollbar-thin">
        <div className="h-full w-max min-w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            {renderTableContent()}
          </DndContext>
        </div>
      </div>
    </div>
  );
}
