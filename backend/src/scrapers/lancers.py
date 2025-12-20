"""Lancersスクレイパー"""

import asyncio
import re
from typing import Optional
from urllib.parse import urlencode, urlparse

from playwright.async_api import Page

from src.models.config import ScrapingConfig
from src.models.job import (
    BudgetType,
    ClientInfo,
    JobCategory,
    JobInfo,
    JobStatus,
    JobType,
    Service,
)
from src.scrapers.base import BaseScraper


class LancersScraper(BaseScraper):
    """Lancers案件情報スクレイパー"""

    SERVICE = Service.LANCERS
    URL_PATTERN = r"lancers\.jp/work/detail/(\d+)"
    LIST_URL_PATTERN = r"lancers\.jp/work/search"
    BASE_URL = "https://www.lancers.jp"

    # カテゴリマッピング
    CATEGORY_SLUGS = {
        "system": "system",
        "web": "web",
        "writing": "writing",
        "design": "design",
        "multimedia": "multimedia",
        "business": "business",
        "translation": "translation",
    }

    def can_handle(self, url: str) -> bool:
        """このURLを処理できるか判定"""
        return bool(re.search(self.URL_PATTERN, url))

    def can_handle_list(self, url: str) -> bool:
        """一覧ページURLを処理できるか判定"""
        return bool(re.search(self.LIST_URL_PATTERN, url))

    def _extract_job_id(self, url: str) -> Optional[str]:
        """URLから案件IDを抽出"""
        match = re.search(self.URL_PATTERN, url)
        return match.group(1) if match else None

    def _extract_job_id_from_onclick(self, onclick: str) -> Optional[str]:
        """onclick属性から案件IDを抽出"""
        match = re.search(r"goToLjpWorkDetail\((\d+)\)", onclick)
        return match.group(1) if match else None

    def build_search_url(
        self,
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
        base = f"{self.BASE_URL}/work/search"

        if category and category in self.CATEGORY_SLUGS:
            base = f"{base}/{self.CATEGORY_SLUGS[category]}"
            # サブカテゴリが指定されていれば追加
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

    async def scrape_list(
        self,
        url: Optional[str] = None,
        category: Optional[str] = None,
        job_types: Optional[list[str]] = None,
        open_only: bool = True,
        max_items: int = 50,
    ) -> list[JobInfo]:
        """案件一覧ページから複数の案件情報を取得

        Args:
            url: 直接URLを指定する場合
            category: カテゴリ（system, web等）
            job_types: 案件形式のリスト（["project", "task"]等）
            open_only: 募集中のみ
            max_items: 最大取得件数
        """
        if url is None:
            url = self.build_search_url(category, job_types, open_only)

        async with self._get_page() as page:
            # ページ読み込み（タイムアウト30秒）
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except Exception as e:
                print(f"ページ読み込みエラー: {url} - {e}")
                return []

            # 案件カードの出現を待機（最大5秒）
            try:
                await page.wait_for_selector(".p-search-job-media", timeout=5000)
            except Exception:
                pass  # タイムアウトしても続行

            # 案件カードを取得（存在しない場合は空リストを返す）
            job_cards = await page.query_selector_all(".p-search-job-media")
            if not job_cards:
                print(f"案件カードが見つかりません: {url}")
                return []

            jobs = []
            for card in job_cards[:max_items]:
                try:
                    job = await self._parse_job_card(card, page)
                    if job:
                        jobs.append(job)
                except Exception as e:
                    continue

            return jobs

    async def _parse_job_card(self, card, page: Page) -> Optional[JobInfo]:
        """案件カードから情報を抽出"""
        # 案件ID取得（複数の方法を試す）
        job_id = None
        job_url = None

        # 方法1: onclick属性から
        onclick = await card.get_attribute("onclick")
        if onclick:
            job_id = self._extract_job_id_from_onclick(onclick)

        # 方法2: タイトルリンクから
        if not job_id:
            title_link = await card.query_selector(".p-search-job-media__title")
            if title_link:
                href = await title_link.get_attribute("href")
                if href:
                    match = re.search(r'/work/detail/(\d+)', href)
                    if match:
                        job_id = match.group(1)

        # 方法3: 任意のdetailリンクから
        if not job_id:
            any_link = await card.query_selector("a[href*='/work/detail/']")
            if any_link:
                href = await any_link.get_attribute("href")
                if href:
                    match = re.search(r'/work/detail/(\d+)', href)
                    if match:
                        job_id = match.group(1)

        if not job_id:
            return None

        job_url = f"{self.BASE_URL}/work/detail/{job_id}"

        # タイトル
        title_el = await card.query_selector(".p-search-job-media__title")
        title = await title_el.inner_text() if title_el else ""
        title = title.strip()

        # タグを除去
        tags_container = await card.query_selector(".p-search-job-media__tags")
        if tags_container:
            tags_text = await tags_container.inner_text()
            for tag in tags_text.split():
                title = title.replace(tag.strip(), "").strip()

        # 募集状態
        status = JobStatus.UNKNOWN
        status_el = await card.query_selector(".p-search-job-media__time-text")
        if status_el:
            status_text = await status_el.inner_text()
            if "募集中" in status_text:
                status = JobStatus.OPEN
            elif "終了" in status_text or "締切" in status_text:
                status = JobStatus.CLOSED

        # 残り日数
        remaining_days = None
        remaining_el = await card.query_selector(".p-search-job-media__time-remaining")
        if remaining_el:
            remaining_text = await remaining_el.inner_text()
            match = re.search(r"あと(\d+)日", remaining_text)
            if match:
                remaining_days = int(match.group(1))

        # タグ情報
        tags = []
        tag_elements = await card.query_selector_all(".p-search-job-media__tag")
        for tag_el in tag_elements:
            tag_text = await tag_el.inner_text()
            if tag_text.strip():
                tags.append(tag_text.strip())

        # 案件形式
        job_type = JobType.UNKNOWN
        if await card.query_selector(".c-badge--worktype-project"):
            job_type = JobType.PROJECT
        elif await card.query_selector(".c-badge--worktype-task"):
            job_type = JobType.TASK
        elif await card.query_selector(".c-badge--worktype-competition"):
            job_type = JobType.COMPETITION

        # 報酬
        budget_min, budget_max = None, None
        price_numbers = await card.query_selector_all(".p-search-job-media__number")
        prices = []
        for price_el in price_numbers:
            text = await price_el.inner_text()
            price_text = text.replace(",", "").strip()
            if price_text.isdigit():
                prices.append(int(price_text))

        if len(prices) >= 2:
            budget_min, budget_max = prices[0], prices[1]
        elif len(prices) == 1:
            budget_min = budget_max = prices[0]

        # 特徴タグ
        feature_tags = []
        feature_elements = await card.query_selector_all(".p-search-job-media__tag-list")
        for feature_el in feature_elements:
            feature_text = await feature_el.inner_text()
            if feature_text.strip():
                feature_tags.append(feature_text.strip())

        # 提案数・募集人数
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

        # クライアント情報
        client = None
        client_name_el = await card.query_selector(".p-search-job-media__avatar-note a")
        if client_name_el:
            client_name = await client_name_el.inner_text()

            # 発注数・評価
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

            client = ClientInfo(
                name=client_name.strip(),
                rating=rating,
                order_history=order_count,
            )

        # カテゴリ判定
        category = self._categorize(title)

        return JobInfo(
            title=title,
            description="",  # 一覧からは取得しない
            category=category,
            budget_type=BudgetType.FIXED if job_type == JobType.PROJECT else BudgetType.UNKNOWN,
            source=self.SERVICE,
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

    async def scrape(self, url: str) -> JobInfo:
        """案件詳細ページから情報を取得"""
        job_id = self._extract_job_id(url)
        if not job_id:
            raise ValueError(f"Invalid Lancers URL: {url}")

        async with self._get_page() as page:
            await page.goto(url, wait_until="domcontentloaded", timeout=self.config.timeout.page_load)

            # メインコンテンツの出現を待機（最大5秒）
            try:
                await page.wait_for_selector(".p-work-detail", timeout=5000)
            except Exception:
                pass  # タイムアウトしても続行

            # 閲覧制限ページかチェック
            page_title = await page.title()
            if "閲覧制限" in page_title:
                raise ValueError("この案件は閲覧制限されています")

            # 情報抽出
            title = await self._extract_title(page)
            description = await self._extract_description(page)
            budget_min, budget_max, budget_type = await self._extract_budget(page)
            deadline = await self._extract_deadline(page)
            client_name, order_count, rating = await self._extract_client_info(page)
            skills = await self._extract_skills(page, description)
            tags, feature_tags = await self._extract_all_tags(page)

            # カテゴリ判定
            category = self._categorize(f"{title} {description}")

            # クライアント情報
            client = ClientInfo(
                name=client_name,
                rating=rating,
                order_history=order_count,
            ) if client_name else None

            return JobInfo(
                title=title,
                description=description,
                category=category,
                budget_type=budget_type,
                source=self.SERVICE,
                url=url,
                job_id=job_id,
                job_type=JobType.PROJECT,  # 詳細ページではプロジェクトと仮定
                status=JobStatus.OPEN,
                budget_min=budget_min,
                budget_max=budget_max,
                deadline=deadline,
                required_skills=skills,
                tags=tags,
                feature_tags=feature_tags,
                client=client,
            )

    async def _extract_title(self, page: Page) -> str:
        """タイトルを抽出"""
        # metaタグから取得
        title = await self._get_meta_content(page, "keywords")
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

    async def _extract_description(self, page: Page) -> str:
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

        desc = await self._get_meta_content(page, "description")
        return desc or ""

    async def _extract_budget(self, page: Page) -> tuple[Optional[int], Optional[int], BudgetType]:
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

    async def _extract_deadline(self, page: Page) -> Optional[str]:
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

    async def _extract_client_info(self, page: Page) -> tuple[Optional[str], Optional[int], Optional[float]]:
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

    async def _extract_skills(self, page: Page, description: str) -> list[str]:
        """必要スキルを抽出"""
        skills = []

        skill_keywords = [
            "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular",
            "Node.js", "Django", "Flask", "FastAPI", "Ruby", "Rails",
            "PHP", "Laravel", "Java", "Spring", "Go", "Rust",
            "AWS", "GCP", "Azure", "Docker", "Kubernetes",
            "MySQL", "PostgreSQL", "MongoDB", "Redis",
            "HTML", "CSS", "Sass", "WordPress",
            "iOS", "Android", "Swift", "Kotlin", "Flutter",
            "機械学習", "AI", "データ分析", "スクレイピング",
        ]

        desc_lower = description.lower()
        for skill in skill_keywords:
            if skill.lower() in desc_lower:
                skills.append(skill)

        return skills

    async def _extract_all_tags(self, page: Page) -> tuple[list[str], list[str]]:
        """全タグを抽出（一般タグ・特徴タグ）"""
        tags = []
        feature_tags = []

        try:
            # 一般タグ
            tag_elements = await page.query_selector_all(".c-tag.p-work-detail-tag")
            for el in tag_elements:
                text = await el.inner_text()
                if text:
                    feature_tags.append(text.strip())

        except Exception:
            pass

        return tags, feature_tags

    async def _get_meta_content(self, page: Page, name: str) -> Optional[str]:
        """metaタグの内容を取得"""
        try:
            meta = await page.query_selector(f'meta[name="{name}"]')
            if meta:
                return await meta.get_attribute("content")
        except Exception:
            pass
        return None
