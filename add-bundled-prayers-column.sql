-- Add bundled prayers column to app_config table
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new

ALTER TABLE app_config ADD COLUMN IF NOT EXISTS bundled_prayers JSONB DEFAULT '{}'::jsonb;
