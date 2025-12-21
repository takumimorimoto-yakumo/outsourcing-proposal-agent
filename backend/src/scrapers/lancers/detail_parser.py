"""Lancers案件詳細ページパーサー"""

import re
from typing import Optional

from playwright.async_api import Page

from src.models.job import BudgetType
from .constants import SKILL_KEYWORDS


async def extract_title(page: Page) -> str:
    """タイトルを抽出"""
    # metaタグから取得
    title = await get_meta_content(page, "keywords")
    if title:
        return title.strip()

    # titleタグからフォールバック
    title_tag = await page.title()
    if title_tag:
        match = re.match(r"(.+?)の副業", title_tag)
        if match:
            return match.group(1).strip()
        return title_tag.split("|")[0].strip()

    return ""


async def extract_description(page: Page) -> str:
    """詳細説明を抽出"""
    selectors = [
        ".c-definition-list__description",
        ".p-work-detail-lancer__postscript-description",
        "[class*='description']",
    ]

    for selector in selectors:
        elements = await page.query_selector_all(selector)
        if elements:
            texts = []
            for el in elements:
                text = await el.inner_text()
                if text and len(text) > 50:
                    texts.append(text.strip())
            if texts:
                return "\n\n".join(texts)

    desc = await get_meta_content(page, "description")
    return desc or ""


async def extract_budget(page: Page) -> tuple[Optional[int], Optional[int], BudgetType]:
    """報酬情報を抽出"""
    try:
        price_elements = await page.query_selector_all(".price-number")
        prices = []

        for el in price_elements:
            text = await el.inner_text()
            price_text = text.replace(",", "").replace("円", "").strip()
            if price_text.isdigit():
                prices.append(int(price_text))

        if len(prices) >= 2:
            return prices[0], prices[1], BudgetType.FIXED
        elif len(prices) == 1:
            return prices[0], prices[0], BudgetType.FIXED

    except Exception:
        pass

    return None, None, BudgetType.UNKNOWN


async def extract_deadline(page: Page) -> Optional[str]:
    """締切日を抽出"""
    try:
        schedule_items = await page.query_selector_all(".p-work-detail-schedule__item")

        for item in schedule_items:
            title_el = await item.query_selector(".p-work-detail-schedule__item__title")
            if title_el:
                title_text = await title_el.inner_text()
                if "締切" in title_text:
                    text_el = await item.query_selector(".p-work-detail-schedule__text")
                    if text_el:
                        return (await text_el.inner_text()).strip()

    except Exception:
        pass

    return None


async def extract_client_info(page: Page) -> tuple[Optional[str], Optional[int], Optional[float]]:
    """クライアント情報を抽出"""
    client_name = None
    order_count = None
    rating = None

    try:
        # アバター画像のalt属性から取得
        avatar = await page.query_selector(".p-work-detail-sub-heading__avatar-image")
        if avatar:
            client_name = await avatar.get_attribute("alt")

        # クライアントリンクからフォールバック
        if not client_name:
            client_link = await page.query_selector('a[href^="/client/"]')
            if client_link:
                client_name = await client_link.inner_text()

    except Exception:
        pass

    return client_name, order_count, rating


async def extract_skills(page: Page, description: str) -> list[str]:
    """必要スキルを抽出"""
    skills = []
    desc_lower = description.lower()

    for skill in SKILL_KEYWORDS:
        if skill.lower() in desc_lower:
            skills.append(skill)

    return skills


async def extract_all_tags(page: Page) -> tuple[list[str], list[str]]:
    """全タグを抽出（一般タグ・特徴タグ）"""
    tags = []
    feature_tags = []

    try:
        tag_elements = await page.query_selector_all(".c-tag.p-work-detail-tag")
        for el in tag_elements:
            text = await el.inner_text()
            if text:
                feature_tags.append(text.strip())

    except Exception:
        pass

    return tags, feature_tags


async def get_meta_content(page: Page, name: str) -> Optional[str]:
    """metaタグの内容を取得"""
    try:
        meta = await page.query_selector(f'meta[name="{name}"]')
        if meta:
            return await meta.get_attribute("content")
    except Exception:
        pass
    return None
