# インストールガイド

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [システム要件](#1-システム要件)
2. [インストール方法](#2-インストール方法)
3. [初期設定](#3-初期設定)
4. [動作確認](#4-動作確認)
5. [アップデート](#5-アップデート)
6. [アンインストール](#6-アンインストール)

---

## 1. システム要件

### 1.1. 必須要件

| 項目 | 要件 |
|------|------|
| OS | macOS, Linux, Windows |
| Python | 3.11以上 |
| メモリ | 4GB以上（推奨8GB） |
| ディスク | 2GB以上の空き容量 |
| ネットワーク | インターネット接続必須 |

### 1.2. 必要なアカウント

| サービス | 必須 | 用途 |
|----------|------|------|
| Google AI Studio | Yes | Gemini APIキーの取得 |
| GitHub | No（推奨） | 技術実績の表示 |

---

## 2. インストール方法

### 2.1. pipでインストール（推奨）

```bash
# インストール
pip install proposal-generator

# Playwrightブラウザのインストール
playwright install chromium
```

### 2.2. pipxでインストール（隔離環境）

```bash
# pipxのインストール（未インストールの場合）
pip install pipx
pipx ensurepath

# proposal-generatorのインストール
pipx install proposal-generator

# Playwrightブラウザのインストール
pipx runpip proposal-generator install playwright
playwright install chromium
```

### 2.3. ソースからインストール

```bash
# リポジトリをクローン
git clone https://github.com/your-username/proposal-generator.git
cd proposal-generator

# 仮想環境を作成
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate

# インストール
pip install -e .

# Playwrightブラウザのインストール
playwright install chromium
```

### 2.4. Linuxでの追加設定

```bash
# Ubuntu/Debian: Playwrightの依存関係をインストール
playwright install-deps chromium
```

---

## 3. 初期設定

### 3.1. Gemini APIキーの取得

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Googleアカウントでログイン
3. 「Create API Key」をクリック
4. APIキーをコピー

### 3.2. 環境変数の設定

#### macOS / Linux

```bash
# .bashrc または .zshrc に追加
export GEMINI_API_KEY="your_api_key_here"

# 設定を反映
source ~/.bashrc  # または source ~/.zshrc
```

#### Windows (PowerShell)

```powershell
# ユーザー環境変数として設定
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "your_api_key_here", "User")

# 新しいPowerShellセッションを開始して反映
```

#### Windows (コマンドプロンプト)

```cmd
setx GEMINI_API_KEY "your_api_key_here"
```

### 3.3. 設定ファイルの初期化

```bash
# 設定ファイルを作成
proposal-gen config init
```

対話形式で以下の情報を入力:
- GitHubユーザー名（オプション）
- デフォルトプロフィール名

### 3.4. 設定ファイルの編集

```bash
# 設定ファイルを開く
proposal-gen config edit --settings

# プロフィールを編集
proposal-gen config edit --profile
```

#### settings.yaml の主要項目

```yaml
version: "1.0"

github:
  username: "your-github-username"  # GitHubユーザー名

gemini:
  model: "gemini-pro"
  temperature: 0.7  # 0.0-1.0（高いほど創造的）

scraping:
  headless: true  # バックグラウンド実行

default_profile: "default"
```

#### profile.yaml の主要項目

```yaml
profiles:
  default:
    name: "メインプロフィール"
    introduction:
      greeting: |
        はじめまして。ご依頼内容を拝見し、ご提案させていただきます。
      self_intro: |
        # ここに自己紹介を記載
        私は○年の開発経験を持つエンジニアです。
    closing:
      farewell: |
        ご検討のほど、よろしくお願いいたします。
```

### 3.5. GitHubトークンの設定（オプション）

GitHubの情報をより多く取得したい場合:

1. [GitHub Settings > Tokens](https://github.com/settings/tokens) にアクセス
2. 「Generate new token (classic)」をクリック
3. `repo` (read) スコープを選択
4. トークンを生成してコピー

```bash
# 環境変数に設定
export GITHUB_TOKEN="your_github_token_here"
```

---

## 4. 動作確認

### 4.1. インストール確認

```bash
# バージョン確認
proposal-gen version

# 出力例:
# proposal-gen v0.1.0
# Python 3.11.5
# Playwright 1.40.0
```

### 4.2. 設定確認

```bash
# 設定の表示
proposal-gen config show

# 出力例:
# 設定ファイル: ~/.proposal-gen/settings.yaml
#
# [GitHub]
#   username: your-github-username
#
# [Gemini]
#   model: gemini-pro
#   temperature: 0.7
```

### 4.3. 設定のバリデーション

```bash
# 設定を検証
proposal-gen config validate

# 成功時:
# ✓ settings.yaml: 有効
# ✓ profile.yaml: 有効
# ✓ GEMINI_API_KEY: 設定済み
#
# すべての設定が有効です。
```

### 4.4. 提案文生成テスト

```bash
# ドライランで動作確認（実際のAPI呼び出しは行わない）
proposal-gen https://www.lancers.jp/work/detail/XXXXX --dry-run -v
```

---

## 5. アップデート

### 5.1. pipでアップデート

```bash
pip install --upgrade proposal-generator
```

### 5.2. pipxでアップデート

```bash
pipx upgrade proposal-generator
```

### 5.3. ソースからアップデート

```bash
cd proposal-generator
git pull origin main
pip install -e .
```

---

## 6. アンインストール

### 6.1. pipでアンインストール

```bash
pip uninstall proposal-generator
```

### 6.2. pipxでアンインストール

```bash
pipx uninstall proposal-generator
```

### 6.3. 設定ファイルの削除

```bash
# 設定ディレクトリを削除
rm -rf ~/.proposal-gen
```

### 6.4. Playwrightブラウザの削除

```bash
# ブラウザキャッシュを削除
rm -rf ~/Library/Caches/ms-playwright  # macOS
rm -rf ~/.cache/ms-playwright           # Linux
```

---

## 次のステップ

- [クイックリファレンス](../00-quick-reference.md) で使い方を確認
- [CLI詳細仕様](../specs/cli.md) でオプションを確認
- [トラブルシューティング](./troubleshooting.md) で問題解決

---

## 関連ドキュメント

- [クイックリファレンス](../00-quick-reference.md)
- [CLI詳細仕様](../specs/cli.md)
- [設定仕様](../specs/config.md)
- [トラブルシューティング](./troubleshooting.md)
