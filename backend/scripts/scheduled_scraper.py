#!/usr/bin/env python3
"""GitHub Actions用 定期スクレイピングスクリプト（並列実行対応）"""

import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from supabase import create_client

from src.models.config import ScrapingConfig, HumanLikeConfig, TimeoutConfig
from src.scrapers.lancers import LancersScraper


# 環境変数読み込み
load_dotenv()


def get_supabase_client():
    """Supabaseクライアントを取得"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    return create_client(url, key)


def job_to_db_record(job_data: dict) -> dict:
    """案件データをDBレコード形式に変換"""
    client = job_data.get("client") or {}
    return {
        "job_id": job_data.get("job_id"),
        "title": job_data.get("title", ""),
        "description": job_data.get("description", ""),
        "category": job_data.get("category", "other"),
        "budget_type": job_data.get("budget_type", "unknown"),
        "job_type": job_data.get("job_type", "project"),
        "status": job_data.get("status", "open"),
        "budget_min": job_data.get("budget_min"),
        "budget_max": job_data.get("budget_max"),
        "deadline": job_data.get("deadline"),
        "remaining_days": job_data.get("remaining_days"),
        "required_skills": job_data.get("required_skills", []),
        "tags": job_data.get("tags", []),
        "feature_tags": job_data.get("feature_tags", []),
        "proposal_count": job_data.get("proposal_count"),
        "recruitment_count": job_data.get("recruitment_count"),
        "source": job_data.get("source", "lancers"),
        "url": job_data.get("url", ""),
        "client_name": client.get("name") if isinstance(client, dict) else None,
        "client_rating": client.get("rating") if isinstance(client, dict) else None,
        "client_review_count": client.get("review_count") if isinstance(client, dict) else None,
        "client_order_history": client.get("order_history") if isinstance(client, dict) else None,
        "scraped_at": job_data.get("scraped_at", datetime.now().isoformat()),
    }


async def save_to_database(supabase, jobs: list[dict]) -> dict:
    """Supabaseにデータを保存（upsert）"""
    total_added = 0
    total_updated = 0

    print(f"Supabase保存開始: {len(jobs)}件")

    for job in jobs:
        record = job_to_db_record(job)
        job_id = record.get("job_id")

        if not job_id:
            continue

        try:
            # 既存レコードをチェック
            existing = supabase.table("jobs").select("id").eq("job_id", job_id).execute()

            if existing.data:
                supabase.table("jobs").update(record).eq("job_id", job_id).execute()
                total_updated += 1
            else:
                supabase.table("jobs").insert(record).execute()
                total_added += 1
        except Exception as e:
            print(f"  保存エラー: {job_id} - {e}")

    print(f"Supabase保存完了: 追加{total_added}件, 更新{total_updated}件")
    return {"added": total_added, "updated": total_updated}


def job_info_to_dict(job, category: str) -> dict:
    """JobInfoをdictに変換"""
    return {
        "title": job.title,
        "description": job.description,
        "category": job.category.value if job.category else category,
        "budget_type": job.budget_type.value if job.budget_type else "unknown",
        "job_id": job.job_id,
        "job_type": job.job_type.value if job.job_type else "project",
        "status": job.status.value if job.status else "open",
        "budget_min": job.budget_min,
        "budget_max": job.budget_max,
        "deadline": job.deadline,
        "remaining_days": job.remaining_days,
        "required_skills": job.required_skills or [],
        "tags": job.tags or [],
        "feature_tags": job.feature_tags or [],
        "proposal_count": job.proposal_count,
        "recruitment_count": job.recruitment_count,
        "source": job.source.value if job.source else "lancers",
        "url": job.url,
        "client": {
            "name": job.client.name if job.client else None,
            "rating": job.client.rating if job.client else None,
            "order_history": job.client.order_history if job.client else None,
        } if job.client else None,
        "scraped_at": datetime.now().isoformat(),
    }


async def scrape_category(
    category: str,
    job_types: list[str],
    max_pages: int,
    config: ScrapingConfig,
) -> list[dict]:
    """単一カテゴリをスクレイピング"""
    scraper = LancersScraper(config)
    results = []

    print(f"[{category}] スクレイピング開始...")

    for page_num in range(1, max_pages + 1):
        print(f"  [{category}] {page_num}ページ目を取得中...")

        url = scraper.build_search_url(
            category=category,
            job_types=job_types,
            open_only=True,
            page=page_num,
        )

        try:
            page_jobs = await asyncio.wait_for(
                scraper.scrape_list(url=url, max_items=50),
                timeout=60.0
            )
        except asyncio.TimeoutError:
            print(f"  [{category}] タイムアウト: {page_num}ページ目")
            break
        except Exception as e:
            print(f"  [{category}] エラー: {e}")
            break

        if not page_jobs:
            print(f"  [{category}] {page_num}ページ目は空でした")
            break

        # JobInfoをdictに変換
        for job in page_jobs:
            results.append(job_info_to_dict(job, category))

        print(f"  [{category}] {len(page_jobs)}件取得")

        if len(page_jobs) < 20:
            print(f"  [{category}] 最終ページと判断")
            break

        # ページ間の短い待機（1秒）
        await asyncio.sleep(1)

    print(f"[{category}] 完了: {len(results)}件")
    return results


async def run_scheduled_scrape():
    """定期スクレイピングを実行（並列処理）"""
    # 設定を環境変数から取得（デフォルト値あり）
    categories = [c.strip() for c in os.getenv("SCRAPE_CATEGORIES", "system,web").split(",")]
    job_types = [j.strip() for j in os.getenv("SCRAPE_JOB_TYPES", "project").split(",")]
    max_pages = int(os.getenv("SCRAPE_MAX_PAGES", "3"))

    print("=" * 50)
    print("定期スクレイピング開始（並列処理）")
    print(f"  カテゴリ: {categories}")
    print(f"  案件形式: {job_types}")
    print(f"  最大ページ数: {max_pages}")
    print(f"  実行時刻: {datetime.now().isoformat()}")
    print("=" * 50)

    # スクレイパー設定（高速化: human_like無効）
    config = ScrapingConfig(
        human_like=HumanLikeConfig(enabled=False),
        timeout=TimeoutConfig(page_load=30000, element_wait=5000),
    )

    # 並列でスクレイピング実行（最大2並列）
    tasks = [
        scrape_category(category, job_types, max_pages, config)
        for category in categories[:2]  # 安全のため2カテゴリまで
    ]

    start_time = datetime.now()
    results_list = await asyncio.gather(*tasks, return_exceptions=True)
    elapsed = (datetime.now() - start_time).total_seconds()

    # 結果を集約
    all_results = []
    for i, result in enumerate(results_list):
        if isinstance(result, Exception):
            print(f"カテゴリ {categories[i]} でエラー: {result}")
        else:
            all_results.extend(result)

    print(f"\n合計: {len(all_results)}件 (実行時間: {elapsed:.1f}秒)")

    # Supabaseに保存
    if all_results:
        supabase = get_supabase_client()
        result = await save_to_database(supabase, all_results)
        print(f"\n保存結果: 追加{result['added']}件, 更新{result['updated']}件")

    print("\n定期スクレイピング完了!")
    return all_results


if __name__ == "__main__":
    asyncio.run(run_scheduled_scrape())
