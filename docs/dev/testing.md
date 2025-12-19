# テスト戦略

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [テストの分類](#2-テストの分類)
3. [テストディレクトリ構造](#3-テストディレクトリ構造)
4. [単体テスト](#4-単体テスト)
5. [結合テスト](#5-結合テスト)
6. [E2Eテスト](#6-e2eテスト)
7. [モック戦略](#7-モック戦略)
8. [フィクスチャ](#8-フィクスチャ)
9. [テスト実行](#9-テスト実行)
10. [CI/CD連携](#10-cicd連携)

---

## 1. 概要

### 1.1. テスト方針

| 方針 | 説明 |
|------|------|
| ピラミッド型 | 単体テスト > 結合テスト > E2Eテスト |
| 外部依存の分離 | API・スクレイピングはモックで代替 |
| 高速フィードバック | 単体テストは1秒以内に完了 |
| 再現性 | 環境に依存しない確定的なテスト |

### 1.2. カバレッジ目標

| 対象 | 目標カバレッジ |
|------|--------------|
| モデル（models/） | 90%以上 |
| ビジネスロジック | 80%以上 |
| ユーティリティ | 80%以上 |
| 全体 | 70%以上 |

### 1.3. 使用ツール

| ツール | 用途 |
|--------|------|
| pytest | テストフレームワーク |
| pytest-asyncio | 非同期テスト |
| pytest-cov | カバレッジ測定 |
| pytest-mock | モック |
| freezegun | 日時固定 |
| responses / respx | HTTPモック |

---

## 2. テストの分類

### 2.1. テストレベル

```
┌─────────────────────────────────────────┐
│           E2Eテスト（10%）              │  ← 最も少ない
│    実際の外部サービスと連携             │
├─────────────────────────────────────────┤
│         結合テスト（20%）               │
│    複数モジュールの連携確認             │
├─────────────────────────────────────────┤
│         単体テスト（70%）               │  ← 最も多い
│    個々のモジュール・関数の確認         │
└─────────────────────────────────────────┘
```

### 2.2. テスト種別

| 種別 | 対象 | 実行タイミング |
|------|------|--------------|
| 単体テスト | モデル、ユーティリティ、各モジュール | 毎コミット |
| 結合テスト | モジュール間連携 | 毎プッシュ |
| E2Eテスト | 全体フロー | リリース前 |
| スナップショットテスト | プロンプト生成 | プロンプト変更時 |

---

## 3. テストディレクトリ構造

```
tests/
├── __init__.py
├── conftest.py              # 共通フィクスチャ
│
├── unit/                    # 単体テスト
│   ├── __init__.py
│   ├── test_models/
│   │   ├── test_job.py
│   │   ├── test_github.py
│   │   └── test_config.py
│   ├── test_scrapers/
│   │   ├── test_lancers.py
│   │   └── test_crowdworks.py
│   ├── test_github/
│   │   └── test_client.py
│   ├── test_generator/
│   │   ├── test_proposal.py
│   │   └── test_prompts.py
│   └── test_utils/
│       ├── test_validators.py
│       └── test_logger.py
│
├── integration/             # 結合テスト
│   ├── __init__.py
│   ├── test_orchestrator.py
│   └── test_config_loader.py
│
├── e2e/                     # E2Eテスト
│   ├── __init__.py
│   └── test_full_flow.py
│
├── fixtures/                # テストデータ
│   ├── __init__.py
│   ├── jobs/
│   │   ├── lancers_job.json
│   │   └── crowdworks_job.json
│   ├── github/
│   │   ├── user_response.json
│   │   └── repos_response.json
│   ├── html/
│   │   ├── lancers_page.html
│   │   └── crowdworks_page.html
│   └── config/
│       ├── settings.yaml
│       └── profile.yaml
│
└── snapshots/               # スナップショット
    └── prompts/
        └── test_prompts.ambr
```

---

## 4. 単体テスト

### 4.1. モデルのテスト

```python
# tests/unit/test_models/test_job.py

import pytest
from src.models.job import JobInfo, JobCategory, BudgetType, Service


class TestJobInfo:
    """JobInfoモデルのテスト"""

    def test_create_job_info(self):
        """正常なJobInfoの作成"""
        job = JobInfo(
            title="ECサイト開発",
            description="React + TypeScriptでECサイトを開発",
            category=JobCategory.WEB_DEVELOPMENT,
            budget_type=BudgetType.FIXED,
            source=Service.LANCERS,
            url="https://www.lancers.jp/work/detail/12345",
            budget_min=300000,
            budget_max=500000,
        )

        assert job.title == "ECサイト開発"
        assert job.category == JobCategory.WEB_DEVELOPMENT
        assert job.budget_min == 300000

    def test_budget_display_range(self):
        """予算表示（範囲）"""
        job = JobInfo(
            title="Test",
            description="Test",
            category=JobCategory.OTHER,
            budget_type=BudgetType.FIXED,
            source=Service.LANCERS,
            url="https://example.com",
            budget_min=100000,
            budget_max=200000,
        )

        assert job.budget_display == "100,000円 〜 200,000円"

    def test_budget_display_no_budget(self):
        """予算表示（未設定）"""
        job = JobInfo(
            title="Test",
            description="Test",
            category=JobCategory.OTHER,
            budget_type=BudgetType.FIXED,
            source=Service.LANCERS,
            url="https://example.com",
        )

        assert job.budget_display == "要相談"

    def test_to_dict(self):
        """辞書変換"""
        job = JobInfo(
            title="Test",
            description="Test",
            category=JobCategory.WEB_DEVELOPMENT,
            budget_type=BudgetType.FIXED,
            source=Service.LANCERS,
            url="https://example.com",
        )

        data = job.to_dict()

        assert data["title"] == "Test"
        assert data["category"] == "web_development"
        assert data["source"] == "lancers"

    def test_from_dict(self):
        """辞書からの作成"""
        data = {
            "title": "Test",
            "description": "Test",
            "category": "web_development",
            "budget_type": "fixed",
            "source": "lancers",
            "url": "https://example.com",
        }

        job = JobInfo.from_dict(data)

        assert job.title == "Test"
        assert job.category == JobCategory.WEB_DEVELOPMENT
```

### 4.2. ユーティリティのテスト

```python
# tests/unit/test_utils/test_validators.py

import pytest
from src.utils.validators import validate_url, extract_job_id


class TestValidateUrl:
    """URL検証のテスト"""

    @pytest.mark.parametrize("url,expected", [
        ("https://www.lancers.jp/work/detail/12345", True),
        ("https://crowdworks.jp/public/jobs/67890", True),
        ("https://www.lancers.jp/work/detail/", False),
        ("https://example.com", False),
        ("invalid-url", False),
    ])
    def test_validate_url(self, url: str, expected: bool):
        """各URLパターンの検証"""
        result = validate_url(url)
        assert result == expected


class TestExtractJobId:
    """ジョブID抽出のテスト"""

    def test_extract_from_lancers_url(self):
        """ランサーズURLからのID抽出"""
        url = "https://www.lancers.jp/work/detail/12345"
        assert extract_job_id(url) == "12345"

    def test_extract_from_crowdworks_url(self):
        """クラウドワークスURLからのID抽出"""
        url = "https://crowdworks.jp/public/jobs/67890"
        assert extract_job_id(url) == "67890"

    def test_invalid_url_raises_error(self):
        """無効なURLでエラー"""
        with pytest.raises(InvalidURLError):
            extract_job_id("https://example.com")
```

### 4.3. 非同期関数のテスト

```python
# tests/unit/test_github/test_client.py

import pytest
from unittest.mock import AsyncMock, patch

from src.github.client import GitHubClient
from src.models.github import GitHubProfile


class TestGitHubClient:
    """GitHubクライアントのテスト"""

    @pytest.fixture
    def client(self):
        """テスト用クライアント"""
        return GitHubClient(username="test-user")

    @pytest.mark.asyncio
    async def test_get_profile(self, client, mock_github_api):
        """プロフィール取得"""
        mock_github_api.get("/users/test-user").respond(
            json={
                "login": "test-user",
                "name": "Test User",
                "bio": "Developer",
                "public_repos": 30,
                "followers": 100,
            }
        )

        profile = await client.get_profile()

        assert profile.username == "test-user"
        assert profile.name == "Test User"
        assert profile.public_repos == 30

    @pytest.mark.asyncio
    async def test_get_profile_not_found(self, client, mock_github_api):
        """存在しないユーザー"""
        mock_github_api.get("/users/test-user").respond(status_code=404)

        with pytest.raises(GitHubAPIError):
            await client.get_profile()
```

---

## 5. 結合テスト

### 5.1. オーケストレータのテスト

```python
# tests/integration/test_orchestrator.py

import pytest
from unittest.mock import AsyncMock, MagicMock

from src.orchestrator import Orchestrator
from src.models.job import JobInfo, JobCategory


class TestOrchestrator:
    """オーケストレータの結合テスト"""

    @pytest.fixture
    def orchestrator(self, mock_config, mock_scraper, mock_github, mock_generator):
        """モック済みオーケストレータ"""
        return Orchestrator(
            config=mock_config,
            scraper=mock_scraper,
            github_client=mock_github,
            generator=mock_generator,
        )

    @pytest.mark.asyncio
    async def test_full_flow(self, orchestrator, sample_job_info):
        """完全なフローのテスト"""
        # スクレイパーのモック設定
        orchestrator.scraper.scrape.return_value = sample_job_info

        # GitHubクライアントのモック設定
        orchestrator.github_client.get_data.return_value = MagicMock()

        # ジェネレータのモック設定
        orchestrator.generator.generate.return_value = "生成された提案文"

        # 実行
        result = await orchestrator.run("https://www.lancers.jp/work/detail/12345")

        # 検証
        assert result == "生成された提案文"
        orchestrator.scraper.scrape.assert_called_once()
        orchestrator.github_client.get_data.assert_called_once()
        orchestrator.generator.generate.assert_called_once()

    @pytest.mark.asyncio
    async def test_flow_without_github(self, orchestrator, sample_job_info):
        """GitHub情報なしのフロー"""
        orchestrator.scraper.scrape.return_value = sample_job_info
        orchestrator.github_client.get_data.side_effect = GitHubAPIError("API Error")
        orchestrator.generator.generate.return_value = "生成された提案文"

        # エラーでも続行
        result = await orchestrator.run("https://www.lancers.jp/work/detail/12345")

        assert result == "生成された提案文"
```

---

## 6. E2Eテスト

### 6.1. フルフローテスト

```python
# tests/e2e/test_full_flow.py

import pytest
from click.testing import CliRunner

from src.main import app


@pytest.mark.e2e
@pytest.mark.slow
class TestFullFlow:
    """E2Eテスト（実際の外部サービスを使用）"""

    @pytest.fixture
    def runner(self):
        return CliRunner()

    def test_help_command(self, runner):
        """ヘルプコマンド"""
        result = runner.invoke(app, ["--help"])
        assert result.exit_code == 0
        assert "Usage:" in result.output

    def test_version_command(self, runner):
        """バージョンコマンド"""
        result = runner.invoke(app, ["version"])
        assert result.exit_code == 0
        assert "proposal-gen" in result.output

    def test_config_show(self, runner, tmp_config):
        """設定表示"""
        result = runner.invoke(app, ["config", "show"])
        assert result.exit_code == 0

    @pytest.mark.skip(reason="実際のAPIを使用するため、CI環境ではスキップ")
    def test_generate_proposal(self, runner, tmp_config):
        """提案文生成（実際のAPI使用）"""
        result = runner.invoke(
            app,
            ["https://www.lancers.jp/work/detail/XXXXX", "--dry-run"],
        )
        assert result.exit_code == 0
```

---

## 7. モック戦略

### 7.1. HTTPモック（respx）

```python
# tests/conftest.py

import pytest
import respx

@pytest.fixture
def mock_github_api():
    """GitHub APIのモック"""
    with respx.mock(base_url="https://api.github.com") as mock:
        yield mock


@pytest.fixture
def mock_gemini_api():
    """Gemini APIのモック"""
    with respx.mock(base_url="https://generativelanguage.googleapis.com") as mock:
        yield mock
```

### 7.2. Playwrightモック

```python
# tests/unit/test_scrapers/test_lancers.py

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


@pytest.fixture
def mock_page():
    """Playwrightページのモック"""
    page = AsyncMock()
    page.goto = AsyncMock()
    page.wait_for_selector = AsyncMock()
    page.query_selector = AsyncMock()
    page.evaluate = AsyncMock()
    return page


@pytest.fixture
def mock_browser(mock_page):
    """Playwrightブラウザのモック"""
    browser = AsyncMock()
    browser.new_page = AsyncMock(return_value=mock_page)
    return browser


class TestLancersScraper:
    @pytest.mark.asyncio
    async def test_scrape_job(self, mock_browser, mock_page, lancers_html):
        """案件スクレイピング"""
        # HTMLコンテンツを設定
        mock_page.content = AsyncMock(return_value=lancers_html)
        mock_page.query_selector.return_value = MagicMock(
            inner_text=AsyncMock(return_value="ECサイト開発")
        )

        with patch("playwright.async_api.async_playwright") as mock_playwright:
            mock_playwright.return_value.__aenter__.return_value.chromium.launch = (
                AsyncMock(return_value=mock_browser)
            )

            scraper = LancersScraper(config)
            job = await scraper.scrape("https://www.lancers.jp/work/detail/12345")

            assert job.title == "ECサイト開発"
```

### 7.3. 日時のモック

```python
# tests/unit/test_models/test_job.py

from freezegun import freeze_time


class TestJobInfoTimestamp:
    @freeze_time("2025-01-15 12:00:00")
    def test_scraped_at_default(self):
        """スクレイピング日時のデフォルト値"""
        job = JobInfo(
            title="Test",
            description="Test",
            category=JobCategory.OTHER,
            budget_type=BudgetType.FIXED,
            source=Service.LANCERS,
            url="https://example.com",
        )

        assert job.scraped_at.year == 2025
        assert job.scraped_at.month == 1
        assert job.scraped_at.day == 15
```

---

## 8. フィクスチャ

### 8.1. 共通フィクスチャ

```python
# tests/conftest.py

import pytest
import json
from pathlib import Path

from src.models.job import JobInfo, JobCategory, BudgetType, Service
from src.models.github import GitHubData, GitHubProfile


FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def sample_job_info() -> JobInfo:
    """サンプル案件情報"""
    return JobInfo(
        title="ECサイトのフロントエンド開発",
        description="React + TypeScriptでECサイトを開発してください。",
        category=JobCategory.WEB_DEVELOPMENT,
        budget_type=BudgetType.FIXED,
        budget_min=300000,
        budget_max=500000,
        deadline="2025-01-31",
        required_skills=["React", "TypeScript", "Next.js"],
        source=Service.LANCERS,
        url="https://www.lancers.jp/work/detail/12345",
    )


@pytest.fixture
def sample_github_data() -> GitHubData:
    """サンプルGitHub情報"""
    return GitHubData(
        profile=GitHubProfile(
            username="test-user",
            name="Test User",
            bio="Full-stack developer",
            public_repos=30,
            followers=100,
        ),
        repos=[],
        language_stats=[],
        matched_repos=[],
    )


@pytest.fixture
def lancers_html() -> str:
    """ランサーズページのHTML"""
    return (FIXTURES_DIR / "html" / "lancers_page.html").read_text()


@pytest.fixture
def github_user_response() -> dict:
    """GitHub APIユーザーレスポンス"""
    return json.loads(
        (FIXTURES_DIR / "github" / "user_response.json").read_text()
    )


@pytest.fixture
def tmp_config(tmp_path):
    """一時設定ファイル"""
    config_dir = tmp_path / "config"
    config_dir.mkdir()

    settings = config_dir / "settings.yaml"
    settings.write_text("""
version: "1.0"
github:
  username: "test-user"
gemini:
  model: "gemini-pro"
""")

    return config_dir
```

### 8.2. フィクスチャファイル

```json
// tests/fixtures/github/user_response.json
{
  "login": "test-user",
  "name": "Test User",
  "bio": "Full-stack developer",
  "company": "Test Inc.",
  "location": "Tokyo",
  "public_repos": 30,
  "followers": 100,
  "created_at": "2020-01-01T00:00:00Z"
}
```

```html
<!-- tests/fixtures/html/lancers_page.html -->
<!DOCTYPE html>
<html>
<head><title>案件詳細</title></head>
<body>
  <h1 class="c-heading__title">ECサイトのフロントエンド開発</h1>
  <div class="p-job-detail__description">
    React + TypeScriptでECサイトを開発してください。
  </div>
  <div class="c-job-info__price">300,000円 〜 500,000円</div>
</body>
</html>
```

---

## 9. テスト実行

### 9.1. 基本コマンド

```bash
# 全テスト実行
pytest

# 詳細出力
pytest -v

# 特定ディレクトリ
pytest tests/unit/

# 特定ファイル
pytest tests/unit/test_models/test_job.py

# 特定テスト
pytest tests/unit/test_models/test_job.py::TestJobInfo::test_create_job_info

# キーワードでフィルタ
pytest -k "github"
```

### 9.2. カバレッジ

```bash
# カバレッジ測定
pytest --cov=src --cov-report=html

# カバレッジレポート表示
open htmlcov/index.html
```

### 9.3. マーカー

```bash
# 遅いテストをスキップ
pytest -m "not slow"

# E2Eテストのみ
pytest -m e2e

# 非同期テストのみ
pytest -m asyncio
```

### 9.4. pytest.ini

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
asyncio_mode = auto
markers =
    slow: marks tests as slow
    e2e: marks tests as end-to-end
    integration: marks tests as integration tests
addopts = -v --tb=short
```

---

## 10. CI/CD連携

### 10.1. GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install -e ".[dev]"
          playwright install chromium
          playwright install-deps chromium

      - name: Run linters
        run: |
          black --check src/ tests/
          isort --check src/ tests/
          ruff check src/ tests/

      - name: Run type check
        run: mypy src/

      - name: Run tests
        run: pytest --cov=src --cov-report=xml -m "not e2e"

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
```

---

## 関連ドキュメント

- [開発環境構築](./getting-started.md)
- [コーディング規約](./coding-standards.md)
- [アーキテクチャ](../design/architecture.md)
