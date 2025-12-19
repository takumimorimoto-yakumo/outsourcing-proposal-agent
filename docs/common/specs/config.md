# 設定仕様

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [設定ファイル一覧](#2-設定ファイル一覧)
3. [settings.yaml](#3-settingsyaml)
4. [profile.yaml](#4-profileyaml)
5. [環境変数](#5-環境変数)
6. [設定の優先順位](#6-設定の優先順位)
7. [バリデーション](#7-バリデーション)

---

## 1. 概要

### 1.1. 設定の分類

| 分類 | 管理場所 | 内容 |
|------|---------|------|
| 認証情報 | 環境変数 / settings.yaml | APIキー |
| システム設定 | settings.yaml | GitHub username、デフォルト設定 |
| コンテンツ | profile.yaml | 固定文、テンプレート |

### 1.2. 設定ファイルの配置

```
~/.proposal-gen/
├── settings.yaml    # システム設定
└── profile.yaml     # 固定文・プロフィール
```

または、プロジェクトルートの `config/` ディレクトリ:

```
proposal-generator/
└── config/
    ├── settings.yaml
    └── profile.yaml
```

### 1.3. 読み込み優先順位

1. コマンドライン引数（`--config`で指定した場合）
2. カレントディレクトリの `config/`
3. ホームディレクトリの `~/.proposal-gen/`
4. デフォルト値

---

## 2. 設定ファイル一覧

| ファイル | 必須 | 説明 |
|---------|------|------|
| `settings.yaml` | Yes | システム設定、GitHub username |
| `profile.yaml` | Yes | 固定文テンプレート |
| `.env` | No | 環境変数（APIキー） |

---

## 3. settings.yaml

### 3.1. 完全な定義

```yaml
# settings.yaml - システム設定

# バージョン（互換性確認用）
version: "1.0"

# GitHub設定
github:
  # GitHubユーザー名（必須）
  username: "your-github-username"

  # GitHubトークン（オプション、環境変数推奨）
  # token: "ghp_xxxx"  # 環境変数 GITHUB_TOKEN を推奨

# Gemini API設定
gemini:
  # モデル名
  model: "gemini-pro"

  # 生成パラメータ
  temperature: 0.7
  top_p: 0.9
  max_output_tokens: 2048

# スクレイピング設定
scraping:
  # ヘッドレスモード（true: バックグラウンド実行）
  headless: true

  # 人間らしい振る舞い
  human_like:
    enabled: true
    min_delay: 2.0  # 最小待機時間（秒）
    max_delay: 4.0  # 最大待機時間（秒）

  # タイムアウト（ミリ秒）
  timeout:
    page_load: 30000
    element_wait: 10000

  # リトライ設定
  retry:
    max_attempts: 3
    delay: 5

# 出力設定
output:
  # デフォルトの出力先（stdout / clipboard / file）
  default: "stdout"

  # ファイル出力時のデフォルトディレクトリ
  directory: "~/proposals"

# ログ設定
logging:
  # ログレベル（DEBUG / INFO / WARNING / ERROR）
  level: "INFO"

  # ファイル出力
  file:
    enabled: false
    path: "~/.proposal-gen/logs/proposal-gen.log"

# デフォルトプロフィール
default_profile: "default"
```

### 3.2. 必須項目

| 項目 | パス | デフォルト値 |
|------|------|-------------|
| GitHubユーザー名 | `github.username` | なし（必須） |

### 3.3. オプション項目とデフォルト値

| 項目 | パス | デフォルト値 |
|------|------|-------------|
| Geminiモデル | `gemini.model` | `"gemini-pro"` |
| temperature | `gemini.temperature` | `0.7` |
| ヘッドレスモード | `scraping.headless` | `true` |
| 人間らしい振る舞い | `scraping.human_like.enabled` | `true` |
| ログレベル | `logging.level` | `"INFO"` |

---

## 4. profile.yaml

### 4.1. 完全な定義

```yaml
# profile.yaml - 固定文・プロフィール設定

# バージョン
version: "1.0"

# プロフィール一覧
profiles:
  # デフォルトプロフィール
  default:
    # プロフィール名（表示用）
    name: "メインプロフィール"

    # 挨拶・自己紹介（Part 1）
    introduction:
      greeting: |
        はじめまして。ご依頼内容を拝見し、ご提案させていただきます。

      self_intro: |
        私は5年以上のWeb開発経験を持つフルスタックエンジニアです。
        フロントエンドからバックエンド、インフラまで一貫して対応可能です。

        【主な経験】
        - ECサイト構築（React/Next.js + Node.js）
        - 業務システム開発（Python/Django）
        - データ収集・分析基盤構築

    # スケジュール・見積もり（Part 5 の補足）
    schedule:
      availability: |
        ご依頼いただければ、即日着手可能です。

      working_hours: |
        平日・土日ともに対応可能で、1日4〜6時間程度の稼働が可能です。

    # 締めの挨拶（Part 6）
    closing:
      contact: |
        ご不明点がございましたら、お気軽にご質問ください。
        メッセージには24時間以内に返信いたします。

      farewell: |
        ご検討のほど、よろしくお願いいたします。

  # チーム用プロフィール
  team:
    name: "チームプロフィール"

    introduction:
      greeting: |
        はじめまして。ご依頼内容を拝見し、弊チームよりご提案させていただきます。

      self_intro: |
        私たちは3名のエンジニアで構成されたフリーランスチームです。
        フロントエンド、バックエンド、インフラの専門家が在籍しており、
        ワンストップでの開発が可能です。

        【チーム構成】
        - フロントエンドエンジニア（React/Vue.js 専門）
        - バックエンドエンジニア（Python/Go 専門）
        - インフラエンジニア（AWS/GCP 専門）

    schedule:
      availability: |
        チーム体制のため、即日着手・並行作業が可能です。

      working_hours: |
        平日9:00〜18:00を中心に、必要に応じて土日も対応いたします。

    closing:
      contact: |
        ご不明点がございましたら、お気軽にご質問ください。
        プロジェクトマネージャーが窓口として迅速に対応いたします。

      farewell: |
        ご検討のほど、よろしくお願いいたします。

# カテゴリ別テンプレート
category_templates:
  web_development:
    strength: |
      Web開発においては、レスポンシブデザインの実装、
      SEO最適化、Core Web Vitalsを意識したパフォーマンス改善を
      得意としております。

    approach_hints:
      - "モバイルファーストでの設計"
      - "アクセシビリティへの配慮"
      - "セキュリティベストプラクティスの適用"

  app_development:
    strength: |
      アプリ開発においては、ユーザビリティを重視した
      UI/UX設計と、iOS/Android両対応の効率的な開発を
      得意としております。

    approach_hints:
      - "クロスプラットフォーム開発の検討"
      - "ストア申請のサポート"
      - "プッシュ通知・分析基盤の導入"

  scraping:
    strength: |
      スクレイピングにおいては、大規模データ収集、
      アンチスクレイピング対策、データ品質管理を
      得意としております。

    approach_hints:
      - "robots.txtの遵守"
      - "適切なリクエスト間隔の設定"
      - "データ形式の正規化・クレンジング"

  automation:
    strength: |
      自動化においては、業務フローの分析から実装、
      運用までを一貫してサポートし、定量的な効果測定も
      行っております。

    approach_hints:
      - "既存業務の可視化・分析"
      - "段階的な自動化の提案"
      - "エラーハンドリングとリカバリー"

  data_analysis:
    strength: |
      データ分析においては、統計分析からビジネスインサイトの
      導出、わかりやすい可視化レポートの作成を
      得意としております。

    approach_hints:
      - "分析目的の明確化"
      - "データ品質の確認・前処理"
      - "アクショナブルな示唆の提示"

  ai_ml:
    strength: |
      AI・機械学習においては、課題に適したモデル選定から
      学習・評価、本番環境へのデプロイまで対応可能です。

    approach_hints:
      - "既存手法との比較検討"
      - "精度とコストのトレードオフ"
      - "継続的な学習・改善の仕組み"

  other:
    strength: |
      幅広い技術領域での開発経験があり、
      新しい技術のキャッチアップも得意としております。

    approach_hints:
      - "要件の丁寧なヒアリング"
      - "段階的なデリバリー"
      - "密なコミュニケーション"
```

### 4.2. プロフィールの切り替え

```bash
# デフォルトプロフィールを使用
proposal-gen <URL>

# チームプロフィールを使用
proposal-gen <URL> --profile team
```

---

## 5. 環境変数

### 5.1. 対応環境変数

| 環境変数 | 必須 | 説明 |
|---------|------|------|
| `GEMINI_API_KEY` | Yes | Gemini APIキー |
| `GITHUB_TOKEN` | No | GitHubアクセストークン（レート制限緩和） |
| `PROPOSAL_GEN_CONFIG` | No | 設定ファイルのパス |

### 5.2. .env.example

```env
# Gemini API Key (Required)
# https://makersuite.google.com/app/apikey で取得
GEMINI_API_KEY=your_gemini_api_key_here

# GitHub Token (Optional)
# https://github.com/settings/tokens で取得
# 認証なし: 60 req/h、認証あり: 5,000 req/h
GITHUB_TOKEN=your_github_token_here

# Config Path (Optional)
# デフォルト: ~/.proposal-gen/ または ./config/
# PROPOSAL_GEN_CONFIG=/path/to/config
```

### 5.3. 環境変数の読み込み

```python
import os
from dotenv import load_dotenv

# .envファイルを読み込み
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
```

---

## 6. 設定の優先順位

### 6.1. 読み込み優先順位（高い順）

1. **コマンドライン引数**
   ```bash
   proposal-gen <URL> --profile team
   ```

2. **環境変数**
   ```bash
   export GEMINI_API_KEY=xxx
   ```

3. **カレントディレクトリの設定ファイル**
   ```
   ./config/settings.yaml
   ```

4. **ホームディレクトリの設定ファイル**
   ```
   ~/.proposal-gen/settings.yaml
   ```

5. **デフォルト値**

### 6.2. 設定のマージ

- 同じキーは優先度の高い値で上書き
- 存在しないキーはデフォルト値を使用

---

## 7. バリデーション

### 7.1. 必須チェック

| 項目 | チェック内容 |
|------|-------------|
| `GEMINI_API_KEY` | 環境変数または設定ファイルに存在 |
| `github.username` | settings.yamlに存在 |
| `profiles.default` | profile.yamlに存在 |

### 7.2. 形式チェック

| 項目 | 形式 |
|------|------|
| `gemini.temperature` | 0.0〜1.0の数値 |
| `scraping.timeout.*` | 正の整数（ミリ秒） |
| `logging.level` | DEBUG/INFO/WARNING/ERROR のいずれか |

### 7.3. エラーメッセージ例

```
Error: 設定ファイルの検証に失敗しました。

[settings.yaml]
- github.username: 必須項目が設定されていません
- gemini.temperature: 0.0〜1.0の範囲で指定してください（現在値: 1.5）

設定ファイルを修正してください:
  ~/.proposal-gen/settings.yaml
```

---

## 関連ドキュメント

- [非機能要件](../requirements/non-functional.md)
- [提案文生成仕様](./generation.md)
