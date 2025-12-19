"""Quality Check Agent - チェックAI"""

import json
from .base import BaseAgent, AgentResult
from .models import (
    QualityCheckInput,
    QualityCheckOutput,
    Evaluation,
    EvaluationItem,
    RevisionInstructions,
    JobUnderstandingOutput,
    ProposalWritingOutput,
)


class QualityCheckAgent(BaseAgent):
    """生成された提案文の品質を検証するエージェント"""

    # 合格基準
    MIN_OVERALL_SCORE = 70
    MIN_CATEGORY_SCORE = 60

    @property
    def name(self) -> str:
        return "QualityCheckAgent"

    @property
    def system_prompt(self) -> str:
        return """あなたは提案文の品質管理の専門家です。案件理解と提案文を評価し、品質チェックを行ってください。

## あなたの役割
- 案件理解が正確かどうかを検証する
- 提案文の品質を多角的に評価する
- 問題がある場合は具体的な修正指示を出す

## 評価項目（各項目0-100点）

### 1. 案件理解の正確性 (understanding_accuracy)
- 案件の要件を正しく把握しているか
- クライアントの目的を理解しているか
- 重要なポイントを見逃していないか

### 2. 提案文の品質 (proposal_quality)
- 構成が適切か
- 具体性があるか
- 読みやすいか

### 3. プロフィールとの関連性 (profile_relevance)
- ユーザーのスキル・経験が適切に活用されているか
- 誇張や嘘がないか
- 強みが効果的にアピールされているか

### 4. トーンの適切さ (tone_appropriateness)
- ビジネスにふさわしい丁寧さか
- 機械的すぎないか
- クライアントに安心感を与えるか

## 合格基準
- 総合スコア70点以上
- 各カテゴリ60点以上

## 出力形式
必ず以下のJSON形式で出力してください：

```json
{
  "passed": true/false,
  "overall_score": 総合スコア（0-100）,
  "evaluation": {
    "understanding_accuracy": {
      "score": スコア,
      "issues": ["問題点1", "問題点2"]
    },
    "proposal_quality": {
      "score": スコア,
      "issues": ["問題点1"]
    },
    "profile_relevance": {
      "score": スコア,
      "issues": []
    },
    "tone_appropriateness": {
      "score": スコア,
      "issues": []
    }
  },
  "revision_instructions": {
    "target": "understanding" または "proposal",
    "instructions": ["修正指示1", "修正指示2"]
  }
}
```

## 注意事項
- 不合格の場合は必ず revision_instructions を含めること
- 修正指示は具体的で実行可能なものにすること
- 問題がない項目の issues は空配列にすること"""

    async def execute(self, input_data: QualityCheckInput) -> AgentResult:
        """品質チェックを実行"""
        try:
            # プロンプト構築
            user_content = self._build_check_prompt(
                input_data.job,
                input_data.job_understanding,
                input_data.proposal,
                input_data.user_profile,
            )
            prompt = self._build_prompt(user_content)

            # Gemini API呼び出し
            response = await self._generate(prompt)

            # レスポンスをパース
            parsed = self._parse_json_response(response)
            output = self._convert_to_output(parsed)

            return AgentResult(
                success=True,
                data=output,
                raw_response=response,
            )

        except Exception as e:
            return AgentResult(
                success=False,
                error=str(e),
            )

    def _build_check_prompt(
        self,
        job: dict,
        job_understanding: JobUnderstandingOutput,
        proposal: ProposalWritingOutput,
        user_profile: dict,
    ) -> str:
        """品質チェック用プロンプトを構築"""
        # 案件情報
        title = job.get("title", "タイトルなし")
        description = job.get("description", "")

        # 案件理解結果
        req = job_understanding.requirements
        client = job_understanding.client_analysis

        # 提案文
        proposal_text = proposal.proposal
        char_count = proposal.character_count

        # ユーザープロフィール
        skills = user_profile.get("skills", [])
        specialties = user_profile.get("specialties", [])
        skills_detail = user_profile.get("skills_detail", "")

        prompt = f"""以下の案件、案件理解、提案文を評価してください。

## 元の案件情報
**タイトル**: {title}

**説明**:
{description[:500]}{"..." if len(description) > 500 else ""}

## 案件理解結果
- 主要タスク: {req.main_task}
- 成果物: {', '.join(req.deliverables) if req.deliverables else 'なし'}
- 技術要件: {', '.join(req.technical_requirements) if req.technical_requirements else 'なし'}
- クライアント事業種別: {client.business_type}
- 推定目的: {client.estimated_purpose}

## 生成された提案文（{char_count}文字）
{proposal_text}

## ユーザープロフィール（参考）
- スキル: {', '.join(skills) if skills else 'なし'}
- 得意分野: {', '.join(specialties) if specialties else 'なし'}
- スキル詳細: {skills_detail if skills_detail else '（未設定）'}

---

上記を評価し、JSON形式で出力してください。
合格基準: 総合スコア70点以上、各カテゴリ60点以上"""

        return prompt

    def _convert_to_output(self, parsed: dict) -> QualityCheckOutput:
        """パースされたJSONをQualityCheckOutputに変換"""
        eval_data = parsed.get("evaluation", {})

        # 各評価項目を変換
        understanding = eval_data.get("understanding_accuracy", {})
        quality = eval_data.get("proposal_quality", {})
        relevance = eval_data.get("profile_relevance", {})
        tone = eval_data.get("tone_appropriateness", {})

        evaluation = Evaluation(
            understanding_accuracy=EvaluationItem(
                score=understanding.get("score", 0),
                issues=understanding.get("issues", []),
            ),
            proposal_quality=EvaluationItem(
                score=quality.get("score", 0),
                issues=quality.get("issues", []),
            ),
            profile_relevance=EvaluationItem(
                score=relevance.get("score", 0),
                issues=relevance.get("issues", []),
            ),
            tone_appropriateness=EvaluationItem(
                score=tone.get("score", 0),
                issues=tone.get("issues", []),
            ),
        )

        # 修正指示
        revision_data = parsed.get("revision_instructions")
        revision_instructions = None
        if revision_data:
            revision_instructions = RevisionInstructions(
                target=revision_data.get("target", ""),
                instructions=revision_data.get("instructions", []),
            )

        # 合否判定（独自に計算して信頼性を高める）
        scores = [
            evaluation.understanding_accuracy.score,
            evaluation.proposal_quality.score,
            evaluation.profile_relevance.score,
            evaluation.tone_appropriateness.score,
        ]
        overall_score = sum(scores) // 4
        passed = (
            overall_score >= self.MIN_OVERALL_SCORE
            and all(s >= self.MIN_CATEGORY_SCORE for s in scores)
        )

        return QualityCheckOutput(
            passed=passed,
            overall_score=overall_score,
            evaluation=evaluation,
            revision_instructions=revision_instructions if not passed else None,
        )
