"""FastAPI サーバー"""

import asyncio
import httpx
import json
import os
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass

from fastapi import FastAPI, Query, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# .envファイルを読み込み
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

from src.models.config import ScrapingConfig, HumanLikeConfig, TimeoutConfig
from src.scrapers.lancers import LancersScraper
from src.db.supabase_client import get_supabase_client


# スクレイパー状態管理
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
    # 詳細ステータス
    phase: str = "idle"  # idle, fetching, saving, done
    message: str = ""
    current_category_index: int = 0
    total_categories: int = 0
    # 詳細取得進捗
    detail_current: int = 0
    detail_total: int = 0


# グローバル状態
scraper_state = ScraperState()
scraper_history: list[dict] = []

app = FastAPI(title="Proposal Generator API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3005"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def job_to_db_record(job: dict) -> dict:
    """案件データをDBレコード形式に変換"""
    client = job.get("client") or {}
    return {
        "job_id": job.get("job_id"),
        "title": job.get("title", ""),
        "description": job.get("description", ""),
        "category": job.get("category", "other"),
        "budget_type": job.get("budget_type", "unknown"),
        "job_type": job.get("job_type", "project"),
        "status": job.get("status", "open"),
        "budget_min": job.get("budget_min"),
        "budget_max": job.get("budget_max"),
        "deadline": job.get("deadline"),
        "remaining_days": job.get("remaining_days"),
        "required_skills": job.get("required_skills", []),
        "tags": job.get("tags", []),
        "feature_tags": job.get("feature_tags", []),
        "proposal_count": job.get("proposal_count"),
        "recruitment_count": job.get("recruitment_count"),
        "source": job.get("source", "lancers"),
        "url": job.get("url", ""),
        "client_name": client.get("name") if isinstance(client, dict) else job.get("client_name"),
        "client_rating": client.get("rating") if isinstance(client, dict) else job.get("client_rating"),
        "client_review_count": client.get("review_count") if isinstance(client, dict) else job.get("client_review_count"),
        "client_order_history": client.get("order_history") if isinstance(client, dict) else job.get("client_order_history"),
        "scraped_at": job.get("scraped_at", datetime.now().isoformat()),
    }


def db_record_to_job(record: dict) -> dict:
    """DBレコードを案件データ形式に変換"""
    return {
        "job_id": record.get("job_id"),
        "title": record.get("title", ""),
        "description": record.get("description", ""),
        "category": record.get("category", "other"),
        "budget_type": record.get("budget_type", "unknown"),
        "job_type": record.get("job_type", "project"),
        "status": record.get("status", "open"),
        "budget_min": record.get("budget_min"),
        "budget_max": record.get("budget_max"),
        "deadline": record.get("deadline"),
        "remaining_days": record.get("remaining_days"),
        "required_skills": record.get("required_skills", []),
        "tags": record.get("tags", []),
        "feature_tags": record.get("feature_tags", []),
        "proposal_count": record.get("proposal_count"),
        "recruitment_count": record.get("recruitment_count"),
        "source": record.get("source", "lancers"),
        "url": record.get("url", ""),
        "client": {
            "name": record.get("client_name"),
            "rating": record.get("client_rating"),
            "review_count": record.get("client_review_count"),
            "order_history": record.get("client_order_history"),
        },
        "scraped_at": record.get("scraped_at"),
    }


async def save_to_database(jobs: list[dict]) -> dict:
    """Supabaseにデータを保存（upsert）"""
    total_added = 0
    total_updated = 0

    try:
        supabase = get_supabase_client()
        print(f"Supabase保存開始: {len(jobs)}件")

        for job in jobs:
            record = job_to_db_record(job)
            job_id = record.get("job_id")

            if not job_id:
                print(f"  スキップ: job_idがありません - {record.get('title', 'Unknown')}")
                continue

            # 既存レコードをチェック
            existing = supabase.table("jobs").select("id").eq("job_id", job_id).execute()

            if existing.data:
                # 更新
                supabase.table("jobs").update(record).eq("job_id", job_id).execute()
                total_updated += 1
            else:
                # 新規追加
                supabase.table("jobs").insert(record).execute()
                total_added += 1

        print(f"Supabase保存完了: 追加{total_added}件, 更新{total_updated}件")
        return {
            "success": True,
            "added": total_added,
            "updated": total_updated,
            "count": total_added + total_updated
        }

    except Exception as e:
        print(f"Supabase保存エラー: {e}")
        return {
            "success": False,
            "error": str(e),
            "added": total_added,
            "updated": total_updated
        }


async def fetch_from_database(
    category: Optional[str] = None,
    job_types: Optional[list[str]] = None,
    status: str = "open"
) -> list[dict]:
    """Supabaseからデータを取得"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("jobs").select("*")

        # フィルタ適用
        if category and category != "all":
            query = query.eq("category", category)

        if job_types:
            query = query.in_("job_type", job_types)

        if status:
            query = query.eq("status", status)

        # 最新順にソート
        query = query.order("scraped_at", desc=True)

        result = query.execute()

        # レコードを案件形式に変換
        jobs = [db_record_to_job(record) for record in result.data]
        return jobs

    except Exception as e:
        print(f"Supabase読み込みエラー: {e}")
        return []


async def clear_database() -> dict:
    """Supabaseのデータを削除"""
    try:
        supabase = get_supabase_client()
        # 全レコード削除（status != 'never_match' で全件マッチさせる）
        supabase.table("jobs").delete().neq("status", "never_match_placeholder").execute()
        return {"success": True, "message": "全データを削除しました"}
    except Exception as e:
        print(f"Supabase削除エラー: {e}")
        return {"success": False, "error": str(e)}


@app.get("/")
async def root():
    return {"message": "Proposal Generator API", "version": "1.0.0"}


@app.get("/api/categories")
async def get_categories():
    """利用可能なカテゴリ一覧"""
    return {
        "categories": [
            {"value": "system", "label": "システム開発・運用"},
            {"value": "web", "label": "Web制作・Webデザイン"},
            {"value": "writing", "label": "ライティング・記事作成"},
            {"value": "design", "label": "デザイン制作"},
            {"value": "multimedia", "label": "写真・映像・音楽"},
            {"value": "business", "label": "ビジネス・マーケティング"},
            {"value": "translation", "label": "翻訳・通訳"},
        ]
    }


@app.get("/api/job-types")
async def get_job_types():
    """案件形式一覧"""
    return {
        "job_types": [
            {"value": "project", "label": "プロジェクト"},
            {"value": "task", "label": "タスク"},
            {"value": "competition", "label": "コンペ"},
        ]
    }


@app.get("/api/jobs/{job_id}/detail")
async def fetch_job_detail(job_id: str):
    """案件詳細をスクレイピングで取得"""
    url = f"https://www.lancers.jp/work/detail/{job_id}"

    # 高速化: human_like無効
    config = ScrapingConfig(
        human_like=HumanLikeConfig(enabled=False),
        timeout=TimeoutConfig(page_load=30000, element_wait=5000),
    )
    scraper = LancersScraper(config)

    try:
        job = await scraper.scrape(url)
        client = job.client
        return {
            "title": job.title,
            "description": job.description,
            "category": job.category.value if job.category else "",
            "budget_type": job.budget_type.value if job.budget_type else "",
            "job_id": job.job_id,
            "job_type": job.job_type.value if job.job_type else "",
            "status": job.status.value if job.status else "",
            "budget_min": job.budget_min,
            "budget_max": job.budget_max,
            "deadline": job.deadline,
            "remaining_days": job.remaining_days,
            "required_skills": job.required_skills or [],
            "tags": job.tags or [],
            "feature_tags": job.feature_tags or [],
            "proposal_count": job.proposal_count,
            "recruitment_count": job.recruitment_count,
            "source": job.source.value if job.source else "",
            "url": job.url,
            "client_name": client.name if client else None,
            "client_rating": client.rating if client else None,
            "client_order_history": client.order_history if client else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/jobs")
async def fetch_jobs(
    category: Optional[str] = Query(None, description="カテゴリ（省略時は全カテゴリ）"),
    job_types: str = Query("project,task,competition", description="案件形式（カンマ区切り）"),
):
    """データベースから案件を取得"""
    job_type_list = [jt.strip() for jt in job_types.split(",")]

    # データベースから全件取得
    jobs = await fetch_from_database()

    # フィルタリング
    filtered_jobs = []
    for job in jobs:
        # カテゴリフィルター
        if category and job.get("category") != category:
            continue
        # 案件形式フィルター
        if job.get("job_type") not in job_type_list:
            continue
        filtered_jobs.append(job)

    return {"jobs": filtered_jobs, "total": len(filtered_jobs)}


# =============================================================================
# スクレイパーダッシュボード用エンドポイント
# =============================================================================

class ScraperStartRequest(BaseModel):
    """スクレイピング開始リクエスト"""
    categories: list[str] = []
    job_types: list[str] = ["project"]
    max_pages: int = 3
    fetch_details: bool = False
    save_to_database: bool = True


async def run_scraper_task(request: ScraperStartRequest):
    """バックグラウンドでスクレイピングを実行"""
    global scraper_state, scraper_history

    # デバッグ: リクエスト内容をログ出力
    print("=" * 50)
    print("スクレイピング開始")
    print(f"  categories: {request.categories}")
    print(f"  job_types: {request.job_types}")
    print(f"  max_pages: {request.max_pages}")
    print(f"  fetch_details: {request.fetch_details}")  # ← これが重要
    print(f"  save_to_database: {request.save_to_database}")
    print("=" * 50)

    # 高速化: human_like無効、タイムアウト短縮
    config = ScrapingConfig(
        human_like=HumanLikeConfig(enabled=False),
        timeout=TimeoutConfig(page_load=30000, element_wait=5000),
    )
    scraper = LancersScraper(config)

    categories = request.categories if request.categories else [None]
    total_categories = len(categories)

    max_pages = request.max_pages if request.max_pages > 0 else 100
    is_fetch_all = request.max_pages == 0

    try:
        scraper_state.is_running = True
        scraper_state.current_page = 0
        scraper_state.total_pages = max_pages * total_categories if not is_fetch_all else 0
        scraper_state.jobs_fetched = 0
        scraper_state.estimated_total = max_pages * 30 * total_categories if not is_fetch_all else 0
        scraper_state.started_at = datetime.now()
        scraper_state.category = ", ".join(c or "all" for c in categories)
        scraper_state.error = None
        scraper_state.cancelled = False
        scraper_state.phase = "fetching"
        scraper_state.message = "準備中..."
        scraper_state.current_category_index = 0
        scraper_state.total_categories = total_categories

        all_results = []

        for cat_idx, category in enumerate(categories):
            if scraper_state.cancelled:
                break

            scraper_state.current_category_index = cat_idx + 1
            scraper_state.category = category or "all"
            category_label = category or "全カテゴリ"

            jobs = []
            for page in range(1, max_pages + 1):
                if scraper_state.cancelled:
                    break

                scraper_state.current_page = cat_idx * max_pages + page
                scraper_state.message = f"{category_label} - {page}ページ目を取得中..."

                url = scraper.build_search_url(
                    category=category,
                    job_types=request.job_types,
                    open_only=True,
                    page=page,
                )

                # タイムアウト付きでスクレイピング（90秒）
                try:
                    page_jobs = await asyncio.wait_for(
                        scraper.scrape_list(url=url, max_items=50),
                        timeout=90.0
                    )
                except asyncio.TimeoutError:
                    print(f"タイムアウト: {category_label} - {page}ページ目")
                    scraper_state.message = f"{category_label} - {page}ページ目でタイムアウト、次へ進みます..."
                    break

                jobs.extend(page_jobs)
                scraper_state.jobs_fetched += len(page_jobs)

                # ページが存在しない、または案件が少ない場合は終了
                if len(page_jobs) == 0:
                    print(f"{category_label}: {page}ページ目は空でした、終了します")
                    break
                if len(page_jobs) < 20:
                    print(f"{category_label}: {page}ページ目で{len(page_jobs)}件取得、最終ページと判断")
                    break

                # ページ間の短い待機（1秒）
                await asyncio.sleep(1)

            # デバッグ: 詳細取得ループ開始
            print(f"詳細取得ループ開始: {len(jobs)}件, fetch_details={request.fetch_details}")
            scraper_state.detail_total = len(jobs)
            scraper_state.detail_current = 0

            for idx, job in enumerate(jobs):
                if scraper_state.cancelled:
                    print("キャンセルされました")
                    break

                scraper_state.detail_current = idx + 1
                print(f"処理中: {idx+1}/{len(jobs)} - job_id={job.job_id}")

                job_data = {
                    "title": job.title,
                    "description": job.description,
                    "category": job.category.value if job.category else "",
                    "budget_type": job.budget_type.value if job.budget_type else "",
                    "job_id": job.job_id,
                    "job_type": job.job_type.value if job.job_type else "",
                    "status": job.status.value if job.status else "",
                    "budget_min": job.budget_min,
                    "budget_max": job.budget_max,
                    "deadline": job.deadline,
                    "remaining_days": job.remaining_days,
                    "required_skills": job.required_skills or [],
                    "tags": job.tags or [],
                    "feature_tags": job.feature_tags or [],
                    "proposal_count": job.proposal_count,
                    "recruitment_count": job.recruitment_count,
                    "source": job.source.value if job.source else "",
                    "url": job.url,
                    "client": {
                        "name": job.client.name if job.client else None,
                        "rating": job.client.rating if job.client else None,
                        "order_history": job.client.order_history if job.client else None,
                    } if job.client else None,
                    "scraped_at": datetime.now().isoformat(),
                }

                if request.fetch_details and job.job_id:
                    scraper_state.message = f"詳細取得中: {job.job_id}"
                    try:
                        detail_url = f"https://www.lancers.jp/work/detail/{job.job_id}"
                        # タイムアウト付きで詳細取得（60秒）
                        detail = await asyncio.wait_for(
                            scraper.scrape(detail_url),
                            timeout=60.0
                        )
                        job_data["description"] = detail.description
                        job_data["required_skills"] = detail.required_skills or []
                        job_data["deadline"] = detail.deadline
                        if detail.client:
                            job_data["client"] = {
                                "name": detail.client.name,
                                "rating": detail.client.rating,
                                "order_history": detail.client.order_history,
                            }
                        print(f"詳細取得成功: {job.job_id}")
                    except asyncio.TimeoutError:
                        print(f"詳細取得タイムアウト: {job.job_id}")
                    except Exception as e:
                        print(f"詳細取得エラー: {job.job_id} - {e}")
                    # 詳細取得間の短い待機（1.5秒）
                    await asyncio.sleep(1.5)

                all_results.append(job_data)

        if scraper_state.cancelled:
            scraper_history.insert(0, {
                "timestamp": datetime.now().isoformat(),
                "category": ", ".join(c or "all" for c in categories),
                "count": len(all_results),
                "status": "cancelled",
                "duration_seconds": (datetime.now() - scraper_state.started_at).seconds,
            })
            return

        # JSONファイルに保存（常に実行）
        if all_results:
            output_dir = Path(__file__).parent.parent.parent / "output"
            output_dir.mkdir(exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            category_str = "_".join(c or "all" for c in categories)
            json_path = output_dir / f"{category_str}_jobs_{timestamp}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(all_results, f, ensure_ascii=False, indent=2)
            print(f"JSONファイル保存完了: {json_path}")

        # データベースに保存
        added_count = 0
        updated_count = 0
        if request.save_to_database and all_results:
            scraper_state.phase = "saving"
            scraper_state.message = f"データベースに{len(all_results)}件を保存中..."
            print(f"データベースに{len(all_results)}件保存中...")
            result = await save_to_database(all_results)
            if result.get("success"):
                added_count = result.get("added", 0)
                updated_count = result.get("updated", 0)
                scraper_state.message = f"保存完了: 追加{added_count}件, 更新{updated_count}件"
                print(f"データベース保存完了: 追加{added_count}件, 更新{updated_count}件")
            else:
                scraper_state.message = f"保存失敗: {result.get('error')}"
                print(f"データベース保存失敗: {result.get('error')}")

        duration = (datetime.now() - scraper_state.started_at).seconds
        scraper_history.insert(0, {
            "timestamp": datetime.now().isoformat(),
            "category": ", ".join(c or "all" for c in categories),
            "count": len(all_results),
            "added": added_count,
            "updated": updated_count,
            "status": "success",
            "duration_seconds": duration,
        })

        scraper_history[:] = scraper_history[:20]

    except Exception as e:
        scraper_state.error = str(e)
        scraper_history.insert(0, {
            "timestamp": datetime.now().isoformat(),
            "category": ", ".join(c or "all" for c in categories),
            "count": 0,
            "status": "error",
            "error": str(e),
            "duration_seconds": (datetime.now() - scraper_state.started_at).seconds if scraper_state.started_at else 0,
        })
    finally:
        scraper_state.is_running = False


@app.post("/api/scraper/start")
async def start_scraper(request: ScraperStartRequest, background_tasks: BackgroundTasks):
    """スクレイピングを開始"""
    global scraper_state

    if scraper_state.is_running:
        raise HTTPException(status_code=400, detail="スクレイピングは既に実行中です")

    background_tasks.add_task(run_scraper_task, request)

    return {"success": True, "message": "スクレイピングを開始しました"}


@app.get("/api/scraper/status")
async def get_scraper_status():
    """スクレイピングの進捗状況を取得"""
    elapsed_seconds = 0
    if scraper_state.started_at and scraper_state.is_running:
        elapsed_seconds = (datetime.now() - scraper_state.started_at).seconds

    return {
        "is_running": scraper_state.is_running,
        "current_page": scraper_state.current_page,
        "total_pages": scraper_state.total_pages,
        "jobs_fetched": scraper_state.jobs_fetched,
        "estimated_total": scraper_state.estimated_total,
        "elapsed_seconds": elapsed_seconds,
        "category": scraper_state.category,
        "error": scraper_state.error,
        "phase": scraper_state.phase,
        "message": scraper_state.message,
        "current_category_index": scraper_state.current_category_index,
        "total_categories": scraper_state.total_categories,
        "detail_current": scraper_state.detail_current,
        "detail_total": scraper_state.detail_total,
    }


@app.post("/api/scraper/cancel")
async def cancel_scraper():
    """スクレイピングをキャンセル"""
    global scraper_state

    if not scraper_state.is_running:
        raise HTTPException(status_code=400, detail="スクレイピングは実行されていません")

    scraper_state.cancelled = True

    return {"success": True, "message": "キャンセルをリクエストしました"}


@app.get("/api/scraper/stats")
async def get_scraper_stats():
    """スクレイピング統計を取得（履歴ベース + データベース）"""
    jobs = await fetch_from_database()

    # カテゴリ別集計（データベースの現在のデータ）
    by_category: dict[str, int] = {}
    for job in jobs:
        cat = job.get("category", "unknown")
        by_category[cat] = by_category.get(cat, 0) + 1

    # 履歴から新規追加数を集計
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())

    today_added = 0
    this_week_added = 0
    total_added = 0

    for entry in scraper_history:
        if entry.get("status") != "success":
            continue

        added = entry.get("added", 0)
        total_added += added

        try:
            ts = datetime.fromisoformat(entry["timestamp"]).date()
            if ts == today:
                today_added += added
            if ts >= week_start:
                this_week_added += added
        except (ValueError, KeyError):
            pass

    return {
        "today": today_added,
        "this_week": this_week_added,
        "total": len(jobs),  # データベースの総件数
        "total_added": total_added,  # 履歴からの新規追加合計
        "by_category": by_category,
    }


@app.post("/api/scraper/clear-database")
async def clear_jobs_database():
    """データベースの案件データを削除"""
    result = await clear_database()
    if result.get("success"):
        return {"success": True, "message": "データベースをクリアしました"}
    else:
        raise HTTPException(status_code=500, detail=result.get("error", "不明なエラー"))


# 後方互換性のためのエイリアス
@app.post("/api/scraper/clear-spreadsheet")
async def clear_spreadsheet_alias():
    """データベースの案件データを削除（後方互換性）"""
    return await clear_jobs_database()


@app.get("/api/scraper/history")
async def get_scraper_history():
    """スクレイピング履歴を取得"""
    return {"history": scraper_history}


# =============================================================================
# プロフィール管理API
# =============================================================================

# プロフィール保存先パス
PROFILE_PATH = Path(__file__).parent.parent.parent / "config" / "user_profile.json"

# デフォルトプロフィール
DEFAULT_PROFILE = {
    "name": "",
    "bio": "",
    "skills": [],
    "specialties": [],
    "skills_detail": "",
    "preferred_categories": [],
    "preferred_categories_detail": "",
    "website_url": "",
    "github_url": "",
    "twitter_url": "",
    "portfolio_urls": [],
}


class UserProfileModel(BaseModel):
    """ユーザープロフィールモデル"""
    name: str = ""
    bio: str = ""
    skills: list[str] = []
    specialties: list[str] = []
    skills_detail: str = ""
    preferred_categories: list[str] = []
    preferred_categories_detail: str = ""
    website_url: str = ""
    github_url: str = ""
    twitter_url: str = ""
    portfolio_urls: list[str] = []


def load_user_profile() -> dict:
    """プロフィールを読み込み"""
    if PROFILE_PATH.exists():
        try:
            with open(PROFILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                # デフォルト値とマージ
                return {**DEFAULT_PROFILE, **data}
        except (json.JSONDecodeError, IOError) as e:
            print(f"プロフィール読み込みエラー: {e}")
    return DEFAULT_PROFILE.copy()


def save_user_profile(profile: dict) -> bool:
    """プロフィールを保存"""
    try:
        PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(PROFILE_PATH, "w", encoding="utf-8") as f:
            json.dump(profile, f, ensure_ascii=False, indent=2)
        return True
    except IOError as e:
        print(f"プロフィール保存エラー: {e}")
        return False


@app.get("/api/profile")
async def get_profile():
    """プロフィールを取得"""
    return load_user_profile()


@app.post("/api/profile")
async def update_profile(profile: UserProfileModel):
    """プロフィールを更新"""
    profile_dict = profile.model_dump()
    if save_user_profile(profile_dict):
        return {"success": True, "message": "プロフィールを保存しました"}
    else:
        raise HTTPException(status_code=500, detail="プロフィールの保存に失敗しました")


# =============================================================================
# 案件優先度分析API
# =============================================================================

from src.analyzer.job_priority import JobPriorityAnalyzer, UserProfile as AnalyzerUserProfile


class AnalyzePriorityRequest(BaseModel):
    """優先度分析リクエスト"""
    job_ids: list[str]


@app.post("/api/jobs/analyze-priority")
async def analyze_job_priority(request: AnalyzePriorityRequest):
    """案件の優先度を分析"""
    # プロフィール読み込み
    profile_data = load_user_profile()

    # AnalyzerUserProfileに変換（新しいプロフィール形式から必要なフィールドのみ）
    analyzer_profile = AnalyzerUserProfile(
        name=profile_data.get("name", ""),
        skills=profile_data.get("skills", []),
        specialties=profile_data.get("specialties", []),
        preferred_categories=profile_data.get("preferred_categories", []),
    )

    # アナライザー初期化
    analyzer = JobPriorityAnalyzer(analyzer_profile)

    # データベースから案件データを取得
    all_jobs = await fetch_from_database()

    # リクエストされたjob_idに対応する案件をフィルタリング
    job_id_set = set(request.job_ids)
    target_jobs = [
        job for job in all_jobs
        if job.get("job_id") in job_id_set or job.get("url") in job_id_set
    ]

    # リクエストされた全てのjob_idが見つからない場合、全件分析
    if not target_jobs and request.job_ids:
        target_jobs = all_jobs

    # 分析実行
    scores = analyzer.analyze_batch(target_jobs)

    # 結果を辞書形式に変換
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


@app.get("/api/jobs/analyze-all-priorities")
async def analyze_all_priorities():
    """全案件の優先度を分析"""
    # プロフィール読み込み
    profile_data = load_user_profile()

    # AnalyzerUserProfileに変換（新しいプロフィール形式から必要なフィールドのみ）
    analyzer_profile = AnalyzerUserProfile(
        name=profile_data.get("name", ""),
        skills=profile_data.get("skills", []),
        specialties=profile_data.get("specialties", []),
        preferred_categories=profile_data.get("preferred_categories", []),
    )

    # アナライザー初期化
    analyzer = JobPriorityAnalyzer(analyzer_profile)

    # データベースから全案件データを取得
    all_jobs = await fetch_from_database()

    # 分析実行
    scores = analyzer.analyze_batch(all_jobs)

    # 結果を配列形式に変換
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


# =============================================================================
# 提案文生成API
# =============================================================================

class GenerateProposalRequestModel(BaseModel):
    """提案文生成リクエスト"""
    job_id: str
    max_retries: int = 3


@app.post("/api/proposals/generate")
async def generate_proposal(request: GenerateProposalRequestModel):
    """提案文を自動生成（マルチエージェントシステム）"""
    from src.agents import BossAgent

    # プロフィール読み込み
    user_profile = load_user_profile()

    # データベースから案件データを取得
    all_jobs = await fetch_from_database()

    # 対象の案件を検索
    target_job = None
    for job in all_jobs:
        if job.get("job_id") == request.job_id or job.get("url", "").endswith(request.job_id):
            target_job = job
            break

    if not target_job:
        raise HTTPException(status_code=404, detail=f"案件が見つかりません: {request.job_id}")

    # Boss Agentを初期化して実行
    try:
        boss = BossAgent()
        result = await boss.generate_proposal(
            job=target_job,
            user_profile=user_profile,
            max_retries=request.max_retries,
        )

        return result.to_dict()

    except ValueError as e:
        # API キー未設定など
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"提案文生成エラー: {str(e)}")


@app.get("/api/proposals/generate/{job_id}")
async def generate_proposal_get(job_id: str, max_retries: int = 3):
    """提案文を自動生成（GETメソッド版）"""
    request = GenerateProposalRequestModel(job_id=job_id, max_retries=max_retries)
    return await generate_proposal(request)


# =============================================================================
# AI案件スコアリングAPI
# =============================================================================

class ScoreJobRequestModel(BaseModel):
    """案件スコアリングリクエスト"""
    job_id: str


class ScoreJobsRequestModel(BaseModel):
    """複数案件スコアリングリクエスト"""
    job_ids: list[str]


@app.post("/api/jobs/ai-score")
async def score_job(request: ScoreJobRequestModel):
    """案件をAIでスコアリング"""
    from src.agents import JobScoringAgent
    from src.agents.models import JobScoringInput

    # プロフィール読み込み
    user_profile = load_user_profile()

    # データベースから案件データを取得
    all_jobs = await fetch_from_database()

    # 対象の案件を検索
    target_job = None
    for job in all_jobs:
        if job.get("job_id") == request.job_id or job.get("url", "").endswith(request.job_id):
            target_job = job
            break

    if not target_job:
        raise HTTPException(status_code=404, detail=f"案件が見つかりません: {request.job_id}")

    # JobScoringAgentで評価
    try:
        agent = JobScoringAgent()
        input_data = JobScoringInput(job=target_job, user_profile=user_profile)
        result = await agent.execute(input_data)

        if result.success:
            return {
                "success": True,
                "job_id": request.job_id,
                "score": result.data.to_dict(),
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


@app.post("/api/jobs/ai-score-batch")
async def score_jobs_batch(request: ScoreJobsRequestModel):
    """複数案件をAIでスコアリング（バッチ処理）"""
    from src.agents import JobScoringAgent
    from src.agents.models import JobScoringInput

    # プロフィール読み込み
    user_profile = load_user_profile()

    # データベースから案件データを取得
    all_jobs = await fetch_from_database()

    # 対象の案件を検索
    job_id_set = set(request.job_ids)
    target_jobs = [
        job for job in all_jobs
        if job.get("job_id") in job_id_set
    ]

    if not target_jobs:
        raise HTTPException(status_code=404, detail="指定された案件が見つかりません")

    # JobScoringAgentで評価
    agent = JobScoringAgent()
    results = []

    for job in target_jobs:
        job_id = job.get("job_id")
        try:
            input_data = JobScoringInput(job=job, user_profile=user_profile)
            result = await agent.execute(input_data)

            if result.success:
                results.append({
                    "job_id": job_id,
                    "success": True,
                    "score": result.data.to_dict(),
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
