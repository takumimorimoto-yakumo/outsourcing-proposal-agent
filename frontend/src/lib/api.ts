import { Job, Category, JobType, JobPriorityScore } from "@/types/job";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchJobs(
  category: string | null,
  jobTypes: string[],
  maxPages: number = 3
): Promise<{ jobs: Job[]; total: number }> {
  const params = new URLSearchParams({
    job_types: jobTypes.join(","),
    max_pages: maxPages.toString(),
  });

  // カテゴリが指定されている場合のみパラメータに追加
  if (category) {
    params.set("category", category);
  }

  const response = await fetch(`${API_BASE_URL}/api/jobs?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return response.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/api/categories`);

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = await response.json();
  return data.categories;
}

export async function fetchJobTypes(): Promise<JobType[]> {
  const response = await fetch(`${API_BASE_URL}/api/job-types`);

  if (!response.ok) {
    throw new Error("Failed to fetch job types");
  }

  const data = await response.json();
  return data.job_types;
}

export async function fetchJobDetail(jobId: string): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/detail`);

  if (!response.ok) {
    throw new Error("Failed to fetch job detail");
  }

  return response.json();
}

export async function scrapeJobs(
  category: string | null,
  jobTypes: string[],
  maxPages: number = 3,
  fetchDetails: boolean = false  // デフォルトでオフ
): Promise<{ success: boolean; total: number; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/scrape`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      category: category || null,
      job_types: jobTypes,
      max_pages: maxPages,
      fetch_details: fetchDetails,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to scrape jobs");
  }

  return response.json();
}

export function formatBudget(min: number | null, max: number | null): string {
  if (min && max && min !== max) {
    return `${min.toLocaleString()}円 〜 ${max.toLocaleString()}円`;
  } else if (min) {
    return `${min.toLocaleString()}円`;
  } else if (max) {
    return `〜 ${max.toLocaleString()}円`;
  }
  return "要相談";
}

// =============================================================================
// スクレイパーダッシュボード用API
// =============================================================================

export interface ScraperStatus {
  is_running: boolean;
  current_page: number;
  total_pages: number;
  jobs_fetched: number;
  estimated_total: number;
  elapsed_seconds: number;
  category: string | null;
  error: string | null;
  phase: "idle" | "fetching" | "saving" | "done";
  message: string;
  current_category_index: number;
  total_categories: number;
  detail_current: number;
  detail_total: number;
}

export interface ScraperStats {
  today: number;
  this_week: number;
  total: number;
  by_category: Record<string, number>;
}

export interface ScraperHistoryItem {
  timestamp: string;
  category: string;
  count: number;
  added?: number;
  updated?: number;
  status: "success" | "error" | "cancelled";
  error?: string;
  duration_seconds: number | null;
}

export interface ScraperStartRequest {
  categories: string[];  // 複数カテゴリ対応
  job_types: string[];
  max_pages: number;
  fetch_details: boolean;
  save_to_database: boolean;
}

export async function startScraper(
  request: ScraperStartRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scraper/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to start scraper");
  }

  return response.json();
}

export async function getScraperStatus(): Promise<ScraperStatus> {
  const response = await fetch(`${API_BASE_URL}/api/scraper/status`);

  if (!response.ok) {
    throw new Error("Failed to get scraper status");
  }

  return response.json();
}

export async function cancelScraper(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scraper/cancel`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to cancel scraper");
  }

  return response.json();
}

export async function getScraperStats(): Promise<ScraperStats> {
  const response = await fetch(`${API_BASE_URL}/api/scraper/stats`);

  if (!response.ok) {
    throw new Error("Failed to get scraper stats");
  }

  return response.json();
}

export async function getScraperHistory(): Promise<{ history: ScraperHistoryItem[] }> {
  const response = await fetch(`${API_BASE_URL}/api/scraper/history`);

  if (!response.ok) {
    throw new Error("Failed to get scraper history");
  }

  return response.json();
}

export async function clearDatabase(): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/scraper/clear-database`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to clear database");
  }

  return response.json();
}

// 後方互換性のためのエイリアス
export const clearSpreadsheet = clearDatabase;

// =============================================================================
// プロフィール管理API
// =============================================================================

import type { UserProfile } from "@/types/profile";

export async function getProfile(): Promise<UserProfile> {
  const response = await fetch(`${API_BASE_URL}/api/profile`);

  if (!response.ok) {
    throw new Error("Failed to get profile");
  }

  return response.json();
}

export async function saveProfile(
  profile: UserProfile
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to save profile");
  }

  return response.json();
}

// =============================================================================
// 案件優先度分析API
// =============================================================================

export async function analyzeJobPriority(
  jobIds: string[]
): Promise<{ priorities: JobPriorityScore[] }> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/analyze-priority`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job_ids: jobIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to analyze job priority");
  }

  return response.json();
}

export async function analyzeAllPriorities(): Promise<{
  priorities: JobPriorityScore[];
  total: number;
}> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/analyze-all-priorities`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to analyze all priorities");
  }

  return response.json();
}

// =============================================================================
// AI案件スコアリングAPI
// =============================================================================

export interface AIScoreBreakdown {
  skill_match: number;
  budget_appropriateness: number;
  competition_level: number;
  client_reliability: number;
  growth_potential: number;
}

export interface AIJobScore {
  overall_score: number;
  recommendation: "highly_recommended" | "recommended" | "neutral" | "not_recommended";
  breakdown: AIScoreBreakdown;
  reasons: string[];
  concerns: string[];
}

export interface AIScoreResult {
  job_id: string;
  success: boolean;
  score?: AIJobScore;
  error?: string;
}

export async function scoreJobWithAI(jobId: string | number): Promise<{
  success: boolean;
  job_id: string;
  score?: AIJobScore;
  error?: string;
}> {
  // job_idを必ず文字列として送信
  const jobIdStr = String(jobId).trim();

  const response = await fetch(`${API_BASE_URL}/api/jobs/ai-score`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job_id: jobIdStr }),
  });

  if (!response.ok) {
    const error = await response.json();
    // FastAPIのバリデーションエラーはdetailが配列の場合がある
    let errorMessage = "Failed to score job";
    if (typeof error.detail === "string") {
      errorMessage = error.detail;
    } else if (Array.isArray(error.detail)) {
      errorMessage = error.detail.map((e: { msg?: string }) => e.msg || JSON.stringify(e)).join(", ");
    } else if (error.detail) {
      errorMessage = JSON.stringify(error.detail);
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function scoreJobsWithAI(jobIds: (string | number)[]): Promise<{
  success: boolean;
  total: number;
  scores: AIScoreResult[];
}> {
  // job_idsを必ず文字列配列として送信
  const jobIdStrs = jobIds.map((id) => String(id).trim());

  const response = await fetch(`${API_BASE_URL}/api/jobs/ai-score-batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ job_ids: jobIdStrs }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to score jobs");
  }

  return response.json();
}

// =============================================================================
// 提案文生成API
// =============================================================================

export interface ProposalResult {
  text: string;
  character_count: number;
}

export interface ProposalMetadata {
  job_understanding: Record<string, unknown>;
  quality_score: number;
  retry_count: number;
  processing_time_ms: number;
  agents_used: string[];
}

export interface GenerateProposalResponse {
  success: boolean;
  proposal?: ProposalResult;
  metadata?: ProposalMetadata;
  error?: {
    code: string;
    message: string;
  };
}

export async function generateProposal(
  jobId: string | number,
  maxRetries: number = 3
): Promise<GenerateProposalResponse> {
  // job_idを必ず文字列として送信
  const jobIdStr = String(jobId).trim();

  const response = await fetch(`${API_BASE_URL}/api/proposals/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      job_id: jobIdStr,
      max_retries: maxRetries,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate proposal");
  }

  return response.json();
}
