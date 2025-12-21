"""API Routes"""

from .jobs import router as jobs_router
from .scraper import router as scraper_router
from .profile import router as profile_router
from .analysis import router as analysis_router
from .proposals import router as proposals_router
from .github import router as github_router
from .pipeline import router as pipeline_router

__all__ = [
    "jobs_router",
    "scraper_router",
    "profile_router",
    "analysis_router",
    "proposals_router",
    "github_router",
    "pipeline_router",
]
