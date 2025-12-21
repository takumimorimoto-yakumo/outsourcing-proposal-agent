-- Migration: Create generated_proposals table
-- Created at: 2025-12-21

-- generated_proposals テーブル作成
-- AI生成された提案文を保存
CREATE TABLE IF NOT EXISTS generated_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  job_title TEXT NOT NULL,
  proposal_text TEXT NOT NULL,
  character_count INTEGER DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_generated_proposals_job_id ON generated_proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_generated_proposals_generated_at ON generated_proposals(generated_at DESC);

-- RLS（Row Level Security）を有効化
ALTER TABLE generated_proposals ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員許可
CREATE POLICY "Allow public read" ON generated_proposals
  FOR SELECT USING (true);

-- 書き込みはservice_roleのみ許可
CREATE POLICY "Allow service role write" ON generated_proposals
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at自動更新トリガー
CREATE TRIGGER update_generated_proposals_updated_at
  BEFORE UPDATE ON generated_proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE generated_proposals IS 'AI生成提案文テーブル';
COMMENT ON COLUMN generated_proposals.job_id IS '案件ID';
COMMENT ON COLUMN generated_proposals.job_title IS '案件タイトル';
COMMENT ON COLUMN generated_proposals.proposal_text IS '生成された提案文';
COMMENT ON COLUMN generated_proposals.character_count IS '文字数';
COMMENT ON COLUMN generated_proposals.quality_score IS '品質スコア';
COMMENT ON COLUMN generated_proposals.metadata IS '追加メタデータ (JSON)';
COMMENT ON COLUMN generated_proposals.generated_at IS '生成日時';
