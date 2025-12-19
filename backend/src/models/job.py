"""案件情報モデル"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class Service(str, Enum):
    """対応サービス"""

    LANCERS = "lancers"
    CROWDWORKS = "crowdworks"


class BudgetType(str, Enum):
    """予算タイプ"""

    FIXED = "fixed"
    HOURLY = "hourly"
    UNKNOWN = "unknown"


class JobType(str, Enum):
    """案件形式"""

    PROJECT = "project"
    TASK = "task"
    COMPETITION = "competition"
    UNKNOWN = "unknown"


class JobStatus(str, Enum):
    """募集状態"""

    OPEN = "open"
    CLOSED = "closed"
    UNKNOWN = "unknown"


class JobCategory(str, Enum):
    """案件カテゴリ"""

    WEB_DEVELOPMENT = "web_development"
    APP_DEVELOPMENT = "app_development"
    SCRAPING = "scraping"
    AUTOMATION = "automation"
    DATA_ANALYSIS = "data_analysis"
    AI_ML = "ai_ml"
    OTHER = "other"


@dataclass(frozen=True)
class ClientInfo:
    """クライアント情報"""

    name: Optional[str] = None
    rating: Optional[float] = None
    review_count: Optional[int] = None
    order_history: Optional[int] = None

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "rating": self.rating,
            "review_count": self.review_count,
            "order_history": self.order_history,
        }


@dataclass(frozen=True)
class JobInfo:
    """案件情報"""

    title: str
    description: str
    category: JobCategory
    budget_type: BudgetType
    source: Service
    url: str
    job_id: Optional[str] = None
    job_type: JobType = JobType.UNKNOWN
    status: JobStatus = JobStatus.UNKNOWN
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    deadline: Optional[str] = None
    remaining_days: Optional[int] = None
    required_skills: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    feature_tags: list[str] = field(default_factory=list)
    proposal_count: Optional[int] = None
    recruitment_count: Optional[int] = None
    client: Optional[ClientInfo] = None
    scraped_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "description": self.description,
            "category": self.category.value,
            "budget_type": self.budget_type.value,
            "job_id": self.job_id,
            "job_type": self.job_type.value,
            "status": self.status.value,
            "budget_min": self.budget_min,
            "budget_max": self.budget_max,
            "deadline": self.deadline,
            "remaining_days": self.remaining_days,
            "required_skills": self.required_skills,
            "tags": self.tags,
            "feature_tags": self.feature_tags,
            "proposal_count": self.proposal_count,
            "recruitment_count": self.recruitment_count,
            "source": self.source.value,
            "url": self.url,
            "client": self.client.to_dict() if self.client else None,
            "scraped_at": self.scraped_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "JobInfo":
        client_data = data.get("client")
        return cls(
            title=data["title"],
            description=data["description"],
            category=JobCategory(data["category"]),
            budget_type=BudgetType(data["budget_type"]),
            job_id=data.get("job_id"),
            job_type=JobType(data.get("job_type", "unknown")),
            status=JobStatus(data.get("status", "unknown")),
            budget_min=data.get("budget_min"),
            budget_max=data.get("budget_max"),
            deadline=data.get("deadline"),
            remaining_days=data.get("remaining_days"),
            required_skills=data.get("required_skills", []),
            tags=data.get("tags", []),
            feature_tags=data.get("feature_tags", []),
            proposal_count=data.get("proposal_count"),
            recruitment_count=data.get("recruitment_count"),
            source=Service(data["source"]),
            url=data["url"],
            client=ClientInfo(**client_data) if client_data else None,
            scraped_at=(
                datetime.fromisoformat(data["scraped_at"])
                if data.get("scraped_at")
                else datetime.now()
            ),
        )

    @property
    def budget_display(self) -> str:
        """予算の表示用文字列"""
        if self.budget_min and self.budget_max:
            return f"{self.budget_min:,}円 〜 {self.budget_max:,}円"
        elif self.budget_max:
            return f"〜 {self.budget_max:,}円"
        elif self.budget_min:
            return f"{self.budget_min:,}円 〜"
        else:
            return "要相談"
