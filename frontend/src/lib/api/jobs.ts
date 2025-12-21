import { Job, Category, JobType } from "@/types/job";
import { API_BASE_URL } from "./base";

export async function fetchJobs(
  category: string | null,
  jobTypes: string[],
  maxPages: number = 3
): Promise<{ jobs: Job[]; total: number }> {
  const params = new URLSearchParams({
    job_types: jobTypes.join(","),
    max_pages: maxPages.toString(),
  });

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
  fetchDetails: boolean = false
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
