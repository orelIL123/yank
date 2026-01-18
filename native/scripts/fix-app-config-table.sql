-- ============================================
-- Fix: Create missing app_config table
-- ============================================
-- This table is needed for storing the daily quote and other app-wide configuration
-- Run this in Supabase SQL Editor: https://app.supabase.com

-- Create app_config table
CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY DEFAULT 'config',
  daily_quote TEXT NOT NULL DEFAULT 'ציטוט יומי - הרב הינוקא',
  quote_author TEXT DEFAULT 'הרב הינוקא',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config row
INSERT INTO app_config (id, daily_quote, quote_author) 
VALUES ('config', 'ברוך השם יום יום', 'הרב הינוקא')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Public read access for app_config" 
ON app_config 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to update
CREATE POLICY "Authenticated users can update app_config" 
ON app_config 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert
CREATE POLICY "Authenticated users can insert app_config" 
ON app_config 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Done!
SELECT 'app_config table created successfully!' as status;

