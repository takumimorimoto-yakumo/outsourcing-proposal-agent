# 拡張ガイド

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [新しいサービスの追加](#2-新しいサービスの追加)
3. [新しいカテゴリの追加](#3-新しいカテゴリの追加)
4. [プロンプトのカスタマイズ](#4-プロンプトのカスタマイズ)
5. [出力形式の追加](#5-出力形式の追加)
6. [プラグインシステム](#6-プラグインシステム)

---

## 1. 概要

### 1.1. 拡張ポイント

このシステムは以下のポイントで拡張可能です：

| 拡張ポイント | 説明 | 難易度 |
|-------------|------|--------|
| 新しいサービス | 他のクラウドソーシングサービスへの対応 | 中 |
| 新しいカテゴリ | 案件カテゴリの追加 | 低 |
| プロンプト | 提案文生成のプロンプト調整 | 低 |
| 出力形式 | Markdown、HTMLなどの出力形式 | 低 |
| プラグイン | カスタムフック・処理の追加 | 高 |

### 1.2. 設計原則

- **Open-Closed Principle**: 既存コードを変更せず、新機能を追加
- **Strategy Pattern**: スクレイパーやジェネレーターを差し替え可能
- **Factory Pattern**: サービスに応じた実装の自動選択

---

## 2. 新しいサービスの追加

### 2.1. 手順概要

1. Service 列挙型に新サービスを追加
2. 新しいスクレイパークラスを作成
3. スクレイパーファクトリーに登録
4. テストを作成

### 2.2. 実装例: ココナラ対応

#### Step 1: Service 列挙型の更新

```python
# src/models/job.py

class Service(str, Enum):
    LANCERS = "lancers"
    CROWDWORKS = "crowdworks"
    COCONALA = "coconala"  # 追加
```

#### Step 2: スクレイパークラスの作成

```python
# src/scrapers/coconala.py

from src.scrapers.base import BaseScraper
from src.models.job import JobInfo, Service, JobCategory, BudgetType


class CoconalaScraper(BaseScraper):
    """ココナラ用スクレイパー"""

    SERVICE = Service.COCONALA
    URL_PATTERN = r"https://coconala\.com/services/(\d+)"

    # セレクタ定義
    SELECTORS = {
        "title": ".service-title",
        "description": ".service-description",
        "price": ".service-price",
        "category": ".category-breadcrumb",
    }

    def can_handle(self, url: str) -> bool:
        """このURLを処理できるか判定"""
        return "coconala.com" in url

    async def scrape(self, url: str) -> JobInfo:
        """案件情報を取得"""
        async with self._get_page() as page:
            await page.goto(url)
            await self._human_like_wait()

            title = await self._get_text(page, self.SELECTORS["title"])
            description = await self._get_text(page, self.SELECTORS["description"])
            price = await self._parse_price(page)
            category = await self._detect_category(page)

            return JobInfo(
                title=title,
                description=description,
                category=category,
                budget_type=BudgetType.FIXED,
                budget_min=price,
                budget_max=price,
                source=self.SERVICE,
                url=url,
            )

    async def _parse_price(self, page) -> int | None:
        """価格をパース"""
        text = await self._get_text(page, self.SELECTORS["price"])
        # 例: "¥5,000" -> 5000
        if text:
            return int(text.replace("¥", "").replace(",", ""))
        return None

    async def _detect_category(self, page) -> JobCategory:
        """カテゴリを判定"""
        breadcrumb = await self._get_text(page, self.SELECTORS["category"])
        # カテゴリ判定ロジック
        return self._categorize(breadcrumb)
```

#### Step 3: ファクトリーへの登録

```python
# src/scrapers/__init__.py

from src.scrapers.lancers import LancersScraper
from src.scrapers.crowdworks import CrowdworksScraper
from src.scrapers.coconala import CoconalaScraper  # 追加

SCRAPERS = [
    LancersScraper,
    CrowdworksScraper,
    CoconalaScraper,  # 追加
]


def get_scraper(url: str, config: ScrapingConfig) -> BaseScraper:
    """URLに対応するスクレイパーを取得"""
    for scraper_class in SCRAPERS:
        scraper = scraper_class(config)
        if scraper.can_handle(url):
            return scraper
    raise InvalidURLError(f"対応していないURL: {url}")
```

#### Step 4: テストの作成

```python
# tests/unit/test_scrapers/test_coconala.py

import pytest
from src.scrapers.coconala import CoconalaScraper


class TestCoconalaScraper:
    @pytest.fixture
    def scraper(self, mock_config):
        return CoconalaScraper(mock_config)

    def test_can_handle_coconala_url(self, scraper):
        assert scraper.can_handle("https://coconala.com/services/12345")

    def test_cannot_handle_other_url(self, scraper):
        assert not scraper.can_handle("https://lancers.jp/work/detail/12345")

    @pytest.mark.asyncio
    async def test_scrape_job(self, scraper, mock_page, coconala_html):
        # スクレイピングテスト
        pass
```

### 2.3. チェックリスト

- [ ] Service 列挙型に追加
- [ ] スクレイパークラスを作成
- [ ] URL判定ロジックを実装
- [ ] セレクタを定義・検証
- [ ] ファクトリーに登録
- [ ] 単体テストを作成
- [ ] HTMLフィクスチャを追加
- [ ] ドキュメントを更新

---

## 3. 新しいカテゴリの追加

### 3.1. 手順概要

1. JobCategory 列挙型に追加
2. カテゴリ判定キーワードを追加
3. カテゴリテンプレートを追加

### 3.2. 実装例: インフラ・DevOps カテゴリ

#### Step 1: 列挙型の更新

```python
# src/models/job.py

class JobCategory(str, Enum):
    WEB_DEVELOPMENT = "web_development"
    APP_DEVELOPMENT = "app_development"
    SCRAPING = "scraping"
    AUTOMATION = "automation"
    DATA_ANALYSIS = "data_analysis"
    AI_ML = "ai_ml"
    INFRASTRUCTURE = "infrastructure"  # 追加
    OTHER = "other"
```

#### Step 2: カテゴリ判定キーワードの追加

```python
# src/utils/categorizer.py

CATEGORY_KEYWORDS = {
    JobCategory.INFRASTRUCTURE: [
        "AWS", "GCP", "Azure", "インフラ", "DevOps",
        "Docker", "Kubernetes", "k8s", "CI/CD",
        "Terraform", "Ansible", "サーバー構築",
    ],
    # 他のカテゴリ...
}
```

#### Step 3: テンプレートの追加

```yaml
# config/profile.yaml

category_templates:
  infrastructure:
    strength: |
      インフラ・DevOps領域においては、クラウド環境の設計・構築、
      CI/CDパイプラインの構築、コンテナ化・オーケストレーションを
      得意としております。

    approach_hints:
      - "可用性・スケーラビリティの設計"
      - "セキュリティベストプラクティス"
      - "コスト最適化"
      - "Infrastructure as Code"
```

---

## 4. プロンプトのカスタマイズ

### 4.1. システムプロンプトの調整

```python
# src/generator/prompts.py

CUSTOM_SYSTEM_PROMPT = """
{base_system_prompt}

## 追加の指示

以下のポイントも考慮してください：
- 専門用語は適度に使用し、わかりやすさを重視
- 具体的な数字や実績を含める
- クライアントの業界に合わせた表現を使用
"""
```

### 4.2. カテゴリ別プロンプトの追加

```python
# src/generator/prompts.py

CATEGORY_PROMPTS = {
    JobCategory.INFRASTRUCTURE: """
## インフラ案件向けの追加指示

以下のポイントを提案に含めることを検討してください：
- 可用性・耐障害性の設計方針
- セキュリティ対策（WAF、暗号化等）
- コスト見積もりと最適化
- 監視・アラート体制
- ドキュメント・引き継ぎ
""",
}
```

### 4.3. 出力制御の調整

```yaml
# config/settings.yaml

gemini:
  temperature: 0.7
  custom_instructions: |
    - 箇条書きは3-5項目程度に抑える
    - 技術用語には簡単な説明を添える
    - 過度に長い文は避ける
```

---

## 5. 出力形式の追加

### 5.1. Markdown 出力

```python
# src/output/markdown.py

from src.models.generation import GenerationOutput


class MarkdownFormatter:
    """Markdown形式での出力"""

    def format(self, output: GenerationOutput) -> str:
        return f"""# 提案文

{output.proposal}

---

## メタデータ

| 項目 | 値 |
|------|-----|
| 文字数 | {output.metadata.character_count} |
| カテゴリ | {output.metadata.category.value} |
| 生成時間 | {output.metadata.generation_time:.2f}秒 |
"""
```

### 5.2. HTML 出力

```python
# src/output/html.py

class HtmlFormatter:
    """HTML形式での出力"""

    TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>提案文</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: auto; padding: 20px; }
        .proposal { white-space: pre-wrap; line-height: 1.8; }
        .metadata { margin-top: 20px; padding: 10px; background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="proposal">{proposal}</div>
    <div class="metadata">
        <p>文字数: {char_count}</p>
        <p>カテゴリ: {category}</p>
    </div>
</body>
</html>
"""

    def format(self, output: GenerationOutput) -> str:
        return self.TEMPLATE.format(
            proposal=output.proposal,
            char_count=output.metadata.character_count,
            category=output.metadata.category.value,
        )
```

### 5.3. CLIオプションへの追加

```python
# src/main.py

@app.command()
def generate(
    url: str,
    output: Path = None,
    format: str = typer.Option("text", help="出力形式: text, markdown, html, json"),
):
    """提案文を生成"""
    result = orchestrator.run(url)

    formatter = get_formatter(format)
    formatted = formatter.format(result)

    if output:
        output.write_text(formatted)
    else:
        print(formatted)
```

---

## 6. プラグインシステム

### 6.1. プラグインインターフェース

```python
# src/plugins/base.py

from abc import ABC, abstractmethod
from src.models.job import JobInfo
from src.models.generation import GenerationOutput


class BasePlugin(ABC):
    """プラグインの基底クラス"""

    @property
    @abstractmethod
    def name(self) -> str:
        """プラグイン名"""
        pass

    def on_job_scraped(self, job: JobInfo) -> JobInfo:
        """案件情報取得後のフック"""
        return job

    def on_before_generate(self, job: JobInfo) -> JobInfo:
        """生成前のフック"""
        return job

    def on_after_generate(self, output: GenerationOutput) -> GenerationOutput:
        """生成後のフック"""
        return output
```

### 6.2. プラグイン実装例

```python
# src/plugins/keyword_highlighter.py

class KeywordHighlighterPlugin(BasePlugin):
    """キーワードをハイライトするプラグイン"""

    name = "keyword_highlighter"

    def __init__(self, keywords: list[str]):
        self.keywords = keywords

    def on_after_generate(self, output: GenerationOutput) -> GenerationOutput:
        """生成後にキーワードをハイライト"""
        proposal = output.proposal
        for keyword in self.keywords:
            proposal = proposal.replace(keyword, f"**{keyword}**")

        return GenerationOutput(
            proposal=proposal,
            metadata=output.metadata,
        )
```

### 6.3. プラグインの登録

```python
# src/plugins/__init__.py

from src.plugins.base import BasePlugin
from src.plugins.keyword_highlighter import KeywordHighlighterPlugin

PLUGINS: list[BasePlugin] = []


def register_plugin(plugin: BasePlugin):
    """プラグインを登録"""
    PLUGINS.append(plugin)


def run_hook(hook_name: str, data):
    """フックを実行"""
    for plugin in PLUGINS:
        hook = getattr(plugin, hook_name, None)
        if hook:
            data = hook(data)
    return data
```

---

## 関連ドキュメント

- [アーキテクチャ](../design/architecture.md)
- [スクレイピング仕様](../specs/scraping.md)
- [プロンプト設計](../design/prompts.md)
- [コーディング規約](../dev/coding-standards.md)
