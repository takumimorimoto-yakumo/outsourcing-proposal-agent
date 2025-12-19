"""Data models for multi-agent proposal generation system."""

from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime


# =============================================================================
# Job Understanding Agent Models
# =============================================================================

@dataclass
class JobRequirements:
    """案件要件"""
    main_task: str = ""
    deliverables: list[str] = field(default_factory=list)
    technical_requirements: list[str] = field(default_factory=list)
    constraints: list[str] = field(default_factory=list)


@dataclass
class ClientAnalysis:
    """クライアント分析"""
    business_type: str = ""
    estimated_purpose: str = ""
    pain_points: list[str] = field(default_factory=list)


@dataclass
class KeyPoints:
    """重要ポイント"""
    keywords: list[str] = field(default_factory=list)
    emphasis_points: list[str] = field(default_factory=list)
    risk_factors: list[str] = field(default_factory=list)


@dataclass
class ExternalResearch:
    """外部調査結果"""
    sources: list[str] = field(default_factory=list)
    findings: list[str] = field(default_factory=list)


@dataclass
class JobUnderstandingInput:
    """案件理解AIの入力"""
    job: dict  # 案件情報
    client_url: Optional[str] = None


@dataclass
class JobUnderstandingOutput:
    """案件理解AIの出力"""
    requirements: JobRequirements = field(default_factory=JobRequirements)
    client_analysis: ClientAnalysis = field(default_factory=ClientAnalysis)
    key_points: KeyPoints = field(default_factory=KeyPoints)
    external_research: Optional[ExternalResearch] = None

    def to_dict(self) -> dict:
        return {
            "requirements": {
                "main_task": self.requirements.main_task,
                "deliverables": self.requirements.deliverables,
                "technical_requirements": self.requirements.technical_requirements,
                "constraints": self.requirements.constraints,
            },
            "client_analysis": {
                "business_type": self.client_analysis.business_type,
                "estimated_purpose": self.client_analysis.estimated_purpose,
                "pain_points": self.client_analysis.pain_points,
            },
            "key_points": {
                "keywords": self.key_points.keywords,
                "emphasis_points": self.key_points.emphasis_points,
                "risk_factors": self.key_points.risk_factors,
            },
            "external_research": {
                "sources": self.external_research.sources,
                "findings": self.external_research.findings,
            } if self.external_research else None,
        }


# =============================================================================
# Proposal Writing Agent Models
# =============================================================================

@dataclass
class ProposalStructure:
    """提案文の構成"""
    greeting: str = ""
    understanding: str = ""
    approach: str = ""
    experience: str = ""
    closing: str = ""


@dataclass
class ProposalWritingInput:
    """文面作成AIの入力"""
    job_understanding: JobUnderstandingOutput
    user_profile: dict
    job: dict


@dataclass
class ProposalWritingOutput:
    """文面作成AIの出力"""
    proposal: str = ""
    structure: ProposalStructure = field(default_factory=ProposalStructure)
    character_count: int = 0

    def to_dict(self) -> dict:
        return {
            "proposal": self.proposal,
            "structure": {
                "greeting": self.structure.greeting,
                "understanding": self.structure.understanding,
                "approach": self.structure.approach,
                "experience": self.structure.experience,
                "closing": self.structure.closing,
            },
            "character_count": self.character_count,
        }


# =============================================================================
# Quality Check Agent Models
# =============================================================================

@dataclass
class EvaluationItem:
    """評価項目"""
    score: int = 0  # 0-100
    issues: list[str] = field(default_factory=list)


@dataclass
class Evaluation:
    """各項目の評価"""
    understanding_accuracy: EvaluationItem = field(default_factory=EvaluationItem)
    proposal_quality: EvaluationItem = field(default_factory=EvaluationItem)
    profile_relevance: EvaluationItem = field(default_factory=EvaluationItem)
    tone_appropriateness: EvaluationItem = field(default_factory=EvaluationItem)


@dataclass
class RevisionInstructions:
    """修正指示"""
    target: str = ""  # "understanding" or "proposal"
    instructions: list[str] = field(default_factory=list)


@dataclass
class QualityCheckInput:
    """チェックAIの入力"""
    job: dict
    job_understanding: JobUnderstandingOutput
    proposal: ProposalWritingOutput
    user_profile: dict


@dataclass
class QualityCheckOutput:
    """チェックAIの出力"""
    passed: bool = False
    overall_score: int = 0
    evaluation: Evaluation = field(default_factory=Evaluation)
    revision_instructions: Optional[RevisionInstructions] = None

    def to_dict(self) -> dict:
        return {
            "passed": self.passed,
            "overall_score": self.overall_score,
            "evaluation": {
                "understanding_accuracy": {
                    "score": self.evaluation.understanding_accuracy.score,
                    "issues": self.evaluation.understanding_accuracy.issues,
                },
                "proposal_quality": {
                    "score": self.evaluation.proposal_quality.score,
                    "issues": self.evaluation.proposal_quality.issues,
                },
                "profile_relevance": {
                    "score": self.evaluation.profile_relevance.score,
                    "issues": self.evaluation.profile_relevance.issues,
                },
                "tone_appropriateness": {
                    "score": self.evaluation.tone_appropriateness.score,
                    "issues": self.evaluation.tone_appropriateness.issues,
                },
            },
            "revision_instructions": {
                "target": self.revision_instructions.target,
                "instructions": self.revision_instructions.instructions,
            } if self.revision_instructions else None,
        }


# =============================================================================
# Job Scoring Agent Models
# =============================================================================

@dataclass
class JobScoringInput:
    """案件スコアリングAIの入力"""
    job: dict
    user_profile: dict


@dataclass
class ScoringBreakdown:
    """スコア内訳"""
    skill_match: int = 0  # スキルマッチ度 (0-100)
    budget_appropriateness: int = 0  # 予算妥当性 (0-100)
    competition_level: int = 0  # 競争率（低いほど高スコア）(0-100)
    client_reliability: int = 0  # クライアント信頼度 (0-100)
    growth_potential: int = 0  # 成長・実績獲得可能性 (0-100)


@dataclass
class JobScoringOutput:
    """案件スコアリングAIの出力"""
    overall_score: int = 0  # 総合スコア (0-100)
    recommendation: str = ""  # "highly_recommended", "recommended", "neutral", "not_recommended"
    breakdown: ScoringBreakdown = field(default_factory=ScoringBreakdown)
    reasons: list[str] = field(default_factory=list)  # 推薦/非推薦理由
    concerns: list[str] = field(default_factory=list)  # 懸念事項

    def to_dict(self) -> dict:
        return {
            "overall_score": self.overall_score,
            "recommendation": self.recommendation,
            "breakdown": {
                "skill_match": self.breakdown.skill_match,
                "budget_appropriateness": self.breakdown.budget_appropriateness,
                "competition_level": self.breakdown.competition_level,
                "client_reliability": self.breakdown.client_reliability,
                "growth_potential": self.breakdown.growth_potential,
            },
            "reasons": self.reasons,
            "concerns": self.concerns,
        }


# =============================================================================
# API Request/Response Models
# =============================================================================

@dataclass
class GenerateProposalRequest:
    """提案文生成リクエスト"""
    job_id: str
    max_retries: int = 3
    external_research: bool = True


@dataclass
class ProposalResult:
    """提案文結果"""
    text: str
    character_count: int


@dataclass
class GenerationMetadata:
    """生成メタデータ"""
    job_understanding: dict
    quality_score: int
    retry_count: int
    processing_time_ms: int
    agents_used: list[str]


@dataclass
class GenerateProposalResponse:
    """提案文生成レスポンス"""
    success: bool
    proposal: Optional[ProposalResult] = None
    metadata: Optional[GenerationMetadata] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None

    def to_dict(self) -> dict:
        result = {
            "success": self.success,
        }
        if self.proposal:
            result["proposal"] = {
                "text": self.proposal.text,
                "character_count": self.proposal.character_count,
            }
        if self.metadata:
            result["metadata"] = {
                "job_understanding": self.metadata.job_understanding,
                "quality_score": self.metadata.quality_score,
                "retry_count": self.metadata.retry_count,
                "processing_time_ms": self.metadata.processing_time_ms,
                "agents_used": self.metadata.agents_used,
            }
        if self.error_code:
            result["error"] = {
                "code": self.error_code,
                "message": self.error_message,
            }
        return result
