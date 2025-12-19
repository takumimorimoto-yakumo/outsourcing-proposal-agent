"""セッション管理モジュール"""

import json
from pathlib import Path
from typing import Optional

from playwright.async_api import Browser, BrowserContext, Page, async_playwright

from src.models.job import Service


class SessionManager:
    """ログインセッションの管理"""

    # サービスごとのログインURL
    LOGIN_URLS = {
        Service.LANCERS: "https://www.lancers.jp/user/login",
        Service.CROWDWORKS: "https://crowdworks.jp/login",
    }

    # ログイン成功の確認URL（ログイン後にリダイレクトされるページ）
    SUCCESS_URLS = {
        Service.LANCERS: ["lancers.jp/mypage", "lancers.jp/work"],
        Service.CROWDWORKS: ["crowdworks.jp/public/jobs", "crowdworks.jp/mypage"],
    }

    def __init__(self, storage_dir: Optional[Path] = None) -> None:
        """
        Args:
            storage_dir: Cookie保存ディレクトリ（デフォルト: ~/.proposal-gen/sessions/）
        """
        if storage_dir is None:
            storage_dir = Path.home() / ".proposal-gen" / "sessions"
        self.storage_dir = storage_dir
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def _get_cookie_path(self, service: Service) -> Path:
        """サービスのCookieファイルパスを取得"""
        return self.storage_dir / f"{service.value}_cookies.json"

    def _get_storage_state_path(self, service: Service) -> Path:
        """サービスのストレージ状態ファイルパスを取得"""
        return self.storage_dir / f"{service.value}_state.json"

    def has_session(self, service: Service) -> bool:
        """保存済みセッションがあるか確認"""
        return self._get_storage_state_path(service).exists()

    def get_storage_state_path(self, service: Service) -> Optional[str]:
        """セッションがあればパスを返す"""
        path = self._get_storage_state_path(service)
        if path.exists():
            return str(path)
        return None

    async def login(self, service: Service, timeout: int = 300) -> bool:
        """
        手動ログインを行い、セッションを保存

        Args:
            service: ログインするサービス
            timeout: ログイン待機タイムアウト（秒）

        Returns:
            ログイン成功したらTrue
        """
        login_url = self.LOGIN_URLS[service]
        success_patterns = self.SUCCESS_URLS[service]
        storage_state_path = self._get_storage_state_path(service)

        print(f"\n{'='*50}")
        print(f"🔐 {service.value} にログインします")
        print(f"{'='*50}")
        print(f"\n📌 ブラウザが開きます。手動でログインしてください。")
        print(f"   ログインが完了すると自動的に検出されます。")
        print(f"   タイムアウト: {timeout}秒\n")

        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=False,  # 手動ログインなので必ず表示
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--no-sandbox",
                    "--start-maximized",
                ],
            )

            context = await browser.new_context(
                viewport={"width": 1280, "height": 900},
                locale="ja-JP",
                timezone_id="Asia/Tokyo",
            )

            page = await context.new_page()

            try:
                # ログインページに移動
                await page.goto(login_url, wait_until="domcontentloaded")
                print(f"✅ ログインページを開きました: {login_url}")
                print(f"⏳ ログインを待機中...")

                # ログイン成功を待機
                success = await self._wait_for_login(
                    page, success_patterns, timeout * 1000
                )

                if success:
                    # セッションを保存
                    await context.storage_state(path=str(storage_state_path))
                    print(f"\n✅ ログイン成功！セッションを保存しました")
                    print(f"   保存先: {storage_state_path}")
                    return True
                else:
                    print(f"\n❌ ログインがタイムアウトしました")
                    return False

            except Exception as e:
                print(f"\n❌ エラーが発生しました: {e}")
                return False

            finally:
                await browser.close()

    async def _wait_for_login(
        self, page: Page, success_patterns: list[str], timeout_ms: int
    ) -> bool:
        """ログイン成功を待機"""
        import asyncio

        check_interval = 1000  # 1秒ごとにチェック
        elapsed = 0

        while elapsed < timeout_ms:
            current_url = page.url

            # 成功パターンのいずれかにマッチするか
            for pattern in success_patterns:
                if pattern in current_url:
                    return True

            await asyncio.sleep(check_interval / 1000)
            elapsed += check_interval

        return False

    async def logout(self, service: Service) -> bool:
        """保存済みセッションを削除"""
        storage_state_path = self._get_storage_state_path(service)
        cookie_path = self._get_cookie_path(service)

        deleted = False
        if storage_state_path.exists():
            storage_state_path.unlink()
            deleted = True
        if cookie_path.exists():
            cookie_path.unlink()
            deleted = True

        if deleted:
            print(f"✅ {service.value} のセッションを削除しました")
        else:
            print(f"ℹ️  {service.value} のセッションは存在しません")

        return deleted

    async def verify_session(self, service: Service) -> bool:
        """保存済みセッションが有効か確認"""
        if not self.has_session(service):
            return False

        storage_state_path = self._get_storage_state_path(service)

        # Cookieファイルの内容を確認
        try:
            with open(storage_state_path) as f:
                import json
                state = json.load(f)
                cookies = state.get("cookies", [])

                # サービスドメインのCookieが存在するか確認
                service_domain = f".{service.value}.jp"
                has_auth_cookies = any(
                    service_domain in cookie.get("domain", "")
                    for cookie in cookies
                )
                return has_auth_cookies and len(cookies) > 0
        except Exception:
            return False

    def list_sessions(self) -> dict[Service, bool]:
        """保存済みセッションの一覧"""
        return {service: self.has_session(service) for service in Service}
