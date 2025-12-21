-- Migration: Create user_profiles table
-- Created at: 2025-12-21

-- user_profiles テーブル作成
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  skills JSONB DEFAULT '[]'::jsonb,
  specialties JSONB DEFAULT '[]'::jsonb,
  skills_detail TEXT DEFAULT '',
  preferred_categories JSONB DEFAULT '[]'::jsonb,
  preferred_categories_detail TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  github_url TEXT DEFAULT '',
  twitter_url TEXT DEFAULT '',
  portfolio_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS（Row Level Security）を有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員許可
CREATE POLICY "Allow public read" ON user_profiles
  FOR SELECT USING (true);

-- 書き込みはservice_roleのみ許可
CREATE POLICY "Allow service role write" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- updated_at自動更新トリガー
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE user_profiles IS 'ユーザープロフィール設定';
COMMENT ON COLUMN user_profiles.name IS 'ユーザー名';
COMMENT ON COLUMN user_profiles.bio IS '自己紹介';
COMMENT ON COLUMN user_profiles.skills IS '技術スキル (JSON配列)';
COMMENT ON COLUMN user_profiles.specialties IS '得意分野 (JSON配列)';
COMMENT ON COLUMN user_profiles.skills_detail IS 'スキル詳細説明';
COMMENT ON COLUMN user_profiles.preferred_categories IS '希望カテゴリ (JSON配列)';
COMMENT ON COLUMN user_profiles.preferred_categories_detail IS '希望カテゴリ詳細説明';
COMMENT ON COLUMN user_profiles.portfolio_urls IS 'ポートフォリオURL (JSON配列)';
