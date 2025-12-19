"""Job Understanding Agent - 案件理解AI"""

import json
from .base import BaseAgent, AgentResult
from .models import (
    JobUnderstandingInput,
    JobUnderstandingOutput,
    JobRequirements,
    ClientAnalysis,
    KeyPoints,
    ExternalResearch,
)


class JobUnderstandingAgent(BaseAgent):
    """案件の深い理解と情報収集を行うエージェント"""

    @property
    def name(self) -> str:
        return "JobUnderstandingAgent"

    @property
    def system_prompt(self) -> str:
        return """あなたは案件分析の専門家です。クラウドソーシングの案件情報を深く分析し、以下の観点で情報を整理してください。

## あなたの役割
- 案件の要件を正確に理解し、構造化する
- クライアントの真の目的や課題を推測する
- 提案文作成に役立つ重要なポイントを抽出する

## 分析の観点
1. **案件要件**: 何を作るのか、どんな技術が必要か、制約条件は何か
2. **クライアント分析**: どんな事業をしている人か、なぜこの案件を出しているのか
3. **重要ポイント**: 提案で強調すべき点、注意すべきリスク

## 出力形式
必ず以下のJSON形式で出力してください：

```json
{
  "requirements": {
    "main_task": "主要なタスクの説明（1-2文）",
    "deliverables": ["成果物1", "成果物2"],
    "technical_requirements": ["技術要件1", "技術要件2"],
    "constraints": ["制約1", "制約2"]
  },
  "client_analysis": {
    "business_type": "事業種別（例：EC事業者、スタートアップ、個人事業主など）",
    "estimated_purpose": "この案件を出した目的の推測",
    "pain_points": ["クライアントが抱えていそうな課題1", "課題2"]
  },
  "key_points": {
    "keywords": ["提案で使うべきキーワード1", "キーワード2"],
    "emphasis_points": ["提案で強調すべき点1", "強調点2"],
    "risk_factors": ["リスク要因1", "リスク要因2"]
  }
}
```

## 注意事項
- 案件文から読み取れる情報を基に、論理的に推測してください
- 不確かな情報は「推測」であることを明示してください
- 技術的な要件は具体的に記述してください"""

    async def execute(self, input_data: JobUnderstandingInput) -> AgentResult:
        """案件を分析"""
        try:
            job = input_data.job
            print(f"[JobUnderstandingAgent] Processing job: {job.get('title', 'N/A')[:50]}")

            # プロンプト構築
            user_content = self._build_analysis_prompt(job)
            prompt = self._build_prompt(user_content)
            print(f"[JobUnderstandingAgent] Prompt length: {len(prompt)} chars")

            # Gemini API呼び出し
            print("[JobUnderstandingAgent] Calling Gemini API...")
            response = await self._generate(prompt)
            print(f"[JobUnderstandingAgent] Response length: {len(response)} chars")

            # レスポンスをパース
            parsed = self._parse_json_response(response)
            output = self._convert_to_output(parsed)
            print("[JobUnderstandingAgent] Success!")

            return AgentResult(
                success=True,
                data=output,
                raw_response=response,
            )

        except Exception as e:
            import traceback
            print(f"[JobUnderstandingAgent] Error: {e}")
            print(traceback.format_exc())
            return AgentResult(
                success=False,
                error=str(e),
            )

    def _build_analysis_prompt(self, job: dict) -> str:
        """分析用プロンプトを構築"""
        title = job.get("title", "タイトルなし")
        description = job.get("description", "説明なし")
        category = job.get("category", "不明")
        job_type = job.get("job_type", "不明")
        budget_min = job.get("budget_min")
        budget_max = job.get("budget_max")
        required_skills = job.get("required_skills", [])
        tags = job.get("tags", [])
        feature_tags = job.get("feature_tags", [])

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

        prompt = f"""以下の案件を分析してください。

## 案件情報

**タイトル**: {title}

**カテゴリ**: {category}
**案件形式**: {job_type}
**予算**: {budget_str}

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

上記の案件を分析し、JSON形式で出力してください。"""

        return prompt

    def _convert_to_output(self, parsed: dict) -> JobUnderstandingOutput:
        """パースされたJSONをJobUnderstandingOutputに変換"""
        req_data = parsed.get("requirements", {})
        requirements = JobRequirements(
            main_task=req_data.get("main_task", ""),
            deliverables=req_data.get("deliverables", []),
            technical_requirements=req_data.get("technical_requirements", []),
            constraints=req_data.get("constraints", []),
        )

        client_data = parsed.get("client_analysis", {})
        client_analysis = ClientAnalysis(
            business_type=client_data.get("business_type", ""),
            estimated_purpose=client_data.get("estimated_purpose", ""),
            pain_points=client_data.get("pain_points", []),
        )

        key_data = parsed.get("key_points", {})
        key_points = KeyPoints(
            keywords=key_data.get("keywords", []),
            emphasis_points=key_data.get("emphasis_points", []),
            risk_factors=key_data.get("risk_factors", []),
        )

        # 外部調査結果（将来の拡張用）
        external_data = parsed.get("external_research")
        external_research = None
        if external_data:
            external_research = ExternalResearch(
                sources=external_data.get("sources", []),
                findings=external_data.get("findings", []),
            )

        return JobUnderstandingOutput(
            requirements=requirements,
            client_analysis=client_analysis,
            key_points=key_points,
            external_research=external_research,
        )
