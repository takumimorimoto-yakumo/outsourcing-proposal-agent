# API 仕様

> **最終更新日**: 2025-12-13
> **バージョン**: 1.0

---

## 1. 概要

フロントエンド向けREST API。

| 項目 | 値 |
|------|-----|
| **フレームワーク** | FastAPI |
| **言語** | Python 3.9+ |
| **ポート** | 8000 |
| **ベースURL** | `http://localhost:8000` |

---

## 2. エンドポイント一覧

### 2.1 案件関連

| メソッド | パス | 説明 | 実装状況 |
|---------|------|------|---------|
| `GET` | `/` | ヘルスチェック | 完了 |
| `GET` | `/api/jobs` | 案件一覧取得 | 完了 |
| `GET` | `/api/jobs/{job_id}/detail` | 案件詳細取得 | 完了 |
| `GET` | `/api/categories` | カテゴリ一覧 | 完了 |
| `GET` | `/api/job-types` | 案件形式一覧 | 完了 |

### 2.2 スクレイピング関連

| メソッド | パス | 説明 | 実装状況 |
|---------|------|------|---------|
| `POST` | `/api/scraper/start` | スクレイピング開始 | 完了 |
| `GET` | `/api/scraper/status` | スクレイピング状態取得 | 完了 |
| `POST` | `/api/scraper/cancel` | スクレイピングキャンセル | 完了 |
| `GET` | `/api/scraper/stats` | スクレイピング統計情報 | 完了 |
| `GET` | `/api/scraper/history` | スクレイピング履歴取得 | 完了 |
| `POST` | `/api/scraper/clear-database` | データベース削除 | 完了 |

### 2.3 分析・スコアリング関連

| メソッド | パス | 説明 | 実装状況 |
|---------|------|------|---------|
| `POST` | `/api/jobs/analyze-priority` | 指定案件の優先度分析 | 完了 |
| `GET` | `/api/jobs/analyze-all-priorities` | 全案件の優先度分析 | 完了 |
| `POST` | `/api/jobs/ai-score` | AIスコアリング（単一） | 完了 |
| `POST` | `/api/jobs/ai-score-batch` | AIスコアリング（バッチ） | 完了 |

### 2.4 提案文生成関連

| メソッド | パス | 説明 | 実装状況 |
|---------|------|------|---------|
| `POST` | `/api/proposals/generate` | 提案文生成 | 完了 |
| `GET` | `/api/proposals/generate/{job_id}` | 提案文生成（GET） | 完了 |

### 2.5 プロフィール関連

| メソッド | パス | 説明 | 実装状況 |
|---------|------|------|---------|
| `GET` | `/api/profile` | ユーザープロフィール取得 | 完了 |
| `POST` | `/api/profile` | ユーザープロフィール保存 | 完了 |

---

## 3. エンドポイント詳細

### 3.1. GET /

ヘルスチェック。

**レスポンス:**
```json
{
  "message": "Proposal Generator API",
  "version": "1.0.0"
}
```

---

### 3.2. GET /api/jobs

保存済み案件一覧を取得。

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|----------|------|
| `category` | string | No | - | カテゴリ（省略時は全カテゴリ） |
| `job_types` | string | No | `"project"` | 案件形式（カンマ区切り） |

**カテゴリ値:**

| 値 | 説明 |
|----|------|
| `system` | システム開発・運用 |
| `web` | Web制作・Webデザイン |
| `writing` | ライティング・記事作成 |
| `design` | デザイン制作 |
| `multimedia` | 写真・映像・音楽 |
| `business` | ビジネス・マーケティング |
| `translation` | 翻訳・通訳 |

**案件形式値:**

| 値 | 説明 |
|----|------|
| `project` | プロジェクト |
| `task` | タスク |
| `competition` | コンペ |

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
      "feature_tags": ["経験者優遇"],
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

### 3.3. GET /api/categories

カテゴリ一覧を取得。

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

### 3.4. GET /api/job-types

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

## 4. エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| `400` | リクエストパラメータエラー |
| `404` | リソースが見つからない |
| `500` | サーバー内部エラー |

**エラーレスポンス形式:**
```json
{
  "detail": "エラーメッセージ"
}
```

---

## 5. CORS設定

| オリジン | 許可 |
|---------|------|
| `http://localhost:3000` | ○ |
| `http://localhost:3005` | ○ |

---

## 関連ドキュメント

- [実装詳細](./implementation.md)
- [フロントエンド仕様](../frontend/specs.md)
- [データモデル](../common/specs/data-models.md)
