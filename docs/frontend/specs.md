# フロントエンド仕様

> **最終更新日**: 2025-12-19
> **バージョン**: 1.1

---

## 1. 概要

Lancers案件検索・閲覧・提案文作成のためのWebフロントエンド。

| 項目 | 値 |
|------|-----|
| **フレームワーク** | Next.js 16 (App Router) |
| **UIライブラリ** | shadcn/ui |
| **言語** | TypeScript |
| **ポート** | 3005 |

---

## 2. 画面一覧

| 画面 | パス | 説明 | 実装状況 |
|------|------|------|---------|
| 案件一覧 | `/` | 案件の検索・一覧表示・優先度分析 | 完了 |
| 下書き | `/drafts` | 提案文の下書き管理 | 完了 |
| 設定 | `/settings` | プロフィール・データ管理 | 完了 |
| ダッシュボード | `/dashboard` | 概要表示 | 完了 |
| 提出済み | `/submitted` | 提出済み提案一覧 | 完了 |
| 進行中 | `/ongoing` | 進行中案件一覧 | 完了 |
| 履歴 | `/history` | 過去の案件履歴 | 完了 |

---

## 3. 案件一覧画面

### 3.1. レイアウト

```
┌─────────────────────────────────────────────────────────┐
│ Header: Lancers 案件検索                                 │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Filters   │            Job List                        │
│            │                                            │
│ ┌────────┐ │  ┌──────────────────────────────────────┐  │
│ │Category│ │  │ JobCard                              │  │
│ └────────┘ │  └──────────────────────────────────────┘  │
│            │  ┌──────────────────────────────────────┐  │
│ ┌────────┐ │  │ JobCard                              │  │
│ │JobTypes│ │  └──────────────────────────────────────┘  │
│ └────────┘ │  ┌──────────────────────────────────────┐  │
│            │  │ JobCard                              │  │
│ [取得]     │  └──────────────────────────────────────┘  │
│            │                                            │
└────────────┴────────────────────────────────────────────┘
```

### 3.2. フィルター項目

| フィルター | コンポーネント | 値 |
|-----------|--------------|-----|
| カテゴリ | Select | 全て, システム開発, Web制作, etc. |
| 案件形式 | Checkbox | プロジェクト, タスク, コンペ |

### 3.3. 案件カード表示項目

| 項目 | 必須 | 説明 |
|------|------|------|
| タイトル | ○ | リンク付き |
| 予算 | ○ | min〜max 形式 |
| 残り日数 | △ | あれば表示 |
| 提案数/募集人数 | △ | あれば表示 |
| クライアント名 | △ | あれば表示 |
| クライアント評価 | △ | 星アイコン付き |
| 発注履歴 | △ | あれば表示 |
| タグ | △ | Badge表示 |
| 特徴タグ | △ | Badge表示（outline） |

---

## 4. コンポーネント仕様

### 4.1. JobFilters

フィルター操作パネル。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `categories` | `Category[]` | カテゴリ一覧 |
| `jobTypes` | `JobType[]` | 案件形式一覧 |
| `selectedCategory` | `string` | 選択中カテゴリ |
| `selectedJobTypes` | `string[]` | 選択中案件形式 |
| `onCategoryChange` | `(v: string) => void` | カテゴリ変更 |
| `onJobTypesChange` | `(v: string[]) => void` | 案件形式変更 |
| `onFetch` | `() => void` | 取得実行 |
| `isLoading` | `boolean` | ローディング中 |

### 4.2. JobList

案件一覧表示。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `jobs` | `Job[]` | 案件一覧 |
| `isLoading` | `boolean` | ローディング中 |

**状態:**
- ローディング中: Skeleton × 3
- 0件: メッセージ表示
- n件: JobCard × n

### 4.3. JobCard

案件カード。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `job` | `Job` | 案件データ |

### 4.4. JobDataTable

Notion風テーブル表示。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `jobs` | `Job[]` | 案件一覧 |
| `isLoading` | `boolean` | ローディング中 |
| `priorityScores` | `Map<string, JobPriorityScore>` | 優先度スコア |

**機能:**
- ドラッグ&ドロップによる列並び替え
- 列幅リサイズ
- 列表示/非表示切替
- ソート機能

### 4.5. JobDetailPopover

案件詳細ポップオーバー。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `job` | `Job` | 案件データ |
| `trigger` | `ReactNode` | トリガー要素 |

### 4.6. PipelineLayout

パイプラインレイアウト。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `children` | `ReactNode` | 子要素 |

### 4.7. PipelineSidebar

パイプラインサイドバー。

**機能:**
- ナビゲーションメニュー表示
- 現在のページのハイライト

### 4.8. PipelineSummary

パイプライン概要表示。

**機能:**
- 案件数の統計表示
- カテゴリ別集計

### 4.9. ScraperSettings

スクレイパー設定コンポーネント。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `onStart` | `(options: ScraperOptions) => void` | 開始コールバック |
| `isRunning` | `boolean` | 実行中フラグ |

### 4.10. ScraperProgress

スクレイピング進捗表示。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `status` | `ScraperStatus` | スクレイパー状態 |

**表示項目:**
- 現在のフェーズ
- 進捗率
- 取得件数
- エラーメッセージ

### 4.11. ScraperStats

スクレイピング統計表示。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `stats` | `ScraperStats` | 統計情報 |

**表示項目:**
- 総取得件数
- 最終実行日時
- カテゴリ別件数

### 4.12. ScraperHistory

スクレイピング履歴表示。

**Props:**
| Prop | 型 | 説明 |
|------|-----|------|
| `history` | `ScraperHistoryItem[]` | 履歴一覧 |

---

## 5. 状態管理

### 5.1. ページ状態

| 状態 | 型 | 初期値 | 説明 |
|------|-----|--------|------|
| `jobs` | `Job[]` | `[]` | 案件一覧 |
| `isLoading` | `boolean` | `false` | ローディング |
| `selectedCategory` | `string` | `"all"` | 選択カテゴリ |
| `selectedJobTypes` | `string[]` | `["project"]` | 選択案件形式 |
| `error` | `string \| null` | `null` | エラー |
| `priorityScores` | `Map<string, JobPriorityScore>` | `new Map()` | 優先度スコア |

### 5.2. 初期化

- ページ読み込み時にローカルストレージからキャッシュを復元
- バックグラウンドでAPIから最新データを取得

### 5.3. ローカルストレージキャッシュ

| キー | 説明 |
|------|------|
| `proposal-generator-jobs-cache` | 案件データのキャッシュ |
| `proposal-generator-priority-scores` | 優先度スコアのキャッシュ |
| `proposal-generator-drafts` | 下書きデータ |

**キャッシュ戦略:**
1. 初回アクセス時はローカルストレージからキャッシュを読み込み
2. バックグラウンドでAPIから最新データを取得（UIはブロックしない）
3. 手動リフレッシュ時はローディング表示付きで再取得

---

## 6. API連携

| 操作 | API | 説明 |
|------|-----|------|
| 案件取得 | `GET /api/jobs` | カテゴリ・形式でフィルタ |
| カテゴリ取得 | `GET /api/categories` | カテゴリ一覧 |
| 案件形式取得 | `GET /api/job-types` | 案件形式一覧 |

---

## 7. 設定画面

### 7.1. タブ構成

```
設定画面
├── プロフィール設定（メインタブ）
│   ├── 基本情報（サブタブ）
│   │   ├── 名前
│   │   ├── 自己紹介
│   │   └── リンク（Webサイト、GitHub、X、ポートフォリオ）
│   ├── スキル（サブタブ）
│   │   ├── 技術スキル（タグ選択）
│   │   ├── 得意分野（タグ選択）
│   │   └── スキル・経験の詳細（自由記述）
│   └── 希望条件（サブタブ）
│       ├── 応募したいカテゴリ（タグ選択）
│       └── カテゴリ詳細（自由記述）
└── データ管理（メインタブ）
    ├── データベースクリア
    └── ローカルキャッシュクリア
```

### 7.2. UserProfile 型

```typescript
interface UserProfile {
  // 基本情報
  name: string;
  bio: string;

  // スキル・得意分野
  skills: string[];
  specialties: string[];
  skills_detail: string;  // 自由記述

  // 希望条件
  preferred_categories: string[];
  preferred_categories_detail: string;  // 自由記述

  // ソーシャル・ポートフォリオ
  website_url: string;
  github_url: string;
  twitter_url: string;
  portfolio_urls: string[];
}
```

---

## 関連ドキュメント

- [実装詳細](./implementation.md)
- [レイアウト修正記録](./layout-fixes.md)
- [デザインシステム](../common/design-system.md)
- [API仕様](../api/specs.md)
