"""Multi-agent proposal generation system."""

from .base import BaseAgent, AgentResult
from .boss import BossAgent
from .job_understanding import JobUnderstandingAgent
from .proposal_writing import ProposalWritingAgent
from .quality_check import QualityCheckAgent
from .job_scoring import JobScoringAgent
from .models import (
    JobUnderstandingInput,
    JobUnderstandingOutput,
    ProposalWritingInput,
    ProposalWritingOutput,
    QualityCheckInput,
    QualityCheckOutput,
    JobScoringInput,
    JobScoringOutput,
    GenerateProposalRequest,
    GenerateProposalResponse,
)

__all__ = [
    "BaseAgent",
    "AgentResult",
    "BossAgent",
    "JobUnderstandingAgent",
    "ProposalWritingAgent",
    "QualityCheckAgent",
    "JobScoringAgent",
    "JobUnderstandingInput",
    "JobUnderstandingOutput",
    "ProposalWritingInput",
    "ProposalWritingOutput",
    "QualityCheckInput",
    "QualityCheckOutput",
    "JobScoringInput",
    "JobScoringOutput",
    "GenerateProposalRequest",
    "GenerateProposalResponse",
]
