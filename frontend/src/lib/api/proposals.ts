import { API_BASE_URL } from "./base";

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
