"""プロンプトテンプレート"""

from typing import Optional

from src.models.config import CategoryTemplate, ProfileConfig
from src.models.github import GitHubData
from src.models.job import JobInfo


def build_system_prompt() -> str:
    """システムプロンプトを構築"""
    return """あなたはフリーランスエンジニア向けの提案文作成アシスタントです。
クラウドソーシングサービス（ランサーズ、クラウドワークス）で
高い採用率を獲得できる提案文を作成することが目標です。

## あなたの役割
- 案件情報を正確に理解し、クライアントの課題に共感する
- 具体的で実現可能な提案を行う
- エンジニアの技術力と実績を効果的にアピールする
- 自然で誠実な文章を作成する

## 提案文の構成（必須）
以下の6パートで構成してください：

1. **挨拶・自己紹介**: 提供された固定文をそのまま使用
2. **案件への理解・共感**: 案件の要点を自分の言葉で要約し、課題への共感を示す
3. **提案内容・アプローチ**: 具体的な実装方針、使用技術、工夫点を説明
4. **技術力・実績**: 関連する技術経験とGitHub実績を紹介
5. **スケジュール・見積もり**: 対応可能時期と稼働について
6. **締めの挨拶**: 提供された固定文をそのまま使用

## 制約事項
- 文字数は1,500〜1,800文字を目標とする（最大2,000文字）
- 虚偽の実績や経験を記載しない
- 過度な自慢や競合批判をしない
- 定型文の羅列を避け、案件固有の内容を含める
- 価格のダンピング表現を避ける
- 敬語を適切に使用し、自然な日本語で記述する

## 出力形式
- プレーンテキストで出力
- パート間は空行で区切る
- 箇条書きは適度に使用（多用しない）
"""


def build_user_prompt(
    job_info: JobInfo,
    github_data: Optional[GitHubData],
    profile: ProfileConfig,
    category_template: CategoryTemplate,
) -> str:
    """ユーザープロンプトを構築"""
    github_section = _format_github_data(github_data)
    skills_str = ", ".join(job_info.required_skills) if job_info.required_skills else "記載なし"
    approach_hints = "\n".join(
        f"- {hint}" for hint in category_template.approach_hints
    ) if category_template.approach_hints else "特になし"

    return f"""## 案件情報

**タイトル**: {job_info.title}

**カテゴリ**: {job_info.category.value}

**予算**: {job_info.budget_display}

**納期**: {job_info.deadline or "記載なし"}

**必要スキル**: {skills_str}

**案件詳細**:
{job_info.description}

---

## 技術力・実績（GitHub情報）

{github_section}

---

## 使用する固定文

**【挨拶・自己紹介】（Part 1 でそのまま使用）**
{profile.introduction.greeting}
{profile.introduction.self_intro}

**【締めの挨拶】（Part 6 でそのまま使用）**
{profile.closing.contact}
{profile.closing.farewell}

---

## カテゴリ別の強調ポイント

{category_template.strength}

アプローチのヒント:
{approach_hints}

---

## 生成指示

上記の情報をもとに、提案文を作成してください。

- Part 1 と Part 6 は固定文をそのまま使用してください
- Part 2〜5 は案件情報とGitHub情報を活用して作成してください
- 案件の「{job_info.title}」に対する具体的な提案を含めてください
- 必要スキル「{skills_str}」に関連する経験を強調してください
"""


def _format_github_data(github_data: Optional[GitHubData]) -> str:
    """GitHub情報をフォーマット"""
    if github_data is None:
        return "（GitHub情報なし）"

    lines = []

    # プロフィール
    lines.append(f"**ユーザー名**: {github_data.profile.username}")
    if github_data.profile.bio:
        lines.append(f"**自己紹介**: {github_data.profile.bio}")

    # 言語統計
    if github_data.top_languages:
        lines.append(f"**主要言語**: {', '.join(github_data.top_languages)}")

    # 関連リポジトリ
    if github_data.matched_repos:
        lines.append("\n**関連リポジトリ**:")
        for repo in github_data.matched_repos[:3]:
            stars = repo.stars_display
            lines.append(f"- [{repo.name}]({repo.url}) {stars}")
            if repo.description:
                lines.append(f"  {repo.description[:100]}")

    return "\n".join(lines)
