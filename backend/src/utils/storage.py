"""案件情報の保存ユーティリティ"""

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

from src.models.job import JobInfo


class JobStorage:
    """案件情報を保存・管理するクラス"""

    def __init__(self, base_dir: Optional[Path] = None):
        """
        Args:
            base_dir: 保存先ベースディレクトリ（デフォルト: プロジェクト内 output/jobs）
        """
        project_root = Path(__file__).parent.parent.parent
        self.base_dir = base_dir or project_root / "output" / "jobs"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save(self, job_info: JobInfo) -> tuple[Path, Path]:
        """
        案件情報をJSONとCSVの両方で保存

        Args:
            job_info: 保存する案件情報

        Returns:
            (JSONファイルパス, CSVファイルパス)のタプル
        """
        # ファイル名生成（タイムスタンプ + サービス名 + 案件ID）
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        job_id = self._extract_job_id(job_info.url)
        filename_base = f"{timestamp}_{job_info.source.value}_{job_id}"

        json_path = self._save_json(job_info, filename_base)
        csv_path = self._save_csv(job_info, filename_base)

        # 履歴CSVにも追記
        self._append_to_history(job_info)

        return json_path, csv_path

    def _save_json(self, job_info: JobInfo, filename_base: str) -> Path:
        """JSON形式で保存"""
        json_dir = self.base_dir / "json"
        json_dir.mkdir(exist_ok=True)

        json_path = json_dir / f"{filename_base}.json"
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(job_info.to_dict(), f, ensure_ascii=False, indent=2)

        return json_path

    def _save_csv(self, job_info: JobInfo, filename_base: str) -> Path:
        """CSV形式で保存（単一案件）"""
        csv_dir = self.base_dir / "csv"
        csv_dir.mkdir(exist_ok=True)

        csv_path = csv_dir / f"{filename_base}.csv"
        self._write_csv_row(csv_path, job_info, write_header=True)

        return csv_path

    def _append_to_history(self, job_info: JobInfo) -> Path:
        """履歴CSVに追記"""
        history_path = self.base_dir / "history.csv"
        write_header = not history_path.exists()

        self._write_csv_row(history_path, job_info, write_header=write_header)
        return history_path

    def _write_csv_row(self, path: Path, job_info: JobInfo, write_header: bool) -> None:
        """CSVファイルに1行書き込み"""
        fieldnames = [
            "scraped_at",
            "source",
            "title",
            "category",
            "budget_type",
            "budget_min",
            "budget_max",
            "budget_display",
            "deadline",
            "client_name",
            "required_skills",
            "url",
            "description",
        ]

        row = {
            "scraped_at": job_info.scraped_at.isoformat(),
            "source": job_info.source.value,
            "title": job_info.title,
            "category": job_info.category.value,
            "budget_type": job_info.budget_type.value,
            "budget_min": job_info.budget_min or "",
            "budget_max": job_info.budget_max or "",
            "budget_display": job_info.budget_display,
            "deadline": job_info.deadline or "",
            "client_name": job_info.client.name if job_info.client else "",
            "required_skills": ", ".join(job_info.required_skills),
            "url": job_info.url,
            "description": job_info.description,
        }

        mode = "w" if write_header else "a"
        with open(path, mode, encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            if write_header:
                writer.writeheader()
            writer.writerow(row)

    def _extract_job_id(self, url: str) -> str:
        """URLから案件IDを抽出"""
        import re

        # Lancers
        match = re.search(r"lancers\.jp/work/detail/(\d+)", url)
        if match:
            return match.group(1)

        # CrowdWorks
        match = re.search(r"crowdworks\.jp/public/jobs/(\d+)", url)
        if match:
            return match.group(1)

        # フォールバック
        return "unknown"

    def get_history(self) -> list[dict]:
        """履歴CSVを読み込み"""
        history_path = self.base_dir / "history.csv"
        if not history_path.exists():
            return []

        with open(history_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)

    def list_saved_jobs(self) -> list[Path]:
        """保存済みJSONファイル一覧"""
        json_dir = self.base_dir / "json"
        if not json_dir.exists():
            return []
        return sorted(json_dir.glob("*.json"), reverse=True)
