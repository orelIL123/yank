-- ============================================
-- Create baal_shem_tov_stories table (סיפורי הבעל שם טוב)
-- ============================================
-- Run this in Supabase SQL Editor: https://app.supabase.com
-- סרטון חדש כל מוצש - YouTube videos like הודו לה׳

CREATE TABLE IF NOT EXISTS baal_shem_tov_stories (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baal_shem_tov_stories_created_at ON baal_shem_tov_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_baal_shem_tov_stories_data ON baal_shem_tov_stories USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_baal_shem_tov_stories_is_active ON baal_shem_tov_stories((data->>'isActive'));

ALTER TABLE baal_shem_tov_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
ON baal_shem_tov_stories
FOR SELECT
USING (true);

-- Allow anon write (app uses Firebase auth + Supabase anon key; canManageLearning controls UI)
CREATE POLICY "Enable write access for anon and authenticated"
ON baal_shem_tov_stories
FOR ALL
USING (true)
WITH CHECK (true);

SELECT 'baal_shem_tov_stories table created successfully! ✨' as status;
