"""スクレイパー基底クラス"""

import asyncio
import random
from abc import ABC, abstractmethod
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from playwright.async_api import Browser, BrowserContext, Page, async_playwright

from src.auth.session import SessionManager
from src.models.config import ScrapingConfig
from src.models.job import JobCategory, JobInfo, Service


class BaseScraper(ABC):
    """スクレイパーの基底クラス"""

    SERVICE: Service
    URL_PATTERN: str

    # カテゴリ判定キーワード
    CATEGORY_KEYWORDS: dict[JobCategory, list[str]] = {
        JobCategory.WEB_DEVELOPMENT: [
            "Web",
            "ウェブ",
            "ホームページ",
            "サイト",
            "WordPress",
            "PHP",
            "JavaScript",
            "React",
            "Vue",
            "Next.js",
            "フロントエンド",
            "バックエンド",
        ],
        JobCategory.APP_DEVELOPMENT: [
            "アプリ",
            "iOS",
            "Android",
            "Flutter",
            "React Native",
            "Swift",
            "Kotlin",
            "モバイル",
        ],
        JobCategory.SCRAPING: [
            "スクレイピング",
            "クローリング",
            "データ収集",
            "データ取得",
            "自動取得",
        ],
        JobCategory.AUTOMATION: [
            "自動化",
            "RPA",
            "効率化",
            "ツール開発",
            "バッチ",
            "定期実行",
        ],
        JobCategory.DATA_ANALYSIS: [
            "分析",
            "データ",
            "統計",
            "pandas",
            "可視化",
            "レポート",
            "BI",
        ],
        JobCategory.AI_ML: [
            "AI",
            "機械学習",
            "深層学習",
            "ChatGPT",
            "LLM",
            "自然言語処理",
            "画像認識",
        ],
    }

    def __init__(self, config: ScrapingConfig) -> None:
        self.config = config
        self._browser: Optional[Browser] = None
        self._session_manager = SessionManager()

    @abstractmethod
    async def scrape(self, url: str) -> JobInfo:
        """案件情報を取得"""
        pass

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """このURLを処理できるか判定"""
        pass

    @asynccontextmanager
    async def _get_browser(self) -> AsyncGenerator[Browser, None]:
        """ブラウザを取得"""
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=self.config.headless,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                ],
            )
            try:
                yield browser
            finally:
                await browser.close()

    @asynccontextmanager
    async def _get_page(self) -> AsyncGenerator[Page, None]:
        """ページを取得（セッションがあれば使用）"""
        async with self._get_browser() as browser:
            # 保存済みセッションがあれば使用
            storage_state = self._session_manager.get_storage_state_path(self.SERVICE)

            context = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                user_agent=self._get_user_agent(),
                locale="ja-JP",
                timezone_id="Asia/Tokyo",
                storage_state=storage_state,  # Cookieを読み込み
            )
            page = await context.new_page()
            try:
                yield page
            finally:
                await page.close()
                await context.close()

    def is_logged_in(self) -> bool:
        """ログイン済みか確認"""
        return self._session_manager.has_session(self.SERVICE)

    def _get_user_agent(self) -> str:
        """User-Agentを取得"""
        user_agents = [
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ]
        return random.choice(user_agents)

    async def _human_like_wait(self) -> None:
        """人間らしい待機"""
        if self.config.human_like.enabled:
            delay = random.uniform(
                self.config.human_like.min_delay,
                self.config.human_like.max_delay,
            )
            await asyncio.sleep(delay)

    async def _human_like_scroll(self, page: Page) -> None:
        """人間らしいスクロール"""
        if not self.config.human_like.enabled:
            return

        viewport_height = await page.evaluate("window.innerHeight")
        scroll_height = await page.evaluate("document.body.scrollHeight")

        current_position = 0
        while current_position < scroll_height:
            scroll_amount = random.randint(300, 500)
            current_position += scroll_amount
            await page.evaluate(f"window.scrollTo(0, {current_position})")
            await asyncio.sleep(random.uniform(0.5, 1.5))

    async def _get_text(self, page: Page, selector: str) -> Optional[str]:
        """セレクタからテキストを取得"""
        try:
            element = await page.wait_for_selector(
                selector,
                timeout=self.config.timeout.element_wait,
            )
            if element:
                return await element.inner_text()
        except Exception:
            pass
        return None

    def _categorize(self, text: str) -> JobCategory:
        """テキストからカテゴリを判定"""
        text_lower = text.lower()
        scores: dict[JobCategory, int] = {}

        for category, keywords in self.CATEGORY_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw.lower() in text_lower)
            if score > 0:
                scores[category] = score

        if scores:
            return max(scores, key=lambda k: scores[k])
        return JobCategory.OTHER
