import { API_BASE_URL } from "./base";

export type PipelineStatus = "draft" | "submitted" | "ongoing" | "expired" | "rejected" | "completed";

export interface PipelineJob {
  id: string;
  job_id: string;
  pipeline_status: PipelineStatus;
  added_at: string;
  status_changed_at: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineSummary {
  draft: number;
  submitted: number;
  ongoing: number;
  expired: number;
  rejected: number;
  completed: number;
}

export async function getAllPipelineJobs(): Promise<{
  success: boolean;
  jobs: PipelineJob[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline`);
  return response.json();
}

export async function getPipelineJobsByStatus(status: PipelineStatus): Promise<{
  success: boolean;
  jobs: PipelineJob[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/status/${status}`);
  return response.json();
}

export async function getPipelineJobsForJob(jobId: string): Promise<{
  success: boolean;
  jobs: PipelineJob[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/job/${jobId}`);
  return response.json();
}

export async function addToPipeline(
  jobId: string,
  status: PipelineStatus,
  notes: string = ""
): Promise<{ success: boolean; message: string; id?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      job_id: jobId,
      pipeline_status: status,
      notes,
    }),
  });
  return response.json();
}

export async function updatePipelineJob(
  pipelineId: string,
  update: { pipeline_status?: PipelineStatus; notes?: string }
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/${pipelineId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  return response.json();
}

export async function changeJobStatus(
  jobId: string,
  newStatus: PipelineStatus
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/job/${jobId}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ new_status: newStatus }),
  });
  return response.json();
}

export async function removeFromPipeline(pipelineId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/${pipelineId}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function removeJobFromAllPipelines(jobId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/job/${jobId}`, {
    method: "DELETE",
  });
  return response.json();
}

export async function getPipelineSummary(): Promise<{
  success: boolean;
  summary: PipelineSummary;
}> {
  const response = await fetch(`${API_BASE_URL}/api/pipeline/summary`);
  return response.json();
}
