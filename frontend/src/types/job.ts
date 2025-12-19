export interface Job {
  title: string;
  description: string;
  category: string;
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
}

export interface Category {
  value: string;
  label: string;
}

export interface JobType {
  value: string;
  label: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  system: "システム開発",
  web: "Web制作",
  writing: "ライティング",
  design: "デザイン",
  multimedia: "マルチメディア",
  business: "ビジネス",
  translation: "翻訳",
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
