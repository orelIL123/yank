-- ============================================
-- Create hodu_la_hashem table for miracle stories
-- ============================================
-- Run this in Supabase SQL Editor: https://app.supabase.com
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- ============================================
-- HODU LAHASHEM (סיפורי ניסים)
-- ============================================
CREATE TABLE IF NOT EXISTS hodu_la_hashem (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hodu_la_hashem_created_at ON hodu_la_hashem(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hodu_la_hashem_data ON hodu_la_hashem USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_hodu_la_hashem_is_active ON hodu_la_hashem((data->>'isActive'));

-- Enable Row Level Security
ALTER TABLE hodu_la_hashem ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (everyone can read)
CREATE POLICY "Enable read access for all users" 
ON hodu_la_hashem 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert/update/delete (admins only)
-- Note: You may want to add admin check here if needed
CREATE POLICY "Enable write access for authenticated users" 
ON hodu_la_hashem 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ============================================
-- DONE!
-- ============================================
-- The table is now ready to use!
-- You can now add miracle stories through the admin panel.

SELECT 'hodu_la_hashem table created successfully! ✨' as status;

