"""Lancers URL操作ユーティリティ"""

import re
from typing import Optional
from urllib.parse import urlencode

from .constants import BASE_URL, URL_PATTERN, LIST_URL_PATTERN, CATEGORY_SLUGS


def can_handle(url: str) -> bool:
    """詳細ページURLを処理できるか判定"""
    return bool(re.search(URL_PATTERN, url))


def can_handle_list(url: str) -> bool:
    """一覧ページURLを処理できるか判定"""
    return bool(re.search(LIST_URL_PATTERN, url))


def extract_job_id(url: str) -> Optional[str]:
    """URLから案件IDを抽出"""
    match = re.search(URL_PATTERN, url)
    return match.group(1) if match else None


def extract_job_id_from_onclick(onclick: str) -> Optional[str]:
    """onclick属性から案件IDを抽出"""
    match = re.search(r"goToLjpWorkDetail\((\d+)\)", onclick)
    return match.group(1) if match else None


def build_search_url(
    category: Optional[str] = None,
    subcategory: Optional[str] = None,
    job_types: Optional[list[str]] = None,
    open_only: bool = True,
    page: int = 1,
) -> str:
    """検索URLを構築

    Args:
        category: カテゴリ（system, web, writing, design等）
        subcategory: サブカテゴリ（app, website, scraping等）
        job_types: 案件形式のリスト（project, task, competition, job）
        open_only: 募集中のみ
        page: ページ番号
    """
    base = f"{BASE_URL}/work/search"

    if category and category in CATEGORY_SLUGS:
        base = f"{base}/{CATEGORY_SLUGS[category]}"
        if subcategory:
            base = f"{base}/{subcategory}"

    params = []
    if open_only:
        params.append(("open", "1"))
    if job_types:
        for jt in job_types:
            params.append(("type[]", jt))
    if page > 1:
        params.append(("page", str(page)))

    if params:
        return f"{base}?{urlencode(params)}"
    return base
