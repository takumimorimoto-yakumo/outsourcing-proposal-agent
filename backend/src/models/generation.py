"""生成関連モデル"""

import json
from dataclasses import dataclass, field
from typing import Optional

from src.models.config import CategoryTemplate, ProfileConfig
from src.models.github import GitHubData
from src.models.job import JobCategory, JobInfo


@dataclass(frozen=True)
class GenerationInput:
    """提案文生成の入力"""

    job_info: JobInfo
    github_data: Optional[GitHubData]
    profile: ProfileConfig
    category_template: CategoryTemplate


@dataclass(frozen=True)
class ProposalMetadata:
    """提案文のメタデータ"""

    character_count: int
    category: JobCategory
    matched_skills: list[str]
    used_repos: list[str]
    generation_time: float
    model: str
    temperature: float
    retry_count: int = 0

    def to_dict(self) -> dict:
        return {
            "character_count": self.character_count,
            "category": self.category.value,
            "matched_skills": self.matched_skills,
            "used_repos": self.used_repos,
            "generation_time": round(self.generation_time, 2),
            "model": self.model,
            "temperature": self.temperature,
            "retry_count": self.retry_count,
        }


@dataclass(frozen=True)
class GenerationOutput:
    """提案文生成の出力"""

    proposal: str
    metadata: ProposalMetadata

    def to_dict(self) -> dict:
        return {
            "proposal": self.proposal,
            "metadata": self.metadata.to_dict(),
        }

    def to_json(self, indent: int = 2) -> str:
        """JSON文字列に変換"""
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)


@dataclass
class QualityCheckResult:
    """品質チェック結果"""

    passed: bool
    character_count: int
    issues: list[str] = field(default_factory=list)

    @property
    def needs_regeneration(self) -> bool:
        """再生成が必要か"""
        return not self.passed and len(self.issues) > 0
