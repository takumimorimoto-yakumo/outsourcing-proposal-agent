"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  SortingState,
  VisibilityState,
  RowSelectionState,
  ColumnOrderState,
  ColumnSizingState,
} from "@tanstack/react-table";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import {
  STORAGE_KEY_PREFIX,
  SCHEMA_VERSION,
  DEFAULT_COLUMN_SIZES,
  DEFAULT_HIDDEN_COLUMNS,
  getAvailableColumns,
} from "./constants";

// localStorage読み込みヘルパー
function readFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved) as T;
  } catch (e) {
    console.error(`Failed to parse ${key}:`, e);
  }
  return defaultValue;
}

// localStorage書き込みヘルパー
function writeToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write ${key}:`, e);
  }
}

// スキーマバージョンチェック＆リセット
function checkAndResetIfOutdated(prefix: string): void {
  if (typeof window === "undefined") return;
  const versionKey = `${prefix}-schema-version`;
  const savedVersion = localStorage.getItem(versionKey);

  if (savedVersion !== String(SCHEMA_VERSION)) {
    // 古い設定をクリア
    localStorage.removeItem(`${prefix}-visibility`);
    localStorage.removeItem(`${prefix}-order`);
    localStorage.removeItem(`${prefix}-sizing`);
    localStorage.setItem(versionKey, String(SCHEMA_VERSION));
    console.log(`[JobTable] Schema upgraded to v${SCHEMA_VERSION}, settings reset.`);
  }
}

export interface UseJobTableStateOptions {
  storageKeyPrefix?: string;
}

export function useJobTableState(options: UseJobTableStateOptions = {}) {
  const prefix = options.storageKeyPrefix || STORAGE_KEY_PREFIX;
  const [isMounted, setIsMounted] = useState(false);

  // スキーマバージョンチェック（古い設定をリセット）
  if (typeof window !== "undefined") {
    checkAndResetIfOutdated(prefix);
  }

  // 状態初期化
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const defaultVisibility: VisibilityState = {};
      DEFAULT_HIDDEN_COLUMNS.forEach((col) => {
        defaultVisibility[col] = false;
      });
      return readFromStorage(`${prefix}-visibility`, defaultVisibility);
    }
  );
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
    readFromStorage(`${prefix}-order`, [])
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() =>
    readFromStorage(`${prefix}-sizing`, DEFAULT_COLUMN_SIZES)
  );

  // マウント検出
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // localStorage永続化
  useEffect(() => {
    if (isMounted) {
      writeToStorage(`${prefix}-visibility`, columnVisibility);
    }
  }, [columnVisibility, isMounted, prefix]);

  useEffect(() => {
    if (isMounted && columnOrder.length > 0) {
      writeToStorage(`${prefix}-order`, columnOrder);
    }
  }, [columnOrder, isMounted, prefix]);

  useEffect(() => {
    if (isMounted) {
      writeToStorage(`${prefix}-sizing`, columnSizing);
    }
  }, [columnSizing, isMounted, prefix]);

  // 利用可能なカラム
  const availableColumns = useMemo(() => getAvailableColumns(), []);

  // ベースカラムIDリスト
  const baseColumnIds = useMemo(
    () => availableColumns.map((col) => col.id),
    [availableColumns]
  );

  // 有効なカラム順序を計算
  const effectiveColumnOrder = useMemo(() => {
    if (columnOrder.length === 0) {
      return baseColumnIds;
    }

    // 保存された順序から無効なIDを除外
    const validOrder = columnOrder.filter((id) => baseColumnIds.includes(id));

    // 不足しているカラムを追加
    const missingIds = baseColumnIds.filter((id) => !validOrder.includes(id));

    return [...validOrder, ...missingIds];
  }, [columnOrder, baseColumnIds]);

  // ドラッグ終了ハンドラー
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        setColumnOrder((currentOrder) => {
          const order =
            currentOrder.length === 0 ? baseColumnIds : currentOrder;
          const oldIndex = order.indexOf(active.id as string);
          const newIndex = order.indexOf(over.id as string);

          if (oldIndex === -1 || newIndex === -1) {
            return order;
          }

          return arrayMove(order, oldIndex, newIndex);
        });
      }
    },
    [baseColumnIds]
  );

  // カラム表示切り替え
  const toggleColumnVisibility = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: prev[columnId] === false ? true : false,
    }));
  }, []);

  // 全カラム表示
  const showAllColumns = useCallback(() => {
    setColumnVisibility({});
  }, []);

  // デフォルトに戻す
  const resetToDefaults = useCallback(() => {
    const defaultVisibility: VisibilityState = {};
    DEFAULT_HIDDEN_COLUMNS.forEach((col) => {
      defaultVisibility[col] = false;
    });
    setColumnVisibility(defaultVisibility);
    setColumnOrder([]);
    setColumnSizing(DEFAULT_COLUMN_SIZES);
  }, []);

  // 選択された行IDを取得
  const selectedJobIds = useMemo(() => {
    return Object.keys(rowSelection).filter((id) => rowSelection[id]);
  }, [rowSelection]);

  // 全選択解除
  const clearSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  return {
    // 状態
    isMounted,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    columnVisibility,
    setColumnVisibility,
    columnOrder: effectiveColumnOrder,
    setColumnOrder,
    columnSizing,
    setColumnSizing,

    // メタデータ
    availableColumns,

    // ハンドラー
    handleDragEnd,
    toggleColumnVisibility,
    showAllColumns,
    resetToDefaults,

    // 選択関連
    selectedJobIds,
    clearSelection,
  };
}
