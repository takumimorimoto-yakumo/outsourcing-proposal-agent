# GitHub連携仕様

**最終更新**: 2025-12-12
**バージョン**: 1.0

---

## 目次

1. [概要](#1-概要)
2. [API仕様](#2-api仕様)
3. [取得項目](#3-取得項目)
4. [技術マッチング](#4-技術マッチング)
5. [レート制限対応](#5-レート制限対応)
6. [エラーハンドリング](#6-エラーハンドリング)
7. [データモデル](#7-データモデル)

---

## 1. 概要

### 1.1. 目的

GitHub REST APIを使用して、技術力・実績をアピールするための情報を取得する。

### 1.2. 使用API

| API | 用途 |
|-----|------|
| GitHub REST API v3 | ユーザー情報、リポジトリ情報の取得 |

### 1.3. 認証

| 認証方式 | レート制限 | 推奨 |
|----------|-----------|------|
| 認証なし | 60 requests/hour | 個人利用 |
| Personal Access Token | 5,000 requests/hour | チーム利用 |

---

## 2. API仕様

### 2.1. 使用エンドポイント

| エンドポイント | 用途 | メソッド |
|---------------|------|---------|
| `/users/{username}` | ユーザー情報取得 | GET |
| `/users/{username}/repos` | リポジトリ一覧取得 | GET |
| `/repos/{owner}/{repo}/languages` | 言語情報取得 | GET |

### 2.2. リクエストヘッダー

```python
headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "proposal-generator",
}

# 認証ありの場合
if github_token:
    headers["Authorization"] = f"token {github_token}"
```

### 2.3. ユーザー情報取得

```
GET https://api.github.com/users/{username}
```

**レスポンス例**:
```json
{
  "login": "example-user",
  "name": "Example User",
  "bio": "Full-stack developer",
  "company": "Example Inc.",
  "location": "Tokyo, Japan",
  "public_repos": 30,
  "followers": 100,
  "created_at": "2015-01-01T00:00:00Z"
}
```

### 2.4. リポジトリ一覧取得

```
GET https://api.github.com/users/{username}/repos?sort=updated&per_page=100
```

**クエリパラメータ**:
| パラメータ | 値 | 説明 |
|-----------|-----|------|
| `sort` | `updated` | 更新日順 |
| `per_page` | `100` | 取得件数（最大100） |
| `type` | `owner` | 所有リポジトリのみ |

### 2.5. 言語情報取得

```
GET https://api.github.com/repos/{owner}/{repo}/languages
```

**レスポンス例**:
```json
{
  "Python": 50000,
  "JavaScript": 30000,
  "TypeScript": 20000
}
```

---

## 3. 取得項目

### 3.1. ユーザー情報

| 項目 | APIフィールド | 用途 |
|------|--------------|------|
| ユーザー名 | `login` | 表示用 |
| 表示名 | `name` | 表示用 |
| 自己紹介 | `bio` | プロフィール |
| 会社名 | `company` | 信頼性 |
| 公開リポジトリ数 | `public_repos` | 実績 |
| フォロワー数 | `followers` | 影響力 |
| アカウント作成日 | `created_at` | 経験年数 |

### 3.2. リポジトリ情報

| 項目 | APIフィールド | 用途 |
|------|--------------|------|
| リポジトリ名 | `name` | 表示用 |
| 説明 | `description` | 内容把握 |
| 言語 | `language` | 技術スタック |
| スター数 | `stargazers_count` | 人気度 |
| フォーク数 | `forks_count` | 利用度 |
| 更新日 | `updated_at` | アクティブ度 |
| トピック | `topics` | 技術タグ |

### 3.3. 言語統計

全リポジトリの言語情報を集計し、以下を算出:

| 項目 | 説明 |
|------|------|
| 言語別バイト数 | 各言語のコード量 |
| 言語別割合 | 全体に対する割合 |
| 上位N言語 | 主要言語リスト |

---

## 4. 技術マッチング

### 4.1. 目的

案件で求められる技術と、GitHubから取得した技術情報をマッチングし、関連度の高いリポジトリを抽出する。

### 4.2. マッチングロジック

```python
def match_skills(job_skills: list[str], repos: list[RepoInfo]) -> list[RepoInfo]:
    """案件スキルとリポジトリをマッチング"""
    matched = []

    for repo in repos:
        score = 0
        # 言語マッチ
        if repo.language and repo.language.lower() in [s.lower() for s in job_skills]:
            score += 3
        # トピックマッチ
        for topic in repo.topics:
            if topic.lower() in [s.lower() for s in job_skills]:
                score += 2
        # 説明文マッチ
        if repo.description:
            for skill in job_skills:
                if skill.lower() in repo.description.lower():
                    score += 1

        if score > 0:
            matched.append((repo, score))

    # スコア順にソートして返却
    return [repo for repo, _ in sorted(matched, key=lambda x: -x[1])]
```

### 4.3. 技術名の正規化

| 入力例 | 正規化後 |
|--------|---------|
| `javascript`, `JS` | `JavaScript` |
| `typescript`, `TS` | `TypeScript` |
| `python`, `py` | `Python` |
| `react.js`, `reactjs` | `React` |
| `next.js`, `nextjs` | `Next.js` |
| `node.js`, `nodejs` | `Node.js` |

### 4.4. 抽出ルール

| ルール | 説明 |
|--------|------|
| 最大件数 | 関連リポジトリは最大5件 |
| スター優先 | 同スコアならスター数が多い方を優先 |
| 最新優先 | 同スコアなら更新が新しい方を優先 |
| フォーク除外 | フォークしたリポジトリは除外 |

---

## 5. レート制限対応

### 5.1. レート制限確認

```python
async def check_rate_limit(client: httpx.AsyncClient) -> dict:
    """レート制限状況を確認"""
    response = await client.get("https://api.github.com/rate_limit")
    data = response.json()
    return {
        "limit": data["rate"]["limit"],
        "remaining": data["rate"]["remaining"],
        "reset": data["rate"]["reset"],  # Unix timestamp
    }
```

### 5.2. 制限時の挙動

| 残りリクエスト数 | 挙動 |
|-----------------|------|
| > 10 | 通常処理 |
| 1-10 | 警告ログ出力 |
| 0 | GitHub情報なしで続行（警告表示） |

### 5.3. キャッシュ

| 対象 | キャッシュ時間 | 目的 |
|------|--------------|------|
| ユーザー情報 | 24時間 | レート制限節約 |
| リポジトリ一覧 | 1時間 | レート制限節約 |

※ v1.0ではキャッシュ機能はスコープ外

---

## 6. エラーハンドリング

### 6.1. エラー種別

| HTTPステータス | 原因 | 対応 |
|---------------|------|------|
| 404 | ユーザーが存在しない | 警告表示、GitHub情報なしで続行 |
| 403 | レート制限超過 | 警告表示、GitHub情報なしで続行 |
| 401 | 認証エラー（トークン無効） | 警告表示、認証なしで再試行 |
| 5xx | サーバーエラー | リトライ後、失敗なら警告 |

### 6.2. フォールバック

GitHub情報の取得に失敗した場合:
1. 警告ログを出力
2. GitHub情報なしで提案文生成を続行
3. 提案文の「技術力・実績」セクションは固定文のみで構成

---

## 7. データモデル

### 7.1. GitHubProfile

```python
from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class GitHubProfile:
    """GitHubユーザー情報"""
    username: str
    name: Optional[str]
    bio: Optional[str]
    company: Optional[str]
    public_repos: int
    followers: int
    created_at: datetime
```

### 7.2. RepoInfo

```python
@dataclass
class RepoInfo:
    """リポジトリ情報"""
    name: str
    description: Optional[str]
    language: Optional[str]
    stars: int
    forks: int
    updated_at: datetime
    topics: list[str]
    url: str
```

### 7.3. GitHubData

```python
@dataclass
class GitHubData:
    """GitHub情報（集約）"""
    profile: GitHubProfile
    repos: list[RepoInfo]
    language_stats: dict[str, int]  # 言語名 -> バイト数
    top_languages: list[str]  # 上位言語リスト
    matched_repos: list[RepoInfo]  # 案件にマッチしたリポジトリ
```

### 7.4. 出力例

```json
{
  "profile": {
    "username": "example-user",
    "name": "Example User",
    "bio": "Full-stack developer",
    "public_repos": 30,
    "followers": 100
  },
  "top_languages": ["Python", "TypeScript", "JavaScript"],
  "matched_repos": [
    {
      "name": "react-dashboard",
      "description": "Admin dashboard built with React and TypeScript",
      "language": "TypeScript",
      "stars": 50,
      "url": "https://github.com/example-user/react-dashboard"
    }
  ]
}
```

---

## 関連ドキュメント

- [機能要件](../requirements/functional.md)
- [提案文生成仕様](./generation.md)
- [設定仕様](./config.md)
