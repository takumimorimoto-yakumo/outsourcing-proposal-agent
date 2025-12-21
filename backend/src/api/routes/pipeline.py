"""Pipeline API routes - パイプライン管理"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.db import get_supabase_client

router = APIRouter(prefix="/api/pipeline", tags=["pipeline"])

# パイプラインステータスの定義
VALID_STATUSES = ["draft", "submitted", "ongoing", "expired", "rejected", "completed"]


class PipelineJobCreate(BaseModel):
    """パイプラインジョブ作成モデル"""
    job_id: str
    pipeline_status: str
    notes: str = ""


class PipelineJobUpdate(BaseModel):
    """パイプラインジョブ更新モデル"""
    pipeline_status: Optional[str] = None
    notes: Optional[str] = None


class PipelineStatusChange(BaseModel):
    """ステータス変更モデル"""
    new_status: str


@router.get("")
async def get_all_pipeline_jobs():
    """全パイプラインジョブを取得"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("pipeline_jobs").select("*").order("added_at", desc=True).execute()
        return {"success": True, "jobs": response.data or []}
    except Exception as e:
        print(f"パイプラインジョブ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"取得エラー: {str(e)}")


@router.get("/status/{status}")
async def get_pipeline_jobs_by_status(status: str):
    """ステータス別にパイプラインジョブを取得"""
    if status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"無効なステータス: {status}")

    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("pipeline_jobs")
            .select("*")
            .eq("pipeline_status", status)
            .order("added_at", desc=True)
            .execute()
        )
        return {"success": True, "jobs": response.data or []}
    except Exception as e:
        print(f"パイプラインジョブ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"取得エラー: {str(e)}")


@router.get("/job/{job_id}")
async def get_pipeline_job(job_id: str):
    """特定のジョブIDのパイプライン情報を取得"""
    try:
        supabase = get_supabase_client()
        response = (
            supabase.table("pipeline_jobs")
            .select("*")
            .eq("job_id", job_id)
            .execute()
        )
        return {"success": True, "jobs": response.data or []}
    except Exception as e:
        print(f"パイプラインジョブ取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"取得エラー: {str(e)}")


@router.post("")
async def add_pipeline_job(job: PipelineJobCreate):
    """パイプラインにジョブを追加"""
    if job.pipeline_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"無効なステータス: {job.pipeline_status}")

    try:
        supabase = get_supabase_client()

        # 既に同じジョブが同じステータスで存在するか確認
        existing = (
            supabase.table("pipeline_jobs")
            .select("id")
            .eq("job_id", job.job_id)
            .eq("pipeline_status", job.pipeline_status)
            .execute()
        )

        if existing.data and len(existing.data) > 0:
            return {"success": True, "message": "既に追加済みです", "id": existing.data[0]["id"]}

        # 新規追加
        now = datetime.utcnow().isoformat()
        data = {
            "job_id": job.job_id,
            "pipeline_status": job.pipeline_status,
            "notes": job.notes,
            "added_at": now,
            "status_changed_at": now,
        }
        response = supabase.table("pipeline_jobs").insert(data).execute()

        return {
            "success": True,
            "message": "追加しました",
            "id": response.data[0]["id"] if response.data else None,
        }
    except Exception as e:
        print(f"パイプラインジョブ追加エラー: {e}")
        raise HTTPException(status_code=500, detail=f"追加エラー: {str(e)}")


@router.put("/{pipeline_id}")
async def update_pipeline_job(pipeline_id: str, update: PipelineJobUpdate):
    """パイプラインジョブを更新"""
    if update.pipeline_status and update.pipeline_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"無効なステータス: {update.pipeline_status}")

    try:
        supabase = get_supabase_client()

        update_data = {}
        if update.pipeline_status:
            update_data["pipeline_status"] = update.pipeline_status
            update_data["status_changed_at"] = datetime.utcnow().isoformat()
        if update.notes is not None:
            update_data["notes"] = update.notes

        if not update_data:
            return {"success": True, "message": "更新項目がありません"}

        response = (
            supabase.table("pipeline_jobs")
            .update(update_data)
            .eq("id", pipeline_id)
            .execute()
        )

        return {"success": True, "message": "更新しました"}
    except Exception as e:
        print(f"パイプラインジョブ更新エラー: {e}")
        raise HTTPException(status_code=500, detail=f"更新エラー: {str(e)}")


@router.put("/job/{job_id}/status")
async def change_job_status(job_id: str, status_change: PipelineStatusChange):
    """ジョブのステータスを変更（別のパイプラインに移動）"""
    new_status = status_change.new_status
    if new_status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"無効なステータス: {new_status}")

    try:
        supabase = get_supabase_client()

        # 現在のパイプラインエントリを取得
        current = (
            supabase.table("pipeline_jobs")
            .select("*")
            .eq("job_id", job_id)
            .execute()
        )

        if not current.data:
            raise HTTPException(status_code=404, detail="ジョブが見つかりません")

        # 既に新しいステータスで存在するか確認
        existing_new = next(
            (j for j in current.data if j["pipeline_status"] == new_status),
            None
        )
        if existing_new:
            return {"success": True, "message": "既にそのステータスです"}

        # 古いエントリを削除して新しいエントリを作成
        old_entry = current.data[0]
        now = datetime.utcnow().isoformat()

        # 古いエントリを削除
        supabase.table("pipeline_jobs").delete().eq("id", old_entry["id"]).execute()

        # 新しいエントリを作成
        new_data = {
            "job_id": job_id,
            "pipeline_status": new_status,
            "notes": old_entry.get("notes", ""),
            "added_at": old_entry.get("added_at", now),
            "status_changed_at": now,
        }
        supabase.table("pipeline_jobs").insert(new_data).execute()

        return {"success": True, "message": f"ステータスを{new_status}に変更しました"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"ステータス変更エラー: {e}")
        raise HTTPException(status_code=500, detail=f"変更エラー: {str(e)}")


@router.delete("/{pipeline_id}")
async def delete_pipeline_job(pipeline_id: str):
    """パイプラインからジョブを削除"""
    try:
        supabase = get_supabase_client()
        supabase.table("pipeline_jobs").delete().eq("id", pipeline_id).execute()
        return {"success": True, "message": "削除しました"}
    except Exception as e:
        print(f"パイプラインジョブ削除エラー: {e}")
        raise HTTPException(status_code=500, detail=f"削除エラー: {str(e)}")


@router.delete("/job/{job_id}")
async def delete_job_from_pipeline(job_id: str):
    """特定のジョブIDを全パイプラインから削除"""
    try:
        supabase = get_supabase_client()
        supabase.table("pipeline_jobs").delete().eq("job_id", job_id).execute()
        return {"success": True, "message": "削除しました"}
    except Exception as e:
        print(f"パイプラインジョブ削除エラー: {e}")
        raise HTTPException(status_code=500, detail=f"削除エラー: {str(e)}")


@router.get("/summary")
async def get_pipeline_summary():
    """パイプラインサマリーを取得"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("pipeline_jobs").select("pipeline_status").execute()

        summary = {status: 0 for status in VALID_STATUSES}
        for job in response.data or []:
            status = job.get("pipeline_status")
            if status in summary:
                summary[status] += 1

        return {"success": True, "summary": summary}
    except Exception as e:
        print(f"サマリー取得エラー: {e}")
        raise HTTPException(status_code=500, detail=f"取得エラー: {str(e)}")
