# フロントエンド実装

## 概要

Next.js 16 + shadcn/ui によるフロントエンド実装。

| 項目 | 値 |
|------|-----|
| **フレームワーク** | Next.js 16.0.10 (App Router) |
| **UIライブラリ** | shadcn/ui |
| **CSSフレームワーク** | Tailwind CSS v4 |
| **言語** | TypeScript |
| **ポート** | 3005 |

---

## ディレクトリ構成

```
frontend/
├── src/
│   ├── app/                    # App Router
│   │   ├── layout.tsx          # ルートレイアウト
│   │   ├── page.tsx            # メインページ
│   │   └── globals.css         # グローバルスタイル
│   │
│   ├── components/
│   │   ├── ui/                 # shadcn/ui コンポーネント
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── select.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── ...
│   │   │
│   │   ├── job-card.tsx        # 案件カードコンポーネント
│   │   ├── job-list.tsx        # 案件一覧コンポーネント
│   │   └── job-filters.tsx     # フィルターコンポーネント
│   │
│   ├── lib/
│   │   ├── api.ts              # API クライアント
│   │   └── utils.ts            # ユーティリティ関数
│   │
│   └── types/
│       └── job.ts              # 型定義
│
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## コンポーネント詳細

### ページコンポーネント

#### `page.tsx`（メインページ）

| 状態 | 型 | 説明 |
|------|-----|------|
| `jobs` | `Job[]` | 案件一覧 |
| `isLoading` | `boolean` | ローディング状態 |
| `selectedCategory` | `string` | 選択中のカテゴリ |
| `selectedJobTypes` | `string[]` | 選択中の案件形式 |
| `error` | `string \| null` | エラーメッセージ |

**初期表示**: ページ読み込み時に `useEffect` で全案件を自動取得。

---

### 業務コンポーネント

#### `JobFilters`（フィルターコンポーネント）

**Props:**

| Prop | 型 | 説明 |
|------|-----|------|
| `categories` | `Category[]` | カテゴリ一覧 |
| `jobTypes` | `JobType[]` | 案件形式一覧 |
| `selectedCategory` | `string` | 選択中のカテゴリ |
| `selectedJobTypes` | `string[]` | 選択中の案件形式 |
| `onCategoryChange` | `(value: string) => void` | カテゴリ変更ハンドラ |
| `onJobTypesChange` | `(types: string[]) => void` | 案件形式変更ハンドラ |
| `onFetch` | `() => void` | 取得ボタンハンドラ |
| `isLoading` | `boolean` | ローディング状態 |

**UI構成:**
- カテゴリ選択（Select）
- 案件形式選択（Checkbox × 3）
- 取得ボタン（Button）

---

#### `JobList`（案件一覧コンポーネント）

**Props:**

| Prop | 型 | 説明 |
|------|-----|------|
| `jobs` | `Job[]` | 案件一覧 |
| `isLoading` | `boolean` | ローディング状態 |

**表示:**
- ローディング時: スケルトンカード（3件）
- 案件なし: メッセージ表示
- 案件あり: JobCard を一覧表示

---

#### `JobCard`（案件カードコンポーネント）

**Props:**

| Prop | 型 | 説明 |
|------|-----|------|
| `job` | `Job` | 案件データ |

**表示項目:**
- タイトル（リンク付き）
- 予算（フォーマット済み）
- 残り日数
- 提案数 / 募集人数
- クライアント情報（名前、評価、発注履歴）
- タグ（Badge）
- 特徴タグ（Badge）

---

### UIコンポーネント（shadcn/ui）

| コンポーネント | 用途 |
|--------------|------|
| `Button` | 取得ボタン |
| `Card` | 案件カード |
| `Checkbox` | 案件形式選択 |
| `Select` | カテゴリ選択 |
| `Skeleton` | ローディング表示 |
| `Badge` | タグ表示 |
| `Separator` | 区切り線 |
| `Label` | フォームラベル |

---

## 型定義

### `Job`（案件）

```typescript
interface Job {
  title: string;
  description: string;
  category: string;
  budget_type: string;
  job_id: string | null;
  job_type: string;
  status: string;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  remaining_days: number | null;
  required_skills: string[];
  tags: string[];
  feature_tags: string[];
  proposal_count: number | null;
  recruitment_count: number | null;
  source: string;
  url: string;
  client_name: string | null;
  client_rating: number | null;
  client_order_history: number | null;
}
```

### `Category`（カテゴリ）

```typescript
interface Category {
  value: string;  // "all", "system", "web", etc.
  label: string;  // "全て", "システム開発・運用", etc.
}
```

### `JobType`（案件形式）

```typescript
interface JobType {
  value: string;  // "project", "task", "competition"
  label: string;  // "プロジェクト", "タスク", "コンペ"
}
```

---

## API クライアント

### `fetchJobs()`

```typescript
async function fetchJobs(
  category: string | null,
  jobTypes: string[],
  maxPages?: number
): Promise<{ jobs: Job[]; total: number }>
```

| パラメータ | 説明 |
|-----------|------|
| `category` | カテゴリ（null で全カテゴリ） |
| `jobTypes` | 案件形式の配列 |
| `maxPages` | 最大ページ数（デフォルト: 3） |

### `formatBudget()`

```typescript
function formatBudget(
  min: number | null,
  max: number | null
): string
```

予算を日本円表示にフォーマット。

---

## 起動方法

```bash
cd frontend
npm run dev
```

アクセス: http://localhost:3005

---

**最終更新**: 2025-12-13
**バージョン**: 1.0.0
