-- Migration: Create ai_scores table
-- Created at: 2025-12-21

-- ai_scores テーブル作成
-- AIによる案件評価スコアを保存
CREATE TABLE IF NOT EXISTS ai_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE,
  overall_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('highly_recommended', 'recommended', 'neutral', 'not_recommended')),
  breakdown JSONB NOT NULL DEFAULT '{
    "skill_match": 0,
    "budget_appropriateness": 0,
    "competition_level": 0,
    "client_reliability": 0,
    "growth_potential": 0
  }'::jsonb,
  reasons JSONB DEFAULT '[]'::jsonb,
  concerns JSONB DEFAULT '[]'::jsonb,
  scored_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_ai_scores_job_id ON ai_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_scores_overall_score ON ai_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_scores_recommendation ON ai_scores(recommendation);
CREATE INDEX IF NOT EXISTS idx_ai_scores_scored_at ON ai_scores(scored_at DESC);

-- RLS（Row Level Security）を有効化
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員許可
CREATE POLICY "Allow public read" ON ai_scores
  FOR SELECT USING (true);

-- 書き込みはservice_roleのみ許可
CREATE POLICY "Allow service role write" ON ai_scores
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at自動更新トリガー
CREATE TRIGGER update_ai_scores_updated_at
  BEFORE UPDATE ON ai_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE ai_scores IS 'AI評価スコアテーブル';
COMMENT ON COLUMN ai_scores.job_id IS '案件ID';
COMMENT ON COLUMN ai_scores.overall_score IS '総合スコア (0-100)';
COMMENT ON COLUMN ai_scores.recommendation IS '推奨度 (highly_recommended, recommended, neutral, not_recommended)';
COMMENT ON COLUMN ai_scores.breakdown IS 'スコア内訳 (skill_match, budget_appropriateness, competition_level, client_reliability, growth_potential)';
COMMENT ON COLUMN ai_scores.reasons IS '推奨理由 (JSON配列)';
COMMENT ON COLUMN ai_scores.concerns IS '懸念事項 (JSON配列)';
COMMENT ON COLUMN ai_scores.scored_at IS '評価日時';
