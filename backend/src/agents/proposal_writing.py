"""Proposal Writing Agent - 文面作成AI"""

import json
from .base import BaseAgent, AgentResult
from .models import (
    ProposalWritingInput,
    ProposalWritingOutput,
    ProposalStructure,
    JobUnderstandingOutput,
)


class ProposalWritingAgent(BaseAgent):
    """案件理解に基づいて提案文を生成するエージェント"""

    @property
    def name(self) -> str:
        return "ProposalWritingAgent"

    @property
    def system_prompt(self) -> str:
        return """あなたはクラウドソーシングの提案文作成の専門家です。案件分析結果とユーザーのプロフィールを基に、効果的な提案文を作成してください。

## あなたの役割
- クライアントの心に響く提案文を作成する
- ユーザーの経験・スキルを効果的にアピールする
- 簡潔だが人間味のある文面にする

## 提案文の構成
1. **挨拶**: 簡潔な挨拶（1-2文）
2. **案件理解の表明**: クライアントの目的を理解していることを示す（2-3文）
3. **アプローチ提案**: 具体的な進め方を提案する（3-5文）
4. **関連経験**: プロフィールから適切な経験を選んでアピール（2-4文）
5. **締め**: 前向きな姿勢と連絡への言及（1-2文）

## 文体ガイドライン
- 丁寧だが堅すぎない（ビジネスカジュアル）
- 専門用語は必要最小限に
- 具体性を持たせる（「できます」より「○○の方法で実現します」）
- 機械的にならないよう、人間らしい表現を心がける
- 全体で400-800文字程度に収める

## 出力形式
必ず以下のJSON形式で出力してください：

```json
{
  "proposal": "完成した提案文全文",
  "structure": {
    "greeting": "挨拶部分",
    "understanding": "案件理解の表明部分",
    "approach": "アプローチ提案部分",
    "experience": "関連経験部分",
    "closing": "締め部分"
  },
  "character_count": 文字数（数値）
}
```

## 注意事項
- 嘘や誇張は書かない
- プロフィールに無いスキルはアピールしない
- クライアントの立場に立って、安心感を与える内容にする"""

    async def execute(self, input_data: ProposalWritingInput) -> AgentResult:
        """提案文を生成"""
        try:
            # プロンプト構築
            user_content = self._build_writing_prompt(
                input_data.job_understanding,
                input_data.user_profile,
                input_data.job,
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

    def _build_writing_prompt(
        self,
        job_understanding: JobUnderstandingOutput,
        user_profile: dict,
        job: dict,
    ) -> str:
        """提案文作成用プロンプトを構築"""
        # 案件情報
        title = job.get("title", "タイトルなし")
        category = job.get("category", "不明")

        # 案件理解結果
        req = job_understanding.requirements
        client = job_understanding.client_analysis
        key = job_understanding.key_points

        # ユーザープロフィール
        name = user_profile.get("name", "")
        bio = user_profile.get("bio", "")
        skills = user_profile.get("skills", [])
        specialties = user_profile.get("specialties", [])
        skills_detail = user_profile.get("skills_detail", "")
        github_url = user_profile.get("github_url", "")
        portfolio_urls = user_profile.get("portfolio_urls", [])

        prompt = f"""以下の情報を基に、提案文を作成してください。

## 案件情報
**タイトル**: {title}
**カテゴリ**: {category}

## 案件分析結果

### 要件
- 主要タスク: {req.main_task}
- 成果物: {', '.join(req.deliverables) if req.deliverables else 'なし'}
- 技術要件: {', '.join(req.technical_requirements) if req.technical_requirements else 'なし'}
- 制約: {', '.join(req.constraints) if req.constraints else 'なし'}

### クライアント分析
- 事業種別: {client.business_type}
- 推定目的: {client.estimated_purpose}
- 課題: {', '.join(client.pain_points) if client.pain_points else 'なし'}

### 重要ポイント
- キーワード: {', '.join(key.keywords) if key.keywords else 'なし'}
- 強調すべき点: {', '.join(key.emphasis_points) if key.emphasis_points else 'なし'}
- リスク要因: {', '.join(key.risk_factors) if key.risk_factors else 'なし'}

## ユーザープロフィール
- 名前: {name if name else '（未設定）'}
- 自己紹介: {bio if bio else '（未設定）'}
- スキル: {', '.join(skills) if skills else 'なし'}
- 得意分野: {', '.join(specialties) if specialties else 'なし'}
- スキル詳細: {skills_detail if skills_detail else '（未設定）'}
- GitHub: {github_url if github_url else 'なし'}
- ポートフォリオ: {', '.join(portfolio_urls) if portfolio_urls else 'なし'}

---

上記の情報を基に、クライアントに響く提案文を作成し、JSON形式で出力してください。
提案文は400-800文字程度に収めてください。"""

        return prompt

    def _convert_to_output(self, parsed: dict) -> ProposalWritingOutput:
        """パースされたJSONをProposalWritingOutputに変換"""
        proposal = parsed.get("proposal", "")

        struct_data = parsed.get("structure", {})
        structure = ProposalStructure(
            greeting=struct_data.get("greeting", ""),
            understanding=struct_data.get("understanding", ""),
            approach=struct_data.get("approach", ""),
            experience=struct_data.get("experience", ""),
            closing=struct_data.get("closing", ""),
        )

        # 文字数は実際にカウント
        character_count = len(proposal)

        return ProposalWritingOutput(
            proposal=proposal,
            structure=structure,
            character_count=character_count,
        )
