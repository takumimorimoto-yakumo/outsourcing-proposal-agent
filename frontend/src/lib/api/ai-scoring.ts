import { API_BASE_URL } from "./base";

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

export async function getAllCachedScores(): Promise<{
  success: boolean;
  scores: Record<string, AIJobScore>;
}> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/ai-scores`);

  if (!response.ok) {
    console.error("Failed to fetch cached scores");
    return { success: false, scores: {} };
  }

  return response.json();
}

export async function getCachedScore(jobId: string): Promise<{
  success: boolean;
  job_id: string;
  score?: AIJobScore;
  error?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/ai-score/${jobId}`);
  return response.json();
}
