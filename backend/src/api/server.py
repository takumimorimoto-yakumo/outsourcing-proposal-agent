"""FastAPI サーバー - メインエントリーポイント"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# .envファイルを読み込み
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

# ルーターをインポート
from src.api.routes import (
    jobs_router,
    scraper_router,
    profile_router,
    analysis_router,
    proposals_router,
    github_router,
    pipeline_router,
)

app = FastAPI(title="Proposal Generator API", version="1.0.0")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3005"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(jobs_router)
app.include_router(scraper_router)
app.include_router(profile_router)
app.include_router(analysis_router)
app.include_router(proposals_router)
app.include_router(github_router)
app.include_router(pipeline_router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
