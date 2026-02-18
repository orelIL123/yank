-- Add Daily Orchot Tzadikim table for daily content and cycle management
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new

-- Daily Orchot Tzadikim collection (for daily content and cycle management)
CREATE TABLE IF NOT EXISTS daily_orchot_tzadikim (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE daily_orchot_tzadikim ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for daily_orchot_tzadikim" ON daily_orchot_tzadikim FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Authenticated users can insert daily_orchot_tzadikim" ON daily_orchot_tzadikim FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update daily_orchot_tzadikim" ON daily_orchot_tzadikim FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete daily_orchot_tzadikim" ON daily_orchot_tzadikim FOR DELETE USING (true);
