"""Lancersスクレイパーメインクラス"""

from typing import Optional

from playwright.async_api import Page

from src.models.job import (
    BudgetType,
    ClientInfo,
    JobInfo,
    JobStatus,
    JobType,
)
from src.scrapers.base import BaseScraper

from .constants import SERVICE, BASE_URL
from . import url_utils
from . import card_parser
from . import detail_parser


class LancersScraper(BaseScraper):
    """Lancers案件情報スクレイパー"""

    SERVICE = SERVICE
    BASE_URL = BASE_URL

    def can_handle(self, url: str) -> bool:
        """このURLを処理できるか判定"""
        return url_utils.can_handle(url)

    def can_handle_list(self, url: str) -> bool:
        """一覧ページURLを処理できるか判定"""
        return url_utils.can_handle_list(url)

    def build_search_url(
        self,
        category: Optional[str] = None,
        subcategory: Optional[str] = None,
        job_types: Optional[list[str]] = None,
        open_only: bool = True,
        page: int = 1,
    ) -> str:
        """検索URLを構築"""
        return url_utils.build_search_url(category, subcategory, job_types, open_only, page)

    async def scrape_list(
        self,
        url: Optional[str] = None,
        category: Optional[str] = None,
        job_types: Optional[list[str]] = None,
        open_only: bool = True,
        max_items: int = 50,
    ) -> list[JobInfo]:
        """案件一覧ページから複数の案件情報を取得"""
        if url is None:
            url = self.build_search_url(category, job_types, open_only)

        async with self._get_page() as page:
            # ページ読み込み
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except Exception as e:
                print(f"ページ読み込みエラー: {url} - {e}")
                return []

            # 案件カードの出現を待機
            try:
                await page.wait_for_selector(".p-search-job-media", timeout=5000)
            except Exception:
                pass

            # 案件カードを取得
            job_cards = await page.query_selector_all(".p-search-job-media")
            if not job_cards:
                print(f"案件カードが見つかりません: {url}")
                return []

            jobs = []
            for card in job_cards[:max_items]:
                try:
                    job = await card_parser.parse_job_card(card, page, self._categorize)
                    if job:
                        jobs.append(job)
                except Exception:
                    continue

            return jobs

    async def scrape(self, url: str) -> JobInfo:
        """案件詳細ページから情報を取得"""
        job_id = url_utils.extract_job_id(url)
        if not job_id:
            raise ValueError(f"Invalid Lancers URL: {url}")

        async with self._get_page() as page:
            await page.goto(url, wait_until="domcontentloaded", timeout=self.config.timeout.page_load)

            # メインコンテンツの出現を待機
            try:
                await page.wait_for_selector(".p-work-detail", timeout=5000)
            except Exception:
                pass

            # 閲覧制限ページかチェック
            page_title = await page.title()
            if "閲覧制限" in page_title:
                raise ValueError("この案件は閲覧制限されています")

            # 情報抽出
            title = await detail_parser.extract_title(page)
            description = await detail_parser.extract_description(page)
            budget_min, budget_max, budget_type = await detail_parser.extract_budget(page)
            deadline = await detail_parser.extract_deadline(page)
            client_name, order_count, rating = await detail_parser.extract_client_info(page)
            skills = await detail_parser.extract_skills(page, description)
            tags, feature_tags = await detail_parser.extract_all_tags(page)

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
                job_type=JobType.PROJECT,
                status=JobStatus.OPEN,
                budget_min=budget_min,
                budget_max=budget_max,
                deadline=deadline,
                required_skills=skills,
                tags=tags,
                feature_tags=feature_tags,
                client=client,
            )

    async def fetch_job_detail(self, url: str) -> Optional[dict]:
        """案件詳細を取得してdict形式で返す"""
        try:
            job_info = await self.scrape(url)
            return job_info.to_dict() if hasattr(job_info, 'to_dict') else None
        except Exception as e:
            print(f"詳細取得エラー: {url} - {e}")
            return None
