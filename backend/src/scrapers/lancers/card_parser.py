"""Lancers案件カードパーサー"""

import re
from typing import Optional

from playwright.async_api import Page, ElementHandle

from src.models.job import (
    BudgetType,
    ClientInfo,
    JobCategory,
    JobInfo,
    JobStatus,
    JobType,
)
from src.scrapers.base import BaseScraper
from .constants import BASE_URL, SERVICE
from .url_utils import extract_job_id_from_onclick


async def parse_job_card(
    card: ElementHandle,
    page: Page,
    categorize_fn,
) -> Optional[JobInfo]:
    """案件カードから情報を抽出"""
    # 案件ID取得
    job_id = await _extract_card_job_id(card)
    if not job_id:
        return None

    job_url = f"{BASE_URL}/work/detail/{job_id}"

    # 各種情報を抽出
    title = await _extract_card_title(card)
    status = await _extract_card_status(card)
    remaining_days = await _extract_card_remaining_days(card)
    tags = await _extract_card_tags(card)
    job_type = await _extract_card_job_type(card)
    budget_min, budget_max = await _extract_card_budget(card)
    feature_tags = await _extract_card_feature_tags(card)
    proposal_count, recruitment_count = await _extract_card_counts(card)
    client = await _extract_card_client(card)
    category = categorize_fn(title)

    return JobInfo(
        title=title,
        description="",
        category=category,
        budget_type=BudgetType.FIXED if job_type == JobType.PROJECT else BudgetType.UNKNOWN,
        source=SERVICE,
        url=job_url,
        job_id=job_id,
        job_type=job_type,
        status=status,
        budget_min=budget_min,
        budget_max=budget_max,
        remaining_days=remaining_days,
        tags=tags,
        feature_tags=feature_tags,
        proposal_count=proposal_count,
        recruitment_count=recruitment_count,
        client=client,
    )


async def _extract_card_job_id(card: ElementHandle) -> Optional[str]:
    """カードから案件IDを抽出"""
    # 方法1: onclick属性から
    onclick = await card.get_attribute("onclick")
    if onclick:
        job_id = extract_job_id_from_onclick(onclick)
        if job_id:
            return job_id

    # 方法2: タイトルリンクから
    title_link = await card.query_selector(".p-search-job-media__title")
    if title_link:
        href = await title_link.get_attribute("href")
        if href:
            match = re.search(r'/work/detail/(\d+)', href)
            if match:
                return match.group(1)

    # 方法3: 任意のdetailリンクから
    any_link = await card.query_selector("a[href*='/work/detail/']")
    if any_link:
        href = await any_link.get_attribute("href")
        if href:
            match = re.search(r'/work/detail/(\d+)', href)
            if match:
                return match.group(1)

    return None


async def _extract_card_title(card: ElementHandle) -> str:
    """カードからタイトルを抽出"""
    title_el = await card.query_selector(".p-search-job-media__title")
    title = await title_el.inner_text() if title_el else ""
    title = title.strip()

    # タグを除去
    tags_container = await card.query_selector(".p-search-job-media__tags")
    if tags_container:
        tags_text = await tags_container.inner_text()
        for tag in tags_text.split():
            title = title.replace(tag.strip(), "").strip()

    return title


async def _extract_card_status(card: ElementHandle) -> JobStatus:
    """カードから募集状態を抽出"""
    status_el = await card.query_selector(".p-search-job-media__time-text")
    if status_el:
        status_text = await status_el.inner_text()
        if "募集中" in status_text:
            return JobStatus.OPEN
        elif "終了" in status_text or "締切" in status_text:
            return JobStatus.CLOSED
    return JobStatus.UNKNOWN


async def _extract_card_remaining_days(card: ElementHandle) -> Optional[int]:
    """カードから残り日数を抽出"""
    remaining_el = await card.query_selector(".p-search-job-media__time-remaining")
    if remaining_el:
        remaining_text = await remaining_el.inner_text()
        match = re.search(r"あと(\d+)日", remaining_text)
        if match:
            return int(match.group(1))
    return None


async def _extract_card_tags(card: ElementHandle) -> list[str]:
    """カードからタグを抽出"""
    tags = []
    tag_elements = await card.query_selector_all(".p-search-job-media__tag")
    for tag_el in tag_elements:
        tag_text = await tag_el.inner_text()
        if tag_text.strip():
            tags.append(tag_text.strip())
    return tags


async def _extract_card_job_type(card: ElementHandle) -> JobType:
    """カードから案件形式を抽出"""
    if await card.query_selector(".c-badge--worktype-project"):
        return JobType.PROJECT
    elif await card.query_selector(".c-badge--worktype-task"):
        return JobType.TASK
    elif await card.query_selector(".c-badge--worktype-competition"):
        return JobType.COMPETITION
    return JobType.UNKNOWN


async def _extract_card_budget(card: ElementHandle) -> tuple[Optional[int], Optional[int]]:
    """カードから報酬を抽出"""
    price_numbers = await card.query_selector_all(".p-search-job-media__number")
    prices = []
    for price_el in price_numbers:
        text = await price_el.inner_text()
        price_text = text.replace(",", "").strip()
        if price_text.isdigit():
            prices.append(int(price_text))

    if len(prices) >= 2:
        return prices[0], prices[1]
    elif len(prices) == 1:
        return prices[0], prices[0]
    return None, None


async def _extract_card_feature_tags(card: ElementHandle) -> list[str]:
    """カードから特徴タグを抽出"""
    feature_tags = []
    feature_elements = await card.query_selector_all(".p-search-job-media__tag-list")
    for feature_el in feature_elements:
        feature_text = await feature_el.inner_text()
        if feature_text.strip():
            feature_tags.append(feature_text.strip())
    return feature_tags


async def _extract_card_counts(card: ElementHandle) -> tuple[Optional[int], Optional[int]]:
    """カードから提案数・募集人数を抽出"""
    proposal_count = None
    recruitment_count = None
    propose_numbers = await card.query_selector_all(".p-search-job-media__propose-number")
    if len(propose_numbers) >= 2:
        text1 = await propose_numbers[0].inner_text()
        text2 = await propose_numbers[1].inner_text()
        if text1.strip().isdigit():
            proposal_count = int(text1.strip())
        if text2.strip().isdigit():
            recruitment_count = int(text2.strip())
    return proposal_count, recruitment_count


async def _extract_card_client(card: ElementHandle) -> Optional[ClientInfo]:
    """カードからクライアント情報を抽出"""
    client_name_el = await card.query_selector(".p-search-job-media__avatar-note a")
    if not client_name_el:
        return None

    client_name = await client_name_el.inner_text()
    order_count = None
    rating = None

    subnotes = await card.query_selector_all(".p-search-job-media__avatar-subnote")
    for subnote in subnotes:
        text = await subnote.inner_text()
        if "発注" in text:
            match = re.search(r"(\d+)", text)
            if match:
                order_count = int(match.group(1))
        elif "評価" in text:
            match = re.search(r"(\d+\.?\d*)", text)
            if match:
                rating = float(match.group(1))

    return ClientInfo(
        name=client_name.strip(),
        rating=rating,
        order_history=order_count,
    )
