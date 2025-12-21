// Base utilities
export { API_BASE_URL, formatBudget } from "./base";

// Jobs API
export {
  fetchJobs,
  fetchCategories,
  fetchJobTypes,
  fetchJobDetail,
  scrapeJobs,
} from "./jobs";

// Scraper API
export type {
  ScraperStatus,
  ScraperStats,
  ScraperHistoryItem,
  ScraperStartRequest,
} from "./scraper";
export {
  startScraper,
  getScraperStatus,
  cancelScraper,
  getScraperStats,
  getScraperHistory,
  clearDatabase,
  clearSpreadsheet,
  cleanupExpiredJobs,
} from "./scraper";

// Profile API
export type { ProfileSuggestions } from "./profile";
export { getProfile, saveProfile, autoCompleteProfile } from "./profile";

// Analysis API
export { analyzeJobPriority, analyzeAllPriorities } from "./analysis";

// AI Scoring API
export type {
  AIScoreBreakdown,
  AIJobScore,
  AIScoreResult,
} from "./ai-scoring";
export { scoreJobWithAI, scoreJobsWithAI, getAllCachedScores, getCachedScore } from "./ai-scoring";

// Pipeline API
export type { PipelineStatus, PipelineJob, PipelineSummary } from "./pipeline";
export {
  getAllPipelineJobs,
  getPipelineJobsByStatus,
  getPipelineJobsForJob,
  addToPipeline,
  updatePipelineJob,
  changeJobStatus,
  removeFromPipeline,
  removeJobFromAllPipelines,
  getPipelineSummary,
} from "./pipeline";

// Proposals API
export type {
  ProposalResult,
  ProposalMetadata,
  GenerateProposalResponse,
} from "./proposals";
export { generateProposal } from "./proposals";

// GitHub API
export type {
  WorkflowRun,
  GitHubConfig,
  TriggerWorkflowRequest,
} from "./github";
export { getGitHubConfig, getWorkflowRuns, triggerWorkflow } from "./github";
