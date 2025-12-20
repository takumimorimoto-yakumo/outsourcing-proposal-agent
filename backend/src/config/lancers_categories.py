"""Lancersカテゴリ・サブカテゴリ定義
Reference: https://www.lancers.jp/work/search

サブカテゴリはランサーズのサイドバーに表示されるレベルに統一
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class Subcategory:
    """サブカテゴリ"""
    slug: str
    label: str


@dataclass
class Category:
    """カテゴリ"""
    slug: str
    label: str
    subcategories: list[Subcategory]


# Lancersカテゴリ定義（サイドバー表示レベル）
LANCERS_CATEGORIES: list[Category] = [
    Category(
        slug="system",
        label="システム開発・運用",
        subcategories=[
            Subcategory("development", "Web・システム開発"),
            Subcategory("smartphoneapp", "スマホアプリ・モバイル開発"),
            Subcategory("maintenance", "運用・管理・保守"),
            Subcategory("instructor", "講師・ITコンサルタント"),
            Subcategory("ai", "AI・機械学習・ChatGPT"),
            Subcategory("tool", "業務システム・ツール開発"),
            Subcategory("product_development", "製品開発・設計"),
        ],
    ),
    Category(
        slug="web",
        label="Web制作・Webデザイン",
        subcategories=[
            Subcategory("website", "ウェブサイト制作・デザイン"),
            Subcategory("modification_customization", "Webサイト修正・カスタム"),
            Subcategory("smartphonesite", "スマートフォン・モバイルサイト制作"),
            Subcategory("webparts", "バナー・アイコン・ボタン"),
            Subcategory("thumbnail_image_design", "サムネイル・画像デザイン"),
            Subcategory("ec", "ECサイト・ネットショップ構築・運用"),
            Subcategory("management", "運営・更新・保守・SNS運用"),
        ],
    ),
    Category(
        slug="writing",
        label="ライティング・ネーミング",
        subcategories=[
            Subcategory("writing", "ライティング"),
            Subcategory("copy", "ネーミング・コピーライティング"),
            Subcategory("edit", "編集・校正"),
            Subcategory("script_writing", "小説・シナリオ・出版物の作成"),
            Subcategory("business_writing", "ビジネス文章の作成"),
        ],
    ),
    Category(
        slug="design",
        label="デザイン制作",
        subcategories=[
            Subcategory("designparts", "ロゴ・イラスト・キャラクター"),
            Subcategory("graphic", "印刷物・DTP・その他"),
            Subcategory("info", "看板・地図・インフォグラフィック"),
            Subcategory("medium", "CD・本"),
            Subcategory("product", "プロダクトデザイン・3D-CG制作"),
            Subcategory("wedding_anniversary", "結婚式・記念日デザイン"),
            Subcategory("design_data_correction_conversion", "デザインデータ修正・変換"),
            Subcategory("architecture_interior_drawing", "建築・インテリア・図面デザイン"),
        ],
    ),
    Category(
        slug="multimedia",
        label="写真・映像・音楽",
        subcategories=[
            Subcategory("photograph", "写真撮影・素材提供・画像加工"),
            Subcategory("create", "漫画・アニメーション"),
            Subcategory("music", "ナレーション・キャラクターボイス"),
            Subcategory("video", "動画編集・映像制作"),
            Subcategory("wedding_event_movie", "結婚式・イベント動画制作"),
            Subcategory("bgm_soundeffect", "BGM・SE・ジングル作成"),
            Subcategory("composition_arrange", "作曲・編曲（アレンジ）"),
            Subcategory("me_singing", "歌ってみた"),
            Subcategory("performance", "楽器演奏"),
            Subcategory("temporarysong_vocaloid", "仮歌・歌入れ・ボカロ制作"),
        ],
    ),
    Category(
        slug="business",
        label="ビジネス・事務・専門・その他",
        subcategories=[
            Subcategory("businesssupport", "バックオフィス・ビジネスサポート"),
            Subcategory("support", "資料作成サポート"),
            Subcategory("consultant", "コンサルティング"),
            Subcategory("brushchar", "筆文字・筆耕"),
            Subcategory("ai_enhancement", "生成AI活用・業務効率化"),
            Subcategory("workother", "その他"),
        ],
    ),
    Category(
        slug="translation",
        label="翻訳・通訳",
        subcategories=[
            Subcategory("english", "英語翻訳・英文翻訳"),
            Subcategory("chinese", "中国語翻訳"),
            Subcategory("korean", "韓国語翻訳"),
            Subcategory("french", "フランス語翻訳"),
            Subcategory("spanish", "スペイン語翻訳"),
            Subcategory("german", "ドイツ語翻訳"),
            Subcategory("thai", "タイ語翻訳"),
            Subcategory("vietnamese", "ベトナム語翻訳"),
            Subcategory("russian", "ロシア語翻訳"),
            Subcategory("italian", "イタリア語翻訳"),
            Subcategory("portuguese", "ポルトガル語翻訳"),
            Subcategory("media", "映像翻訳・出版翻訳・メディア翻訳"),
            Subcategory("simultaneous", "同時通訳・電話通訳"),
            Subcategory("translations", "その他翻訳"),
        ],
    ),
]


def get_category(slug: str) -> Optional[Category]:
    """カテゴリをslugで取得"""
    for cat in LANCERS_CATEGORIES:
        if cat.slug == slug:
            return cat
    return None


def get_subcategory(category_slug: str, subcategory_slug: str) -> Optional[Subcategory]:
    """サブカテゴリをslugで取得"""
    cat = get_category(category_slug)
    if cat:
        for subcat in cat.subcategories:
            if subcat.slug == subcategory_slug:
                return subcat
    return None


def get_all_categories_flat() -> list[dict]:
    """全カテゴリ・サブカテゴリをフラットなリストで取得（API用）"""
    result = []
    for cat in LANCERS_CATEGORIES:
        result.append({
            "slug": cat.slug,
            "label": cat.label,
            "subcategories": [
                {"slug": sub.slug, "label": sub.label}
                for sub in cat.subcategories
            ],
        })
    return result
