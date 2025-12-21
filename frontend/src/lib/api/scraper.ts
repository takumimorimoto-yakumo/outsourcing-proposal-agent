import { API_BASE_URL } from "./base";

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
  categories: string[];
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

export async function cleanupExpiredJobs(): Promise<{
  success: boolean;
  deleted: number;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/scraper/cleanup-expired`, {
    method: "POST",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to cleanup expired jobs");
  }

  return response.json();
}
