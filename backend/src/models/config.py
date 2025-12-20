"""設定モデル"""

from dataclasses import dataclass, field
from typing import Optional

from src.models.job import JobCategory


@dataclass
class GeminiConfig:
    """Gemini API設定"""

    model: str = "gemini-2.0-flash"  # See src/config/models.py for available models
    temperature: float = 0.7
    top_p: float = 0.9
    max_output_tokens: int = 2048

    def validate(self) -> list[str]:
        """バリデーション（エラーメッセージのリストを返す）"""
        errors = []
        if not 0.0 <= self.temperature <= 1.0:
            errors.append(f"temperature must be 0.0-1.0 (got {self.temperature})")
        if not 0.0 <= self.top_p <= 1.0:
            errors.append(f"top_p must be 0.0-1.0 (got {self.top_p})")
        if self.max_output_tokens <= 0:
            errors.append(f"max_output_tokens must be positive (got {self.max_output_tokens})")
        return errors


@dataclass
class HumanLikeConfig:
    """人間らしい振る舞い設定"""

    enabled: bool = True
    min_delay: float = 2.0
    max_delay: float = 4.0


@dataclass
class TimeoutConfig:
    """タイムアウト設定"""

    page_load: int = 30000
    element_wait: int = 10000


@dataclass
class RetryConfig:
    """リトライ設定"""

    max_attempts: int = 3
    delay: int = 5


@dataclass
class ScrapingConfig:
    """スクレイピング設定"""

    headless: bool = True
    human_like: HumanLikeConfig = field(default_factory=HumanLikeConfig)
    timeout: TimeoutConfig = field(default_factory=TimeoutConfig)
    retry: RetryConfig = field(default_factory=RetryConfig)


@dataclass
class IntroductionConfig:
    """挨拶・自己紹介設定"""

    greeting: str = ""
    self_intro: str = ""


@dataclass
class ScheduleConfig:
    """スケジュール設定"""

    availability: str = ""
    working_hours: str = ""


@dataclass
class ClosingConfig:
    """締めの挨拶設定"""

    contact: str = ""
    farewell: str = ""


@dataclass
class ProfileConfig:
    """プロフィール設定"""

    name: str
    introduction: IntroductionConfig
    schedule: ScheduleConfig
    closing: ClosingConfig


@dataclass
class CategoryTemplate:
    """カテゴリ別テンプレート"""

    category: JobCategory
    strength: str = ""
    approach_hints: list[str] = field(default_factory=list)


@dataclass
class AppConfig:
    """アプリケーション設定（全体）"""

    version: str
    github_username: str
    gemini: GeminiConfig
    scraping: ScrapingConfig
    profiles: dict[str, ProfileConfig]
    category_templates: dict[JobCategory, CategoryTemplate]
    default_profile: str = "default"

    def get_profile(self, name: Optional[str] = None) -> ProfileConfig:
        """プロフィールを取得"""
        from src.models.errors import ConfigError

        profile_name = name or self.default_profile
        if profile_name not in self.profiles:
            raise ConfigError(f"Profile not found: {profile_name}")
        return self.profiles[profile_name]

    def get_category_template(self, category: JobCategory) -> CategoryTemplate:
        """カテゴリテンプレートを取得"""
        return self.category_templates.get(
            category,
            self.category_templates.get(
                JobCategory.OTHER,
                CategoryTemplate(category=JobCategory.OTHER),
            ),
        )
