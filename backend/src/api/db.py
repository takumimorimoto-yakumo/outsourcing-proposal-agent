"""Database operations for jobs"""

from datetime import datetime
from typing import Optional

from src.db.supabase_client import get_supabase_client


def job_to_db_record(job: dict) -> dict:
    """案件データをDBレコード形式に変換"""
    client = job.get("client") or {}
    return {
        "job_id": job.get("job_id"),
        "title": job.get("title", ""),
        "description": job.get("description", ""),
        "category": job.get("category", "other"),
        "subcategory": job.get("subcategory"),
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
        "subcategory": record.get("subcategory"),
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
        "client_name": record.get("client_name"),
        "client_rating": record.get("client_rating"),
        "client_review_count": record.get("client_review_count"),
        "client_order_history": record.get("client_order_history"),
        "scraped_at": record.get("scraped_at"),
    }


async def save_to_database(jobs: list[dict]) -> dict:
    """案件データをデータベースに保存（upsert）"""
    if not jobs:
        return {"success": True, "added": 0, "updated": 0}

    try:
        supabase = get_supabase_client()
        records = [job_to_db_record(job) for job in jobs]

        # 既存のjob_idを取得
        job_ids = [r["job_id"] for r in records if r["job_id"]]
        existing_result = supabase.table("jobs").select("job_id").in_("job_id", job_ids).execute()
        existing_ids = {r["job_id"] for r in existing_result.data}

        # 新規と更新を分類
        new_records = [r for r in records if r["job_id"] not in existing_ids]
        update_records = [r for r in records if r["job_id"] in existing_ids]

        added_count = 0
        updated_count = 0

        # 新規追加
        if new_records:
            supabase.table("jobs").insert(new_records).execute()
            added_count = len(new_records)

        # 更新（upsert）
        if update_records:
            for record in update_records:
                supabase.table("jobs").upsert(record, on_conflict="job_id").execute()
            updated_count = len(update_records)

        return {"success": True, "added": added_count, "updated": updated_count}

    except Exception as e:
        print(f"データベース保存エラー: {e}")
        return {"success": False, "error": str(e), "added": 0, "updated": 0}


async def fetch_from_database(
    category: Optional[str] = None,
    job_types: Optional[list[str]] = None,
    limit: int = 1000,
) -> list[dict]:
    """データベースから案件を取得"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("jobs").select("*")

        if category:
            query = query.eq("category", category)

        if job_types:
            query = query.in_("job_type", job_types)

        query = query.order("scraped_at", desc=True).limit(limit)
        result = query.execute()

        return [db_record_to_job(record) for record in result.data]

    except Exception as e:
        print(f"データベース取得エラー: {e}")
        return []


async def clear_database() -> dict:
    """データベースの全データを削除"""
    try:
        supabase = get_supabase_client()
        supabase.table("jobs").delete().neq("job_id", "").execute()
        return {"success": True}
    except Exception as e:
        print(f"データベースクリアエラー: {e}")
        return {"success": False, "error": str(e)}


async def cleanup_expired_jobs() -> dict:
    """期限切れ案件をデータベースから削除"""
    try:
        supabase = get_supabase_client()

        # remaining_days <= 0 または status = 'closed' の案件を削除
        result1 = supabase.table("jobs").delete().lte("remaining_days", 0).execute()
        deleted_by_days = len(result1.data) if result1.data else 0

        result2 = supabase.table("jobs").delete().eq("status", "closed").execute()
        deleted_by_status = len(result2.data) if result2.data else 0

        total_deleted = deleted_by_days + deleted_by_status
        print(f"期限切れ案件削除完了: {total_deleted}件")

        return {
            "success": True,
            "deleted": total_deleted,
            "deleted_by_remaining_days": deleted_by_days,
            "deleted_by_status": deleted_by_status,
        }
    except Exception as e:
        print(f"期限切れ削除エラー: {e}")
        return {"success": False, "error": str(e), "deleted": 0}
