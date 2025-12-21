"""Lancersスクレイパー定数"""

from src.models.job import Service

SERVICE = Service.LANCERS
URL_PATTERN = r"lancers\.jp/work/detail/(\d+)"
LIST_URL_PATTERN = r"lancers\.jp/work/search"
BASE_URL = "https://www.lancers.jp"

# カテゴリマッピング
CATEGORY_SLUGS = {
    "system": "system",
    "web": "web",
    "writing": "writing",
    "design": "design",
    "multimedia": "multimedia",
    "business": "business",
    "translation": "translation",
}

# スキルキーワード
SKILL_KEYWORDS = [
    "Python", "JavaScript", "TypeScript", "React", "Vue", "Angular",
    "Node.js", "Django", "Flask", "FastAPI", "Ruby", "Rails",
    "PHP", "Laravel", "Java", "Spring", "Go", "Rust",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes",
    "MySQL", "PostgreSQL", "MongoDB", "Redis",
    "HTML", "CSS", "Sass", "WordPress",
    "iOS", "Android", "Swift", "Kotlin", "Flutter",
    "機械学習", "AI", "データ分析", "スクレイピング",
]
