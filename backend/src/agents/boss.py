"""Boss Agent - オーケストレーター"""

import time
from dataclasses import dataclass
from typing import Optional

from src.config.models import RECOMMENDED
from .job_understanding import JobUnderstandingAgent
from .proposal_writing import ProposalWritingAgent
from .quality_check import QualityCheckAgent
from .models import (
    JobUnderstandingInput,
    JobUnderstandingOutput,
    ProposalWritingInput,
    ProposalWritingOutput,
    QualityCheckInput,
    QualityCheckOutput,
    GenerateProposalRequest,
    GenerateProposalResponse,
    ProposalResult,
    GenerationMetadata,
)


@dataclass
class ExecutionLog:
    """実行ログ"""
    agent: str
    success: bool
    duration_ms: int
    error: Optional[str] = None


class BossAgent:
    """全体のオーケストレーションを行うエージェント"""

    def __init__(
        self,
        model_name: str = RECOMMENDED.PROPOSAL_GENERATION,
        temperature: float = 0.7,
    ):
        self.model_name = model_name
        self.temperature = temperature

        # 各エージェントを初期化
        self.job_understanding_agent = JobUnderstandingAgent(
            model_name=model_name,
            temperature=temperature,
        )
        self.proposal_writing_agent = ProposalWritingAgent(
            model_name=model_name,
            temperature=temperature,
        )
        self.quality_check_agent = QualityCheckAgent(
            model_name=model_name,
            temperature=0.3,  # チェックは低温度で一貫性重視
        )

        self.execution_logs: list[ExecutionLog] = []

    async def generate_proposal(
        self,
        job: dict,
        user_profile: dict,
        max_retries: int = 3,
    ) -> GenerateProposalResponse:
        """提案文を生成（メインエントリポイント）"""
        start_time = time.time()
        self.execution_logs = []
        retry_count = 0
        agents_used = []

        job_understanding: Optional[JobUnderstandingOutput] = None
        proposal: Optional[ProposalWritingOutput] = None
        quality_result: Optional[QualityCheckOutput] = None

        try:
            # Step 1: 案件理解
            job_understanding = await self._run_job_understanding(job)
            if job_understanding is None:
                return self._create_error_response(
                    "UNDERSTANDING_FAILED",
                    "案件理解に失敗しました",
                    start_time,
                )
            agents_used.append("JobUnderstandingAgent")

            # リトライループ
            while retry_count < max_retries:
                # Step 2: 提案文作成
                proposal = await self._run_proposal_writing(
                    job_understanding,
                    user_profile,
                    job,
                )
                if proposal is None:
                    return self._create_error_response(
                        "PROPOSAL_FAILED",
                        "提案文生成に失敗しました",
                        start_time,
                    )
                if "ProposalWritingAgent" not in agents_used:
                    agents_used.append("ProposalWritingAgent")

                # Step 3: 品質チェック
                quality_result = await self._run_quality_check(
                    job,
                    job_understanding,
                    proposal,
                    user_profile,
                )
                if quality_result is None:
                    return self._create_error_response(
                        "QUALITY_CHECK_FAILED",
                        "品質チェックに失敗しました",
                        start_time,
                    )
                if "QualityCheckAgent" not in agents_used:
                    agents_used.append("QualityCheckAgent")

                # 合格判定
                if quality_result.passed:
                    break

                # 不合格の場合、修正対象に応じて再実行
                retry_count += 1
                if retry_count >= max_retries:
                    break

                if quality_result.revision_instructions:
                    target = quality_result.revision_instructions.target
                    if target == "understanding":
                        # 案件理解からやり直し
                        job_understanding = await self._run_job_understanding(job)
                        if job_understanding is None:
                            break
                    # proposal は常に再生成

            # 最大リトライ回数超過
            if not quality_result or not quality_result.passed:
                if retry_count >= max_retries:
                    return self._create_error_response(
                        "MAX_RETRIES_EXCEEDED",
                        f"品質基準を満たせませんでした（{retry_count}回試行）",
                        start_time,
                        job_understanding=job_understanding,
                        quality_score=quality_result.overall_score if quality_result else 0,
                        retry_count=retry_count,
                        agents_used=agents_used,
                    )

            # 成功レスポンス
            processing_time_ms = int((time.time() - start_time) * 1000)

            return GenerateProposalResponse(
                success=True,
                proposal=ProposalResult(
                    text=proposal.proposal,
                    character_count=proposal.character_count,
                ),
                metadata=GenerationMetadata(
                    job_understanding=job_understanding.to_dict(),
                    quality_score=quality_result.overall_score,
                    retry_count=retry_count,
                    processing_time_ms=processing_time_ms,
                    agents_used=agents_used,
                ),
            )

        except Exception as e:
            return self._create_error_response(
                "GENERAL_ERROR",
                str(e),
                start_time,
            )

    async def _run_job_understanding(
        self,
        job: dict,
    ) -> Optional[JobUnderstandingOutput]:
        """案件理解エージェントを実行"""
        start = time.time()

        input_data = JobUnderstandingInput(job=job)
        result = await self.job_understanding_agent.execute(input_data)

        duration = int((time.time() - start) * 1000)
        self.execution_logs.append(ExecutionLog(
            agent="JobUnderstandingAgent",
            success=result.success,
            duration_ms=duration,
            error=result.error,
        ))

        if result.success:
            return result.data
        return None

    async def _run_proposal_writing(
        self,
        job_understanding: JobUnderstandingOutput,
        user_profile: dict,
        job: dict,
    ) -> Optional[ProposalWritingOutput]:
        """提案文作成エージェントを実行"""
        start = time.time()

        input_data = ProposalWritingInput(
            job_understanding=job_understanding,
            user_profile=user_profile,
            job=job,
        )
        result = await self.proposal_writing_agent.execute(input_data)

        duration = int((time.time() - start) * 1000)
        self.execution_logs.append(ExecutionLog(
            agent="ProposalWritingAgent",
            success=result.success,
            duration_ms=duration,
            error=result.error,
        ))

        if result.success:
            return result.data
        return None

    async def _run_quality_check(
        self,
        job: dict,
        job_understanding: JobUnderstandingOutput,
        proposal: ProposalWritingOutput,
        user_profile: dict,
    ) -> Optional[QualityCheckOutput]:
        """品質チェックエージェントを実行"""
        start = time.time()

        input_data = QualityCheckInput(
            job=job,
            job_understanding=job_understanding,
            proposal=proposal,
            user_profile=user_profile,
        )
        result = await self.quality_check_agent.execute(input_data)

        duration = int((time.time() - start) * 1000)
        self.execution_logs.append(ExecutionLog(
            agent="QualityCheckAgent",
            success=result.success,
            duration_ms=duration,
            error=result.error,
        ))

        if result.success:
            return result.data
        return None

    def _create_error_response(
        self,
        error_code: str,
        error_message: str,
        start_time: float,
        job_understanding: Optional[JobUnderstandingOutput] = None,
        quality_score: int = 0,
        retry_count: int = 0,
        agents_used: Optional[list[str]] = None,
    ) -> GenerateProposalResponse:
        """エラーレスポンスを作成"""
        processing_time_ms = int((time.time() - start_time) * 1000)

        return GenerateProposalResponse(
            success=False,
            metadata=GenerationMetadata(
                job_understanding=job_understanding.to_dict() if job_understanding else {},
                quality_score=quality_score,
                retry_count=retry_count,
                processing_time_ms=processing_time_ms,
                agents_used=agents_used or [],
            ),
            error_code=error_code,
            error_message=error_message,
        )
