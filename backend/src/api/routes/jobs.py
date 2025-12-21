"""Jobs API routes"""

from typing import Optional

from fastapi import APIRouter, Query, HTTPException

from src.api.db import fetch_from_database
from src.scrapers.lancers import LancersScraper
from src.models.config import ScrapingConfig, HumanLikeConfig, TimeoutConfig

router = APIRouter(prefix="/api", tags=["jobs"])


@router.get("/")
async def root():
    return {"message": "Proposal Generator API", "version": "1.0.0"}


@router.get("/categories")
async def get_categories():
    """利用可能なカテゴリ一覧（サブカテゴリ含む）"""
    from src.config.lancers_categories import get_all_categories_flat
    return {"categories": get_all_categories_flat()}


@router.get("/job-types")
async def get_job_types():
    """利用可能な案件形式一覧"""
    return {
        "job_types": [
            {"value": "project", "label": "プロジェクト"},
            {"value": "task", "label": "タスク"},
            {"value": "competition", "label": "コンペ"},
        ]
    }


@router.get("/jobs/{job_id}/detail")
async def fetch_job_detail(job_id: str):
    """案件の詳細をスクレイピング"""
    config = ScrapingConfig(
        headless=True,
        human_like=HumanLikeConfig(enabled=True),
        timeout=TimeoutConfig(page_load=30000, element_wait=10000),
    )
    scraper = LancersScraper(config)

    try:
        url = f"https://www.lancers.jp/work/detail/{job_id}"
        detail = await scraper.fetch_job_detail(url)

        if not detail:
            raise HTTPException(status_code=404, detail="案件の詳細が取得できませんでした")

        return detail

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"詳細取得エラー: {str(e)}")


@router.get("/jobs")
async def fetch_jobs(
    category: Optional[str] = Query(default=None),
    job_types: str = Query(default="project"),
    max_pages: int = Query(default=3, ge=1, le=100),
):
    """データベースから案件一覧を取得"""
    job_type_list = [jt.strip() for jt in job_types.split(",") if jt.strip()]

    jobs = await fetch_from_database(
        category=category,
        job_types=job_type_list if job_type_list else None,
        limit=max_pages * 30,
    )

    return {"jobs": jobs, "total": len(jobs)}
