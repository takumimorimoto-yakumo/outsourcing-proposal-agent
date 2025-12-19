"""バリデーション"""

import re
from typing import Optional

from src.models.errors import InvalidURLError
from src.models.job import Service


URL_PATTERNS = {
    Service.LANCERS: re.compile(
        r"^https?://(?:www\.)?lancers\.jp/work/detail/(\d+)"
    ),
    Service.CROWDWORKS: re.compile(
        r"^https?://crowdworks\.jp/public/jobs/(\d+)"
    ),
}


def validate_url(url: str) -> bool:
    """URLが有効か検証"""
    return any(pattern.match(url) for pattern in URL_PATTERNS.values())


def extract_service(url: str) -> Service:
    """URLからサービスを判定"""
    for service, pattern in URL_PATTERNS.items():
        if pattern.match(url):
            return service
    raise InvalidURLError(
        f"Unsupported URL: {url}. "
        "Supported: lancers.jp, crowdworks.jp"
    )


def extract_job_id(url: str) -> str:
    """URLからジョブIDを抽出"""
    for service, pattern in URL_PATTERNS.items():
        match = pattern.match(url)
        if match:
            return match.group(1)
    raise InvalidURLError(f"Cannot extract job ID from URL: {url}")
