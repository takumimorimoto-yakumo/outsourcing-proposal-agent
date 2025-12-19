# システムアーキテクチャ

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [システム構成図](#2-システム構成図)
3. [モジュール構成](#3-モジュール構成)
4. [ディレクトリ構造](#4-ディレクトリ構造)
5. [データフロー](#5-データフロー)
6. [依存関係](#6-依存関係)

---

## 1. 概要

### 1.1. アーキテクチャ方針

| 方針 | 説明 |
|------|------|
| モジュラー設計 | 各機能を独立したモジュールとして実装 |
| 依存性注入 | テスト容易性のため、外部依存を注入可能に |
| エラー耐性 | 部分的な失敗でも処理を継続可能 |
| 設定駆動 | YAMLファイルによる柔軟な設定 |

### 1.2. 主要コンポーネント

| コンポーネント | 役割 |
|---------------|------|
| CLI | ユーザーインターフェース |
| Scrapers | 案件情報の取得 |
| GitHub Client | GitHub情報の取得 |
| Generator | 提案文の生成 |
| Config | 設定の読み込み・管理 |

---

## 2. システム構成図

### 2.1. 全体構成

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLI                                    │
│                           (Typer)                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Orchestrator                              │
│                     (メイン処理フローの制御)                          │
└─────────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    Scrapers     │  │  GitHub Client  │  │   Generator     │
│  (Playwright)   │  │    (httpx)      │  │  (Gemini API)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   ランサーズ     │  │   GitHub API    │  │   Gemini API    │
│ クラウドワークス  │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 2.2. データの流れ

```
[入力]                    [処理]                      [出力]

案件URL ─────────────▶ スクレイピング ─────▶ JobInfo
                              │                  │
                              │                  ▼
設定ファイル ──────────▶ 設定読み込み ─────▶ Config ─────┐
                              │                         │
                              │                         ▼
GitHubユーザー名 ─────▶ GitHub API ────────▶ GitHubData ─┤
                              │                         │
                              │                         ▼
                              │              ┌──────────────┐
                              └─────────────▶│  Generator   │
                                             │ (Gemini API) │
                                             └──────────────┘
                                                     │
                                                     ▼
                                              提案文テキスト
```

---

## 3. モジュール構成

### 3.1. モジュール一覧

| モジュール | 責務 | 依存 |
|-----------|------|------|
| `main` | CLIエントリーポイント | orchestrator |
| `orchestrator` | 処理フロー制御 | scrapers, github, generator, config |
| `scrapers` | スクレイピング | playwright |
| `github` | GitHub API連携 | httpx |
| `generator` | 提案文生成 | google-generativeai |
| `config` | 設定管理 | pyyaml |
| `models` | データモデル | dataclasses |
| `utils` | ユーティリティ | - |

### 3.2. モジュール間の依存関係

```
main
 └── orchestrator
      ├── scrapers
      │    ├── base (抽象クラス)
      │    ├── lancers
      │    └── crowdworks
      ├── github
      │    └── client
      ├── generator
      │    └── proposal
      ├── config
      │    └── loader
      └── models
           ├── job
           ├── github
           └── proposal
```

### 3.3. インターフェース定義

#### Scraper（基底クラス）

```python
from abc import ABC, abstractmethod
from models.job import JobInfo

class BaseScraper(ABC):
    """スクレイパーの基底クラス"""

    @abstractmethod
    async def scrape(self, url: str) -> JobInfo:
        """案件情報を取得"""
        pass

    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """このURLを処理できるか判定"""
        pass
```

#### Generator

```python
from models.job import JobInfo
from models.github import GitHubData
from config.loader import ProfileConfig

class ProposalGenerator:
    """提案文生成器"""

    async def generate(
        self,
        job_info: JobInfo,
        github_data: GitHubData | None,
        profile: ProfileConfig,
    ) -> str:
        """提案文を生成"""
        pass
```

---

## 4. ディレクトリ構造

### 4.1. プロジェクトルート

```
proposal-generator/
├── docs/                    # ドキュメント
│   ├── README.md
│   ├── 00-quick-reference.md
│   ├── requirements/
│   ├── design/
│   └── specs/
│
├── src/                     # ソースコード
│   ├── __init__.py
│   ├── main.py              # CLIエントリーポイント
│   ├── orchestrator.py      # メイン処理フロー
│   │
│   ├── scrapers/            # スクレイピング
│   │   ├── __init__.py
│   │   ├── base.py          # 基底クラス
│   │   ├── lancers.py       # ランサーズ用
│   │   └── crowdworks.py    # クラウドワークス用
│   │
│   ├── github/              # GitHub連携
│   │   ├── __init__.py
│   │   └── client.py        # APIクライアント
│   │
│   ├── generator/           # 提案文生成
│   │   ├── __init__.py
│   │   ├── proposal.py      # 生成ロジック
│   │   └── prompts.py       # プロンプトテンプレート
│   │
│   ├── config/              # 設定管理
│   │   ├── __init__.py
│   │   └── loader.py        # 設定読み込み
│   │
│   ├── models/              # データモデル
│   │   ├── __init__.py
│   │   ├── job.py           # 案件情報
│   │   ├── github.py        # GitHub情報
│   │   └── proposal.py      # 提案文
│   │
│   └── utils/               # ユーティリティ
│       ├── __init__.py
│       ├── logger.py        # ロギング
│       └── validators.py    # バリデーション
│
├── config/                  # デフォルト設定ファイル
│   ├── settings.yaml.example
│   └── profile.yaml.example
│
├── tests/                   # テスト
│   ├── __init__.py
│   ├── test_scrapers/
│   ├── test_github/
│   ├── test_generator/
│   └── fixtures/
│
├── pyproject.toml           # プロジェクト設定
├── .env.example             # 環境変数サンプル
├── .gitignore
└── README.md                # プロジェクトREADME
```

### 4.2. 各ディレクトリの責務

| ディレクトリ | 責務 | 変更頻度 |
|-------------|------|---------|
| `docs/` | ドキュメント | 中 |
| `src/` | ソースコード | 高 |
| `src/scrapers/` | サービス別スクレイピング | 中（サイト変更時） |
| `src/github/` | GitHub API連携 | 低 |
| `src/generator/` | 提案文生成 | 中（品質改善時） |
| `src/config/` | 設定管理 | 低 |
| `src/models/` | データモデル | 低 |
| `src/utils/` | 共通ユーティリティ | 低 |
| `config/` | 設定ファイルサンプル | 低 |
| `tests/` | テストコード | 高 |

---

## 5. データフロー

### 5.1. 正常系フロー

```
1. CLI起動
   │
   ├─ 引数パース（URL、オプション）
   │
   ├─ 設定読み込み
   │   ├─ settings.yaml
   │   └─ profile.yaml
   │
   ▼
2. URL判定
   │
   ├─ ドメインからサービス特定
   │
   ▼
3. 案件情報取得（並列可能）
   │
   ├─ スクレイピング実行
   │   ├─ ページ読み込み
   │   ├─ 要素抽出
   │   └─ データ構造化
   │
   ▼
4. GitHub情報取得（並列可能）
   │
   ├─ ユーザー情報取得
   ├─ リポジトリ一覧取得
   ├─ 言語統計集計
   └─ 関連リポジトリ抽出
   │
   ▼
5. 提案文生成
   │
   ├─ プロンプト組み立て
   ├─ Gemini API呼び出し
   ├─ 品質チェック
   └─ 文字数調整
   │
   ▼
6. 出力
   │
   ├─ 標準出力 / ファイル / クリップボード
   │
   ▼
7. 終了
```

### 5.2. エラー系フロー

```
スクレイピング失敗
   │
   ├─ リトライ（最大3回）
   │
   ├─ 成功 → 正常フローへ
   │
   └─ 失敗 → エラー終了


GitHub情報取得失敗
   │
   ├─ 警告ログ出力
   │
   └─ GitHub情報なしで続行 → 提案文生成へ


Gemini API失敗
   │
   ├─ リトライ（最大3回、指数バックオフ）
   │
   ├─ 成功 → 正常フローへ
   │
   └─ 失敗 → エラー終了
```

---

## 6. 依存関係

### 6.1. 外部ライブラリ

| ライブラリ | バージョン | 用途 |
|-----------|-----------|------|
| `playwright` | ^1.40 | ブラウザ自動操作 |
| `google-generativeai` | ^0.3 | Gemini API |
| `httpx` | ^0.25 | HTTP通信（GitHub API） |
| `typer` | ^0.9 | CLI構築 |
| `pyyaml` | ^6.0 | YAML読み込み |
| `python-dotenv` | ^1.0 | 環境変数読み込み |
| `pyperclip` | ^1.8 | クリップボード操作 |
| `rich` | ^13.0 | リッチテキスト出力 |

### 6.2. 開発依存

| ライブラリ | 用途 |
|-----------|------|
| `pytest` | テスト |
| `pytest-asyncio` | 非同期テスト |
| `black` | フォーマッター |
| `isort` | import整理 |
| `ruff` | リンター |
| `mypy` | 型チェック |

### 6.3. pyproject.toml（抜粋）

```toml
[project]
name = "proposal-generator"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "playwright>=1.40",
    "google-generativeai>=0.3",
    "httpx>=0.25",
    "typer>=0.9",
    "pyyaml>=6.0",
    "python-dotenv>=1.0",
    "pyperclip>=1.8",
    "rich>=13.0",
]

[project.scripts]
proposal-gen = "src.main:app"

[project.optional-dependencies]
dev = [
    "pytest>=7.4",
    "pytest-asyncio>=0.21",
    "black>=23.0",
    "isort>=5.12",
    "ruff>=0.1",
    "mypy>=1.5",
]
```

---

## 関連ドキュメント

- [クイックリファレンス](../00-quick-reference.md)
- [機能要件](../requirements/functional.md)
- [非機能要件](../requirements/non-functional.md)
