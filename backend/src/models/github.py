"""GitHub情報モデル"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass(frozen=True)
class GitHubProfile:
    """GitHubユーザー情報"""

    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    public_repos: int = 0
    followers: int = 0
    created_at: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "username": self.username,
            "name": self.name,
            "bio": self.bio,
            "company": self.company,
            "location": self.location,
            "public_repos": self.public_repos,
            "followers": self.followers,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @property
    def experience_years(self) -> Optional[int]:
        """GitHub歴（年）"""
        if self.created_at:
            return (datetime.now() - self.created_at).days // 365
        return None


@dataclass(frozen=True)
class RepoInfo:
    """リポジトリ情報"""

    name: str
    url: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    updated_at: Optional[datetime] = None
    topics: list[str] = field(default_factory=list)
    is_fork: bool = False

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "url": self.url,
            "description": self.description,
            "language": self.language,
            "stars": self.stars,
            "forks": self.forks,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "topics": self.topics,
            "is_fork": self.is_fork,
        }

    @property
    def stars_display(self) -> str:
        """スター数の表示用文字列"""
        if self.stars >= 1000:
            return f"★{self.stars / 1000:.1f}k"
        elif self.stars > 0:
            return f"★{self.stars}"
        return ""


@dataclass(frozen=True)
class LanguageStats:
    """言語統計"""

    language: str
    bytes: int
    percentage: float

    def to_dict(self) -> dict:
        return {
            "language": self.language,
            "bytes": self.bytes,
            "percentage": round(self.percentage, 2),
        }


@dataclass(frozen=True)
class GitHubData:
    """GitHub情報（集約）"""

    profile: GitHubProfile
    repos: list[RepoInfo] = field(default_factory=list)
    language_stats: list[LanguageStats] = field(default_factory=list)
    matched_repos: list[RepoInfo] = field(default_factory=list)
    fetched_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "profile": self.profile.to_dict(),
            "repos": [r.to_dict() for r in self.repos],
            "language_stats": [ls.to_dict() for ls in self.language_stats],
            "matched_repos": [r.to_dict() for r in self.matched_repos],
            "fetched_at": self.fetched_at.isoformat(),
        }

    @property
    def top_languages(self) -> list[str]:
        """上位言語リスト"""
        return [
            ls.language
            for ls in sorted(
                self.language_stats, key=lambda x: x.percentage, reverse=True
            )[:5]
        ]
