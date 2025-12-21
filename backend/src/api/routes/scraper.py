"""Scraper API routes"""

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from src.api.db import save_to_database, clear_database, cleanup_expired_jobs
from src.scrapers.lancers import LancersScraper
from src.models.config import ScrapingConfig, HumanLikeConfig, TimeoutConfig
from src.db.supabase_client import get_supabase_client

router = APIRouter(prefix="/api/scraper", tags=["scraper"])


# =============================================================================
# Scraper State
# =============================================================================

@dataclass
class ScraperState:
    """スクレイパーの状態を管理"""
    is_running: bool = False
    current_page: int = 0
    total_pages: int = 0
    jobs_fetched: int = 0
    estimated_total: int = 0
    started_at: Optional[datetime] = None
    category: Optional[str] = None
    error: Optional[str] = None
    cancelled: bool = False
    phase: str = "idle"  # idle, fetching, saving, done
    message: str = ""
    current_category_index: int = 0
    total_categories: int = 0
    detail_current: int = 0
    detail_total: int = 0


# Global state
scraper_state = ScraperState()
scraper_history: list[dict] = []


# =============================================================================
# Request Models
# =============================================================================

class ScraperStartRequest(BaseModel):
    """スクレイピング開始リクエスト"""
    categories: list[str] = []
    job_types: list[str] = ["project"]
    max_pages: int = 3
    fetch_details: bool = False
    save_to_database: bool = True


# =============================================================================
# Helper Functions
# =============================================================================

def parse_category_selection(selection: str) -> tuple[str, Optional[str]]:
    """カテゴリ選択をパース: "system/app" -> ("system", "app")"""
    if "/" in selection:
        parts = selection.split("/", 1)
        return (parts[0], parts[1])
    return (selection, None)


async def run_scraper_task(request: ScraperStartRequest):
    """バックグラウンドでスクレイピングを実行"""
    global scraper_state, scraper_history

    # カテゴリ選択をパース
    selections = []
    for cat_str in request.categories:
        category, subcategory = parse_category_selection(cat_str)
        selections.append((category, subcategory, cat_str))

    if not selections:
        selections = [(None, None, "all")]

    print("=" * 50)
    print("スクレイピング開始")
    print(f"  categories: {request.categories}")
    print(f"  parsed selections: {selections}")
    print(f"  job_types: {request.job_types}")
    print(f"  max_pages: {request.max_pages}")
    print(f"  fetch_details: {request.fetch_details}")
    print(f"  save_to_database: {request.save_to_database}")
    print("=" * 50)

    config = ScrapingConfig(
        headless=True,
        human_like=HumanLikeConfig(enabled=True),
        timeout=TimeoutConfig(page_load=30000, element_wait=10000),
    )
    scraper = LancersScraper(config)

    total_selections = len(selections)
    max_pages = request.max_pages if request.max_pages > 0 else 100
    is_fetch_all = request.max_pages == 0

    try:
        scraper_state.is_running = True
        scraper_state.current_page = 0
        scraper_state.total_pages = max_pages * total_selections if not is_fetch_all else 0
        scraper_state.jobs_fetched = 0
        scraper_state.estimated_total = max_pages * 30 * total_selections if not is_fetch_all else 0
        scraper_state.started_at = datetime.now()
        scraper_state.category = ", ".join(s[2] for s in selections)
        scraper_state.error = None
        scraper_state.cancelled = False
        scraper_state.phase = "fetching"
        scraper_state.message = "準備中..."
        scraper_state.current_category_index = 0
        scraper_state.total_categories = total_selections

        all_results = []

        for sel_idx, (category, subcategory, display_label) in enumerate(selections):
            if scraper_state.cancelled:
                break

            scraper_state.current_category_index = sel_idx + 1
            scraper_state.category = display_label
            category_label = display_label or "全カテゴリ"

            jobs = []
            for page in range(1, max_pages + 1):
                if scraper_state.cancelled:
                    break

                scraper_state.current_page = sel_idx * max_pages + page
                scraper_state.message = f"{category_label} - {page}ページ目を取得中..."

                url = scraper.build_search_url(
                    category=category,
                    subcategory=subcategory,
                    job_types=request.job_types,
                    open_only=True,
                    page=page,
                )
                print(f"取得中: {url}")

                page_jobs = await scraper.fetch_job_list(url)

                if not page_jobs:
                    print(f"  → 0件（終了）")
                    break

                print(f"  → {len(page_jobs)}件取得")
                jobs.extend(page_jobs)
                scraper_state.jobs_fetched = len(all_results) + len(jobs)

                if len(page_jobs) < 20:
                    print(f"  → 最終ページ到達（{len(page_jobs)}件 < 20）")
                    break

            # 詳細取得
            if request.fetch_details and jobs and not scraper_state.cancelled:
                scraper_state.phase = "fetching"
                scraper_state.detail_total = len(jobs)
                scraper_state.detail_current = 0

                print(f"詳細取得開始: {len(jobs)}件")

                for i, job in enumerate(jobs):
                    if scraper_state.cancelled:
                        break

                    scraper_state.detail_current = i + 1
                    scraper_state.message = f"詳細取得中... ({i + 1}/{len(jobs)})"

                    if job.get("url"):
                        try:
                            detail = await scraper.fetch_job_detail(job["url"])
                            if detail:
                                job["description"] = detail.get("description", "")
                                job["required_skills"] = detail.get("required_skills", [])
                        except Exception as e:
                            print(f"詳細取得エラー ({job.get('url')}): {e}")

            all_results.extend(jobs)

        # DB保存
        added_count = 0
        updated_count = 0

        if request.save_to_database and all_results and not scraper_state.cancelled:
            scraper_state.phase = "saving"
            scraper_state.message = f"データベースに保存中... ({len(all_results)}件)"
            print(f"データベース保存開始: {len(all_results)}件")

            save_result = await save_to_database(all_results)
            if save_result.get("success"):
                added_count = save_result.get("added", 0)
                updated_count = save_result.get("updated", 0)
                print(f"保存完了: 新規 {added_count}件, 更新 {updated_count}件")
            else:
                print(f"保存エラー: {save_result.get('error')}")

        # 完了
        scraper_state.phase = "done"
        scraper_state.is_running = False

        if scraper_state.cancelled:
            scraper_history.insert(0, {
                "timestamp": datetime.now().isoformat(),
                "category": ", ".join(c or "all" for c in request.categories),
                "count": len(all_results),
                "status": "cancelled",
                "duration_seconds": (datetime.now() - scraper_state.started_at).seconds,
            })
            scraper_state.message = f"キャンセルされました（{len(all_results)}件取得済み）"
        else:
            # JSON保存
            output_dir = Path(__file__).parent.parent.parent.parent / "output"
            output_dir.mkdir(exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            category_str = "_".join(c or "all" for c in request.categories)
            json_path = output_dir / f"{category_str}_jobs_{timestamp}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(all_results, f, ensure_ascii=False, indent=2)
            print(f"JSON保存: {json_path}")

            scraper_state.message = f"完了: {len(all_results)}件取得"
            if request.save_to_database:
                scraper_state.message += f" (新規 {added_count}件, 更新 {updated_count}件)"

            duration = (datetime.now() - scraper_state.started_at).seconds
            scraper_history.insert(0, {
                "timestamp": datetime.now().isoformat(),
                "category": ", ".join(c or "all" for c in request.categories),
                "count": len(all_results),
                "added": added_count,
                "updated": updated_count,
                "status": "success",
                "duration_seconds": duration,
            })

    except Exception as e:
        print(f"スクレイピングエラー: {e}")
        scraper_state.error = str(e)
        scraper_state.phase = "done"
        scraper_state.is_running = False
        scraper_state.message = f"エラー: {str(e)}"
        scraper_history.insert(0, {
            "timestamp": datetime.now().isoformat(),
            "category": ", ".join(c or "all" for c in request.categories),
            "count": 0,
            "status": "error",
            "error": str(e),
        })

    # 履歴を最大20件に制限
    if len(scraper_history) > 20:
        scraper_history = scraper_history[:20]


# =============================================================================
# Routes
# =============================================================================

@router.post("/start")
async def start_scraper(request: ScraperStartRequest, background_tasks: BackgroundTasks):
    """スクレイピングを開始"""
    if scraper_state.is_running:
        raise HTTPException(status_code=400, detail="スクレイピングは既に実行中です")

    background_tasks.add_task(run_scraper_task, request)
    return {"success": True, "message": "スクレイピングを開始しました"}


@router.get("/status")
async def get_scraper_status():
    """スクレイピング状態を取得"""
    elapsed = 0
    if scraper_state.started_at:
        elapsed = (datetime.now() - scraper_state.started_at).seconds

    return {
        "is_running": scraper_state.is_running,
        "current_page": scraper_state.current_page,
        "total_pages": scraper_state.total_pages,
        "jobs_fetched": scraper_state.jobs_fetched,
        "estimated_total": scraper_state.estimated_total,
        "elapsed_seconds": elapsed,
        "category": scraper_state.category,
        "error": scraper_state.error,
        "phase": scraper_state.phase,
        "message": scraper_state.message,
        "current_category_index": scraper_state.current_category_index,
        "total_categories": scraper_state.total_categories,
        "detail_current": scraper_state.detail_current,
        "detail_total": scraper_state.detail_total,
    }


@router.post("/cancel")
async def cancel_scraper():
    """スクレイピングをキャンセル"""
    if not scraper_state.is_running:
        raise HTTPException(status_code=400, detail="スクレイピングは実行中ではありません")

    scraper_state.cancelled = True
    scraper_state.message = "キャンセル中..."
    return {"success": True, "message": "キャンセルリクエストを送信しました"}


@router.get("/stats")
async def get_scraper_stats():
    """スクレイピング統計を取得"""
    try:
        supabase = get_supabase_client()
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # 今日の件数
        today_result = supabase.table("jobs").select("job_id", count="exact").gte("scraped_at", today.isoformat()).execute()
        today_count = today_result.count or 0

        # 今週の件数
        week_start = today.replace(hour=0, minute=0, second=0)
        week_result = supabase.table("jobs").select("job_id", count="exact").gte("scraped_at", week_start.isoformat()).execute()
        week_count = week_result.count or 0

        # 総件数
        total_result = supabase.table("jobs").select("job_id", count="exact").execute()
        total_count = total_result.count or 0

        # カテゴリ別
        by_category = {}
        categories = ["system", "web", "writing", "design", "multimedia", "business", "translation"]
        for cat in categories:
            cat_result = supabase.table("jobs").select("job_id", count="exact").eq("category", cat).execute()
            by_category[cat] = cat_result.count or 0

        return {
            "today": today_count,
            "this_week": week_count,
            "total": total_count,
            "by_category": by_category,
        }

    except Exception as e:
        print(f"統計取得エラー: {e}")
        return {"today": 0, "this_week": 0, "total": 0, "by_category": {}}


@router.post("/clear-database")
async def clear_jobs_database():
    """データベースの案件データを削除"""
    result = await clear_database()
    if result.get("success"):
        return {"success": True, "message": "データベースをクリアしました"}
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "不明なエラー"))


@router.post("/clear-spreadsheet")
async def clear_spreadsheet_alias():
    """データベースの案件データを削除（後方互換性）"""
    return await clear_jobs_database()


@router.post("/cleanup-expired")
async def cleanup_expired():
    """期限切れ案件をデータベースから削除"""
    result = await cleanup_expired_jobs()
    if result.get("success"):
        return {
            "success": True,
            "deleted": result.get("deleted", 0),
            "message": f"{result.get('deleted', 0)}件の期限切れ案件を削除しました"
        }
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "不明なエラー"))


@router.get("/history")
async def get_scraper_history():
    """スクレイピング履歴を取得"""
    return {"history": scraper_history}
