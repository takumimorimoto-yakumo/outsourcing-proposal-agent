# データモデル一覧

**最終更新**: 2025-12-19
**バージョン**: 1.1

---

## 目次

1. [概要](#1-概要)
2. [案件情報モデル](#2-案件情報モデル)
3. [GitHub情報モデル](#3-github情報モデル)
4. [設定モデル](#4-設定モデル)
5. [生成モデル](#5-生成モデル)
6. [エラーモデル](#6-エラーモデル)
7. [フロントエンドモデル](#7-フロントエンドモデル)
8. [モデル間の関係](#8-モデル間の関係)

---

## 1. 概要

### 1.1. 設計方針

| 方針 | 説明 |
|------|------|
| dataclass使用 | 型安全性とイミュータビリティ |
| Optional活用 | 欠損データの明示的な表現 |
| Enum活用 | 列挙型による値の制限 |
| 変換メソッド | to_dict / from_dict を実装 |

### 1.2. 共通インポート

```python
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime
from enum import Enum, auto
```

### 1.3. モジュール構成

```
src/models/
├── __init__.py
├── job.py          # 案件情報モデル
├── github.py       # GitHub情報モデル
├── config.py       # 設定モデル
├── generation.py   # 生成関連モデル
└── errors.py       # エラーモデル
```

---

## 2. 案件情報モデル

### 2.1. Service（列挙型）

```python
class Service(str, Enum):
    """対応サービス"""
    LANCERS = "lancers"
    CROWDWORKS = "crowdworks"
```

### 2.2. BudgetType（列挙型）

```python
class BudgetType(str, Enum):
    """予算タイプ"""
    FIXED = "fixed"      # 固定報酬
    HOURLY = "hourly"    # 時給
    UNKNOWN = "unknown"  # 不明
```

### 2.3. JobCategory（列挙型）

```python
class JobCategory(str, Enum):
    """案件カテゴリ"""
    WEB_DEVELOPMENT = "web_development"
    APP_DEVELOPMENT = "app_development"
    SCRAPING = "scraping"
    AUTOMATION = "automation"
    DATA_ANALYSIS = "data_analysis"
    AI_ML = "ai_ml"
    OTHER = "other"
```

### 2.4. ClientInfo

```python
@dataclass(frozen=True)
class ClientInfo:
    """クライアント情報"""
    name: Optional[str] = None
    rating: Optional[float] = None      # 0.0 - 5.0
    review_count: Optional[int] = None
    order_history: Optional[int] = None  # 発注実績数

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "rating": self.rating,
            "review_count": self.review_count,
            "order_history": self.order_history,
        }
```

### 2.5. JobInfo

```python
@dataclass(frozen=True)
class JobInfo:
    """案件情報"""
    # 必須項目
    title: str
    description: str
    category: JobCategory
    budget_type: BudgetType
    source: Service
    url: str

    # オプション項目
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    deadline: Optional[str] = None
    required_skills: list[str] = field(default_factory=list)
    client: Optional[ClientInfo] = None
    scraped_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "title": self.title,
            "description": self.description,
            "category": self.category.value,
            "budget_type": self.budget_type.value,
            "budget_min": self.budget_min,
            "budget_max": self.budget_max,
            "deadline": self.deadline,
            "required_skills": self.required_skills,
            "source": self.source.value,
            "url": self.url,
            "client": self.client.to_dict() if self.client else None,
            "scraped_at": self.scraped_at.isoformat(),
        }

    @classmethod
    def from_dict(cls, data: dict) -> "JobInfo":
        return cls(
            title=data["title"],
            description=data["description"],
            category=JobCategory(data["category"]),
            budget_type=BudgetType(data["budget_type"]),
            budget_min=data.get("budget_min"),
            budget_max=data.get("budget_max"),
            deadline=data.get("deadline"),
            required_skills=data.get("required_skills", []),
            source=Service(data["source"]),
            url=data["url"],
            client=ClientInfo(**data["client"]) if data.get("client") else None,
            scraped_at=datetime.fromisoformat(data["scraped_at"]) if data.get("scraped_at") else datetime.now(),
        )

    @property
    def budget_display(self) -> str:
        """予算の表示用文字列"""
        if self.budget_min and self.budget_max:
            return f"{self.budget_min:,}円 〜 {self.budget_max:,}円"
        elif self.budget_max:
            return f"〜 {self.budget_max:,}円"
        elif self.budget_min:
            return f"{self.budget_min:,}円 〜"
        else:
            return "要相談"
```

---

## 3. GitHub情報モデル

### 3.1. GitHubProfile

```python
@dataclass(frozen=True)
class GitHubProfile:
    """GitHubユーザー情報"""
    username: str
    name: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    public_repos: int = 0
    followers: int = 0
    created_at: Optional[datetime] = None

    def to_dict(self) -> dict:
        return {
            "username": self.username,
            "name": self.name,
            "bio": self.bio,
            "company": self.company,
            "location": self.location,
            "public_repos": self.public_repos,
            "followers": self.followers,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @property
    def experience_years(self) -> Optional[int]:
        """GitHub歴（年）"""
        if self.created_at:
            return (datetime.now() - self.created_at).days // 365
        return None
```

### 3.2. RepoInfo

```python
@dataclass(frozen=True)
class RepoInfo:
    """リポジトリ情報"""
    name: str
    url: str
    description: Optional[str] = None
    language: Optional[str] = None
    stars: int = 0
    forks: int = 0
    updated_at: Optional[datetime] = None
    topics: list[str] = field(default_factory=list)
    is_fork: bool = False

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "url": self.url,
            "description": self.description,
            "language": self.language,
            "stars": self.stars,
            "forks": self.forks,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "topics": self.topics,
            "is_fork": self.is_fork,
        }

    @property
    def stars_display(self) -> str:
        """スター数の表示用文字列"""
        if self.stars >= 1000:
            return f"★{self.stars / 1000:.1f}k"
        elif self.stars > 0:
            return f"★{self.stars}"
        return ""
```

### 3.3. LanguageStats

```python
@dataclass(frozen=True)
class LanguageStats:
    """言語統計"""
    language: str
    bytes: int
    percentage: float  # 0.0 - 100.0

    def to_dict(self) -> dict:
        return {
            "language": self.language,
            "bytes": self.bytes,
            "percentage": round(self.percentage, 2),
        }
```

### 3.4. GitHubData

```python
@dataclass(frozen=True)
class GitHubData:
    """GitHub情報（集約）"""
    profile: GitHubProfile
    repos: list[RepoInfo] = field(default_factory=list)
    language_stats: list[LanguageStats] = field(default_factory=list)
    matched_repos: list[RepoInfo] = field(default_factory=list)
    fetched_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "profile": self.profile.to_dict(),
            "repos": [r.to_dict() for r in self.repos],
            "language_stats": [l.to_dict() for l in self.language_stats],
            "matched_repos": [r.to_dict() for r in self.matched_repos],
            "fetched_at": self.fetched_at.isoformat(),
        }

    @property
    def top_languages(self) -> list[str]:
        """上位言語リスト"""
        return [ls.language for ls in sorted(
            self.language_stats,
            key=lambda x: x.percentage,
            reverse=True
        )[:5]]
```

---

## 4. 設定モデル

### 4.1. GeminiConfig

```python
@dataclass
class GeminiConfig:
    """Gemini API設定"""
    model: str = "gemini-pro"
    temperature: float = 0.7
    top_p: float = 0.9
    max_output_tokens: int = 2048

    def validate(self) -> list[str]:
        """バリデーション（エラーメッセージのリストを返す）"""
        errors = []
        if not 0.0 <= self.temperature <= 1.0:
            errors.append(f"temperature must be 0.0-1.0 (got {self.temperature})")
        if not 0.0 <= self.top_p <= 1.0:
            errors.append(f"top_p must be 0.0-1.0 (got {self.top_p})")
        return errors
```

### 4.2. ScrapingConfig

```python
@dataclass
class HumanLikeConfig:
    """人間らしい振る舞い設定"""
    enabled: bool = True
    min_delay: float = 2.0
    max_delay: float = 4.0

@dataclass
class TimeoutConfig:
    """タイムアウト設定"""
    page_load: int = 30000  # ms
    element_wait: int = 10000  # ms

@dataclass
class RetryConfig:
    """リトライ設定"""
    max_attempts: int = 3
    delay: int = 5  # seconds

@dataclass
class ScrapingConfig:
    """スクレイピング設定"""
    headless: bool = True
    human_like: HumanLikeConfig = field(default_factory=HumanLikeConfig)
    timeout: TimeoutConfig = field(default_factory=TimeoutConfig)
    retry: RetryConfig = field(default_factory=RetryConfig)
```

### 4.3. IntroductionConfig / ClosingConfig

```python
@dataclass
class IntroductionConfig:
    """挨拶・自己紹介設定"""
    greeting: str = ""
    self_intro: str = ""

@dataclass
class ScheduleConfig:
    """スケジュール設定"""
    availability: str = ""
    working_hours: str = ""

@dataclass
class ClosingConfig:
    """締めの挨拶設定"""
    contact: str = ""
    farewell: str = ""
```

### 4.4. ProfileConfig

```python
@dataclass
class ProfileConfig:
    """プロフィール設定"""
    name: str
    introduction: IntroductionConfig
    schedule: ScheduleConfig
    closing: ClosingConfig
```

### 4.5. CategoryTemplate

```python
@dataclass
class CategoryTemplate:
    """カテゴリ別テンプレート"""
    category: JobCategory
    strength: str = ""
    approach_hints: list[str] = field(default_factory=list)
```

### 4.6. AppConfig

```python
@dataclass
class AppConfig:
    """アプリケーション設定（全体）"""
    version: str
    github_username: str
    gemini: GeminiConfig
    scraping: ScrapingConfig
    profiles: dict[str, ProfileConfig]
    category_templates: dict[JobCategory, CategoryTemplate]
    default_profile: str = "default"

    def get_profile(self, name: Optional[str] = None) -> ProfileConfig:
        """プロフィールを取得"""
        profile_name = name or self.default_profile
        if profile_name not in self.profiles:
            raise ConfigError(f"Profile not found: {profile_name}")
        return self.profiles[profile_name]

    def get_category_template(self, category: JobCategory) -> CategoryTemplate:
        """カテゴリテンプレートを取得"""
        return self.category_templates.get(
            category,
            self.category_templates.get(JobCategory.OTHER)
        )
```

---

## 5. 生成モデル

### 5.1. GenerationInput

```python
@dataclass(frozen=True)
class GenerationInput:
    """提案文生成の入力"""
    job_info: JobInfo
    github_data: Optional[GitHubData]
    profile: ProfileConfig
    category_template: CategoryTemplate
```

### 5.2. ProposalMetadata

```python
@dataclass(frozen=True)
class ProposalMetadata:
    """提案文のメタデータ"""
    character_count: int
    category: JobCategory
    matched_skills: list[str]
    used_repos: list[str]
    generation_time: float  # seconds
    model: str
    temperature: float
    retry_count: int = 0

    def to_dict(self) -> dict:
        return {
            "character_count": self.character_count,
            "category": self.category.value,
            "matched_skills": self.matched_skills,
            "used_repos": self.used_repos,
            "generation_time": round(self.generation_time, 2),
            "model": self.model,
            "temperature": self.temperature,
            "retry_count": self.retry_count,
        }
```

### 5.3. GenerationOutput

```python
@dataclass(frozen=True)
class GenerationOutput:
    """提案文生成の出力"""
    proposal: str
    metadata: ProposalMetadata

    def to_dict(self) -> dict:
        return {
            "proposal": self.proposal,
            "metadata": self.metadata.to_dict(),
        }

    def to_json(self, indent: int = 2) -> str:
        """JSON文字列に変換"""
        import json
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)
```

### 5.4. QualityCheckResult

```python
@dataclass
class QualityCheckResult:
    """品質チェック結果"""
    passed: bool
    character_count: int
    issues: list[str] = field(default_factory=list)

    @property
    def needs_regeneration(self) -> bool:
        """再生成が必要か"""
        return not self.passed and len(self.issues) > 0
```

---

## 6. エラーモデル

### 6.1. エラー列挙型

```python
class ErrorCode(IntEnum):
    """エラーコード"""
    GENERAL_ERROR = 1
    INVALID_ARGUMENT = 2
    CONFIG_ERROR = 3
    NETWORK_ERROR = 4
    SCRAPING_ERROR = 5
    API_ERROR = 6
    AUTH_ERROR = 7
```

### 6.2. 基底例外クラス

```python
class ProposalGenError(Exception):
    """アプリケーション基底例外"""
    code: ErrorCode = ErrorCode.GENERAL_ERROR

    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}
```

### 6.3. 具体的な例外クラス

```python
class InvalidURLError(ProposalGenError):
    """無効なURLエラー"""
    code = ErrorCode.INVALID_ARGUMENT

class ConfigError(ProposalGenError):
    """設定ファイルエラー"""
    code = ErrorCode.CONFIG_ERROR

class ScrapingError(ProposalGenError):
    """スクレイピングエラー"""
    code = ErrorCode.SCRAPING_ERROR

class PageNotFoundError(ScrapingError):
    """ページが見つからない"""
    pass

class ElementNotFoundError(ScrapingError):
    """要素が見つからない"""
    pass

class LoginRequiredError(ScrapingError):
    """ログインが必要"""
    pass

class GitHubAPIError(ProposalGenError):
    """GitHub APIエラー"""
    code = ErrorCode.API_ERROR

class GeminiAPIError(ProposalGenError):
    """Gemini APIエラー"""
    code = ErrorCode.API_ERROR

class AuthenticationError(ProposalGenError):
    """認証エラー"""
    code = ErrorCode.AUTH_ERROR
```

---

## 7. フロントエンドモデル

フロントエンド（TypeScript）で使用するモデル。

### 7.1. UserProfile

ユーザーのプロフィール情報。提案文生成時のパーソナライズに使用。

```typescript
interface UserProfile {
  // 基本情報
  name: string;
  bio: string;

  // スキル・得意分野
  skills: string[];           // 技術スキル（タグ）
  specialties: string[];      // 得意分野（タグ）
  skills_detail: string;      // スキル・経験の詳細（自由記述）

  // 希望条件
  preferred_categories: string[];        // 希望カテゴリ
  preferred_categories_detail: string;   // カテゴリ詳細（自由記述）

  // ソーシャル・ポートフォリオ
  website_url: string;
  github_url: string;
  twitter_url: string;
  portfolio_urls: string[];
}
```

**スキル候補（SKILL_SUGGESTIONS）:**
- Python, JavaScript, TypeScript, React, Next.js, Vue.js, Node.js
- Go, Rust, Java, PHP, Ruby
- AWS, GCP, Azure, Docker, Kubernetes
- MySQL, PostgreSQL, MongoDB, Redis, GraphQL, REST API
- 機械学習, データ分析, Webスクレイピング, 自動化, CI/CD, テスト自動化

**得意分野候補（SPECIALTY_SUGGESTIONS）:**
- Webアプリケーション開発, モバイルアプリ開発, API開発
- データベース設計, インフラ構築, DevOps
- データ収集・スクレイピング, 業務自動化
- データ分析・可視化, 機械学習・AI
- ECサイト構築, LP制作, WordPress, SEO対策

### 7.2. JobPriorityScore

案件の優先度スコア。AIによる分析結果。

```typescript
interface JobPriorityScore {
  job_id: string;
  score: number;           // 0-100
  match_reasons: string[]; // マッチ理由
  concerns: string[];      // 懸念点
  analyzed_at: string;     // ISO8601
}
```

---

## 8. モデル間の関係

### 8.1. ER図

```
┌─────────────────┐
│   AppConfig     │
├─────────────────┤
│ profiles        │──┐
│ category_       │  │    ┌─────────────────┐
│   templates     │──┼───▶│ ProfileConfig   │
│ gemini          │  │    └─────────────────┘
│ scraping        │  │    ┌─────────────────┐
└─────────────────┘  └───▶│CategoryTemplate │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│    JobInfo      │       │   GitHubData    │
├─────────────────┤       ├─────────────────┤
│ title           │       │ profile         │───▶ GitHubProfile
│ description     │       │ repos           │───▶ RepoInfo[]
│ category        │       │ language_stats  │───▶ LanguageStats[]
│ client          │───▶   │ matched_repos   │───▶ RepoInfo[]
└─────────────────┘       └─────────────────┘
        │                         │
        ▼                         ▼
┌─────────────────────────────────────────┐
│            GenerationInput              │
├─────────────────────────────────────────┤
│ job_info: JobInfo                       │
│ github_data: GitHubData?                │
│ profile: ProfileConfig                  │
│ category_template: CategoryTemplate     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│            GenerationOutput             │
├─────────────────────────────────────────┤
│ proposal: str                           │
│ metadata: ProposalMetadata              │
└─────────────────────────────────────────┘
```

### 8.2. データ変換フロー

```
[Scraping]                [GitHub API]
    │                          │
    ▼                          ▼
Raw HTML              Raw JSON Response
    │                          │
    ▼                          ▼
JobInfo               GitHubData
    │                          │
    └──────────┬───────────────┘
               ▼
        GenerationInput
               │
               ▼ (Gemini API)
        GenerationOutput
               │
               ▼
         提案文テキスト
```

---

## 関連ドキュメント

- [スクレイピング仕様](./scraping.md)
- [GitHub連携仕様](./github.md)
- [提案文生成仕様](./generation.md)
- [設定仕様](./config.md)
