"""GitHub Actions API routes"""

import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/github", tags=["github"])

# GitHub設定
GITHUB_REPO = os.environ.get("GITHUB_REPO", "takumimorimoto-yakumo/outsourcing-proposal-agent")
GITHUB_WORKFLOW_ID = os.environ.get("GITHUB_WORKFLOW_ID", "scheduled-scrape.yml")


class TriggerWorkflowRequest(BaseModel):
    """ワークフロートリガーリクエスト"""
    categories: list[str] = ["system", "web"]
    job_types: list[str] = ["project"]
    max_pages: int = 3
    fetch_details: bool = True


@router.get("/workflow-runs")
async def get_workflow_runs(limit: int = 10):
    """GitHub Actionsのワークフロー実行履歴を取得"""
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        return {
            "success": False,
            "error": "GITHUB_TOKEN が設定されていません",
            "runs": [],
            "setup_required": True,
        }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{GITHUB_WORKFLOW_ID}/runs",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                },
                params={"per_page": limit},
            )

            if response.status_code == 404:
                return {
                    "success": False,
                    "error": "ワークフローが見つかりません",
                    "runs": [],
                }

            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"GitHub API エラー: {response.status_code}",
                    "runs": [],
                }

            data = response.json()
            runs = []
            for run in data.get("workflow_runs", []):
                runs.append({
                    "id": run["id"],
                    "status": run["status"],
                    "conclusion": run["conclusion"],
                    "created_at": run["created_at"],
                    "updated_at": run["updated_at"],
                    "html_url": run["html_url"],
                    "event": run["event"],
                    "run_number": run["run_number"],
                })

            return {
                "success": True,
                "runs": runs,
                "total_count": data.get("total_count", 0),
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "runs": [],
        }


@router.post("/trigger-workflow")
async def trigger_workflow(request: TriggerWorkflowRequest):
    """GitHub Actionsワークフローを手動トリガー"""
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        raise HTTPException(
            status_code=400,
            detail="GITHUB_TOKEN が設定されていません。設定ページで設定してください。"
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/{GITHUB_WORKFLOW_ID}/dispatches",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/vnd.github.v3+json",
                },
                json={
                    "ref": "main",
                    "inputs": {
                        "categories": ",".join(request.categories),
                        "job_types": ",".join(request.job_types),
                        "max_pages": str(request.max_pages),
                        "fetch_details": str(request.fetch_details).lower(),
                    },
                },
            )

            if response.status_code == 204:
                return {
                    "success": True,
                    "message": "ワークフローをトリガーしました。実行が開始されるまで少々お待ちください。",
                }
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="ワークフローが見つかりません。リポジトリ設定を確認してください。"
                )
            else:
                error_data = response.json() if response.text else {}
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("message", f"GitHub API エラー: {response.status_code}")
                )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ワークフロートリガーエラー: {str(e)}")


@router.get("/config")
async def get_github_config():
    """GitHub連携の設定状態を取得"""
    token = os.environ.get("GITHUB_TOKEN")
    return {
        "configured": bool(token),
        "repo": GITHUB_REPO,
        "workflow_id": GITHUB_WORKFLOW_ID,
    }
