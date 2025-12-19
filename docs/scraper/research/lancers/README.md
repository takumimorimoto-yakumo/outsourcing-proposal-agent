# Lancers リサーチデータ

キャプチャ日時: 2024-12-13

## ディレクトリ構造

```
lancers/
├── README.md              # このファイル
├── PAGE_STRUCTURE.md      # セレクタ・ページ構造ドキュメント
├── screenshots/           # スクリーンショット
│   ├── top/              # トップページ
│   ├── search/           # 検索ページ
│   ├── job_list/         # 案件一覧（カテゴリ別・フィルタ別）
│   ├── job_detail/       # 案件詳細
│   ├── mypage/           # マイページ系
│   └── help/             # ヘルプ
└── html/                  # HTMLソース
    ├── top/
    ├── search/
    ├── job_list/
    ├── job_detail/
    ├── mypage/
    └── help/
```

## キャプチャ済みページ

### トップ・検索
| ページ | スクリーンショット | HTML |
|--------|-------------------|------|
| トップ | screenshots/top/top.png | html/top/top.html |
| 検索トップ | screenshots/search/search_top.png | html/search/search_top.html |

### 案件一覧（カテゴリ別）
| カテゴリ | スクリーンショット | HTML |
|---------|-------------------|------|
| 全カテゴリ（募集中） | screenshots/job_list/all_categories_open_*.png | html/job_list/all_categories_open_*.html |
| システム開発 | screenshots/job_list/system.png | html/job_list/system.html |
| Web制作 | screenshots/job_list/web.png | html/job_list/web.html |
| ライティング | screenshots/job_list/writing.png | html/job_list/writing.html |
| デザイン | screenshots/job_list/design.png | html/job_list/design.html |

### 案件一覧（形式別）
| 形式 | スクリーンショット | HTML |
|------|-------------------|------|
| プロジェクト形式 | screenshots/job_list/project.png | html/job_list/project.html |
| タスク形式 | screenshots/job_list/task.png | html/job_list/task.html |
| コンペ形式 | screenshots/job_list/competition.png | html/job_list/competition.html |

### 案件一覧（フィルタテスト）
| フィルタ | HTML |
|---------|------|
| システム（フィルタなし） | html/job_list/system_no_filter_*.html |
| システム（募集中のみ） | html/job_list/system_open_only_*.html |
| システム開発カテゴリ | html/job_list/system_development_*.html |

### 案件詳細
| ページ | スクリーンショット | HTML |
|--------|-------------------|------|
| サンプル案件 | screenshots/job_detail/sample.png | html/job_detail/sample.html |

### マイページ
| ページ | スクリーンショット | HTML |
|--------|-------------------|------|
| マイページトップ | screenshots/mypage/top.png | html/mypage/top.html |
| 提案一覧 | screenshots/mypage/proposals.png | html/mypage/proposals.html |
| 受注した仕事 | screenshots/mypage/works.png | html/mypage/works.html |
| メッセージ | screenshots/mypage/messages.png | html/mypage/messages.html |
| プロフィール | screenshots/mypage/profile.png | html/mypage/profile.html |

### ヘルプ
| ページ | スクリーンショット | HTML |
|--------|-------------------|------|
| ヘルプトップ | screenshots/help/top.png | html/help/top.html |
| 提案の書き方 | screenshots/help/guide_proposal.png | html/help/guide_proposal.html |

## 使い方

スクリーンショットを開く:
```bash
open screenshots/job_detail/sample.png
```

HTMLをブラウザで確認:
```bash
open html/job_detail/sample.html
```
