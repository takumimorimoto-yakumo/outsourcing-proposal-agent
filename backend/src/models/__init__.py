"""データモデル"""

from src.models.job import BudgetType, ClientInfo, JobCategory, JobInfo, Service
from src.models.github import GitHubData, GitHubProfile, LanguageStats, RepoInfo
from src.models.config import AppConfig, GeminiConfig, ProfileConfig, ScrapingConfig
from src.models.generation import GenerationInput, GenerationOutput, ProposalMetadata
from src.models.errors import (
    ProposalGenError,
    InvalidURLError,
    ConfigError,
    ScrapingError,
    PageNotFoundError,
    ElementNotFoundError,
    LoginRequiredError,
    GitHubAPIError,
    GeminiAPIError,
    AuthenticationError,
)

__all__ = [
    # Job models
    "Service",
    "BudgetType",
    "JobCategory",
    "ClientInfo",
    "JobInfo",
    # GitHub models
    "GitHubProfile",
    "RepoInfo",
    "LanguageStats",
    "GitHubData",
    # Config models
    "GeminiConfig",
    "ScrapingConfig",
    "ProfileConfig",
    "AppConfig",
    # Generation models
    "GenerationInput",
    "GenerationOutput",
    "ProposalMetadata",
    # Errors
    "ProposalGenError",
    "InvalidURLError",
    "ConfigError",
    "ScrapingError",
    "PageNotFoundError",
    "ElementNotFoundError",
    "LoginRequiredError",
    "GitHubAPIError",
    "GeminiAPIError",
    "AuthenticationError",
]
