# Proposal Generator - Claude Code プロジェクト設定

## セッション開始時の必須確認事項

### ドキュメント確認（最優先）
セッション開始時は**必ず**以下のディレクトリを確認してください：

```
/Users/t.morimoto/Desktop/proposal-generator/docs
```

**プロジェクトの全要件定義書はこのディレクトリに格納されています。**

- **[docs/README.md](./docs/README.md)** - ドキュメント全体のナビゲーションガイド
- **最初に読むべきファイル**: `docs/00-quick-reference.md`

コーディングを開始する前に、必ず関連ドキュメントを読み込んで理解してください。

### コミュニケーション
- **日本語で回答すること**（このプロジェクトでは日本語での会話が必須）

---

## 絶対に守ること

### パッケージマネージャー

**Python（バックエンド）:**
- **pip のみ使用可能**
- 仮想環境は `backend/.venv` ディレクトリを使用

```bash
# バックエンドディレクトリに移動
cd backend

# 仮想環境の有効化
source .venv/bin/activate

# 依存関係インストール
pip install -e .
```

**Node.js（フロントエンド）:**
- **npm のみ使用可能**

```bash
cd frontend
npm install
npm run dev
```

### Git コミット
- **コミットメッセージは全て英語で記述すること**
- **コミットメッセージは明確で簡潔に**
- **Co-Authored-By を含めること**

```bash
git commit -m "Add feature X

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### その他の禁止事項
- ドキュメントファイル（.md）の勝手な作成禁止（指示がある場合を除く）
- 設定ファイルの無断変更禁止
- `# type: ignore` 系コメントの乱用禁止（型エラーはコードで解消すること）

---

## プロジェクト構成

### ディレクトリ構造

```
proposal-generator/
├── backend/                # Python バックエンド
│   ├── src/                # ソースコード
│   │   ├── api/            # FastAPI サーバー
│   │   │   └── server.py   # APIエンドポイント定義
│   │   ├── scrapers/       # スクレイパー
│   │   │   ├── base.py     # 基底クラス
│   │   │   └── lancers.py  # Lancers スクレイパー
│   │   ├── analyzer/       # 案件分析
│   │   ├── models/         # データモデル
│   │   ├── generator/      # 提案文生成
│   │   ├── auth/           # 認証（セッション管理）
│   │   ├── github/         # GitHub連携
│   │   ├── config/         # 設定読み込み
│   │   └── utils/          # ユーティリティ
│   ├── config/             # 設定ファイル
│   ├── output/             # スクレイピング結果（JSON）
│   ├── tests/              # テスト
│   ├── .venv/              # Python仮想環境
│   └── pyproject.toml      # Python設定
│
├── frontend/               # Next.js フロントエンド
│   ├── src/
│   │   ├── app/            # App Router
│   │   ├── components/     # コンポーネント
│   │   │   ├── ui/         # shadcn/ui コンポーネント
│   │   │   └── *.tsx       # 業務コンポーネント
│   │   ├── lib/            # ユーティリティ
│   │   └── types/          # 型定義
│   └── package.json
│
├── scripts/                # 共通ユーティリティスクリプト
└── docs/                   # ドキュメント
```

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| **バックエンド** | Python 3.9+, FastAPI, Playwright |
| **フロントエンド** | Next.js 16, React 19, TypeScript |
| **UIライブラリ** | shadcn/ui, Tailwind CSS v4 |
| **スクレイピング** | Playwright (Chromium) |
| **API通信** | REST API |

---

## 開発サーバー

### 起動方法

**バックエンド（APIサーバー）:**
```bash
cd backend
source .venv/bin/activate
python -m uvicorn src.api.server:app --reload --port 8000
```

**フロントエンド:**
```bash
cd frontend
npm run dev
```

### アクセスURL

| サービス | URL |
|---------|-----|
| **API サーバー** | http://localhost:8000 |
| **フロントエンド** | http://localhost:3005 |
| **API ドキュメント** | http://localhost:8000/docs |

---

## API エンドポイント

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/api/jobs` | 保存済み案件を取得 |
| `GET` | `/api/categories` | カテゴリ一覧を取得 |
| `GET` | `/api/job-types` | 案件形式一覧を取得 |
| `POST` | `/api/scraper/start` | スクレイピング開始 |
| `GET` | `/api/scraper/status` | スクレイピング状態取得 |
| `GET` | `/api/profile` | ユーザープロフィール取得 |
| `POST` | `/api/profile` | ユーザープロフィール保存 |
| `GET` | `/api/jobs/analyze-all-priorities` | 全案件の優先度分析 |

### `/api/jobs` パラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `category` | string（省略可） | カテゴリ（system, web等）。省略時は全カテゴリ |
| `job_types` | string | 案件形式（カンマ区切り）。例: `project,task` |

---

## スクレイピング

### 対応サービス

| サービス | 実装状況 | ファイル |
|---------|---------|----------|
| **Lancers** | 完了 | `backend/src/scrapers/lancers.py` |
| CrowdWorks | 未実装 | - |
| ココナラ | 未実装 | - |

### Lancers カテゴリ

| 値 | 説明 |
|----|------|
| `system` | システム開発・運用 |
| `web` | Web制作・Webデザイン |
| `writing` | ライティング・記事作成 |
| `design` | デザイン制作 |
| `multimedia` | 写真・映像・音楽 |
| `business` | ビジネス・マーケティング |
| `translation` | 翻訳・通訳 |

### 案件形式

| 値 | 説明 |
|----|------|
| `project` | プロジェクト |
| `task` | タスク |
| `competition` | コンペ |

---

## UIコンポーネント実装ルール

### shadcn/ui の使用

新しいUIコンポーネントを実装する前に、必ずshadcn/uiに既存コンポーネントがないか確認すること。

```bash
# 既存コンポーネントの確認
ls frontend/src/components/ui/

# 新しいコンポーネントの追加
cd frontend
npx shadcn@latest add <component-name>
```

### 実装済みコンポーネント

- `button`, `card`, `checkbox`, `input`, `label`
- `select`, `separator`, `skeleton`, `badge`, `table`
- `tooltip`, `dropdown-menu`

### 業務コンポーネント

| コンポーネント | ファイル | 説明 |
|--------------|---------|------|
| `JobDataTable` | `job-data-table/` | Notion風テーブル（ドラッグ&ドロップ、リサイズ対応） |
| `JobCard` | `job-card.tsx` | 案件カード |
| `JobList` | `job-list.tsx` | 案件一覧 |
| `JobFilters` | `job-filters.tsx` | フィルター（カテゴリ・形式） |

---

## 出力ディレクトリ

スクレイピング結果は `backend/output/` ディレクトリに保存されます。

### ファイル命名規則

```
{category}_jobs_{YYYYMMDD}_{HHMMSS}.json
```

例:
- `system_jobs_20251213_174224.json`
- `web_jobs_20251213_174731.json`

### JSON形式

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
      "order_history": 2
    },
    "scraped_at": "2025-12-13T17:42:02.874369"
  }
]
```

---

## 参考資料

### プロジェクトドキュメント

| ドキュメント | 内容 |
|------------|------|
| [docs/README.md](./docs/README.md) | ドキュメント全体のナビゲーション |
| [docs/00-quick-reference.md](./docs/00-quick-reference.md) | クイックリファレンス |
| [docs/implementation/](./docs/implementation/) | 実装ドキュメント |

### 外部ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Playwright Documentation](https://playwright.dev/python/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**最終更新**: 2025-12-18
**バージョン**: 1.1.0
