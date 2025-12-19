# CLI詳細仕様

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [コマンド体系](#2-コマンド体系)
3. [メインコマンド](#3-メインコマンド)
4. [サブコマンド](#4-サブコマンド)
5. [オプション詳細](#5-オプション詳細)
6. [終了コード](#6-終了コード)
7. [出力形式](#7-出力形式)
8. [環境変数](#8-環境変数)

---

## 1. 概要

### 1.1. コマンド名

```
proposal-gen
```

### 1.2. インストール後の利用

```bash
# pipでインストール後
proposal-gen --help

# 開発環境での実行
python -m src.main --help
```

### 1.3. 基本構文

```
proposal-gen [OPTIONS] COMMAND [ARGS]...
proposal-gen [OPTIONS] <URL>
```

---

## 2. コマンド体系

### 2.1. コマンド一覧

| コマンド | 説明 | 例 |
|---------|------|-----|
| `proposal-gen <URL>` | 提案文を生成 | `proposal-gen https://www.lancers.jp/work/detail/12345` |
| `proposal-gen config` | 設定管理 | `proposal-gen config show` |
| `proposal-gen version` | バージョン表示 | `proposal-gen version` |

### 2.2. コマンド構造

```
proposal-gen
├── <URL>                    # メインコマンド（提案文生成）
├── config                   # 設定管理サブコマンド
│   ├── show                 # 現在の設定を表示
│   ├── edit                 # 設定ファイルを編集
│   ├── init                 # 設定ファイルを初期化
│   └── validate             # 設定ファイルを検証
└── version                  # バージョン情報
```

---

## 3. メインコマンド

### 3.1. 提案文生成

```bash
proposal-gen <URL> [OPTIONS]
```

**引数**:

| 引数 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `URL` | string | Yes | 案件URL（ランサーズ or クラウドワークス） |

**使用例**:

```bash
# 基本的な使用
proposal-gen https://www.lancers.jp/work/detail/12345

# オプション付き
proposal-gen https://crowdworks.jp/public/jobs/67890 --copy --verbose
```

### 3.2. URL形式

| サービス | 対応URL形式 |
|----------|------------|
| ランサーズ | `https://www.lancers.jp/work/detail/{job_id}` |
| クラウドワークス | `https://crowdworks.jp/public/jobs/{job_id}` |

### 3.3. 処理フロー

```
1. URL解析・サービス判定
   ↓
2. 設定ファイル読み込み
   ↓
3. 案件情報スクレイピング
   ↓
4. GitHub情報取得（オプション）
   ↓
5. 提案文生成（Gemini API）
   ↓
6. 出力（stdout / file / clipboard）
```

---

## 4. サブコマンド

### 4.1. config show

現在の設定を表示する。

```bash
proposal-gen config show [OPTIONS]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `--json` | JSON形式で出力 |
| `--path` | 設定ファイルのパスのみ表示 |

**出力例**:

```
設定ファイル: ~/.proposal-gen/settings.yaml

[GitHub]
  username: example-user

[Gemini]
  model: gemini-pro
  temperature: 0.7

[Scraping]
  headless: true
  human_like: enabled

[Output]
  default: stdout

[Profile]
  current: default
  available: default, team
```

### 4.2. config edit

設定ファイルをエディタで開く。

```bash
proposal-gen config edit [OPTIONS]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `--settings` | settings.yaml を編集（デフォルト） |
| `--profile` | profile.yaml を編集 |

**動作**:
1. `$EDITOR` 環境変数のエディタを起動
2. 未設定の場合は `vi` を使用
3. 編集後に自動でバリデーション実行

### 4.3. config init

設定ファイルを初期化する。

```bash
proposal-gen config init [OPTIONS]
```

**オプション**:

| オプション | 説明 |
|-----------|------|
| `--force` | 既存ファイルを上書き |
| `--global` | `~/.proposal-gen/` に作成 |
| `--local` | `./config/` に作成（デフォルト） |

**動作**:
1. サンプル設定ファイルを作成
2. 必要な入力をインタラクティブに取得
   - GitHub username
   - Gemini API key（環境変数設定を推奨）

### 4.4. config validate

設定ファイルを検証する。

```bash
proposal-gen config validate
```

**出力例（成功時）**:

```
✓ settings.yaml: 有効
✓ profile.yaml: 有効
✓ GEMINI_API_KEY: 設定済み

すべての設定が有効です。
```

**出力例（エラー時）**:

```
✗ settings.yaml: エラーあり
  - github.username: 必須項目が未設定
  - gemini.temperature: 範囲外の値 (1.5)

✓ profile.yaml: 有効
✗ GEMINI_API_KEY: 未設定

設定を修正してください。
```

### 4.5. version

バージョン情報を表示する。

```bash
proposal-gen version
```

**出力例**:

```
proposal-gen v0.1.0
Python 3.11.5
Playwright 1.40.0
```

---

## 5. オプション詳細

### 5.1. グローバルオプション

全コマンドで使用可能なオプション。

| オプション | 短縮形 | 型 | デフォルト | 説明 |
|-----------|--------|-----|-----------|------|
| `--help` | `-h` | flag | - | ヘルプを表示 |
| `--version` | `-V` | flag | - | バージョンを表示 |
| `--verbose` | `-v` | flag | false | 詳細ログを表示 |
| `--quiet` | `-q` | flag | false | 最小限の出力のみ |
| `--config` | `-c` | path | - | 設定ファイルのパス |

### 5.2. 生成コマンドオプション

`proposal-gen <URL>` で使用可能なオプション。

| オプション | 短縮形 | 型 | デフォルト | 説明 |
|-----------|--------|-----|-----------|------|
| `--output` | `-o` | path | - | 出力先ファイルパス |
| `--copy` | `-c` | flag | false | クリップボードにコピー |
| `--profile` | `-p` | string | default | 使用するプロフィール名 |
| `--no-github` | - | flag | false | GitHub情報を取得しない |
| `--dry-run` | - | flag | false | 実際に生成せずプロンプトを表示 |
| `--json` | - | flag | false | JSON形式で出力（メタデータ含む） |

### 5.3. オプションの組み合わせ例

```bash
# 基本的な使用
proposal-gen https://www.lancers.jp/work/detail/12345

# ファイルに出力
proposal-gen https://www.lancers.jp/work/detail/12345 -o proposal.txt

# クリップボードにコピー + 詳細ログ
proposal-gen https://www.lancers.jp/work/detail/12345 --copy -v

# チームプロフィールで生成
proposal-gen https://www.lancers.jp/work/detail/12345 -p team

# GitHub情報なしで生成
proposal-gen https://www.lancers.jp/work/detail/12345 --no-github

# プロンプトのみ確認（デバッグ用）
proposal-gen https://www.lancers.jp/work/detail/12345 --dry-run -v

# JSON形式でメタデータ付き出力
proposal-gen https://www.lancers.jp/work/detail/12345 --json -o result.json
```

---

## 6. 終了コード

### 6.1. 終了コード一覧

| コード | 名前 | 説明 |
|--------|------|------|
| 0 | SUCCESS | 正常終了 |
| 1 | GENERAL_ERROR | 一般的なエラー |
| 2 | INVALID_ARGUMENT | 引数エラー（無効なURL等） |
| 3 | CONFIG_ERROR | 設定ファイルエラー |
| 4 | NETWORK_ERROR | ネットワークエラー |
| 5 | SCRAPING_ERROR | スクレイピングエラー |
| 6 | API_ERROR | 外部APIエラー（Gemini/GitHub） |
| 7 | AUTH_ERROR | 認証エラー（APIキー無効等） |
| 130 | INTERRUPTED | ユーザーによる中断（Ctrl+C） |

### 6.2. 終了コードの実装

```python
from enum import IntEnum

class ExitCode(IntEnum):
    SUCCESS = 0
    GENERAL_ERROR = 1
    INVALID_ARGUMENT = 2
    CONFIG_ERROR = 3
    NETWORK_ERROR = 4
    SCRAPING_ERROR = 5
    API_ERROR = 6
    AUTH_ERROR = 7
    INTERRUPTED = 130
```

### 6.3. シェルスクリプトでの使用例

```bash
#!/bin/bash

proposal-gen "$1" -o proposal.txt

case $? in
    0) echo "生成完了" ;;
    2) echo "URLが無効です" ;;
    3) echo "設定ファイルを確認してください" ;;
    5) echo "案件ページにアクセスできません" ;;
    6) echo "API呼び出しに失敗しました" ;;
    7) echo "APIキーを確認してください" ;;
    *) echo "エラーが発生しました" ;;
esac
```

---

## 7. 出力形式

### 7.1. 標準出力（デフォルト）

```bash
proposal-gen https://www.lancers.jp/work/detail/12345
```

**出力**:
```
はじめまして。ご依頼内容を拝見し、ご提案させていただきます。

私は5年以上のWeb開発経験を持つフルスタックエンジニアです...

[以下、提案文本文]
```

### 7.2. ファイル出力

```bash
proposal-gen https://www.lancers.jp/work/detail/12345 -o proposal.txt
```

**出力**:
```
提案文を保存しました: proposal.txt (1,523文字)
```

### 7.3. JSON出力

```bash
proposal-gen https://www.lancers.jp/work/detail/12345 --json
```

**出力**:
```json
{
  "proposal": "はじめまして。ご依頼内容を...",
  "metadata": {
    "character_count": 1523,
    "category": "web_development",
    "matched_skills": ["React", "TypeScript"],
    "used_repos": ["react-dashboard", "nextjs-template"],
    "generation_time": 3.45,
    "service": "lancers",
    "job_title": "ECサイトのフロントエンド開発"
  }
}
```

### 7.4. 詳細ログ（--verbose）

```bash
proposal-gen https://www.lancers.jp/work/detail/12345 -v
```

**出力**:
```
[INFO] 設定ファイルを読み込み: ~/.proposal-gen/settings.yaml
[INFO] サービス判定: lancers
[INFO] スクレイピング開始...
[DEBUG] ページ読み込み完了 (2.3秒)
[DEBUG] 要素抽出完了
[INFO] 案件情報取得完了: ECサイトのフロントエンド開発
[INFO] GitHub情報取得開始...
[DEBUG] ユーザー情報取得完了
[DEBUG] リポジトリ一覧取得完了 (30件)
[INFO] 関連リポジトリ: 3件マッチ
[INFO] 提案文生成開始...
[DEBUG] プロンプト構築完了 (2,450 tokens)
[INFO] Gemini API呼び出し...
[DEBUG] 生成完了 (3.2秒)
[INFO] 品質チェック: OK
[INFO] 文字数: 1,523文字

はじめまして。ご依頼内容を拝見し...
```

---

## 8. 環境変数

### 8.1. 対応環境変数

| 環境変数 | 説明 | デフォルト |
|---------|------|-----------|
| `GEMINI_API_KEY` | Gemini APIキー（必須） | - |
| `GITHUB_TOKEN` | GitHubアクセストークン | - |
| `PROPOSAL_GEN_CONFIG` | 設定ファイルのパス | `~/.proposal-gen/` |
| `PROPOSAL_GEN_LOG_LEVEL` | ログレベル | `INFO` |
| `EDITOR` | config edit で使用するエディタ | `vi` |
| `NO_COLOR` | カラー出力を無効化 | - |

### 8.2. 環境変数の優先順位

```
コマンドライン引数 > 環境変数 > 設定ファイル > デフォルト値
```

---

## 関連ドキュメント

- [機能要件](../requirements/functional.md)
- [設定仕様](./config.md)
- [インストールガイド](../guides/installation.md)
