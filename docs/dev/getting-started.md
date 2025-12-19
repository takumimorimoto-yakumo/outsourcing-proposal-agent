# 開発環境構築ガイド

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [前提条件](#1-前提条件)
2. [リポジトリのクローン](#2-リポジトリのクローン)
3. [Python環境のセットアップ](#3-python環境のセットアップ)
4. [依存関係のインストール](#4-依存関係のインストール)
5. [Playwrightのセットアップ](#5-playwrightのセットアップ)
6. [環境変数の設定](#6-環境変数の設定)
7. [設定ファイルの準備](#7-設定ファイルの準備)
8. [動作確認](#8-動作確認)
9. [IDE設定](#9-ide設定)
10. [トラブルシューティング](#10-トラブルシューティング)

---

## 1. 前提条件

### 1.1. 必要なソフトウェア

| ソフトウェア | バージョン | 確認コマンド |
|-------------|-----------|-------------|
| Python | 3.11以上 | `python --version` |
| pip | 最新推奨 | `pip --version` |
| Git | 任意 | `git --version` |

### 1.2. 推奨環境

| 項目 | 推奨 |
|------|------|
| OS | macOS, Linux, Windows (WSL2推奨) |
| メモリ | 8GB以上 |
| ディスク | 2GB以上の空き容量（Playwright含む） |

### 1.3. 必要なアカウント・APIキー

| サービス | 必須 | 取得方法 |
|----------|------|---------|
| Gemini API | Yes | [Google AI Studio](https://makersuite.google.com/app/apikey) |
| GitHub | No（推奨） | [Personal Access Token](https://github.com/settings/tokens) |

---

## 2. リポジトリのクローン

```bash
# HTTPSでクローン
git clone https://github.com/your-username/proposal-generator.git

# SSHでクローン
git clone git@github.com:your-username/proposal-generator.git

# ディレクトリに移動
cd proposal-generator
```

---

## 3. Python環境のセットアップ

### 3.1. pyenvを使用する場合（推奨）

```bash
# pyenvでPython 3.11をインストール
pyenv install 3.11.5

# プロジェクトでPython 3.11を使用
pyenv local 3.11.5

# 確認
python --version
# Python 3.11.5
```

### 3.2. venvで仮想環境を作成

```bash
# 仮想環境を作成
python -m venv .venv

# 仮想環境を有効化（macOS/Linux）
source .venv/bin/activate

# 仮想環境を有効化（Windows PowerShell）
.\.venv\Scripts\Activate.ps1

# 仮想環境を有効化（Windows CMD）
.\.venv\Scripts\activate.bat

# 確認（仮想環境内のPythonを使用していることを確認）
which python
# /path/to/proposal-generator/.venv/bin/python
```

### 3.3. pipのアップグレード

```bash
pip install --upgrade pip
```

---

## 4. 依存関係のインストール

### 4.1. 本番依存関係のインストール

```bash
pip install -e .
```

### 4.2. 開発依存関係のインストール

```bash
pip install -e ".[dev]"
```

### 4.3. インストールされるパッケージ

**本番依存**:
- playwright
- google-generativeai
- httpx
- typer
- pyyaml
- python-dotenv
- pyperclip
- rich

**開発依存**:
- pytest
- pytest-asyncio
- black
- isort
- ruff
- mypy

### 4.4. 依存関係の確認

```bash
pip list
```

---

## 5. Playwrightのセットアップ

### 5.1. ブラウザのインストール

```bash
# Chromiumをインストール（推奨）
playwright install chromium

# 全ブラウザをインストール（オプション）
playwright install
```

### 5.2. システム依存関係のインストール（Linux）

```bash
# Ubuntu/Debian
playwright install-deps chromium

# または全ブラウザの依存関係
playwright install-deps
```

### 5.3. 動作確認

```bash
# Playwrightの動作確認
python -c "from playwright.sync_api import sync_playwright; print('Playwright OK')"
```

---

## 6. 環境変数の設定

### 6.1. .envファイルの作成

```bash
# サンプルファイルをコピー
cp .env.example .env

# エディタで編集
vim .env  # または任意のエディタ
```

### 6.2. .envファイルの内容

```env
# Gemini API Key (Required)
# https://makersuite.google.com/app/apikey で取得
GEMINI_API_KEY=your_gemini_api_key_here

# GitHub Token (Optional)
# https://github.com/settings/tokens で取得
# スコープ: repo (read-only) を推奨
GITHUB_TOKEN=your_github_token_here

# Log Level (Optional)
# DEBUG / INFO / WARNING / ERROR
PROPOSAL_GEN_LOG_LEVEL=INFO
```

### 6.3. 環境変数の確認

```bash
# 設定されていることを確認（値は表示されない）
python -c "import os; print('GEMINI_API_KEY:', 'Set' if os.getenv('GEMINI_API_KEY') else 'Not set')"
```

---

## 7. 設定ファイルの準備

### 7.1. 設定ファイルの作成

```bash
# 設定ディレクトリを作成
mkdir -p config

# サンプルファイルをコピー
cp config/settings.yaml.example config/settings.yaml
cp config/profile.yaml.example config/profile.yaml
```

### 7.2. settings.yamlの編集

```yaml
# config/settings.yaml

version: "1.0"

github:
  username: "your-github-username"  # ← 自分のGitHubユーザー名に変更

gemini:
  model: "gemini-pro"
  temperature: 0.7

scraping:
  headless: true
  human_like:
    enabled: true

default_profile: "default"
```

### 7.3. profile.yamlの編集

```yaml
# config/profile.yaml

version: "1.0"

profiles:
  default:
    name: "メインプロフィール"
    introduction:
      greeting: |
        はじめまして。ご依頼内容を拝見し、ご提案させていただきます。
      self_intro: |
        # ← 自分の経歴・スキルに変更
        私は○年の開発経験を持つエンジニアです。
    # ... 以下省略
```

---

## 8. 動作確認

### 8.1. ユニットテストの実行

```bash
# 全テスト実行
pytest

# 詳細出力
pytest -v

# 特定のテストのみ
pytest tests/test_config/
```

### 8.2. リンター・フォーマッターの実行

```bash
# コードフォーマット
black src/ tests/
isort src/ tests/

# リンター
ruff check src/ tests/

# 型チェック
mypy src/
```

### 8.3. CLIの動作確認

```bash
# ヘルプ表示
python -m src.main --help

# バージョン表示
python -m src.main version

# 設定確認
python -m src.main config show
```

### 8.4. 実際の生成テスト（オプション）

```bash
# dry-runで動作確認（実際のAPI呼び出しは行わない）
python -m src.main https://www.lancers.jp/work/detail/XXXXX --dry-run -v
```

---

## 9. IDE設定

### 9.1. VS Code

#### 推奨拡張機能

```json
// .vscode/extensions.json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "charliermarsh.ruff"
  ]
}
```

#### 設定

```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/.venv/bin/python",
  "python.analysis.typeCheckingMode": "basic",
  "[python]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.codeActionsOnSave": {
      "source.organizeImports": true
    }
  },
  "ruff.lint.enable": true
}
```

### 9.2. PyCharm

1. **インタープリターの設定**
   - Settings → Project → Python Interpreter
   - `.venv` 内のPythonを選択

2. **Black/isortの設定**
   - Settings → Tools → Black
   - Settings → Editor → Code Style → Python → Imports

3. **pytest の設定**
   - Settings → Tools → Python Integrated Tools
   - Default test runner: pytest

---

## 10. トラブルシューティング

### 10.1. Python バージョンエラー

```
Error: Python 3.11+ is required
```

**解決方法**:
```bash
# pyenvでインストール
pyenv install 3.11.5
pyenv local 3.11.5
```

### 10.2. Playwright インストールエラー

```
playwright._impl._errors.Error: Executable doesn't exist at ...
```

**解決方法**:
```bash
# ブラウザを再インストール
playwright install chromium

# Linux の場合は依存関係も
playwright install-deps chromium
```

### 10.3. 仮想環境が認識されない

```bash
# 仮想環境を再作成
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

### 10.4. モジュールが見つからない

```
ModuleNotFoundError: No module named 'src'
```

**解決方法**:
```bash
# 開発モードで再インストール
pip install -e .
```

### 10.5. 型チェックエラー

```bash
# mypyのキャッシュをクリア
rm -rf .mypy_cache
mypy src/
```

---

## 次のステップ

- [コーディング規約](./coding-standards.md) を確認
- [テスト戦略](./testing.md) を確認
- [アーキテクチャ](../design/architecture.md) を理解

---

## 関連ドキュメント

- [インストールガイド](../guides/installation.md)（エンドユーザー向け）
- [コーディング規約](./coding-standards.md)
- [テスト戦略](./testing.md)
