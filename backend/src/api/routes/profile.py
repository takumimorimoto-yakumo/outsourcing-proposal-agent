"""Profile API routes"""

import json
import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

from src.config.models import RECOMMENDED
from src.db import get_supabase_client

router = APIRouter(prefix="/api/profile", tags=["profile"])

# プロフィール保存先パス（フォールバック用）
PROFILE_PATH = Path(__file__).parent.parent.parent.parent / "config" / "user_profile.json"

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


def load_user_profile_from_supabase() -> Optional[dict]:
    """Supabaseからプロフィールを読み込み"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("user_profiles").select("*").limit(1).execute()
        if response.data and len(response.data) > 0:
            data = response.data[0]
            # DBのカラム名をAPIのフィールド名にマッピング
            return {
                "name": data.get("name", ""),
                "bio": data.get("bio", ""),
                "skills": data.get("skills", []),
                "specialties": data.get("specialties", []),
                "skills_detail": data.get("skills_detail", ""),
                "preferred_categories": data.get("preferred_categories", []),
                "preferred_categories_detail": data.get("preferred_categories_detail", ""),
                "website_url": data.get("website_url", ""),
                "github_url": data.get("github_url", ""),
                "twitter_url": data.get("twitter_url", ""),
                "portfolio_urls": data.get("portfolio_urls", []),
            }
        return None
    except Exception as e:
        print(f"Supabaseからのプロフィール読み込みエラー: {e}")
        return None


def load_user_profile_from_file() -> Optional[dict]:
    """ファイルからプロフィールを読み込み（フォールバック）"""
    if PROFILE_PATH.exists():
        try:
            with open(PROFILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"ファイルからのプロフィール読み込みエラー: {e}")
    return None


def load_user_profile() -> dict:
    """プロフィールを読み込み（Supabase優先、ファイルフォールバック）"""
    # まずSupabaseから読み込み
    profile = load_user_profile_from_supabase()
    if profile:
        return {**DEFAULT_PROFILE, **profile}

    # Supabaseにない場合はファイルから読み込み
    file_profile = load_user_profile_from_file()
    if file_profile:
        return {**DEFAULT_PROFILE, **file_profile}

    return DEFAULT_PROFILE.copy()


def save_user_profile_to_supabase(profile: dict) -> bool:
    """Supabaseにプロフィールを保存"""
    try:
        supabase = get_supabase_client()
        # 既存のプロフィールを確認
        existing = supabase.table("user_profiles").select("id").limit(1).execute()

        profile_data = {
            "name": profile.get("name", ""),
            "bio": profile.get("bio", ""),
            "skills": profile.get("skills", []),
            "specialties": profile.get("specialties", []),
            "skills_detail": profile.get("skills_detail", ""),
            "preferred_categories": profile.get("preferred_categories", []),
            "preferred_categories_detail": profile.get("preferred_categories_detail", ""),
            "website_url": profile.get("website_url", ""),
            "github_url": profile.get("github_url", ""),
            "twitter_url": profile.get("twitter_url", ""),
            "portfolio_urls": profile.get("portfolio_urls", []),
        }

        if existing.data and len(existing.data) > 0:
            # 既存レコードを更新
            profile_id = existing.data[0]["id"]
            supabase.table("user_profiles").update(profile_data).eq("id", profile_id).execute()
        else:
            # 新規レコードを作成
            supabase.table("user_profiles").insert(profile_data).execute()

        return True
    except Exception as e:
        print(f"Supabaseへのプロフィール保存エラー: {e}")
        return False


def save_user_profile_to_file(profile: dict) -> bool:
    """ファイルにプロフィールを保存（フォールバック）"""
    try:
        PROFILE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(PROFILE_PATH, "w", encoding="utf-8") as f:
            json.dump(profile, f, ensure_ascii=False, indent=2)
        return True
    except IOError as e:
        print(f"ファイルへのプロフィール保存エラー: {e}")
        return False


def save_user_profile(profile: dict) -> bool:
    """プロフィールを保存（Supabase優先、ファイルフォールバック）"""
    # Supabaseに保存
    supabase_success = save_user_profile_to_supabase(profile)

    # フォールバックとしてファイルにも保存
    file_success = save_user_profile_to_file(profile)

    return supabase_success or file_success


@router.get("")
async def get_profile():
    """プロフィールを取得"""
    return load_user_profile()


@router.post("")
async def update_profile(profile: UserProfileModel):
    """プロフィールを更新"""
    profile_dict = profile.model_dump()
    if save_user_profile(profile_dict):
        return {"success": True, "message": "プロフィールを保存しました"}
    else:
        raise HTTPException(status_code=500, detail="プロフィールの保存に失敗しました")


@router.post("/auto-complete")
async def auto_complete_profile():
    """自己紹介文からプロフィールを自動補完"""
    profile = load_user_profile()
    bio = profile.get("bio", "")

    if not bio or len(bio) < 20:
        raise HTTPException(status_code=400, detail="自己紹介文が短すぎます。もう少し詳しく書いてください。")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY が設定されていません")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(RECOMMENDED.PROFILE_ANALYSIS)

    existing_skills = profile.get("skills", [])
    existing_specialties = profile.get("specialties", [])

    prompt = f"""以下の自己紹介文を分析して、クラウドソーシングで案件を獲得するためのプロフィール情報を抽出してください。

## 自己紹介文
{bio}

## 既存のスキル（参考）
{', '.join(existing_skills) if existing_skills else 'なし'}

## 既存の得意分野（参考）
{', '.join(existing_specialties) if existing_specialties else 'なし'}

## 抽出してほしい情報

### skills（技術スキル）
自己紹介文から読み取れる技術スキルを抽出してください。
例: Python, JavaScript, TypeScript, React, Next.js, Vue.js, Node.js, Go, AWS, GCP, Docker, MySQL, PostgreSQL, 機械学習, データ分析, Webスクレイピング, 自動化 など

### specialties（得意分野）
自己紹介文から読み取れる得意分野・専門領域を抽出してください。
例: Webアプリケーション開発, モバイルアプリ開発, API開発, インフラ構築, データ収集・スクレイピング, 業務自動化, 機械学習・AI, ECサイト構築, 新規事業開発, プロジェクトマネジメント など

### preferred_categories（Lancers案件の希望カテゴリ）
この人に合いそうなLancersカテゴリを選んでください。
選択肢: system（システム開発・運用）, web（Web制作・Webデザイン）, writing（ライティング）, design（デザイン）, multimedia（マルチメディア）, business（ビジネス・マーケティング）, translation（翻訳）

### skills_detail（スキルの詳細説明）
自己紹介文から、どのような技術をどう使えるかを要約して1-2文で記述してください。

### preferred_categories_detail（希望案件の詳細）
どのような案件を得意としているか、自己紹介文から1-2文で要約してください。

## 出力形式
必ず以下のJSON形式で出力してください：

```json
{{
  "skills": ["スキル1", "スキル2", ...],
  "specialties": ["得意分野1", "得意分野2", ...],
  "preferred_categories": ["system", "web"],
  "skills_detail": "スキルの詳細説明...",
  "preferred_categories_detail": "希望案件の詳細..."
}}
```

既存のスキルや得意分野があれば、それも含めて重複なく出力してください。"""

    try:
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,
                max_output_tokens=1024,
            ),
        )

        response_text = response.text

        # JSONを抽出
        if "```json" in response_text:
            start = response_text.find("```json") + 7
            end = response_text.find("```", start)
            json_str = response_text[start:end].strip()
        elif "```" in response_text:
            start = response_text.find("```") + 3
            end = response_text.find("```", start)
            json_str = response_text[start:end].strip()
        else:
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            json_str = response_text[start:end]

        suggestions = json.loads(json_str)

        return {
            "success": True,
            "suggestions": suggestions,
            "message": "自己紹介文からプロフィール情報を抽出しました",
        }

    except Exception as e:
        print(f"プロフィール自動補完エラー: {e}")
        raise HTTPException(status_code=500, detail=f"AI分析エラー: {str(e)}")
