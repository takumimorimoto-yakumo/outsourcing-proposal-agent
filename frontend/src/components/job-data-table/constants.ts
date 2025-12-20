// カラム幅の定数
export const MIN_COLUMN_WIDTH = 80;
export const CHECKBOX_WIDTH = 40;
export const DEFAULT_COLUMN_WIDTH = 150;

// 幅のヘルパー関数 (文字数から概算ピクセル)
export function w(chars: number): number {
  return Math.max(MIN_COLUMN_WIDTH, chars * 8 + 24);
}

// localStorage キー接頭辞
export const STORAGE_KEY_PREFIX = "proposal-generator-job-table";

// スキーマバージョン（カラム構造が変わったらインクリメント）
export const SCHEMA_VERSION = 5;

// カラムメタデータ
export interface ColumnMeta {
  id: string;
  label: string;
}

// 利用可能なカラム一覧
export function getAvailableColumns(): ColumnMeta[] {
  return [
    { id: "select", label: "選択" },
    { id: "ai_score", label: "AIスコア" },
    { id: "title", label: "タイトル" },
    { id: "category", label: "カテゴリ" },
    { id: "subcategory", label: "サブカテゴリ" },
    { id: "all_tags", label: "タグ" },
    { id: "job_type", label: "形式" },
    { id: "budget", label: "予算" },
    { id: "remaining_days", label: "残り" },
    { id: "proposal_count", label: "応募" },
    { id: "recruitment_count", label: "募集" },
    { id: "client_name", label: "クライアント" },
    { id: "client_rating", label: "評価" },
    { id: "client_order_history", label: "発注数" },
    { id: "actions", label: "アクション" },
  ];
}

// デフォルトのカラムサイズ
export const DEFAULT_COLUMN_SIZES: Record<string, number> = {
  select: CHECKBOX_WIDTH,
  ai_score: 80,
  title: 280,
  category: 100,
  subcategory: 100,
  all_tags: 180,
  job_type: 90,
  budget: 180,
  remaining_days: 60,
  proposal_count: 60,
  recruitment_count: 60,
  client_name: 120,
  client_rating: 60,
  client_order_history: 70,
  actions: 48,
};

// デフォルトで非表示のカラム
export const DEFAULT_HIDDEN_COLUMNS: string[] = [];
