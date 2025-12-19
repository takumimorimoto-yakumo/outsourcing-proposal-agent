# スクレイパー実装

## 概要

Playwright を使用した Web スクレイピング実装。

| 項目 | 値 |
|------|-----|
| **ブラウザエンジン** | Playwright (Chromium) |
| **言語** | Python 3.9+ |
| **対応サービス** | Lancers（実装済み） |

---

## ファイル構成

```
src/scrapers/
├── base.py         # 基底クラス
└── lancers.py      # Lancers スクレイパー
```

---

## クラス構成

### `BaseScraper`（基底クラス）

全スクレイパーの基底クラス。

**主要メソッド:**

| メソッド | 説明 |
|---------|------|
| `initialize()` | ブラウザ初期化 |
| `cleanup()` | ブラウザ終了 |
| `get_page()` | ページ取得 |
| `navigate()` | ページ遷移 |

---

### `LancersScraper`（Lancers スクレイパー）

Lancers の案件をスクレイピング。

**定数:**

```python
BASE_URL = "https://www.lancers.jp"

CATEGORY_SLUGS = {
    "system": "system",
    "web": "web",
    "writing": "writing",
    "design": "design",
    "multimedia": "multimedia",
    "business": "business",
    "translation": "translation",
}
```

---

## 主要メソッド

### `build_search_url()`

検索 URL を構築。

```python
def build_search_url(
    self,
    category: Optional[str] = None,
    job_types: Optional[list[str]] = None,
    open_only: bool = True,
    page: int = 1,
) -> str
```

**パラメータ:**

| パラメータ | 説明 |
|-----------|------|
| `category` | カテゴリ（system, web 等） |
| `job_types` | 案件形式のリスト（project, task, competition） |
| `open_only` | 公開中のみ（デフォルト: True） |
| `page` | ページ番号 |

**生成 URL 例:**
```
https://www.lancers.jp/work/search/system?open=1&type[]=project&type[]=task&page=2
```

---

### `scrape_list()`

一覧ページから案件を取得。

```python
async def scrape_list(
    self,
    url: str,
    max_items: int = 50
) -> list[JobInfo]
```

**処理フロー:**
1. URL に遷移
2. `.p-search-job-media` セレクタで案件カードを取得
3. 各カードから情報を抽出
4. `JobInfo` オブジェクトに変換
5. リストを返却

---

## CSS セレクタ

### 一覧ページ

| 要素 | セレクタ |
|------|---------|
| 案件カード | `.p-search-job-media` |
| タイトル | `.p-search-job-media__title` |
| 予算 | `.p-search-job-media__price` |
| 残り日数 | `.p-search-job-media__status-label--limit` |
| 提案数 | `.p-search-job-media__data-proposals` |
| タグ | `.p-search-job-media__item-tag` |
| 特徴タグ | `.p-search-job-media__item-features` |
| クライアント名 | `.p-search-job-media__client-name` |
| 評価 | `.p-search-job-media__client-rating` |
| 発注履歴 | `.p-search-job-media__client-history` |

---

## Job ID 抽出ロジック

案件 ID は複数の方法で抽出を試みる:

1. **onclick 属性から抽出**
   ```python
   onclick="location.href='/work/detail/5450323'"
   ```

2. **タイトルリンクの href から抽出**
   ```python
   href="/work/detail/5450323"
   ```

3. **詳細リンクの href から抽出**
   ```python
   href="/work/detail/5450323"
   ```

---

## データモデル

### `JobInfo`

```python
@dataclass
class JobInfo:
    title: str
    description: str
    category: Category
    budget_type: BudgetType

    job_id: Optional[str] = None
    job_type: JobType = JobType.UNKNOWN
    status: JobStatus = JobStatus.UNKNOWN
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    deadline: Optional[str] = None
    remaining_days: Optional[int] = None
    required_skills: list[str] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    feature_tags: list[str] = field(default_factory=list)
    proposal_count: Optional[int] = None
    recruitment_count: Optional[int] = None
    source: Source = Source.LANCERS
    url: str = ""
    client: Optional[ClientInfo] = None
    scraped_at: datetime = field(default_factory=datetime.now)
```

### `JobType`

```python
class JobType(str, Enum):
    PROJECT = "project"
    TASK = "task"
    COMPETITION = "competition"
    UNKNOWN = "unknown"
```

### `JobStatus`

```python
class JobStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    UNKNOWN = "unknown"
```

---

## 出力ファイル

### ファイル命名規則

```
output/{category}_jobs_{YYYYMMDD}_{HHMMSS}.json
```

### ファイル形式

```json
[
  {
    "title": "案件タイトル",
    "description": "",
    "category": "app_development",
    "budget_type": "fixed",
    "job_id": "5450323",
    "job_type": "project",
    "status": "open",
    "budget_min": 20000,
    "budget_max": 50000,
    "deadline": null,
    "remaining_days": 1,
    "required_skills": [],
    "tags": ["注目", "限定公開"],
    "feature_tags": ["経験者優遇", "継続依頼あり"],
    "proposal_count": 0,
    "recruitment_count": 2,
    "source": "lancers",
    "url": "https://www.lancers.jp/work/detail/5450323",
    "client": {
      "name": "クライアント名",
      "rating": 5.0,
      "review_count": null,
      "order_history": 2
    },
    "scraped_at": "2025-12-13T17:42:02.874369"
  }
]
```

---

## 使用例

```python
from src.scrapers.lancers import LancersScraper
from src.models.config import ScrapingConfig, HumanLikeConfig

# 設定
config = ScrapingConfig(
    headless=True,
    human_like=HumanLikeConfig(enabled=True, min_delay=1.0, max_delay=2.0),
)

# スクレイパー初期化
scraper = LancersScraper(config)

# URL 構築
url = scraper.build_search_url(
    category="system",
    job_types=["project", "task"],
    open_only=True,
    page=1
)

# スクレイピング実行
jobs = await scraper.scrape_list(url=url, max_items=50)
```

---

## リサーチドキュメント

詳細な CSS セレクタ情報は以下を参照:

- [docs/research/lancers/PAGE_STRUCTURE.md](../research/lancers/PAGE_STRUCTURE.md)
- [docs/research/lancers/README.md](../research/lancers/README.md)

---

**最終更新**: 2025-12-13
**バージョン**: 1.0.0
