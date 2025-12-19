"""提案文生成"""

import time
from typing import Optional

import google.generativeai as genai

from src.generator.prompts import build_system_prompt, build_user_prompt
from src.models.config import GeminiConfig, ProfileConfig, CategoryTemplate
from src.models.errors import GeminiAPIError
from src.models.generation import (
    GenerationInput,
    GenerationOutput,
    ProposalMetadata,
    QualityCheckResult,
)
from src.models.github import GitHubData
from src.models.job import JobInfo


class ProposalGenerator:
    """提案文生成器"""

    MIN_CHARS = 1300
    MAX_CHARS = 2000

    def __init__(self, api_key: str, config: GeminiConfig) -> None:
        self.config = config
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(config.model)

    async def generate(
        self,
        job_info: JobInfo,
        github_data: Optional[GitHubData],
        profile: ProfileConfig,
        category_template: CategoryTemplate,
    ) -> GenerationOutput:
        """提案文を生成"""
        generation_input = GenerationInput(
            job_info=job_info,
            github_data=github_data,
            profile=profile,
            category_template=category_template,
        )

        start_time = time.time()
        retry_count = 0
        max_retries = 3

        while retry_count < max_retries:
            try:
                proposal = await self._generate_proposal(generation_input)
                quality_result = self._check_quality(proposal, job_info)

                if quality_result.passed:
                    generation_time = time.time() - start_time
                    return GenerationOutput(
                        proposal=proposal,
                        metadata=ProposalMetadata(
                            character_count=len(proposal),
                            category=job_info.category,
                            matched_skills=self._extract_matched_skills(
                                proposal, job_info.required_skills
                            ),
                            used_repos=(
                                [r.name for r in github_data.matched_repos]
                                if github_data
                                else []
                            ),
                            generation_time=generation_time,
                            model=self.config.model,
                            temperature=self.config.temperature,
                            retry_count=retry_count,
                        ),
                    )

                retry_count += 1

            except Exception as e:
                retry_count += 1
                if retry_count >= max_retries:
                    raise GeminiAPIError(f"Failed to generate proposal: {e}")

        raise GeminiAPIError("Max retries exceeded")

    async def _generate_proposal(self, input_data: GenerationInput) -> str:
        """Gemini APIで提案文を生成"""
        system_prompt = build_system_prompt()
        user_prompt = build_user_prompt(
            job_info=input_data.job_info,
            github_data=input_data.github_data,
            profile=input_data.profile,
            category_template=input_data.category_template,
        )

        generation_config = genai.types.GenerationConfig(
            temperature=self.config.temperature,
            top_p=self.config.top_p,
            max_output_tokens=self.config.max_output_tokens,
        )

        response = self.model.generate_content(
            f"{system_prompt}\n\n{user_prompt}",
            generation_config=generation_config,
        )

        if not response.text:
            raise GeminiAPIError("Empty response from Gemini API")

        return response.text.strip()

    def _check_quality(self, proposal: str, job_info: JobInfo) -> QualityCheckResult:
        """品質チェック"""
        issues: list[str] = []
        char_count = len(proposal)

        if char_count < self.MIN_CHARS:
            issues.append(f"Character count too low: {char_count} < {self.MIN_CHARS}")

        if char_count > self.MAX_CHARS:
            issues.append(f"Character count too high: {char_count} > {self.MAX_CHARS}")

        # 案件キーワードのチェック
        keywords_found = sum(
            1
            for skill in job_info.required_skills[:3]
            if skill.lower() in proposal.lower()
        )
        if keywords_found == 0 and job_info.required_skills:
            issues.append("No job keywords found in proposal")

        return QualityCheckResult(
            passed=len(issues) == 0,
            character_count=char_count,
            issues=issues,
        )

    def _extract_matched_skills(
        self, proposal: str, required_skills: list[str]
    ) -> list[str]:
        """提案文に含まれるスキルを抽出"""
        return [
            skill
            for skill in required_skills
            if skill.lower() in proposal.lower()
        ]
