# コーディング規約

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [Python スタイルガイド](#2-python-スタイルガイド)
3. [命名規則](#3-命名規則)
4. [型ヒント](#4-型ヒント)
5. [ドキュメンテーション](#5-ドキュメンテーション)
6. [エラーハンドリング](#6-エラーハンドリング)
7. [インポート規則](#7-インポート規則)
8. [ツール設定](#8-ツール設定)
9. [コードレビューチェックリスト](#9-コードレビューチェックリスト)

---

## 1. 概要

### 1.1. 基本方針

| 方針 | 説明 |
|------|------|
| PEP 8 準拠 | Python公式スタイルガイドに従う |
| 型安全 | 型ヒントを必須とする |
| 自動フォーマット | Black + isort で統一 |
| 静的解析 | Ruff + mypy でチェック |

### 1.2. 使用ツール

| ツール | 用途 | 設定ファイル |
|--------|------|-------------|
| Black | コードフォーマッター | `pyproject.toml` |
| isort | インポート整理 | `pyproject.toml` |
| Ruff | リンター | `pyproject.toml` |
| mypy | 型チェッカー | `pyproject.toml` |

---

## 2. Python スタイルガイド

### 2.1. インデント・改行

```python
# Good: 4スペースインデント
def example_function(
    arg1: str,
    arg2: int,
    arg3: Optional[list[str]] = None,
) -> dict:
    return {
        "arg1": arg1,
        "arg2": arg2,
    }

# Bad: タブ、2スペース
def bad_function(arg1,arg2):
  return {"arg1":arg1}
```

### 2.2. 行の長さ

- **最大行長**: 88文字（Blackのデフォルト）
- 長い行は適切に改行する

```python
# Good: 適切な改行
result = some_function(
    first_argument="value",
    second_argument="another_value",
    third_argument=some_long_variable_name,
)

# Good: 文字列の連結
message = (
    "This is a very long message that needs to be "
    "split across multiple lines for readability."
)
```

### 2.3. 空行

```python
# クラス間: 2行
class FirstClass:
    pass


class SecondClass:
    pass


# メソッド間: 1行
class Example:
    def method_one(self) -> None:
        pass

    def method_two(self) -> None:
        pass


# 関数内の論理ブロック: 1行
def process_data(data: list) -> list:
    # 前処理
    cleaned = clean_data(data)

    # 変換
    transformed = transform_data(cleaned)

    # 後処理
    return finalize_data(transformed)
```

### 2.4. 文字列

```python
# Good: ダブルクォート（統一）
message = "Hello, World!"
sql = "SELECT * FROM users WHERE id = ?"

# Good: f-string（フォーマット）
name = "Alice"
greeting = f"Hello, {name}!"

# Good: 複数行文字列
long_text = """
This is a multi-line string.
It preserves line breaks.
"""

# Bad: シングルクォートとダブルクォートの混在
bad = 'Hello' + "World"
```

---

## 3. 命名規則

### 3.1. 基本ルール

| 対象 | 規則 | 例 |
|------|------|-----|
| モジュール | snake_case | `job_scraper.py` |
| クラス | PascalCase | `JobInfo`, `GitHubClient` |
| 関数・メソッド | snake_case | `get_job_info()`, `parse_budget()` |
| 変数 | snake_case | `job_title`, `max_retries` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRIES`, `DEFAULT_TIMEOUT` |
| プライベート | 先頭に `_` | `_internal_method()`, `_cache` |
| 型変数 | PascalCase + T | `ResponseT`, `ConfigT` |

### 3.2. 具体例

```python
# モジュール名: src/scrapers/lancers_scraper.py

# 定数
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30000

# クラス
class LancersScraper(BaseScraper):
    """ランサーズ用スクレイパー"""

    def __init__(self, config: ScrapingConfig) -> None:
        self._config = config  # プライベート属性
        self._cache: dict[str, JobInfo] = {}

    def scrape_job(self, url: str) -> JobInfo:
        """案件情報を取得"""
        job_id = self._extract_job_id(url)
        return self._fetch_job_info(job_id)

    def _extract_job_id(self, url: str) -> str:
        """URLからジョブIDを抽出（プライベート）"""
        pass

    def _fetch_job_info(self, job_id: str) -> JobInfo:
        """案件情報を取得（プライベート）"""
        pass
```

### 3.3. 命名のガイドライン

```python
# Good: 明確で説明的な名前
job_title = "ECサイト開発"
user_count = 100
is_valid = True
has_permission = False

# Bad: 略語、曖昧な名前
jt = "ECサイト開発"
cnt = 100
flag = True
x = False

# Good: 関数名は動詞で始める
def get_user(user_id: int) -> User: ...
def create_proposal(job_info: JobInfo) -> str: ...
def validate_config(config: dict) -> bool: ...
def parse_budget(text: str) -> tuple[int, int]: ...

# Good: ブール値は is_, has_, can_ で始める
def is_valid_url(url: str) -> bool: ...
def has_required_skills(job: JobInfo) -> bool: ...
def can_process(job: JobInfo) -> bool: ...
```

---

## 4. 型ヒント

### 4.1. 基本ルール

- 全ての関数・メソッドに型ヒントを付ける
- クラス属性にも型ヒントを付ける
- `Any` の使用は最小限に

```python
from typing import Optional
from collections.abc import Callable, Iterable

# Good: 完全な型ヒント
def process_jobs(
    jobs: list[JobInfo],
    filter_func: Callable[[JobInfo], bool] | None = None,
) -> list[JobInfo]:
    if filter_func:
        return [job for job in jobs if filter_func(job)]
    return jobs

# Bad: 型ヒントなし
def process_jobs(jobs, filter_func=None):
    pass
```

### 4.2. Optional と Union

```python
from typing import Optional

# Good: Optional の使用
def get_job(job_id: str) -> Optional[JobInfo]:
    """ジョブが見つからない場合はNoneを返す"""
    pass

# Good: Union の使用（Python 3.10+）
def parse_value(value: str) -> int | float | None:
    pass

# Good: 戻り値が必ずある場合
def get_job_or_raise(job_id: str) -> JobInfo:
    """ジョブが見つからない場合は例外を発生"""
    job = get_job(job_id)
    if job is None:
        raise JobNotFoundError(job_id)
    return job
```

### 4.3. ジェネリクス

```python
from typing import TypeVar, Generic

T = TypeVar("T")
ResponseT = TypeVar("ResponseT", bound="BaseResponse")

class Repository(Generic[T]):
    def get(self, id: str) -> Optional[T]:
        pass

    def save(self, entity: T) -> T:
        pass

# 使用例
job_repo: Repository[JobInfo] = Repository()
```

### 4.4. dataclass との組み合わせ

```python
from dataclasses import dataclass, field
from typing import Optional

@dataclass(frozen=True)
class JobInfo:
    title: str
    description: str
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    required_skills: list[str] = field(default_factory=list)
```

---

## 5. ドキュメンテーション

### 5.1. docstring スタイル

Google スタイルを採用。

```python
def scrape_job(url: str, timeout: int = 30000) -> JobInfo:
    """案件ページから情報をスクレイピングする。

    指定されたURLから案件情報を取得し、構造化されたJobInfoオブジェクトを返す。
    ページが見つからない場合やタイムアウトした場合は例外を発生させる。

    Args:
        url: 案件ページのURL。ランサーズまたはクラウドワークスのURL形式。
        timeout: タイムアウト時間（ミリ秒）。デフォルトは30000。

    Returns:
        スクレイピングした案件情報を含むJobInfoオブジェクト。

    Raises:
        InvalidURLError: URLの形式が無効な場合。
        PageNotFoundError: 案件ページが見つからない場合。
        TimeoutError: タイムアウトした場合。

    Example:
        >>> job = scrape_job("https://www.lancers.jp/work/detail/12345")
        >>> print(job.title)
        "ECサイトのフロントエンド開発"
    """
    pass
```

### 5.2. クラスの docstring

```python
class LancersScraper(BaseScraper):
    """ランサーズ用のスクレイパー。

    ランサーズの案件ページから情報を取得するためのスクレイパー。
    Playwrightを使用してJavaScript実行後のDOMを取得する。

    Attributes:
        config: スクレイピング設定。
        browser: Playwrightのブラウザインスタンス。

    Example:
        >>> async with LancersScraper(config) as scraper:
        ...     job = await scraper.scrape(url)
    """

    def __init__(self, config: ScrapingConfig) -> None:
        """スクレイパーを初期化する。

        Args:
            config: スクレイピング設定。
        """
        self.config = config
        self._browser: Optional[Browser] = None
```

### 5.3. コメント

```python
# Good: 「なぜ」を説明するコメント
# レート制限を避けるため、リクエスト間に遅延を入れる
await asyncio.sleep(random.uniform(2.0, 4.0))

# Good: 複雑なロジックの説明
# スコア計算: 言語マッチ(3点) + トピックマッチ(2点) + 説明文マッチ(1点)
score = lang_score * 3 + topic_score * 2 + desc_score

# Bad: 自明なコメント
# カウンターをインクリメント
counter += 1

# Bad: コードの説明（コード自体を明確に）
# ユーザーを取得
u = get_u(id)  # → user = get_user(user_id) とすべき
```

---

## 6. エラーハンドリング

### 6.1. カスタム例外

```python
# src/models/errors.py

class ProposalGenError(Exception):
    """アプリケーション基底例外"""

    def __init__(self, message: str, details: Optional[dict] = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class ScrapingError(ProposalGenError):
    """スクレイピング関連のエラー"""
    pass


class ConfigError(ProposalGenError):
    """設定関連のエラー"""
    pass
```

### 6.2. 例外の使用

```python
# Good: 具体的な例外を発生
def get_job(job_id: str) -> JobInfo:
    job = self._cache.get(job_id)
    if job is None:
        raise JobNotFoundError(f"Job not found: {job_id}")
    return job

# Good: 例外の再発生（コンテキスト追加）
try:
    response = await client.get(url)
except httpx.TimeoutException as e:
    raise NetworkError(f"Request timed out: {url}") from e

# Good: 複数の例外をキャッチ
try:
    job = await scraper.scrape(url)
except (PageNotFoundError, TimeoutError) as e:
    logger.warning(f"Scraping failed: {e}")
    raise

# Bad: 裸の except
try:
    job = await scraper.scrape(url)
except:  # 全ての例外をキャッチしてしまう
    pass
```

### 6.3. コンテキストマネージャ

```python
# Good: async with の使用
async def scrape_job(url: str) -> JobInfo:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        async with browser:
            page = await browser.new_page()
            # スクレイピング処理

# Good: contextlib の使用
from contextlib import asynccontextmanager

@asynccontextmanager
async def get_browser():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        try:
            yield browser
        finally:
            await browser.close()
```

---

## 7. インポート規則

### 7.1. インポート順序

isort により自動整理される。

```python
# 1. 標準ライブラリ
import asyncio
import os
from dataclasses import dataclass
from typing import Optional

# 2. サードパーティライブラリ
import httpx
from playwright.async_api import async_playwright

# 3. ローカルモジュール
from src.models.job import JobInfo
from src.scrapers.base import BaseScraper
```

### 7.2. インポートスタイル

```python
# Good: 明示的なインポート
from src.models.job import JobInfo, ClientInfo
from src.scrapers.base import BaseScraper

# Good: モジュールインポート（多数の場合）
from src import models
job: models.JobInfo = models.JobInfo(...)

# Bad: ワイルドカードインポート
from src.models.job import *

# Bad: 相対インポート（深いネストの場合）
from ....models.job import JobInfo
```

---

## 8. ツール設定

### 8.1. pyproject.toml

```toml
[tool.black]
line-length = 88
target-version = ['py311']
include = '\.pyi?$'
exclude = '''
/(
    \.git
    | \.venv
    | __pycache__
    | \.mypy_cache
)/
'''

[tool.isort]
profile = "black"
line_length = 88
known_first_party = ["src"]
sections = ["FUTURE", "STDLIB", "THIRDPARTY", "FIRSTPARTY", "LOCALFOLDER"]

[tool.ruff]
line-length = 88
target-version = "py311"
select = [
    "E",   # pycodestyle errors
    "W",   # pycodestyle warnings
    "F",   # pyflakes
    "I",   # isort
    "B",   # flake8-bugbear
    "C4",  # flake8-comprehensions
    "UP",  # pyupgrade
]
ignore = [
    "E501",  # line too long (black handles this)
]

[tool.mypy]
python_version = "3.11"
strict = true
warn_return_any = true
warn_unused_configs = true
ignore_missing_imports = true
```

### 8.2. pre-commit 設定

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/psf/black
    rev: 23.12.0
    hooks:
      - id: black

  - repo: https://github.com/pycqa/isort
    rev: 5.13.0
    hooks:
      - id: isort

  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.8
    hooks:
      - id: ruff

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.7.1
    hooks:
      - id: mypy
        additional_dependencies: [types-PyYAML]
```

---

## 9. コードレビューチェックリスト

### 9.1. 必須チェック項目

- [ ] 全ての関数・メソッドに型ヒントがある
- [ ] 全てのパブリック関数・クラスに docstring がある
- [ ] Black/isort でフォーマットされている
- [ ] Ruff でエラーがない
- [ ] mypy でエラーがない
- [ ] テストが追加されている
- [ ] テストが通る

### 9.2. 推奨チェック項目

- [ ] 命名規則に従っている
- [ ] 適切なエラーハンドリングがある
- [ ] ログ出力が適切
- [ ] コメントが「なぜ」を説明している
- [ ] 複雑な処理が分割されている

---

## 関連ドキュメント

- [開発環境構築](./getting-started.md)
- [テスト戦略](./testing.md)
- [アーキテクチャ](../design/architecture.md)
