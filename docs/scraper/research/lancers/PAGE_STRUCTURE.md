# Lancers ページ構造ドキュメント

## 概要

このドキュメントは、Lancersのページ構造を分析し、スクレイピングに必要なセレクタを記録したものです。

**キャプチャ日時**: 2024-12-13

---

## 案件一覧ページ (`/work/search/*`)

### URL パターン
```
https://www.lancers.jp/work/search?open=1           # 全案件（募集中）
https://www.lancers.jp/work/search/system?open=1    # システム開発
https://www.lancers.jp/work/search/web?open=1       # Web制作
https://www.lancers.jp/work/search?type=project     # プロジェクト形式
https://www.lancers.jp/work/search?type=task        # タスク形式
https://www.lancers.jp/work/search?type=competition # コンペ形式
```

### 案件リストコンテナ
```css
.p-search-job-medias                /* 案件リスト全体のコンテナ */
.p-search-job-media                 /* 各案件のカード */
```

### 案件カード内の主要セレクタ

#### 基本情報
```css
.p-search-job-media__title          /* 案件タイトル（リンク） */
a[href*="/work/detail/"]            /* 案件詳細へのリンク */

/* onclick属性からIDを取得 */
/* onclick="goToLjpWorkDetail(5450323)" */
```

#### 募集状態
```css
.p-search-job-media__time                  /* 状態コンテナ */
.p-search-job-media__time--open            /* 募集中の場合 */
.p-search-job-media__time-text             /* 「募集中」テキスト */
.p-search-job-media__time-remaining        /* 「あと1日」など残り期間 */
```

#### タグ情報
```css
.p-search-job-media__tags                  /* タグリスト */
.p-search-job-media__tag                   /* 各タグ */
.p-search-job-media__tag--new              /* NEW */
.p-search-job-media__tag--feature          /* 注目 */
.p-search-job-media__tag--limited          /* 限定公開 */
.p-search-job-media__tag--top              /* PR */
.p-search-job-media__tag--inexperiencedCount  /* 初心者向け回数 */
```

#### カテゴリ・業種
```css
.p-search-job__divisions                   /* カテゴリリスト */
.p-search-job__division                    /* 各カテゴリ */
.p-search-job__division-link               /* カテゴリリンク */
```

#### 案件形式・報酬
```css
.c-badge--worktype-project                 /* プロジェクト形式バッジ */
.c-badge--worktype-task                    /* タスク形式バッジ */
.c-badge--worktype-competition             /* コンペ形式バッジ */
.c-badge__text                             /* 形式テキスト */

.p-search-job-media__price                 /* 報酬コンテナ */
.p-search-job-media__number                /* 金額数値 */
.c-media__job-unit                         /* 単位（円、/ 固定など） */
```

#### 特徴タグ
```css
.p-search-job-media__tag-lists             /* 特徴タグリスト */
.p-search-job-media__tag-list              /* 各特徴タグ */
/* 例: 経験者優遇、継続依頼あり、長期、スピード重視、スムーズな連絡 */
```

#### 提案・募集状況
```css
.p-search-job-media__proposals             /* 提案状況コンテナ */
.p-search-job-media__propose               /* 各状況 */
.p-search-job-media__propose-number        /* 数値 */
/* 当選者数 / 募集人数 の形式 */
```

#### クライアント情報
```css
.p-search-job-media__avatar                /* クライアントアバターコンテナ */
.c-avatar__image                           /* アバター画像 */
.p-search-job-media__avatar-note           /* クライアント名 */
.p-search-job-media__avatar-subnote        /* 発注数・評価 */
/* 例: 発注 2、評価 5 */
```

---

## 案件詳細ページ (`/work/detail/{job_id}`)

### URL パターン
```
https://www.lancers.jp/work/detail/{job_id}
```

### 主要セレクタ

#### 案件タイトル
```css
/* メタタグから取得 */
meta[name="keywords"]  /* content属性 */

/* またはタイトルタグ */
title  /* 「〜の副業・在宅・フリーランスの仕事」の前まで */
```

#### 報酬・予算
```css
.price-number  /* 金額の数値部分 */
.price-unit    /* 「円」の部分 */

/* 例: 20,000円 ~ 50,000円 */
.price-block   /* 金額ブロック全体 */
```

#### 依頼者（クライアント）情報
```css
.p-work-detail-sub-heading__avatar       /* アバター画像リンク */
.p-work-detail-sub-heading__avatar-image /* アバター画像 */

/* 依頼者ページへのリンク */
a[href^="/client/"]
```

#### スケジュール情報
```css
.p-work-detail-schedule              /* スケジュールセクション */
.p-work-detail-schedule__item        /* 各スケジュール項目 */
.p-work-detail-schedule__item__title /* ラベル（開始：、締切：、希望納期：）*/
.p-work-detail-schedule__text        /* 日時テキスト */
```

#### 提案・閲覧状況
```css
.work_detail__proposal-status         /* ステータスセクション */
.work_detail__proposal-status-number  /* 数値（提案数、気になる数、閲覧数等）*/

/* 個別の数値 */
/* - 提案: 8件 */
/* - 気になる: 7人 */
/* - 閲覧: 158回 */
```

#### 依頼概要・詳細
```css
.p-work-detail-lancer__postscript                /* 詳細セクション */
.p-work-detail-lancer__postscript-term           /* 項目ラベル（依頼概要等）*/
.p-work-detail-lancer__postscript-description    /* 項目内容 */
.c-definition-list__description                  /* 説明テキスト */
```

#### タグ情報
```css
.c-tag                   /* 一般タグ */
.p-work-detail-tag       /* 案件タグ（経験者優遇、継続依頼あり等）*/
.c-tag:contains("依頼番号")  /* 依頼番号タグ */
```

#### オプションアイコン
```css
.p-work-detail-option-icon  /* 各種オプションアイコン */
/* アイコン種類はdata-url属性で判別 */
/* - key_silver.png: NDA */
/* - icon_pr_diamond.png: 急募 */
/* - icn_speech--default.png: 相談可 */
/* - icn_words.png: 文字単価 */
```

#### 提案ボタン
```css
.p-work-detail__righter-button  /* 提案するボタン */
a[href^="/work/propose_start/"] /* 提案開始リンク */
```

---

## データ抽出パターン

### 案件ID抽出
```python
import re

# URLから
url = "https://www.lancers.jp/work/detail/5450323"
match = re.search(r'/work/detail/(\d+)', url)
job_id = match.group(1)  # "5450323"

# onclick属性から
onclick = "goToLjpWorkDetail(5450323)"
match = re.search(r'goToLjpWorkDetail\((\d+)\)', onclick)
job_id = match.group(1)  # "5450323"
```

### 報酬抽出
```python
# 単一金額の場合
price_text = "20,000円"
price = int(price_text.replace(",", "").replace("円", ""))

# 範囲の場合
# "20,000円 ~ 50,000円"
# min_price, max_price として分離
```

### 日付抽出
```python
# 形式: "2025年12月09日" または "2025年12月14日 22:56"
from datetime import datetime
date_text = "2025年12月09日"
date = datetime.strptime(date_text, "%Y年%m月%d日")
```

### 残り期間抽出
```python
# "あと1日" → 1日
# "あと6日" → 6日
remaining = "あと1日"
days = int(remaining.replace("あと", "").replace("日", ""))
```

---

## 案件カテゴリ

Lancersの主要カテゴリ:
- system: システム開発・運用
- web: Web制作・Webデザイン
- writing: ライティング・記事作成
- design: デザイン制作
- multimedia: 写真・映像・音楽
- business: ビジネス・マーケティング
- translation: 翻訳・通訳

---

## 案件形式

1. **プロジェクト形式** (`type=project`)
   - 提案・見積もり → 選定 → 契約

2. **タスク形式** (`type=task`)
   - 作業開始 → 納品 → 承認

3. **コンペ形式** (`type=competition`)
   - 作品提出 → 選定 → 当選

---

## 注意事項

1. **セレクタの安定性**: CSSクラス名は変更される可能性があるため、複数のフォールバックを用意する
2. **動的コンテンツ**: JavaScriptで読み込まれる要素があるため、ページ読み込み後に待機が必要
3. **レート制限**: 連続アクセスは避け、適切な間隔を設ける
4. **ログイン状態**: 一部の情報はログイン状態で異なる可能性がある
