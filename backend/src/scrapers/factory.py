"""スクレイパーファクトリ"""

from typing import Optional

from src.models.config import ScrapingConfig
from src.scrapers.base import BaseScraper
from src.scrapers.lancers import LancersScraper


# 利用可能なスクレイパー
SCRAPERS = [
    LancersScraper,
    # CrowdWorksScraper,  # TODO: 実装後に追加
]


def get_scraper(url: str, config: ScrapingConfig) -> Optional[BaseScraper]:
    """
    URLに対応するスクレイパーを取得

    Args:
        url: 案件URL
        config: スクレイピング設定

    Returns:
        対応するスクレイパーインスタンス、または None
    """
    for scraper_class in SCRAPERS:
        scraper = scraper_class(config)
        if scraper.can_handle(url):
            return scraper
    return None


def get_supported_services() -> list[str]:
    """サポートしているサービス一覧を取得"""
    return [s.SERVICE.value for s in SCRAPERS]
