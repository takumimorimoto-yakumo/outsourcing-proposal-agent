"""LLM Model Configuration
Reference: https://ai.google.dev/gemini-api/docs/models
"""

from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class ClaudeModels:
    """Anthropic Claude models"""
    OPUS_4_5: str = "claude-opus-4-5-20251101"
    OPUS_4: str = "claude-opus-4-20250514"
    SONNET_4: str = "claude-sonnet-4-20250514"
    HAIKU: str = "claude-3-5-haiku-20241022"


@dataclass(frozen=True)
class GeminiModels:
    """Google Gemini models
    Reference: https://ai.google.dev/gemini-api/docs/models
    """
    # Latest models (Gemini 2.5) - Best for complex reasoning
    PRO_2_5: str = "gemini-2.5-pro"          # Best for complex reasoning (1M token context)
    FLASH_2_5: str = "gemini-2.5-flash"      # Fast, balanced intelligence and latency

    # Stable models (Gemini 2.0) - Supports Google Search grounding
    FLASH_2_0: str = "gemini-2.0-flash"      # Multimodal, cost-effective, supports Google Search
    FLASH_LITE_2_0: str = "gemini-2.0-flash-lite"  # Lighter version

    # Legacy
    PRO: str = "gemini-pro"                  # Legacy model


# Singleton instances
CLAUDE: Final[ClaudeModels] = ClaudeModels()
GEMINI: Final[GeminiModels] = GeminiModels()


class RecommendedModels:
    """Recommended models for specific use cases"""

    # Deep analysis, complex reasoning, planning
    DEEP_ANALYSIS: Final[str] = GEMINI.FLASH_2_5

    # Job scoring and evaluation
    JOB_SCORING: Final[str] = GEMINI.FLASH_2_0

    # Proposal generation
    PROPOSAL_GENERATION: Final[str] = GEMINI.FLASH_2_5

    # Profile auto-completion
    PROFILE_ANALYSIS: Final[str] = GEMINI.FLASH_2_0

    # Fast search, grounding with Google Search
    SEARCH_GROUNDING: Final[str] = GEMINI.FLASH_2_0

    # High throughput, cost-effective
    HIGH_THROUGHPUT: Final[str] = GEMINI.FLASH_2_0

    # Default fallback
    DEFAULT: Final[str] = GEMINI.FLASH_2_0


# Easy access
RECOMMENDED: Final[RecommendedModels] = RecommendedModels()
