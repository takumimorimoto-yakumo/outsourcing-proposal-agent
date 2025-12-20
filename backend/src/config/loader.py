"""設定読み込み"""

import os
from pathlib import Path
from typing import Any, Optional

import yaml

from src.models.config import (
    AppConfig,
    CategoryTemplate,
    ClosingConfig,
    GeminiConfig,
    HumanLikeConfig,
    IntroductionConfig,
    ProfileConfig,
    RetryConfig,
    ScheduleConfig,
    ScrapingConfig,
    TimeoutConfig,
)
from src.models.errors import ConfigError
from src.models.job import JobCategory
from src.config.models import RECOMMENDED


class ConfigLoader:
    """設定ローダー"""

    DEFAULT_CONFIG_PATHS = [
        Path("./config"),
        Path.home() / ".proposal-gen",
    ]

    def __init__(self, config_path: Optional[Path] = None) -> None:
        self.config_path = config_path or self._find_config_path()

    def _find_config_path(self) -> Path:
        """設定ファイルのパスを探す"""
        env_path = os.getenv("PROPOSAL_GEN_CONFIG")
        if env_path:
            path = Path(env_path)
            if path.exists():
                return path

        for path in self.DEFAULT_CONFIG_PATHS:
            if path.exists():
                return path

        raise ConfigError(
            "Config directory not found. "
            "Run 'proposal-gen config init' to create one."
        )

    def _load_yaml(self, filename: str) -> dict[str, Any]:
        """YAMLファイルを読み込む"""
        file_path = self.config_path / filename
        if not file_path.exists():
            raise ConfigError(f"Config file not found: {file_path}")

        try:
            with open(file_path, encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except yaml.YAMLError as e:
            raise ConfigError(f"Invalid YAML in {filename}: {e}")

    def load(self) -> AppConfig:
        """設定を読み込む"""
        settings = self._load_yaml("settings.yaml")
        profile_data = self._load_yaml("profile.yaml")

        return AppConfig(
            version=settings.get("version", "1.0"),
            github_username=self._get_required(settings, "github.username"),
            gemini=self._load_gemini_config(settings.get("gemini", {})),
            scraping=self._load_scraping_config(settings.get("scraping", {})),
            profiles=self._load_profiles(profile_data.get("profiles", {})),
            category_templates=self._load_category_templates(
                profile_data.get("category_templates", {})
            ),
            default_profile=settings.get("default_profile", "default"),
        )

    def _get_required(self, data: dict, path: str) -> Any:
        """必須項目を取得"""
        keys = path.split(".")
        value = data
        for key in keys:
            if not isinstance(value, dict) or key not in value:
                raise ConfigError(f"Required config missing: {path}")
            value = value[key]
        return value

    def _load_gemini_config(self, data: dict) -> GeminiConfig:
        """Gemini設定を読み込む"""
        return GeminiConfig(
            model=data.get("model", RECOMMENDED.DEFAULT),
            temperature=data.get("temperature", 0.7),
            top_p=data.get("top_p", 0.9),
            max_output_tokens=data.get("max_output_tokens", 2048),
        )

    def _load_scraping_config(self, data: dict) -> ScrapingConfig:
        """スクレイピング設定を読み込む"""
        human_like_data = data.get("human_like", {})
        timeout_data = data.get("timeout", {})
        retry_data = data.get("retry", {})

        return ScrapingConfig(
            headless=data.get("headless", True),
            human_like=HumanLikeConfig(
                enabled=human_like_data.get("enabled", True),
                min_delay=human_like_data.get("min_delay", 2.0),
                max_delay=human_like_data.get("max_delay", 4.0),
            ),
            timeout=TimeoutConfig(
                page_load=timeout_data.get("page_load", 30000),
                element_wait=timeout_data.get("element_wait", 10000),
            ),
            retry=RetryConfig(
                max_attempts=retry_data.get("max_attempts", 3),
                delay=retry_data.get("delay", 5),
            ),
        )

    def _load_profiles(self, data: dict) -> dict[str, ProfileConfig]:
        """プロフィールを読み込む"""
        profiles = {}
        for name, profile_data in data.items():
            intro_data = profile_data.get("introduction", {})
            schedule_data = profile_data.get("schedule", {})
            closing_data = profile_data.get("closing", {})

            profiles[name] = ProfileConfig(
                name=profile_data.get("name", name),
                introduction=IntroductionConfig(
                    greeting=intro_data.get("greeting", ""),
                    self_intro=intro_data.get("self_intro", ""),
                ),
                schedule=ScheduleConfig(
                    availability=schedule_data.get("availability", ""),
                    working_hours=schedule_data.get("working_hours", ""),
                ),
                closing=ClosingConfig(
                    contact=closing_data.get("contact", ""),
                    farewell=closing_data.get("farewell", ""),
                ),
            )
        return profiles

    def _load_category_templates(
        self, data: dict
    ) -> dict[JobCategory, CategoryTemplate]:
        """カテゴリテンプレートを読み込む"""
        templates = {}
        for category_str, template_data in data.items():
            try:
                category = JobCategory(category_str)
                templates[category] = CategoryTemplate(
                    category=category,
                    strength=template_data.get("strength", ""),
                    approach_hints=template_data.get("approach_hints", []),
                )
            except ValueError:
                continue  # 不明なカテゴリはスキップ
        return templates

    def get_api_key(self) -> str:
        """Gemini APIキーを取得"""
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            return api_key

        settings = self._load_yaml("settings.yaml")
        api_key = settings.get("gemini", {}).get("api_key")
        if api_key:
            return api_key

        raise ConfigError(
            "Gemini API key not found. "
            "Set GEMINI_API_KEY environment variable or add to settings.yaml"
        )

    def get_github_token(self) -> Optional[str]:
        """GitHubトークンを取得"""
        return os.getenv("GITHUB_TOKEN")
