# フロントエンド レイアウト修正記録

## 2025-12-19: テーブル表示エリアのオーバーフロー修正

### 問題

案件一覧テーブルが画面の表示エリアからはみ出し、ページ全体がスクロールしてしまっていた。

**期待される動作:**
- メインコンテンツエリア（フィルター、ボタン等）は固定
- テーブルエリアのみが縦横スクロール可能

### 原因

1. `SidebarInset` コンポーネントに `overflow` 制御がなかった
2. `main` タグが固定高さのフレックスコンテナになっていなかった
3. テーブルコンテナが親要素の高さを超えて拡張していた

### 修正内容

#### 1. `src/app/page.tsx`

```tsx
// Before
<SidebarInset>
  <main className="p-6 space-y-4">

// After
<SidebarInset className="overflow-hidden">
  <main className="p-6 h-full flex flex-col overflow-hidden">
```

**変更点:**
- `SidebarInset` に `overflow-hidden` を追加してコンテンツのはみ出しを防止
- `main` を `h-full flex flex-col overflow-hidden` に変更
  - `h-full`: 親要素の高さいっぱいに広がる
  - `flex flex-col`: 縦方向のフレックスコンテナ
  - `overflow-hidden`: はみ出しを非表示

```tsx
// フィルターとボタンは固定
<div className="flex items-center justify-end gap-2 shrink-0 mb-4">
<div className="shrink-0">
  <JobFilters ... />
</div>

// テーブルエリアは残りスペースを埋める
<div className="flex-1 min-h-0 mt-4">
  <JobDataTable ... />
</div>
```

**変更点:**
- `shrink-0`: フィルターやボタンが縮まないように固定
- `flex-1 min-h-0`: テーブルエリアが残りスペースを埋め、最小高さ0で縮小可能

#### 2. `src/components/job-data-table/job-data-table.tsx`

```tsx
// Before
<div className="space-y-3">
  ...
  <div
    className="flex flex-col overflow-hidden rounded-md border bg-card"
    style={{ maxHeight: TABLE_MAX_HEIGHT }}
  >
    <div className="flex-1 overflow-auto scrollbar-thin">

// After
<div className="h-full flex flex-col">
  ...
  <div className="flex-1 min-h-0 rounded-md border bg-card overflow-auto scrollbar-thin">
    <div className="h-full w-max min-w-full">
```

**変更点:**
- ルート要素を `h-full flex flex-col` に変更（親の高さに合わせる）
- `maxHeight` の固定値を削除し、`flex-1 min-h-0` で動的に高さを調整
- `overflow-auto` をテーブルコンテナに直接適用
- `w-max min-w-full`: 内部テーブルが必要な幅を確保しつつ、最小幅は親要素に合わせる

### 技術的解説

#### フレックスボックスで高さを制御する仕組み

```
┌─────────────────────────────────────┐
│ SidebarInset (overflow-hidden)      │
│ ┌─────────────────────────────────┐ │
│ │ main (h-full flex flex-col)     │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ ボタン (shrink-0)           │ │ │ ← 固定高さ
│ │ ├─────────────────────────────┤ │ │
│ │ │ フィルター (shrink-0)       │ │ │ ← 固定高さ
│ │ ├─────────────────────────────┤ │ │
│ │ │ テーブル (flex-1 min-h-0)   │ │ │ ← 残りスペース
│ │ │ ┌─────────────────────────┐ │ │ │
│ │ │ │ スクロール可能エリア    │ │ │ │
│ │ │ └─────────────────────────┘ │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### 重要なCSSプロパティ

| プロパティ | 説明 |
|-----------|------|
| `h-full` | 親要素の高さ100% |
| `flex-1` | フレックスアイテムが残りスペースを埋める |
| `min-h-0` | フレックスアイテムの最小高さを0にして縮小を許可 |
| `shrink-0` | フレックスアイテムが縮まないように固定 |
| `overflow-hidden` | はみ出したコンテンツを非表示 |
| `overflow-auto` | 必要な場合のみスクロールバーを表示 |

#### `min-h-0` が必要な理由

フレックスボックスでは、子要素のデフォルト `min-height` は `auto`（コンテンツに基づく）。
これにより、子要素が親要素からはみ出すことがある。
`min-h-0` を設定することで、子要素が親要素内に収まるように縮小できる。

### 関連ファイル

- `frontend/src/app/page.tsx`
- `frontend/src/components/job-data-table/job-data-table.tsx`
- `frontend/src/components/ui/sidebar.tsx` (SidebarInset)
