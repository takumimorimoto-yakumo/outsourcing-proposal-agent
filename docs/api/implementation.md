# API サーバー実装

## 概要

FastAPI による REST API サーバー実装。

| 項目 | 値 |
|------|-----|
| **フレームワーク** | FastAPI |
| **言語** | Python 3.9+ |
| **ポート** | 8000 |
| **データソース** | output/ ディレクトリの JSON ファイル |

---

## ファイル構成

```
src/api/
└── server.py       # APIエンドポイント定義
```

---

## エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| `GET` | `/` | ヘルスチェック |
| `GET` | `/api/jobs` | 保存済み案件を取得 |
| `GET` | `/api/categories` | カテゴリ一覧を取得 |
| `GET` | `/api/job-types` | 案件形式一覧を取得 |

---

## エンドポイント詳細

### `GET /`

ヘルスチェック用エンドポイント。

**レスポンス:**
```json
{
  "message": "Proposal Generator API",
  "version": "1.0.0"
}
```

---

### `GET /api/jobs`

保存済み案件を取得。

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|----------|------|
| `category` | string | No | - | カテゴリ（省略時は全カテゴリ） |
| `job_types` | string | No | `"project"` | 案件形式（カンマ区切り） |
| `max_pages` | int | No | `3` | 最大ページ数（未使用） |

**カテゴリ値:**
- `system` - システム開発・運用
- `web` - Web制作・Webデザイン
- `writing` - ライティング・記事作成
- `design` - デザイン制作
- `multimedia` - 写真・映像・音楽
- `business` - ビジネス・マーケティング
- `translation` - 翻訳・通訳

**案件形式値:**
- `project` - プロジェクト
- `task` - タスク
- `competition` - コンペ

**レスポンス:**
```json
{
  "jobs": [
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
      "client_name": "クライアント名",
      "client_rating": 5.0,
      "client_order_history": 2
    }
  ],
  "total": 169
}
```

---

### `GET /api/categories`

利用可能なカテゴリ一覧を取得。

**レスポンス:**
```json
{
  "categories": [
    { "value": "system", "label": "システム開発・運用" },
    { "value": "web", "label": "Web制作・Webデザイン" },
    { "value": "writing", "label": "ライティング・記事作成" },
    { "value": "design", "label": "デザイン制作" },
    { "value": "multimedia", "label": "写真・映像・音楽" },
    { "value": "business", "label": "ビジネス・マーケティング" },
    { "value": "translation", "label": "翻訳・通訳" }
  ]
}
```

---

### `GET /api/job-types`

案件形式一覧を取得。

**レスポンス:**
```json
{
  "job_types": [
    { "value": "project", "label": "プロジェクト" },
    { "value": "task", "label": "タスク" },
    { "value": "competition", "label": "コンペ" }
  ]
}
```

---

## 内部関数

### `get_latest_json_file(category: str)`

指定カテゴリの最新 JSON ファイルを取得。

**ロジック:**
1. `output/{category}_jobs_*.json` パターンでファイルを検索
2. ファイル名のタイムスタンプでソート
3. 最新のファイルパスを返却

---

### `get_all_saved_jobs()`

保存されている全案件を取得。

**ロジック:**
1. `output/*_jobs_*.json` パターンで全ファイルを検索
2. 各ファイルを読み込み
3. `job_id` で重複を排除
4. 全案件のリストを返却

---

## CORS 設定

許可されているオリジン:
- `http://localhost:3000`
- `http://localhost:3005`

---

## 起動方法

```bash
source .venv/bin/activate
python -m uvicorn src.api.server:app --reload --port 8000
```

アクセス: http://localhost:8000

API ドキュメント: http://localhost:8000/docs

---

**最終更新**: 2025-12-13
**バージョン**: 1.0.0
