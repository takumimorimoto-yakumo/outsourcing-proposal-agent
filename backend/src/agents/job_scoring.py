"""Job Scoring Agent - 案件評価AI"""

import json
from .base import BaseAgent, AgentResult
from .models import (
    JobScoringInput,
    JobScoringOutput,
    ScoringBreakdown,
)


class JobScoringAgent(BaseAgent):
    """案件の価値を評価し、提案すべきかどうかを判定するエージェント"""

    @property
    def name(self) -> str:
        return "JobScoringAgent"

    @property
    def system_prompt(self) -> str:
        return """あなたはクラウドソーシング案件の評価専門家です。ユーザーのプロフィールと案件情報を比較し、この案件に提案する価値があるかを評価してください。

## あなたの役割
- ユーザーのスキルと案件要件のマッチ度を評価する
- 予算の妥当性を判断する
- 競争率と受注確率を推測する
- クライアントの信頼性を評価する
- 案件の成長・実績獲得の可能性を判断する

## 評価観点

### 1. スキルマッチ度 (skill_match)
- ユーザーの持つスキルと案件の要求スキルの一致度
- 経験領域との関連性
- 対応可能な難易度かどうか

### 2. 予算妥当性 (budget_appropriateness)
- 市場相場と比較して適正か
- 作業量に見合った報酬か
- ユーザーの希望単価との乖離

### 3. 競争率スコア (competition_level)
- 提案数が少ないほど高スコア
- 募集人数に対する応募状況
- 残り日数と応募ペース

### 4. クライアント信頼度 (client_reliability)
- 発注実績の有無
- 評価の高さ
- 過去のトラブル履歴の推測

### 5. 成長可能性 (growth_potential)
- 実績として価値があるか
- 継続案件の可能性
- スキルアップにつながるか

## 出力形式
必ず以下のJSON形式で出力してください：

```json
{
  "overall_score": 75,
  "recommendation": "recommended",
  "breakdown": {
    "skill_match": 80,
    "budget_appropriateness": 70,
    "competition_level": 85,
    "client_reliability": 65,
    "growth_potential": 75
  },
  "reasons": [
    "ユーザーのスキルセットと高いマッチ度",
    "競争率が低く受注確率が高い"
  ],
  "concerns": [
    "クライアントの発注実績が少ない",
    "納期が短い"
  ]
}
```

## recommendation の基準
- "highly_recommended": overall_score >= 80 - 強く推奨、積極的に提案すべき
- "recommended": overall_score >= 60 - 推奨、提案する価値あり
- "neutral": overall_score >= 40 - 中立、状況次第
- "not_recommended": overall_score < 40 - 非推奨、スキップ推奨

## 注意事項
- 各スコアは0〜100で評価
- overall_scoreは各項目の加重平均（skill_match: 30%, budget: 20%, competition: 20%, client: 15%, growth: 15%）
- 具体的な理由と懸念点を必ず記載
- ユーザーのプロフィールに基づいて評価すること"""

    async def execute(self, input_data: JobScoringInput) -> AgentResult:
        """案件を評価"""
        try:
            job = input_data.job
            user_profile = input_data.user_profile
            print(f"[JobScoringAgent] Evaluating job: {job.get('title', 'N/A')[:50]}")

            # プロンプト構築
            user_content = self._build_scoring_prompt(job, user_profile)
            prompt = self._build_prompt(user_content)
            print(f"[JobScoringAgent] Prompt length: {len(prompt)} chars")

            # Gemini API呼び出し
            print("[JobScoringAgent] Calling Gemini API...")
            response = await self._generate(prompt)
            print(f"[JobScoringAgent] Response length: {len(response)} chars")

            # レスポンスをパース
            parsed = self._parse_json_response(response)
            output = self._convert_to_output(parsed)
            print(f"[JobScoringAgent] Score: {output.overall_score}, Recommendation: {output.recommendation}")

            return AgentResult(
                success=True,
                data=output,
                raw_response=response,
            )

        except Exception as e:
            import traceback
            print(f"[JobScoringAgent] Error: {e}")
            print(traceback.format_exc())
            return AgentResult(
                success=False,
                error=str(e),
            )

    def _build_scoring_prompt(self, job: dict, user_profile: dict) -> str:
        """評価用プロンプトを構築"""
        # 案件情報
        title = job.get("title", "タイトルなし")
        description = job.get("description", "説明なし")
        category = job.get("category", "不明")
        job_type = job.get("job_type", "不明")
        budget_min = job.get("budget_min")
        budget_max = job.get("budget_max")
        required_skills = job.get("required_skills", [])
        tags = job.get("tags", [])
        feature_tags = job.get("feature_tags", [])
        proposal_count = job.get("proposal_count", 0)
        recruitment_count = job.get("recruitment_count", 1)
        remaining_days = job.get("remaining_days")

        # クライアント情報
        client = job.get("client", {})
        client_name = client.get("name", "不明") if client else "不明"
        client_rating = client.get("rating") if client else None
        client_history = client.get("order_history") if client else None

        # 予算文字列
        if budget_min and budget_max:
            budget_str = f"{budget_min:,}円 〜 {budget_max:,}円"
        elif budget_max:
            budget_str = f"〜 {budget_max:,}円"
        elif budget_min:
            budget_str = f"{budget_min:,}円 〜"
        else:
            budget_str = "要相談"

        # ユーザープロフィール情報
        user_name = user_profile.get("name", "不明")
        skills = user_profile.get("skills", [])
        skills_detail = user_profile.get("skills_detail", "")
        experience = user_profile.get("experience", "")
        self_pr = user_profile.get("self_pr", "")
        preferred_categories = user_profile.get("preferred_categories", [])
        preferred_categories_detail = user_profile.get("preferred_categories_detail", "")

        prompt = f"""以下の案件をユーザープロフィールに基づいて評価してください。

## 案件情報

**タイトル**: {title}
**カテゴリ**: {category}
**案件形式**: {job_type}
**予算**: {budget_str}
**募集人数**: {recruitment_count}名
**現在の提案数**: {proposal_count}件
**残り日数**: {f'{remaining_days}日' if remaining_days else '不明'}

**説明**:
{description}

**必要スキル**: {', '.join(required_skills) if required_skills else 'なし'}
**タグ**: {', '.join(tags) if tags else 'なし'}
**特徴**: {', '.join(feature_tags) if feature_tags else 'なし'}

**クライアント情報**:
- 名前: {client_name}
- 評価: {f'★{client_rating}' if client_rating else '不明'}
- 発注履歴: {f'{client_history}件' if client_history else '不明'}

---

## ユーザープロフィール

**名前**: {user_name}
**スキル**: {', '.join(skills) if skills else 'なし'}
**スキル詳細**: {skills_detail if skills_detail else 'なし'}
**経験**: {experience if experience else 'なし'}
**自己PR**: {self_pr if self_pr else 'なし'}
**希望カテゴリ**: {', '.join(preferred_categories) if preferred_categories else 'なし'}
**希望カテゴリ詳細**: {preferred_categories_detail if preferred_categories_detail else 'なし'}

---

上記の情報を基に、この案件に提案する価値があるかを評価し、JSON形式で出力してください。"""

        return prompt

    def _convert_to_output(self, parsed: dict) -> JobScoringOutput:
        """パースされたJSONをJobScoringOutputに変換"""
        breakdown_data = parsed.get("breakdown", {})
        breakdown = ScoringBreakdown(
            skill_match=breakdown_data.get("skill_match", 0),
            budget_appropriateness=breakdown_data.get("budget_appropriateness", 0),
            competition_level=breakdown_data.get("competition_level", 0),
            client_reliability=breakdown_data.get("client_reliability", 0),
            growth_potential=breakdown_data.get("growth_potential", 0),
        )

        return JobScoringOutput(
            overall_score=parsed.get("overall_score", 0),
            recommendation=parsed.get("recommendation", "neutral"),
            breakdown=breakdown,
            reasons=parsed.get("reasons", []),
            concerns=parsed.get("concerns", []),
        )
