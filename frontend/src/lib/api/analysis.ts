import { JobPriorityScore } from "@/types/job";
import { API_BASE_URL } from "./base";

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
