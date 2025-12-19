# 提案文自動作成システム ドキュメント

このディレクトリには、提案文自動作成システムの全ての要件定義書、設計書、仕様書が格納されています。

---

## ドキュメント構成

```
docs/
├── README.md                        # このファイル（ナビゲーション）
├── 00-quick-reference.md            # クイックリファレンス（最初に読むべき）
│
├── common/                          # 共通・横断的
│   ├── requirements/                # 要件定義
│   │   ├── functional.md            # 機能要件
│   │   └── non-functional.md        # 非機能要件
│   ├── architecture/                # システム設計
│   │   └── overview.md              # システムアーキテクチャ
│   ├── specs/                       # 共通仕様
│   │   ├── cli.md                   # CLI仕様
│   │   ├── config.md                # 設定仕様
│   │   ├── data-models.md           # データモデル
│   │   └── github.md                # GitHub連携仕様
│   └── design-system.md             # UIデザインシステム
│
├── scraper/                         # スクレイパー
│   ├── specs.md                     # スクレイピング仕様
│   ├── implementation.md            # 実装詳細
│   └── research/                    # リサーチ
│       └── lancers/                 # Lancers調査
│
├── frontend/                        # フロントエンド
│   ├── specs.md                     # フロントエンド仕様
│   └── implementation.md            # 実装詳細
│
├── api/                             # API
│   ├── specs.md                     # API仕様
│   └── implementation.md            # 実装詳細
│
├── generator/                       # 提案文生成
│   ├── specs.md                     # 生成仕様
│   └── prompts.md                   # プロンプト設計
│
├── dev/                             # 開発者向け
│   ├── getting-started.md           # 開発環境構築
│   ├── coding-standards.md          # コーディング規約
│   └── testing.md                   # テスト戦略
│
├── guides/                          # 利用者向けガイド
│   ├── installation.md              # インストール手順
│   ├── troubleshooting.md           # トラブルシューティング
│   └── faq.md                       # FAQ
│
├── maintenance/                     # 保守・拡張
│   ├── extension.md                 # 拡張ガイド
│   └── changelog.md                 # 変更履歴
│
└── legal/                           # 法務・コンプライアンス
    ├── terms-of-use.md              # 利用規約・免責事項
    └── scraping-policy.md           # スクレイピングポリシー
```

---

## 読む順番（推奨）

### 初めて読む場合

1. **[00-quick-reference.md](./00-quick-reference.md)** ← **必ずここから開始**
2. **[common/requirements/functional.md](./common/requirements/functional.md)** - 機能要件
3. **[common/architecture/overview.md](./common/architecture/overview.md)** - システム構成

### コンポーネント別

| コンポーネント | 仕様 | 実装 |
|--------------|------|------|
| スクレイパー | [scraper/specs.md](./scraper/specs.md) | [scraper/implementation.md](./scraper/implementation.md) |
| フロントエンド | [frontend/specs.md](./frontend/specs.md) | [frontend/implementation.md](./frontend/implementation.md) |
| API | [api/specs.md](./api/specs.md) | [api/implementation.md](./api/implementation.md) |
| 提案文生成 | [generator/specs.md](./generator/specs.md) | [generator/prompts.md](./generator/prompts.md) |

### 利用者向け

1. **[guides/installation.md](./guides/installation.md)** - インストール手順
2. **[common/specs/cli.md](./common/specs/cli.md)** - コマンドの使い方
3. **[guides/troubleshooting.md](./guides/troubleshooting.md)** - 問題が発生した場合

### 開発者向け

1. **[dev/getting-started.md](./dev/getting-started.md)** - 開発環境構築
2. **[dev/coding-standards.md](./dev/coding-standards.md)** - コーディング規約

---

## ドキュメント一覧

### 共通 (`common/`)

| ファイル | 内容 |
|---------|------|
| [requirements/functional.md](./common/requirements/functional.md) | 機能要件 |
| [requirements/non-functional.md](./common/requirements/non-functional.md) | 非機能要件 |
| [architecture/overview.md](./common/architecture/overview.md) | システムアーキテクチャ |
| [specs/cli.md](./common/specs/cli.md) | CLI仕様 |
| [specs/config.md](./common/specs/config.md) | 設定仕様 |
| [specs/data-models.md](./common/specs/data-models.md) | データモデル |
| [specs/github.md](./common/specs/github.md) | GitHub連携仕様 |
| [design-system.md](./common/design-system.md) | UIデザインシステム |

### スクレイパー (`scraper/`)

| ファイル | 内容 |
|---------|------|
| [specs.md](./scraper/specs.md) | スクレイピング仕様 |
| [implementation.md](./scraper/implementation.md) | 実装詳細 |
| [research/lancers/README.md](./scraper/research/lancers/README.md) | Lancers調査概要 |
| [research/lancers/PAGE_STRUCTURE.md](./scraper/research/lancers/PAGE_STRUCTURE.md) | CSSセレクタ一覧 |

### フロントエンド (`frontend/`)

| ファイル | 内容 |
|---------|------|
| [specs.md](./frontend/specs.md) | フロントエンド仕様 |
| [implementation.md](./frontend/implementation.md) | 実装詳細 |
| [layout-fixes.md](./frontend/layout-fixes.md) | レイアウト修正記録 |

### API (`api/`)

| ファイル | 内容 |
|---------|------|
| [specs.md](./api/specs.md) | API仕様 |
| [implementation.md](./api/implementation.md) | 実装詳細 |

### 提案文生成 (`generator/`)

| ファイル | 内容 |
|---------|------|
| [specs.md](./generator/specs.md) | 生成仕様 |
| [prompts.md](./generator/prompts.md) | プロンプト設計 |

### 開発者向け (`dev/`)

| ファイル | 内容 |
|---------|------|
| [getting-started.md](./dev/getting-started.md) | 開発環境構築 |
| [coding-standards.md](./dev/coding-standards.md) | コーディング規約 |
| [testing.md](./dev/testing.md) | テスト戦略 |

### 利用者向けガイド (`guides/`)

| ファイル | 内容 |
|---------|------|
| [installation.md](./guides/installation.md) | インストール手順 |
| [troubleshooting.md](./guides/troubleshooting.md) | トラブルシューティング |
| [faq.md](./guides/faq.md) | FAQ |

### 保守・拡張 (`maintenance/`)

| ファイル | 内容 |
|---------|------|
| [extension.md](./maintenance/extension.md) | 拡張ガイド |
| [changelog.md](./maintenance/changelog.md) | 変更履歴 |

### 法務 (`legal/`)

| ファイル | 内容 |
|---------|------|
| [terms-of-use.md](./legal/terms-of-use.md) | 利用規約・免責事項 |
| [scraping-policy.md](./legal/scraping-policy.md) | スクレイピングポリシー |

---

## ドキュメントの役割分担（MECE）

| ディレクトリ | 役割 | 記載内容 |
|------------|------|----------|
| **common/** | 横断的・共通 | 要件定義、アーキテクチャ、共通仕様、デザインシステム |
| **scraper/** | スクレイパー | 仕様、実装、リサーチ（全てここに集約） |
| **frontend/** | フロントエンド | 仕様、実装（全てここに集約） |
| **api/** | API | 仕様、実装（全てここに集約） |
| **generator/** | 提案文生成 | 仕様、プロンプト設計（全てここに集約） |
| **dev/** | 開発者向け | 開発環境、コーディング規約、テスト |
| **guides/** | 利用者向け | インストール、使い方、問題解決 |
| **maintenance/** | 保守 | 拡張方法、変更履歴 |
| **legal/** | 法務 | 利用規約、ポリシー |

**ポイント**: 各コンポーネント（scraper, frontend, api, generator）の情報は1箇所に集約。

---

## ドキュメント更新ルール

### 更新が必要なケース

| 変更内容 | 更新対象 |
|---------|---------|
| 機能の追加・変更 | `00-quick-reference.md`, `common/requirements/functional.md`, 該当コンポーネント |
| 技術スタックの変更 | `common/requirements/non-functional.md` |
| スクレイパー変更 | `scraper/` 以下 |
| フロントエンド変更 | `frontend/` 以下 |
| API変更 | `api/` 以下 |
| 提案文生成変更 | `generator/` 以下 |
| リリース | `maintenance/changelog.md` |

### 更新時の注意

- **MECE原則を維持**: ドキュメント間で情報が重複しないようにする
- **コンポーネント単位で集約**: 関連情報は同じディレクトリに配置
- **相互参照を確認**: 関連ドキュメントへのリンクが正しいか確認する

---

**最終更新**: 2025-12-19
**バージョン**: 2.1
