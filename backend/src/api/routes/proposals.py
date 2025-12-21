"""Proposal generation API routes"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.api.db import fetch_from_database
from src.api.routes.profile import load_user_profile
from src.db import get_supabase_client

router = APIRouter(prefix="/api/proposals", tags=["proposals"])


class GenerateProposalRequestModel(BaseModel):
    """提案文生成リクエスト"""
    job_id: str
    max_retries: int = 3


def save_proposal_to_supabase(
    job_id: str,
    job_title: str,
    proposal_text: str,
    quality_score: float = 0,
    metadata: Optional[dict] = None
) -> bool:
    """生成した提案文をSupabaseに保存"""
    try:
        supabase = get_supabase_client()

        data = {
            "job_id": job_id,
            "job_title": job_title,
            "proposal_text": proposal_text,
            "character_count": len(proposal_text),
            "quality_score": quality_score,
            "metadata": metadata or {},
            "generated_at": datetime.utcnow().isoformat(),
        }

        supabase.table("generated_proposals").insert(data).execute()
        return True
    except Exception as e:
        print(f"提案文保存エラー: {e}")
        return False


def get_proposals_from_supabase(job_id: Optional[str] = None) -> list:
    """Supabaseから提案文を取得"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("generated_proposals").select("*")

        if job_id:
            query = query.eq("job_id", job_id)

        response = query.order("generated_at", desc=True).execute()
        return response.data or []
    except Exception as e:
        print(f"提案文取得エラー: {e}")
        return []


def get_latest_proposal_for_job(job_id: str) -> Optional[dict]:
    """特定ジョブの最新の提案文を取得"""
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("generated_proposals")
            .select("*")
            .eq("job_id", job_id)
            .order("generated_at", desc=True)
            .limit(1)
            .execute()
        )

        if response.data and len(response.data) > 0:
            return response.data[0]
        return None
    except Exception as e:
        print(f"提案文取得エラー: {e}")
        return None


@router.get("")
async def get_all_proposals():
    """保存済みの全提案文を取得"""
    proposals = get_proposals_from_supabase()
    return {"success": True, "proposals": proposals}


@router.get("/job/{job_id}")
async def get_proposals_for_job(job_id: str):
    """特定ジョブの提案文を取得"""
    proposals = get_proposals_from_supabase(job_id)
    return {"success": True, "proposals": proposals}


@router.get("/job/{job_id}/latest")
async def get_latest_proposal(job_id: str):
    """特定ジョブの最新の提案文を取得"""
    proposal = get_latest_proposal_for_job(job_id)
    if proposal:
        return {"success": True, "proposal": proposal}
    return {"success": False, "error": "提案文が見つかりません"}


@router.post("/generate")
async def generate_proposal(request: GenerateProposalRequestModel):
    """提案文を自動生成（マルチエージェントシステム）"""
    from src.agents import BossAgent

    user_profile = load_user_profile()
    all_jobs = await fetch_from_database()

    target_job = None
    for job in all_jobs:
        if job.get("job_id") == request.job_id or job.get("url", "").endswith(request.job_id):
            target_job = job
            break

    if not target_job:
        raise HTTPException(status_code=404, detail=f"案件が見つかりません: {request.job_id}")

    try:
        boss = BossAgent()
        result = await boss.generate_proposal(
            job=target_job,
            user_profile=user_profile,
            max_retries=request.max_retries,
        )

        result_dict = result.to_dict()

        # Supabaseに保存
        if result_dict.get("success"):
            proposal_text = result_dict.get("proposal", "")
            quality_score = result_dict.get("metadata", {}).get("quality_score", 0)
            save_proposal_to_supabase(
                job_id=request.job_id,
                job_title=target_job.get("title", ""),
                proposal_text=proposal_text,
                quality_score=quality_score,
                metadata=result_dict.get("metadata"),
            )

        return result_dict

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"提案文生成エラー: {str(e)}")


@router.get("/generate/{job_id}")
async def generate_proposal_get(job_id: str, max_retries: int = 3):
    """提案文を自動生成（GETメソッド版）"""
    request = GenerateProposalRequestModel(job_id=job_id, max_retries=max_retries)
    return await generate_proposal(request)
