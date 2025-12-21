import { API_BASE_URL } from "./base";

export interface WorkflowRun {
  id: number;
  status: "queued" | "in_progress" | "completed" | "waiting";
  conclusion: "success" | "failure" | "cancelled" | "skipped" | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  event: string;
  run_number: number;
}

export interface GitHubConfig {
  configured: boolean;
  repo: string;
  workflow_id: string;
}

export interface TriggerWorkflowRequest {
  categories: string[];
  job_types: string[];
  max_pages: number;
  fetch_details: boolean;
}

export async function getGitHubConfig(): Promise<GitHubConfig> {
  const response = await fetch(`${API_BASE_URL}/api/github/config`);

  if (!response.ok) {
    throw new Error("Failed to get GitHub config");
  }

  return response.json();
}

export async function getWorkflowRuns(limit: number = 10): Promise<{
  success: boolean;
  runs: WorkflowRun[];
  total_count?: number;
  error?: string;
  setup_required?: boolean;
}> {
  const response = await fetch(`${API_BASE_URL}/api/github/workflow-runs?limit=${limit}`);

  if (!response.ok) {
    throw new Error("Failed to get workflow runs");
  }

  return response.json();
}

export async function triggerWorkflow(
  request: TriggerWorkflowRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/github/trigger-workflow`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to trigger workflow");
  }

  return response.json();
}
