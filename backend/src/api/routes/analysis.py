"""Analysis and AI scoring API routes"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.api.db import fetch_from_database
from src.api.routes.profile import load_user_profile
from src.analyzer.job_priority import JobPriorityAnalyzer, UserProfile as AnalyzerUserProfile
from src.db import get_supabase_client

router = APIRouter(prefix="/api/jobs", tags=["analysis"])


def save_ai_score_to_supabase(job_id: str, score_data: dict) -> bool:
    """AIスコアをSupabaseに保存"""
    try:
        supabase = get_supabase_client()

        # 既存のスコアを確認
        existing = (
            supabase.table("ai_scores")
            .select("id")
            .eq("job_id", job_id)
            .execute()
        )

        data = {
            "job_id": job_id,
            "overall_score": score_data.get("overall_score", 0),
            "recommendation": score_data.get("recommendation", "neutral"),
            "breakdown": score_data.get("breakdown", {}),
            "reasons": score_data.get("reasons", []),
            "concerns": score_data.get("concerns", []),
            "scored_at": datetime.utcnow().isoformat(),
        }

        if existing.data and len(existing.data) > 0:
            # 既存レコードを更新
            supabase.table("ai_scores").update(data).eq("job_id", job_id).execute()
        else:
            # 新規レコードを作成
            supabase.table("ai_scores").insert(data).execute()

        return True
    except Exception as e:
        print(f"AIスコア保存エラー: {e}")
        return False


def get_ai_score_from_supabase(job_id: str) -> Optional[dict]:
    """SupabaseからAIスコアを取得"""
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("ai_scores")
            .select("*")
            .eq("job_id", job_id)
            .execute()
        )

        if response.data and len(response.data) > 0:
            data = response.data[0]
            return {
                "overall_score": data.get("overall_score", 0),
                "recommendation": data.get("recommendation", "neutral"),
                "breakdown": data.get("breakdown", {}),
                "reasons": data.get("reasons", []),
                "concerns": data.get("concerns", []),
            }
        return None
    except Exception as e:
        print(f"AIスコア取得エラー: {e}")
        return None


def get_all_ai_scores_from_supabase() -> dict:
    """SupabaseからすべてのAIスコアを取得"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("ai_scores").select("*").execute()

        scores = {}
        for data in response.data or []:
            job_id = data.get("job_id")
            if job_id:
                scores[job_id] = {
                    "overall_score": data.get("overall_score", 0),
                    "recommendation": data.get("recommendation", "neutral"),
                    "breakdown": data.get("breakdown", {}),
                    "reasons": data.get("reasons", []),
                    "concerns": data.get("concerns", []),
                }
        return scores
    except Exception as e:
        print(f"AIスコア一覧取得エラー: {e}")
        return {}


class AnalyzePriorityRequest(BaseModel):
    """優先度分析リクエスト"""
    job_ids: list[str]


class ScoreJobRequestModel(BaseModel):
    """案件スコアリングリクエスト"""
    job_id: str


class ScoreJobsRequestModel(BaseModel):
    """複数案件スコアリングリクエスト"""
    job_ids: list[str]


@router.post("/analyze-priority")
async def analyze_job_priority(request: AnalyzePriorityRequest):
    """案件の優先度を分析"""
    profile_data = load_user_profile()

    analyzer_profile = AnalyzerUserProfile(
        name=profile_data.get("name", ""),
        skills=profile_data.get("skills", []),
        specialties=profile_data.get("specialties", []),
        preferred_categories=profile_data.get("preferred_categories", []),
    )

    analyzer = JobPriorityAnalyzer(analyzer_profile)
    all_jobs = await fetch_from_database()

    job_id_set = set(request.job_ids)
    target_jobs = [
        job for job in all_jobs
        if job.get("job_id") in job_id_set or job.get("url") in job_id_set
    ]

    if not target_jobs and request.job_ids:
        target_jobs = all_jobs

    scores = analyzer.analyze_batch(target_jobs)

    priorities = [
        {
            "job_id": score.job_id,
            "overall_score": score.overall_score,
            "skill_match_score": score.skill_match_score,
            "budget_score": score.budget_score,
            "competition_score": score.competition_score,
            "client_score": score.client_score,
            "timeline_score": score.timeline_score,
            "reasons": score.reasons,
        }
        for score in scores
    ]

    return {"priorities": priorities}


@router.get("/analyze-all-priorities")
async def analyze_all_priorities():
    """全案件の優先度を分析"""
    profile_data = load_user_profile()

    analyzer_profile = AnalyzerUserProfile(
        name=profile_data.get("name", ""),
        skills=profile_data.get("skills", []),
        specialties=profile_data.get("specialties", []),
        preferred_categories=profile_data.get("preferred_categories", []),
    )

    analyzer = JobPriorityAnalyzer(analyzer_profile)
    all_jobs = await fetch_from_database()
    scores = analyzer.analyze_batch(all_jobs)

    priorities = [
        {
            "job_id": score.job_id,
            "overall_score": score.overall_score,
            "skill_match_score": score.skill_match_score,
            "budget_score": score.budget_score,
            "competition_score": score.competition_score,
            "client_score": score.client_score,
            "timeline_score": score.timeline_score,
            "reasons": score.reasons,
        }
        for score in scores
    ]

    return {"priorities": priorities, "total": len(priorities)}


@router.get("/ai-scores")
async def get_all_ai_scores():
    """保存済みの全AIスコアを取得"""
    scores = get_all_ai_scores_from_supabase()
    return {"success": True, "scores": scores}


@router.get("/ai-score/{job_id}")
async def get_ai_score(job_id: str):
    """保存済みのAIスコアを取得"""
    score = get_ai_score_from_supabase(job_id)
    if score:
        return {"success": True, "job_id": job_id, "score": score}
    return {"success": False, "job_id": job_id, "error": "スコアが見つかりません"}


@router.post("/ai-score")
async def score_job(request: ScoreJobRequestModel):
    """案件をAIでスコアリング"""
    from src.agents import JobScoringAgent
    from src.agents.models import JobScoringInput

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
        agent = JobScoringAgent()
        input_data = JobScoringInput(job=target_job, user_profile=user_profile)
        result = await agent.execute(input_data)

        if result.success:
            score_dict = result.data.to_dict()
            # Supabaseに保存
            save_ai_score_to_supabase(request.job_id, score_dict)

            return {
                "success": True,
                "job_id": request.job_id,
                "score": score_dict,
            }
        else:
            return {
                "success": False,
                "job_id": request.job_id,
                "error": result.error,
            }

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"スコアリングエラー: {str(e)}")


@router.post("/ai-score-batch")
async def score_jobs_batch(request: ScoreJobsRequestModel):
    """複数案件をAIでスコアリング（バッチ処理）"""
    from src.agents import JobScoringAgent
    from src.agents.models import JobScoringInput

    user_profile = load_user_profile()
    all_jobs = await fetch_from_database()

    job_id_set = set(request.job_ids)
    target_jobs = [
        job for job in all_jobs
        if job.get("job_id") in job_id_set
    ]

    if not target_jobs:
        raise HTTPException(status_code=404, detail="指定された案件が見つかりません")

    agent = JobScoringAgent()
    results = []

    for job in target_jobs:
        job_id = job.get("job_id")
        try:
            input_data = JobScoringInput(job=job, user_profile=user_profile)
            result = await agent.execute(input_data)

            if result.success:
                score_dict = result.data.to_dict()
                # Supabaseに保存
                save_ai_score_to_supabase(job_id, score_dict)

                results.append({
                    "job_id": job_id,
                    "success": True,
                    "score": score_dict,
                })
            else:
                results.append({
                    "job_id": job_id,
                    "success": False,
                    "error": result.error,
                })

        except Exception as e:
            results.append({
                "job_id": job_id,
                "success": False,
                "error": str(e),
            })

    return {
        "success": True,
        "total": len(results),
        "scores": results,
    }
