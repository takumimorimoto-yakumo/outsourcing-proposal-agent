# proposal-generator

クラウドソーシング案件向け提案文自動生成CLIツール

## 概要

ランサーズ・クラウドワークスの案件情報を取得し、**案件内容に最適化された提案文**を自動生成するCLIツールです。

## 特徴

- 案件ページから自動で情報を取得（Playwright）
- GitHubリポジトリ情報を活用した技術力アピール
- Gemini AIによる高品質な提案文生成
- カスタマイズ可能なテンプレート

## インストール

### 前提条件

- Python 3.11以上
- Gemini APIキー（[Google AI Studio](https://makersuite.google.com/app/apikey)で取得）

### pipでインストール

```bash
pip install proposal-generator

# Playwrightブラウザのインストール
playwright install chromium
```

### 開発用インストール

```bash
git clone https://github.com/your-username/proposal-generator.git
cd proposal-generator

# 仮想環境を作成
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\activate

# 開発用依存関係をインストール
pip install -e ".[dev]"

# Playwrightブラウザのインストール
playwright install chromium
```

## セットアップ

### 1. 環境変数の設定

```bash
export GEMINI_API_KEY="your_api_key_here"
export GITHUB_TOKEN="your_github_token_here"  # オプション
```

### 2. 設定ファイルの作成

```bash
# 設定ファイルを初期化
proposal-gen config init

# または手動でコピー
cp config/settings.yaml.example config/settings.yaml
cp config/profile.yaml.example config/profile.yaml
```

### 3. 設定ファイルを編集

`config/settings.yaml`:
```yaml
github:
  username: "your-github-username"  # 自分のユーザー名に変更
```

`config/profile.yaml`:
```yaml
profiles:
  default:
    introduction:
      self_intro: |
        # 自分の経歴・スキルに変更
```

## 使い方

### 基本的な使用

```bash
# ランサーズの案件から提案文を生成
proposal-gen https://www.lancers.jp/work/detail/XXXXXX

# クラウドワークスの案件から提案文を生成
proposal-gen https://crowdworks.jp/public/jobs/XXXXXX
```

### オプション

```bash
# ファイルに出力
proposal-gen <URL> --output proposal.txt

# クリップボードにコピー
proposal-gen <URL> --copy

# 詳細ログを表示
proposal-gen <URL> --verbose

# チームプロフィールを使用
proposal-gen <URL> --profile team

# GitHub情報を使用しない
proposal-gen <URL> --no-github
```

### 設定管理

```bash
# 現在の設定を表示
proposal-gen config show

# 設定ファイルを検証
proposal-gen config validate

# バージョンを表示
proposal-gen version
```

## 提案文の構成

生成される提案文は6パートで構成されます：

1. **挨拶・自己紹介** [固定文]
2. **案件への理解・共感** [AI生成]
3. **提案内容・アプローチ** [AI生成]
4. **技術力・実績** [AI生成 + GitHub情報]
5. **スケジュール・見積もり** [AI生成]
6. **締めの挨拶** [固定文]

## ドキュメント

詳細なドキュメントは [docs/](./docs/) を参照してください。

- [クイックリファレンス](./docs/00-quick-reference.md)
- [インストールガイド](./docs/guides/installation.md)
- [設定仕様](./docs/specs/config.md)
- [CLI詳細仕様](./docs/specs/cli.md)

## 開発

### テストの実行

```bash
# 全テスト
pytest

# カバレッジ付き
pytest --cov=src
```

### コードフォーマット

```bash
black src/ tests/
isort src/ tests/
ruff check src/ tests/
```

### 型チェック

```bash
mypy src/
```

## 注意事項

- 各クラウドソーシングサービスの利用規約を遵守してください
- 短時間での大量アクセスは避けてください
- 生成された提案文は送信前に内容を確認してください

## ライセンス

MIT License

## 貢献

Issue、Pull Request を歓迎します。

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。
