"""Supabase client configuration"""

import os
from typing import Optional
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# .envファイルを読み込み
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)

_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """Supabaseクライアントを取得（シングルトン）"""
    global _supabase_client

    if _supabase_client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not key:
            raise ValueError(
                "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
            )

        _supabase_client = create_client(url, key)

    return _supabase_client


# デフォルトクライアント
supabase = get_supabase_client()
