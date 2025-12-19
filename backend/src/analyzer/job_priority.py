"""Job Priority Analysis Module - Rule-based scoring for job matching."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class JobPriorityScore:
    """案件の優先度スコア"""
    job_id: str
    overall_score: float = 0.0
    skill_match_score: float = 0.0
    budget_score: float = 0.0
    competition_score: float = 0.0
    client_score: float = 0.0
    timeline_score: float = 0.0
    reasons: list[str] = field(default_factory=list)


@dataclass
class UserProfile:
    """ユーザープロフィール"""
    name: str = ""
    skills: list[str] = field(default_factory=list)
    specialties: list[str] = field(default_factory=list)
    experience_years: int = 0
    preferred_budget_min: int = 10000
    preferred_budget_max: int = 500000
    preferred_categories: list[str] = field(default_factory=list)
    available_hours_per_week: int = 40


class JobPriorityAnalyzer:
    """案件の優先度を分析するクラス"""

    # スコアの重み付け
    WEIGHTS = {
        "skill_match": 0.30,
        "budget": 0.20,
        "competition": 0.20,
        "client": 0.15,
        "timeline": 0.15,
    }

    def __init__(self, profile: UserProfile):
        self.profile = profile

    def analyze(self, job: dict) -> JobPriorityScore:
        """案件を分析してスコアを計算"""
        job_id = job.get("job_id") or job.get("url", "unknown")

        # 各スコアを計算
        skill_match_score = self._calculate_skill_match_score(job)
        budget_score = self._calculate_budget_score(job)
        competition_score = self._calculate_competition_score(job)
        client_score = self._calculate_client_score(job)
        timeline_score = self._calculate_timeline_score(job)

        # 総合スコア (重み付き平均)
        overall_score = (
            skill_match_score * self.WEIGHTS["skill_match"]
            + budget_score * self.WEIGHTS["budget"]
            + competition_score * self.WEIGHTS["competition"]
            + client_score * self.WEIGHTS["client"]
            + timeline_score * self.WEIGHTS["timeline"]
        )

        # 理由を生成
        reasons = self._generate_reasons(
            skill_match_score,
            budget_score,
            competition_score,
            client_score,
            timeline_score,
            job,
        )

        return JobPriorityScore(
            job_id=job_id,
            overall_score=round(overall_score, 1),
            skill_match_score=round(skill_match_score, 1),
            budget_score=round(budget_score, 1),
            competition_score=round(competition_score, 1),
            client_score=round(client_score, 1),
            timeline_score=round(timeline_score, 1),
            reasons=reasons,
        )

    def _calculate_skill_match_score(self, job: dict) -> float:
        """スキルマッチ度を計算 (0-100)"""
        required_skills = job.get("required_skills", [])
        tags = job.get("tags", [])
        feature_tags = job.get("feature_tags", [])
        category = job.get("category", "")
        title = job.get("title", "").lower()
        description = job.get("description", "").lower()

        if not self.profile.skills:
            return 50.0  # プロフィール未設定時はデフォルト

        # スキルのマッチング
        user_skills_lower = [s.lower() for s in self.profile.skills]
        user_specialties_lower = [s.lower() for s in self.profile.specialties]

        matched_count = 0
        total_relevant = 0

        # required_skills とのマッチング
        for skill in required_skills:
            total_relevant += 1
            skill_lower = skill.lower()
            if any(us in skill_lower or skill_lower in us for us in user_skills_lower):
                matched_count += 1

        # タグとのマッチング (重みは低め)
        all_tags = tags + feature_tags
        for tag in all_tags:
            tag_lower = tag.lower()
            if any(us in tag_lower or tag_lower in us for us in user_skills_lower + user_specialties_lower):
                matched_count += 0.5
                total_relevant += 0.5

        # タイトル・説明文からのキーワードマッチング
        text_to_search = title + " " + description
        for skill in self.profile.skills + self.profile.specialties:
            if skill.lower() in text_to_search:
                matched_count += 0.3
                total_relevant += 0.3

        # ベーススコア計算
        if total_relevant > 0:
            base_score = (matched_count / total_relevant) * 100
        else:
            base_score = 30.0  # スキル情報がない場合

        # カテゴリボーナス
        if category in self.profile.preferred_categories:
            base_score = min(100, base_score + 20)

        return min(100, max(0, base_score))

    def _calculate_budget_score(self, job: dict) -> float:
        """予算適正度を計算 (0-100)"""
        budget_min = job.get("budget_min")
        budget_max = job.get("budget_max")

        if budget_min is None and budget_max is None:
            return 50.0  # 予算情報なし

        # 予算の代表値を使用
        budget = budget_max or budget_min or 0
        pref_min = self.profile.preferred_budget_min
        pref_max = self.profile.preferred_budget_max

        if budget >= pref_min and budget <= pref_max:
            # 希望範囲内
            return 100.0
        elif budget < pref_min:
            # 予算が低い
            diff = pref_min - budget
            penalty = min(50, (diff / pref_min) * 100)
            return max(0, 50 - penalty)
        else:
            # 予算が高い (問題なし、むしろ良い)
            return 80.0

    def _calculate_competition_score(self, job: dict) -> float:
        """競合状況を計算 (0-100)"""
        proposal_count = job.get("proposal_count")
        recruitment_count = job.get("recruitment_count")

        if proposal_count is None:
            return 50.0  # 情報なし

        if proposal_count == 0:
            return 100.0  # 応募なし = チャンス大

        if recruitment_count is None or recruitment_count == 0:
            recruitment_count = 1  # デフォルト

        # 採用数 / 応募数 の比率でスコア計算
        ratio = recruitment_count / proposal_count

        if ratio >= 1:
            return 100.0  # 採用数 >= 応募数
        elif ratio >= 0.5:
            return 80.0
        elif ratio >= 0.2:
            return 60.0
        elif ratio >= 0.1:
            return 40.0
        else:
            return max(20, ratio * 200)

    def _calculate_client_score(self, job: dict) -> float:
        """クライアント信頼度を計算 (0-100)"""
        rating = job.get("client_rating")
        order_history = job.get("client_order_history")

        # 評価スコア (60点分)
        if rating is not None:
            rating_score = (rating / 5.0) * 60
        else:
            rating_score = 30  # 評価なし = 中間

        # 発注履歴スコア (40点分)
        if order_history is not None and order_history > 0:
            history_score = min(40, order_history * 4)
        else:
            history_score = 10  # 履歴なし = 低め

        return min(100, rating_score + history_score)

    def _calculate_timeline_score(self, job: dict) -> float:
        """納期適正度を計算 (0-100)"""
        remaining_days = job.get("remaining_days")

        if remaining_days is None:
            return 50.0  # 情報なし

        if 3 <= remaining_days <= 14:
            return 100.0  # 最適期間
        elif remaining_days < 3:
            # 急ぎすぎ
            return max(20, remaining_days * 30)
        else:
            # 長期 (競合増加リスク)
            penalty = (remaining_days - 14) * 2
            return max(60, 100 - penalty)

    def _generate_reasons(
        self,
        skill_match: float,
        budget: float,
        competition: float,
        client: float,
        timeline: float,
        job: dict,
    ) -> list[str]:
        """スコアに基づいて理由テキストを生成"""
        reasons = []

        # スキルマッチ
        if skill_match >= 80:
            reasons.append("必要スキルが一致しています")
        elif skill_match >= 60:
            reasons.append("関連するスキルがあります")
        elif skill_match < 40:
            reasons.append("スキルマッチが低めです")

        # 予算
        if budget >= 80:
            reasons.append("希望予算に適合しています")
        elif budget < 40:
            reasons.append("予算が希望より低めです")

        # 競合
        proposal_count = job.get("proposal_count", 0)
        if competition >= 80:
            if proposal_count == 0:
                reasons.append("応募がまだありません")
            else:
                reasons.append("競合が少なくチャンスです")
        elif competition < 40:
            reasons.append("競合が多いです")

        # クライアント
        rating = job.get("client_rating")
        if client >= 80:
            if rating and rating >= 4.5:
                reasons.append(f"クライアント評価が高いです (★{rating})")
            else:
                reasons.append("発注実績のあるクライアントです")
        elif client < 40:
            reasons.append("クライアント情報が少ないです")

        # 納期
        remaining_days = job.get("remaining_days")
        if timeline >= 80:
            reasons.append("適切な納期です")
        elif timeline < 40 and remaining_days is not None:
            if remaining_days < 3:
                reasons.append("納期が非常に短いです")

        # カテゴリマッチ
        category = job.get("category", "")
        if category in self.profile.preferred_categories:
            reasons.append("得意カテゴリの案件です")

        return reasons[:5]  # 最大5つまで

    def analyze_batch(self, jobs: list[dict]) -> list[JobPriorityScore]:
        """複数の案件を一括分析"""
        return [self.analyze(job) for job in jobs]
