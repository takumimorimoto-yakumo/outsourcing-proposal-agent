-- Migration: Create pipeline_jobs table
-- Created at: 2025-12-21

-- pipeline_jobs テーブル作成
-- 案件のパイプライン状態（下書き、応募済み、進行中、履歴）を管理
CREATE TABLE IF NOT EXISTS pipeline_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  pipeline_status TEXT NOT NULL CHECK (pipeline_status IN ('draft', 'submitted', 'ongoing', 'expired', 'rejected', 'completed')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  status_changed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- job_idとpipeline_statusの組み合わせはユニーク
  UNIQUE(job_id, pipeline_status)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_job_id ON pipeline_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_pipeline_status ON pipeline_jobs(pipeline_status);
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_added_at ON pipeline_jobs(added_at DESC);

-- RLS（Row Level Security）を有効化
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員許可
CREATE POLICY "Allow public read" ON pipeline_jobs
  FOR SELECT USING (true);

-- 書き込みはservice_roleのみ許可
CREATE POLICY "Allow service role write" ON pipeline_jobs
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at自動更新トリガー
CREATE TRIGGER update_pipeline_jobs_updated_at
  BEFORE UPDATE ON pipeline_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE pipeline_jobs IS '案件パイプライン管理テーブル';
COMMENT ON COLUMN pipeline_jobs.job_id IS '案件ID（jobsテーブルのjob_idと対応）';
COMMENT ON COLUMN pipeline_jobs.pipeline_status IS 'パイプライン状態 (draft, submitted, ongoing, expired, rejected, completed)';
COMMENT ON COLUMN pipeline_jobs.added_at IS 'パイプラインに追加された日時';
COMMENT ON COLUMN pipeline_jobs.status_changed_at IS 'ステータスが変更された日時';
COMMENT ON COLUMN pipeline_jobs.notes IS 'メモ・備考';
