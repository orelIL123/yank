-- Add Video Names table for temporary video name storage (24 hour TTL)
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new

-- Drop table if exists (in case it was created with wrong type)
DROP TABLE IF EXISTS video_names CASCADE;

-- Video Names collection (temporary storage, deleted after 24 hours)
CREATE TABLE video_names (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  news_id TEXT REFERENCES news(id) ON DELETE CASCADE,
  video_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance on cleanup queries
CREATE INDEX IF NOT EXISTS idx_video_names_created_at ON video_names(created_at);
CREATE INDEX IF NOT EXISTS idx_video_names_news_id ON video_names(news_id);

-- Enable RLS
ALTER TABLE video_names ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for video_names" ON video_names;
DROP POLICY IF EXISTS "Authenticated users can insert video_names" ON video_names;
DROP POLICY IF EXISTS "Authenticated users can update video_names" ON video_names;
DROP POLICY IF EXISTS "Authenticated users can delete video_names" ON video_names;

-- Public read access
CREATE POLICY "Public read access for video_names" ON video_names FOR SELECT USING (true);

-- Admin write access
CREATE POLICY "Authenticated users can insert video_names" ON video_names FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update video_names" ON video_names FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete video_names" ON video_names FOR DELETE USING (true);

-- Function to delete old video names (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_video_names()
RETURNS void AS $$
BEGIN
  DELETE FROM video_names
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to run cleanup every hour (requires pg_cron extension)
-- Note: This requires pg_cron extension to be enabled in Supabase
-- You can also call this function manually or via a cron job
-- SELECT cron.schedule('cleanup-video-names', '0 * * * *', 'SELECT cleanup_old_video_names();');

-- Alternative: Use Supabase Edge Function with cron trigger
-- Create an Edge Function that calls this cleanup function
-- See: supabase/functions/cleanup-video-names/index.ts

-- To manually run cleanup:
-- SELECT cleanup_old_video_names();

-- To set up automatic cleanup via pg_cron (if enabled):
-- 1. Enable pg_cron extension: CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 2. Schedule the cleanup: SELECT cron.schedule('cleanup-video-names', '0 * * * *', 'SELECT cleanup_old_video_names();');
-- This will run cleanup every hour

-- Alternative: Use Supabase Dashboard → Database → Cron Jobs to schedule this function
