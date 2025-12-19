"""GitHubクライアント"""

from datetime import datetime
from typing import Optional

import httpx

from src.models.errors import GitHubAPIError
from src.models.github import GitHubData, GitHubProfile, LanguageStats, RepoInfo


class GitHubClient:
    """GitHub APIクライアント"""

    BASE_URL = "https://api.github.com"

    def __init__(self, username: str, token: Optional[str] = None) -> None:
        self.username = username
        self.token = token
        self._client: Optional[httpx.AsyncClient] = None

    def _get_headers(self) -> dict[str, str]:
        """リクエストヘッダーを取得"""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "proposal-generator",
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers

    async def _get_client(self) -> httpx.AsyncClient:
        """HTTPクライアントを取得"""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.BASE_URL,
                headers=self._get_headers(),
                timeout=30.0,
            )
        return self._client

    async def close(self) -> None:
        """クライアントをクローズ"""
        if self._client:
            await self._client.aclose()
            self._client = None

    async def get_profile(self) -> GitHubProfile:
        """ユーザー情報を取得"""
        client = await self._get_client()
        response = await client.get(f"/users/{self.username}")

        if response.status_code == 404:
            raise GitHubAPIError(f"User not found: {self.username}")
        if response.status_code == 403:
            raise GitHubAPIError("Rate limit exceeded")
        if response.status_code != 200:
            raise GitHubAPIError(f"GitHub API error: {response.status_code}")

        data = response.json()
        created_at = None
        if data.get("created_at"):
            created_at = datetime.fromisoformat(data["created_at"].replace("Z", "+00:00"))

        return GitHubProfile(
            username=data["login"],
            name=data.get("name"),
            bio=data.get("bio"),
            company=data.get("company"),
            location=data.get("location"),
            public_repos=data.get("public_repos", 0),
            followers=data.get("followers", 0),
            created_at=created_at,
        )

    async def get_repos(self, per_page: int = 100) -> list[RepoInfo]:
        """リポジトリ一覧を取得"""
        client = await self._get_client()
        response = await client.get(
            f"/users/{self.username}/repos",
            params={
                "sort": "updated",
                "per_page": per_page,
                "type": "owner",
            },
        )

        if response.status_code != 200:
            raise GitHubAPIError(f"GitHub API error: {response.status_code}")

        repos = []
        for data in response.json():
            if data.get("fork"):
                continue

            updated_at = None
            if data.get("updated_at"):
                updated_at = datetime.fromisoformat(
                    data["updated_at"].replace("Z", "+00:00")
                )

            repos.append(
                RepoInfo(
                    name=data["name"],
                    url=data["html_url"],
                    description=data.get("description"),
                    language=data.get("language"),
                    stars=data.get("stargazers_count", 0),
                    forks=data.get("forks_count", 0),
                    updated_at=updated_at,
                    topics=data.get("topics", []),
                    is_fork=data.get("fork", False),
                )
            )

        return repos

    async def get_languages(self, repos: list[RepoInfo]) -> list[LanguageStats]:
        """言語統計を取得"""
        language_bytes: dict[str, int] = {}

        for repo in repos:
            if repo.language:
                language_bytes[repo.language] = language_bytes.get(repo.language, 0) + 1

        total = sum(language_bytes.values())
        if total == 0:
            return []

        return [
            LanguageStats(
                language=lang,
                bytes=count,
                percentage=(count / total) * 100,
            )
            for lang, count in sorted(
                language_bytes.items(), key=lambda x: x[1], reverse=True
            )
        ]

    def match_repos(
        self, repos: list[RepoInfo], skills: list[str]
    ) -> list[RepoInfo]:
        """スキルにマッチするリポジトリを抽出"""
        matched: list[tuple[RepoInfo, int]] = []
        skills_lower = [s.lower() for s in skills]

        for repo in repos:
            score = 0

            # 言語マッチ
            if repo.language and repo.language.lower() in skills_lower:
                score += 3

            # トピックマッチ
            for topic in repo.topics:
                if topic.lower() in skills_lower:
                    score += 2

            # 説明文マッチ
            if repo.description:
                for skill in skills:
                    if skill.lower() in repo.description.lower():
                        score += 1

            if score > 0:
                matched.append((repo, score))

        # スコア順、同点ならスター数順でソート
        matched.sort(key=lambda x: (-x[1], -x[0].stars))
        return [repo for repo, _ in matched[:5]]

    async def get_data(self, skills: Optional[list[str]] = None) -> GitHubData:
        """GitHub情報を取得"""
        try:
            profile = await self.get_profile()
            repos = await self.get_repos()
            language_stats = await self.get_languages(repos)
            matched_repos = self.match_repos(repos, skills or [])

            return GitHubData(
                profile=profile,
                repos=repos,
                language_stats=language_stats,
                matched_repos=matched_repos,
            )
        finally:
            await self.close()
