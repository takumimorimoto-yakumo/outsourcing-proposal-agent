# トラブルシューティング

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [インストール関連](#1-インストール関連)
2. [設定関連](#2-設定関連)
3. [スクレイピング関連](#3-スクレイピング関連)
4. [API関連](#4-api関連)
5. [生成関連](#5-生成関連)
6. [その他](#6-その他)

---

## 1. インストール関連

### 1.1. Python バージョンエラー

**エラー**:
```
Error: Python 3.11+ is required. Current version: 3.9.x
```

**原因**: Python 3.11未満のバージョンを使用している

**解決方法**:
```bash
# pyenvを使用してPython 3.11をインストール
pyenv install 3.11.5
pyenv global 3.11.5

# または、公式サイトからインストール
# https://www.python.org/downloads/
```

---

### 1.2. Playwright インストールエラー

**エラー**:
```
playwright._impl._errors.Error: Executable doesn't exist at /path/to/chromium
```

**原因**: Playwrightのブラウザがインストールされていない

**解決方法**:
```bash
# ブラウザをインストール
playwright install chromium

# Linuxの場合は依存関係も
playwright install-deps chromium
```

---

### 1.3. pip インストールエラー

**エラー**:
```
ERROR: Could not find a version that satisfies the requirement proposal-generator
```

**原因**: パッケージが見つからない、またはPythonバージョンの不一致

**解決方法**:
```bash
# pipをアップグレード
pip install --upgrade pip

# 正しいPythonバージョンを確認
python --version

# 仮想環境を使用
python -m venv .venv
source .venv/bin/activate
pip install proposal-generator
```

---

### 1.4. 権限エラー (Linux/macOS)

**エラー**:
```
PermissionError: [Errno 13] Permission denied
```

**解決方法**:
```bash
# sudoを使用せず、ユーザー権限でインストール
pip install --user proposal-generator

# または仮想環境を使用（推奨）
python -m venv .venv
source .venv/bin/activate
pip install proposal-generator
```

---

## 2. 設定関連

### 2.1. APIキー未設定エラー

**エラー**:
```
Error: Gemini APIキーが設定されていません。
```

**解決方法**:

```bash
# 方法1: 環境変数で設定
export GEMINI_API_KEY="your_api_key_here"

# 方法2: 設定ファイルに追加
proposal-gen config edit --settings
# gemini.api_key を追加
```

**APIキーの取得**:
1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. 「Create API Key」でキーを生成

---

### 2.2. 設定ファイルが見つからない

**エラー**:
```
Error: 設定ファイルが見つかりません: ~/.proposal-gen/settings.yaml
```

**解決方法**:
```bash
# 設定ファイルを初期化
proposal-gen config init

# または手動で作成
mkdir -p ~/.proposal-gen
cat > ~/.proposal-gen/settings.yaml << 'EOF'
version: "1.0"
github:
  username: "your-github-username"
gemini:
  model: "gemini-pro"
EOF
```

---

### 2.3. YAML構文エラー

**エラー**:
```
Error: 設定ファイルの解析に失敗しました
yaml.scanner.ScannerError: while scanning...
```

**原因**: YAMLの構文が不正

**解決方法**:
1. インデントがスペース（タブではない）か確認
2. コロンの後にスペースがあるか確認
3. 文字列にコロンが含まれる場合はクォートで囲む

```yaml
# Bad
key:value

# Good
key: value

# Bad（コロンを含む値）
url: https://example.com

# Good
url: "https://example.com"
```

---

### 2.4. プロフィールが見つからない

**エラー**:
```
Error: プロフィールが見つかりません: team
```

**解決方法**:
```bash
# 利用可能なプロフィールを確認
proposal-gen config show

# プロフィールを追加
proposal-gen config edit --profile
```

---

## 3. スクレイピング関連

### 3.1. ページが見つからない (404)

**エラー**:
```
Error: 案件ページが見つかりません (404)
URL: https://www.lancers.jp/work/detail/XXXXX
```

**原因**:
- 案件が削除された
- URLが間違っている
- 案件が非公開になった

**解決方法**:
1. URLが正しいか確認
2. ブラウザで直接URLにアクセスして確認
3. 別の案件URLを試す

---

### 3.2. タイムアウトエラー

**エラー**:
```
Error: ページの読み込みがタイムアウトしました
```

**原因**:
- ネットワーク接続が遅い
- サイトの応答が遅い

**解決方法**:
```yaml
# settings.yaml でタイムアウトを延長
scraping:
  timeout:
    page_load: 60000  # 60秒に延長
    element_wait: 20000
```

---

### 3.3. アクセス拒否 (403)

**エラー**:
```
Error: アクセスが拒否されました (403)
```

**原因**:
- アクセス制限がかかっている
- 短時間に多くのリクエストを送った

**解決方法**:
1. しばらく待ってから再試行（5-10分）
2. 人間らしい振る舞いを有効化:

```yaml
# settings.yaml
scraping:
  human_like:
    enabled: true
    min_delay: 3.0
    max_delay: 6.0
```

---

### 3.4. ログイン必要エラー

**エラー**:
```
Error: この案件を閲覧するにはログインが必要です
```

**原因**: ログインが必要な案件にアクセスしようとした

**解決方法**:
- 現時点ではログインが必要な案件には対応していません
- 公開案件のURLを使用してください

---

### 3.5. 要素が見つからない

**エラー**:
```
Error: 要素が見つかりません: .job-title
```

**原因**:
- サイトの構造が変更された
- ページが正しく読み込まれていない

**解決方法**:
1. 最新版にアップデート:
   ```bash
   pip install --upgrade proposal-generator
   ```
2. Issue を報告（サイト構造変更の可能性）

---

## 4. API関連

### 4.1. Gemini API エラー

**エラー**:
```
Error: Gemini APIの呼び出しに失敗しました
google.api_core.exceptions.InvalidArgument: API key not valid
```

**原因**: APIキーが無効

**解決方法**:
1. [Google AI Studio](https://makersuite.google.com/app/apikey) で新しいキーを生成
2. 環境変数を更新:
   ```bash
   export GEMINI_API_KEY="new_api_key_here"
   ```

---

### 4.2. Gemini API レート制限

**エラー**:
```
Error: Gemini APIのレート制限に達しました
```

**原因**: 短時間に多くのリクエストを送信した

**解決方法**:
1. しばらく待ってから再試行（1-2分）
2. 連続実行を避ける

---

### 4.3. GitHub API エラー

**エラー**:
```
Warning: GitHub情報の取得に失敗しました
```

**原因**:
- GitHub ユーザー名が間違っている
- レート制限に達した

**解決方法**:
```bash
# ユーザー名を確認
proposal-gen config show

# レート制限を確認
curl -s https://api.github.com/rate_limit | grep remaining

# トークンを設定してレート制限を緩和
export GITHUB_TOKEN="your_token_here"
```

---

### 4.4. GitHub API レート制限

**エラー**:
```
Warning: GitHub APIのレート制限に達しました (0/60)
```

**原因**: 認証なしでの上限（60回/時間）に達した

**解決方法**:
```bash
# GitHubトークンを設定（5000回/時間に増加）
export GITHUB_TOKEN="your_github_token_here"
```

---

## 5. 生成関連

### 5.1. 生成された文字数が少ない

**症状**: 提案文が1000文字未満

**原因**:
- 案件情報が少ない
- temperature が低すぎる

**解決方法**:
```yaml
# settings.yaml
gemini:
  temperature: 0.8  # 少し高めに設定
```

---

### 5.2. 生成された内容が案件と関連しない

**原因**:
- スクレイピングで案件情報が正しく取得できていない

**解決方法**:
```bash
# 詳細ログで確認
proposal-gen <URL> -v --dry-run
```

---

### 5.3. 品質チェックで再生成が繰り返される

**症状**: 3回再生成しても品質チェックを通過しない

**原因**:
- 案件情報が複雑すぎる
- 品質基準が厳しすぎる

**解決方法**:
- 別の案件で試す
- `--no-quality-check` オプションを使用（将来実装予定）

---

## 6. その他

### 6.1. クリップボードにコピーできない

**エラー**:
```
Error: クリップボードへのコピーに失敗しました
```

**原因**:
- Linux: xclip/xsel がインストールされていない
- ヘッドレス環境

**解決方法**:
```bash
# Ubuntu/Debian
sudo apt-get install xclip

# または、ファイルに出力
proposal-gen <URL> -o proposal.txt
```

---

### 6.2. ログが表示されない

**解決方法**:
```bash
# 詳細ログを有効化
proposal-gen <URL> -v

# または環境変数で設定
export PROPOSAL_GEN_LOG_LEVEL=DEBUG
```

---

### 6.3. 文字化け

**原因**: 端末のエンコーディング設定

**解決方法**:
```bash
# UTF-8を設定
export LANG=ja_JP.UTF-8
export LC_ALL=ja_JP.UTF-8
```

---

### 6.4. メモリ不足

**エラー**:
```
MemoryError または OSError: [Errno 12] Cannot allocate memory
```

**原因**: Playwright（Chromium）がメモリを消費

**解決方法**:
1. 他のアプリケーションを終了
2. ヘッドレスモードを確認:
   ```yaml
   scraping:
     headless: true
   ```

---

## 問題が解決しない場合

### デバッグ情報の収集

```bash
# バージョン情報
proposal-gen version

# 設定情報
proposal-gen config show

# 詳細ログで実行
proposal-gen <URL> -v 2>&1 | tee debug.log
```

### Issue の報告

[GitHub Issues](https://github.com/your-username/proposal-generator/issues) に以下を含めて報告:

1. エラーメッセージ（全文）
2. 実行したコマンド
3. バージョン情報 (`proposal-gen version`)
4. OS・Python バージョン
5. 再現手順

---

## 関連ドキュメント

- [インストールガイド](./installation.md)
- [設定仕様](../specs/config.md)
- [CLI詳細仕様](../specs/cli.md)
- [FAQ](./faq.md)
