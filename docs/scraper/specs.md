# スクレイピング仕様

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [共通仕様](#2-共通仕様)
3. [ランサーズ仕様](#3-ランサーズ仕様)
4. [クラウドワークス仕様](#4-クラウドワークス仕様)
5. [人間らしい振る舞い](#5-人間らしい振る舞い)
6. [エラーハンドリング](#6-エラーハンドリング)
7. [データモデル](#7-データモデル)

---

## 1. 概要

### 1.1. 目的

案件ページから必要な情報を取得し、構造化データとして返却する。

### 1.2. 使用技術

| 技術 | 用途 |
|------|------|
| Playwright | ブラウザ自動操作、JavaScript実行後のDOM取得 |
| BeautifulSoup | HTML解析（補助） |

### 1.3. 対応サービス

| サービス | 対応状況 | URL判定パターン |
|----------|---------|----------------|
| ランサーズ | 対応予定 | `lancers.jp` を含む |
| クラウドワークス | 対応予定 | `crowdworks.jp` を含む |

---

## 2. 共通仕様

### 2.1. 取得項目

| 項目 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `title` | string | Yes | 案件タイトル |
| `description` | string | Yes | 案件詳細説明 |
| `budget_min` | int | No | 予算下限（円） |
| `budget_max` | int | No | 予算上限（円） |
| `budget_type` | string | Yes | 予算タイプ（fixed/hourly） |
| `deadline` | string | No | 納期・期限 |
| `required_skills` | list[string] | No | 必要スキル |
| `category` | string | Yes | 案件カテゴリ |
| `client_name` | string | No | クライアント名 |
| `client_rating` | float | No | クライアント評価 |
| `client_history` | int | No | 発注実績数 |

### 2.2. カテゴリ分類

| カテゴリID | カテゴリ名 | キーワード例 |
|-----------|-----------|-------------|
| `web_development` | Web開発 | Web, ホームページ, サイト, WordPress, PHP, JavaScript |
| `app_development` | アプリ開発 | アプリ, iOS, Android, Flutter, React Native |
| `scraping` | スクレイピング | スクレイピング, データ収集, クローリング |
| `automation` | 自動化 | 自動化, RPA, 効率化, ツール |
| `data_analysis` | データ分析 | 分析, データ, 統計, Python, pandas |
| `ai_ml` | AI・機械学習 | AI, 機械学習, 深層学習, ChatGPT |
| `other` | その他 | 上記に該当しない |

### 2.3. ブラウザ設定

```python
browser_options = {
    "headless": True,  # ヘッドレスモード
    "args": [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
    ]
}

context_options = {
    "viewport": {"width": 1920, "height": 1080},
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
    "locale": "ja-JP",
    "timezone_id": "Asia/Tokyo",
}
```

---

## 3. ランサーズ仕様

### 3.1. URL形式

```
https://www.lancers.jp/work/detail/{job_id}
```

### 3.2. 取得対象セレクタ

| 項目 | セレクタ（参考） | 備考 |
|------|----------------|------|
| タイトル | `.c-heading__title` | 要確認 |
| 詳細説明 | `.p-job-detail__description` | 要確認 |
| 予算 | `.c-job-info__price` | パース必要 |
| 納期 | `.c-job-info__deadline` | 要確認 |
| スキル | `.c-tag-list__item` | 複数 |
| カテゴリ | `.c-breadcrumb__item` | パンくず |
| クライアント名 | `.c-client__name` | 要確認 |
| クライアント評価 | `.c-rating__score` | 要確認 |

※ セレクタは実際のサイト構造に応じて調整が必要

### 3.3. 予算パース

```python
# 例: "50,000円 〜 100,000円"
def parse_budget(text: str) -> tuple[int | None, int | None]:
    # カンマ除去、数値抽出
    # "〜" で分割して min/max 取得
    pass
```

### 3.4. カテゴリパース

パンくずリストからカテゴリを抽出し、`2.2. カテゴリ分類` に基づいて分類する。

---

## 4. クラウドワークス仕様

### 4.1. URL形式

```
https://crowdworks.jp/public/jobs/{job_id}
```

### 4.2. 取得対象セレクタ

| 項目 | セレクタ（参考） | 備考 |
|------|----------------|------|
| タイトル | `.job-title` | 要確認 |
| 詳細説明 | `.job-detail-description` | 要確認 |
| 予算 | `.job-info-budget` | パース必要 |
| 納期 | `.job-info-deadline` | 要確認 |
| スキル | `.job-skill-tag` | 複数 |
| カテゴリ | `.breadcrumb-item` | パンくず |
| クライアント名 | `.client-name` | 要確認 |
| クライアント評価 | `.client-rating` | 要確認 |

※ セレクタは実際のサイト構造に応じて調整が必要

### 4.3. 予算パース

ランサーズと同様の処理。フォーマットの違いに対応。

---

## 5. 人間らしい振る舞い

### 5.1. 目的

- スクレイピング検知の回避
- サーバー負荷の軽減
- 利用規約への配慮

### 5.2. 実装項目

| 項目 | 実装内容 | 値 |
|------|---------|-----|
| 初期待機 | ページ読み込み後の待機 | 2〜4秒（ランダム） |
| スクロール | 自然なスクロール動作 | 300〜500px/回 |
| スクロール間隔 | スクロール間の待機 | 0.5〜1.5秒（ランダム） |
| マウス移動 | ランダムなマウス移動 | 要素クリック前 |
| リクエスト間隔 | 連続リクエスト時の間隔 | 最低5秒 |

### 5.3. 実装例

```python
import random
import asyncio

async def human_like_delay(min_sec: float = 1.0, max_sec: float = 3.0):
    """人間らしいランダムな待機"""
    delay = random.uniform(min_sec, max_sec)
    await asyncio.sleep(delay)

async def human_like_scroll(page):
    """人間らしいスクロール"""
    viewport_height = await page.evaluate("window.innerHeight")
    scroll_height = await page.evaluate("document.body.scrollHeight")

    current_position = 0
    while current_position < scroll_height:
        scroll_amount = random.randint(300, 500)
        current_position += scroll_amount
        await page.evaluate(f"window.scrollTo(0, {current_position})")
        await human_like_delay(0.5, 1.5)
```

### 5.4. User-Agent ローテーション

```python
USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ...",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 ...",
]

def get_random_user_agent() -> str:
    return random.choice(USER_AGENTS)
```

---

## 6. エラーハンドリング

### 6.1. エラー種別

| エラー | 原因 | 対応 |
|--------|------|------|
| `PageNotFoundError` | 404 | エラーメッセージ表示、終了 |
| `ElementNotFoundError` | セレクタ不一致 | リトライ、失敗なら終了 |
| `TimeoutError` | ページ読み込みタイムアウト | リトライ |
| `AccessDeniedError` | アクセス拒否（403） | エラーメッセージ表示、終了 |
| `LoginRequiredError` | ログイン必要 | エラーメッセージ表示、終了 |

### 6.2. リトライ設定

```python
RETRY_CONFIG = {
    "max_retries": 3,
    "retry_delay": 5,  # 秒
    "backoff_factor": 2,  # 指数バックオフ
}
```

### 6.3. タイムアウト設定

```python
TIMEOUT_CONFIG = {
    "page_load": 30000,  # ms
    "element_wait": 10000,  # ms
}
```

---

## 7. データモデル

### 7.1. JobInfo（案件情報）

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class JobInfo:
    """案件情報"""
    title: str
    description: str
    budget_min: Optional[int]
    budget_max: Optional[int]
    budget_type: str  # "fixed" | "hourly"
    deadline: Optional[str]
    required_skills: list[str]
    category: str
    source: str  # "lancers" | "crowdworks"
    url: str
    client_name: Optional[str] = None
    client_rating: Optional[float] = None
    client_history: Optional[int] = None
```

### 7.2. JSON出力例

```json
{
  "title": "ECサイトのフロントエンド開発",
  "description": "React + TypeScriptでECサイトのフロントエンドを開発してください...",
  "budget_min": 300000,
  "budget_max": 500000,
  "budget_type": "fixed",
  "deadline": "2025-01-31",
  "required_skills": ["React", "TypeScript", "Next.js"],
  "category": "web_development",
  "source": "lancers",
  "url": "https://www.lancers.jp/work/detail/12345",
  "client_name": "株式会社〇〇",
  "client_rating": 4.8,
  "client_history": 45
}
```

---

## 関連ドキュメント

- [機能要件](../requirements/functional.md)
- [非機能要件](../requirements/non-functional.md)
- [提案文生成仕様](./generation.md)
