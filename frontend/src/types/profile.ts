export interface UserProfile {
  // 基本情報
  name: string;
  bio: string;

  // スキル・得意分野
  skills: string[];
  specialties: string[];
  skills_detail: string; // 自由記述

  // 希望条件
  preferred_categories: string[];
  preferred_categories_detail: string; // 自由記述

  // ソーシャル・ポートフォリオ
  website_url: string;
  github_url: string;
  twitter_url: string;
  portfolio_urls: string[];
}

// デフォルト値
export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "",
  bio: "",
  skills: [],
  specialties: [],
  skills_detail: "",
  preferred_categories: [],
  preferred_categories_detail: "",
  website_url: "",
  github_url: "",
  twitter_url: "",
  portfolio_urls: [],
};

// スキルの候補リスト
export const SKILL_SUGGESTIONS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Node.js",
  "Go",
  "Rust",
  "Java",
  "PHP",
  "Ruby",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST API",
  "機械学習",
  "データ分析",
  "Webスクレイピング",
  "自動化",
  "CI/CD",
  "テスト自動化",
];

// 得意分野の候補リスト
export const SPECIALTY_SUGGESTIONS = [
  "Webアプリケーション開発",
  "モバイルアプリ開発",
  "API開発",
  "データベース設計",
  "インフラ構築",
  "DevOps",
  "データ収集・スクレイピング",
  "業務自動化",
  "データ分析・可視化",
  "機械学習・AI",
  "ECサイト構築",
  "LP制作",
  "WordPress",
  "SEO対策",
];
