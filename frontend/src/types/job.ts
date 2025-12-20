export interface Job {
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  budget_type: string;
  job_id: string | null;
  job_type: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  remaining_days: number | null;
  required_skills: string[];
  tags: string[];
  feature_tags: string[];
  proposal_count: number | null;
  recruitment_count: number | null;
  source: string;
  url: string;
  client_name: string | null;
  client_rating: number | null;
  client_order_history: number | null;
  // パイプライン管理用
  pipeline_status?: PipelineStatus;
  added_at?: string;  // パイプラインに追加された日時
  expired_at?: string; // 期限切れになった日時
}

// パイプラインステータス
export type PipelineStatus = "draft" | "submitted" | "ongoing" | "expired" | "rejected" | "completed";

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = {
  draft: "下書き",
  submitted: "応募済み",
  ongoing: "受注",
  expired: "期限切れ",
  rejected: "落選",
  completed: "完了",
};

// 期限切れ判定
export function isExpired(job: Job): boolean {
  if (job.remaining_days !== null && job.remaining_days <= 0) {
    return true;
  }
  if (job.status === "closed") {
    return true;
  }
  return false;
}

export interface Category {
  value: string;
  label: string;
}

export interface JobType {
  value: string;
  label: string;
}

// Lancersの検索カテゴリ（大カテゴリ）
export const CATEGORY_LABELS: Record<string, string> = {
  system: "システム開発",
  web: "Web制作",
  writing: "ライティング",
  design: "デザイン",
  multimedia: "マルチメディア",
  business: "ビジネス",
  translation: "翻訳",
};

// 自動分類サブカテゴリ（詳細カテゴリ）
export const SUBCATEGORY_LABELS: Record<string, string> = {
  web_development: "Web開発",
  app_development: "アプリ開発",
  scraping: "スクレイピング",
  automation: "自動化",
  data_analysis: "データ分析",
  ai_ml: "AI/ML",
  other: "その他",
};

export const JOB_TYPE_LABELS: Record<string, string> = {
  project: "プロジェクト",
  task: "タスク",
  competition: "コンペ",
  unknown: "不明",
};

export const STATUS_LABELS: Record<string, string> = {
  open: "募集中",
  closed: "終了",
  unknown: "不明",
};

// 案件優先度スコア
export interface JobPriorityScore {
  job_id: string;
  overall_score: number;
  skill_match_score: number;
  budget_score: number;
  competition_score: number;
  client_score: number;
  timeline_score: number;
  reasons: string[];
}
