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
export const SCHEMA_VERSION = 3;

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
    { id: "job_type", label: "案件形式" },
    { id: "budget", label: "予算" },
    { id: "remaining_days", label: "残り日数" },
    { id: "proposal_count", label: "応募状況" },
    { id: "client_rating", label: "クライアント評価" },
    { id: "tags", label: "タグ" },
    { id: "feature_tags", label: "特徴" },
    { id: "actions", label: "アクション" },
  ];
}

// デフォルトのカラムサイズ
export const DEFAULT_COLUMN_SIZES: Record<string, number> = {
  select: CHECKBOX_WIDTH,
  ai_score: 120,
  title: 300,
  category: 120,
  job_type: 100,
  budget: 220,
  remaining_days: 80,
  proposal_count: 100,
  client_rating: 140,
  tags: 150,
  feature_tags: 180,
  actions: 48,
};

// デフォルトで非表示のカラム
export const DEFAULT_HIDDEN_COLUMNS: string[] = ["tags"];
