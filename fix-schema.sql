-- Fix missing columns in Supabase schema

-- Books - add missing columns
ALTER TABLE books ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS author TEXT;

-- Music - add missing columns
ALTER TABLE music ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE music ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Newsletters - add missing columns
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE newsletters ADD COLUMN IF NOT EXISTS author TEXT;

-- News - add missing columns
ALTER TABLE news ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE news ADD COLUMN IF NOT EXISTS author TEXT;

-- Prayers - add missing columns
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS date DATE;
ALTER TABLE prayers ADD COLUMN IF NOT EXISTS author TEXT;

-- Prayer commitments - add missing columns
ALTER TABLE prayer_commitments ADD COLUMN IF NOT EXISTS assigned_to_user_id TEXT;
ALTER TABLE prayer_commitments ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE prayer_commitments ADD COLUMN IF NOT EXISTS prayer_name TEXT;

-- Daily Learning - add missing columns
ALTER TABLE daily_learning ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE daily_learning ADD COLUMN IF NOT EXISTS category TEXT;

-- Daily Insights - add missing columns
ALTER TABLE daily_insights ADD COLUMN IF NOT EXISTS author TEXT;
ALTER TABLE daily_insights ADD COLUMN IF NOT EXISTS category TEXT;

-- Short Lessons - add missing columns
ALTER TABLE short_lessons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE short_lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE short_lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Long Lessons - add missing columns
ALTER TABLE long_lessons ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE long_lessons ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE long_lessons ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Tzadikim - add missing columns
ALTER TABLE tzadikim ADD COLUMN IF NOT EXISTS books TEXT;
ALTER TABLE tzadikim ADD COLUMN IF NOT EXISTS yeshiva TEXT;
ALTER TABLE tzadikim ADD COLUMN IF NOT EXISTS teachings TEXT;

-- Pidyon Nefesh - add missing columns
ALTER TABLE pidyon_nefesh ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE pidyon_nefesh ADD COLUMN IF NOT EXISTS amount NUMERIC;

-- Rabbi Students - add missing columns
ALTER TABLE rabbi_students ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE rabbi_students ADD COLUMN IF NOT EXISTS category TEXT;

-- Rabbi Student Videos - add missing columns
ALTER TABLE rabbi_student_videos ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE rabbi_student_videos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE rabbi_student_videos ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
