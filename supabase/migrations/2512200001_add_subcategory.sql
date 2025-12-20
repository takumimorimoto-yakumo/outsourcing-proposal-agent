-- Migration: Add subcategory column
-- Created at: 2025-12-20

-- subcategory カラム追加
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS subcategory TEXT;

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_jobs_subcategory ON jobs(subcategory);

-- 既存データの移行: 現在のcategoryをsubcategoryにコピー
UPDATE jobs SET subcategory = category WHERE subcategory IS NULL;

-- 既存データのcategoryをLancersカテゴリに修正
-- app_development, ai_ml, automation, data_analysis, scraping, other → system
-- web_development → web
UPDATE jobs SET category = 'system'
WHERE category IN ('app_development', 'ai_ml', 'automation', 'data_analysis', 'scraping', 'other');

UPDATE jobs SET category = 'web'
WHERE category = 'web_development';

-- コメント追加
COMMENT ON COLUMN jobs.category IS 'Lancersの検索カテゴリ (system, web, writing, design, etc.)';
COMMENT ON COLUMN jobs.subcategory IS '自動分類サブカテゴリ (web_development, ai_ml, scraping, etc.)';
