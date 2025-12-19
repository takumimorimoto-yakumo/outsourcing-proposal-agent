-- Migration: Create jobs table
-- Created at: 2025-12-19

-- jobs テーブル作成
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL,
  budget_type TEXT DEFAULT 'unknown',
  job_type TEXT DEFAULT 'project',
  status TEXT DEFAULT 'open',
  budget_min INTEGER,
  budget_max INTEGER,
  deadline TEXT,
  remaining_days INTEGER,
  required_skills JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  feature_tags JSONB DEFAULT '[]'::jsonb,
  proposal_count INTEGER DEFAULT 0,
  recruitment_count INTEGER DEFAULT 1,
  source TEXT NOT NULL DEFAULT 'lancers',
  url TEXT NOT NULL,
  client_name TEXT,
  client_rating DECIMAL(2,1),
  client_review_count INTEGER,
  client_order_history INTEGER,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);

-- RLS（Row Level Security）を有効化
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員許可
CREATE POLICY "Allow public read" ON jobs
  FOR SELECT USING (true);

-- 書き込みはservice_roleのみ許可
CREATE POLICY "Allow service role write" ON jobs
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE jobs IS '案件情報テーブル';
COMMENT ON COLUMN jobs.job_id IS 'Lancers等の案件ID';
COMMENT ON COLUMN jobs.category IS '案件カテゴリ (web_development, app_development, etc.)';
COMMENT ON COLUMN jobs.budget_type IS '予算タイプ (fixed, hourly, unknown)';
COMMENT ON COLUMN jobs.job_type IS '案件形式 (project, task, competition)';
COMMENT ON COLUMN jobs.status IS '募集状態 (open, closed)';
COMMENT ON COLUMN jobs.source IS '情報ソース (lancers, crowdworks)';
COMMENT ON COLUMN jobs.required_skills IS '必要スキル (JSON配列)';
COMMENT ON COLUMN jobs.tags IS 'タグ (JSON配列)';
COMMENT ON COLUMN jobs.feature_tags IS '特徴タグ (JSON配列)';
