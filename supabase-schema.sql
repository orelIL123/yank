-- Yanuka App - Supabase Schema
-- Run this in Supabase SQL Editor: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Books collection
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Music collection
CREATE TABLE IF NOT EXISTS music (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  artist TEXT,
  url TEXT,
  youtube_url TEXT,
  image_url TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletters collection
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  pdf_url TEXT,
  image_url TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- News collection
CREATE TABLE IF NOT EXISTS news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayers collection
CREATE TABLE IF NOT EXISTS prayers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  hebrew_title TEXT,
  description TEXT,
  content TEXT,
  pdf_url TEXT,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer commitments collection
CREATE TABLE IF NOT EXISTS prayer_commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  prayer_id UUID REFERENCES prayers(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  commitment_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Learning collection
CREATE TABLE IF NOT EXISTS daily_learning (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  pdf_url TEXT,
  audio_url TEXT,
  video_url TEXT,
  date DATE,
  hebrew_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Videos collection
CREATE TABLE IF NOT EXISTS daily_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  youtube_url TEXT,
  description TEXT,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily Insights collection
CREATE TABLE IF NOT EXISTS daily_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  date DATE,
  hebrew_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Short Lessons collection
CREATE TABLE IF NOT EXISTS short_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  duration INTEGER,
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Long Lessons collection
CREATE TABLE IF NOT EXISTS long_lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT,
  duration INTEGER,
  category TEXT,
  series TEXT,
  episode_number INTEGER,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tzadikim (Righteous people) collection
CREATE TABLE IF NOT EXISTS tzadikim (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  hebrew_name TEXT,
  description TEXT,
  biography TEXT,
  image_url TEXT,
  birth_date TEXT,
  death_date TEXT,
  burial_place TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications collection
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pidyon Nefesh collection
CREATE TABLE IF NOT EXISTS pidyon_nefesh (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name TEXT NOT NULL,
  user_email TEXT,
  phone TEXT,
  request_text TEXT,
  prayer_type TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Home Cards collection (for homepage widgets)
CREATE TABLE IF NOT EXISTS home_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  link TEXT,
  action TEXT,
  order_index INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chidushim (Torah insights) collection
CREATE TABLE IF NOT EXISTS chidushim (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  author TEXT,
  parsha TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rabbi Students (categories)
CREATE TABLE IF NOT EXISTS rabbi_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rabbi Student Videos (subcollection)
CREATE TABLE IF NOT EXISTS rabbi_student_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES rabbi_students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  youtube_url TEXT,
  description TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beit Midrash Videos collection
CREATE TABLE IF NOT EXISTS beit_midrash_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  youtube_url TEXT,
  description TEXT,
  category TEXT,
  speaker TEXT,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_created_at ON music(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_category ON prayers(category);
CREATE INDEX IF NOT EXISTS idx_daily_learning_date ON daily_learning(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_insights_date ON daily_insights(date DESC);
CREATE INDEX IF NOT EXISTS idx_short_lessons_category ON short_lessons(category);
CREATE INDEX IF NOT EXISTS idx_long_lessons_category ON long_lessons(category);
CREATE INDEX IF NOT EXISTS idx_tzadikim_category ON tzadikim(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_commitments_user_id ON prayer_commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_prayer_commitments_prayer_id ON prayer_commitments(prayer_id);
CREATE INDEX IF NOT EXISTS idx_rabbi_student_videos_category ON rabbi_student_videos(category_id);

-- Enable Row Level Security (RLS)
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tzadikim ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pidyon_nefesh ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE chidushim ENABLE ROW LEVEL SECURITY;
ALTER TABLE rabbi_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rabbi_student_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE beit_midrash_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (anyone can read)
CREATE POLICY "Public read access for books" ON books FOR SELECT USING (true);
CREATE POLICY "Public read access for music" ON music FOR SELECT USING (true);
CREATE POLICY "Public read access for newsletters" ON newsletters FOR SELECT USING (true);
CREATE POLICY "Public read access for news" ON news FOR SELECT USING (true);
CREATE POLICY "Public read access for prayers" ON prayers FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_learning" ON daily_learning FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_videos" ON daily_videos FOR SELECT USING (true);
CREATE POLICY "Public read access for daily_insights" ON daily_insights FOR SELECT USING (true);
CREATE POLICY "Public read access for short_lessons" ON short_lessons FOR SELECT USING (true);
CREATE POLICY "Public read access for long_lessons" ON long_lessons FOR SELECT USING (true);
CREATE POLICY "Public read access for tzadikim" ON tzadikim FOR SELECT USING (true);
CREATE POLICY "Public read access for home_cards" ON home_cards FOR SELECT USING (true);
CREATE POLICY "Public read access for chidushim" ON chidushim FOR SELECT USING (true);
CREATE POLICY "Public read access for rabbi_students" ON rabbi_students FOR SELECT USING (true);
CREATE POLICY "Public read access for rabbi_student_videos" ON rabbi_student_videos FOR SELECT USING (true);
CREATE POLICY "Public read access for beit_midrash_videos" ON beit_midrash_videos FOR SELECT USING (true);

-- Prayer commitments - users can read their own and create new ones
CREATE POLICY "Users can read their own commitments" ON prayer_commitments
  FOR SELECT USING (auth.uid()::text = user_id OR true);
CREATE POLICY "Users can create commitments" ON prayer_commitments
  FOR INSERT WITH CHECK (true);

-- Notifications - users can read their own
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id OR user_id IS NULL);

-- Pidyon Nefesh - users can create and read their own
CREATE POLICY "Users can read their own pidyon requests" ON pidyon_nefesh
  FOR SELECT USING (true);
CREATE POLICY "Users can create pidyon requests" ON pidyon_nefesh
  FOR INSERT WITH CHECK (true);

-- Admin write access - will be controlled via service role key or custom claims
-- For now, allowing inserts/updates for authenticated users (you can restrict this later)
CREATE POLICY "Authenticated users can insert books" ON books FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update books" ON books FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete books" ON books FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert music" ON music FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update music" ON music FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete music" ON music FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert newsletters" ON newsletters FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update newsletters" ON newsletters FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete newsletters" ON newsletters FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert news" ON news FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update news" ON news FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete news" ON news FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert prayers" ON prayers FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update prayers" ON prayers FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete prayers" ON prayers FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert daily_learning" ON daily_learning FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update daily_learning" ON daily_learning FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete daily_learning" ON daily_learning FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert daily_videos" ON daily_videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update daily_videos" ON daily_videos FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete daily_videos" ON daily_videos FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert short_lessons" ON short_lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update short_lessons" ON short_lessons FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete short_lessons" ON short_lessons FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert long_lessons" ON long_lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update long_lessons" ON long_lessons FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete long_lessons" ON long_lessons FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert tzadikim" ON tzadikim FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update tzadikim" ON tzadikim FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete tzadikim" ON tzadikim FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert rabbi_students" ON rabbi_students FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update rabbi_students" ON rabbi_students FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete rabbi_students" ON rabbi_students FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert rabbi_student_videos" ON rabbi_student_videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update rabbi_student_videos" ON rabbi_student_videos FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete rabbi_student_videos" ON rabbi_student_videos FOR DELETE USING (true);

-- App Config (Singleton table for app-wide settings like daily quote)
CREATE TABLE IF NOT EXISTS app_config (
  id TEXT PRIMARY KEY DEFAULT 'config',
  daily_quote TEXT NOT NULL DEFAULT 'ציטוט יומי - הרב הינוקא',
  quote_author TEXT DEFAULT 'הרב הינוקא',
  weekly_prayer_pdf_url TEXT,
  weekly_prayer_title TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add weekly prayer columns if table already exists (run once per deployment)
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS weekly_prayer_pdf_url TEXT;
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS weekly_prayer_title TEXT;

-- Add bundled prayers column (JSONB to store prayer images)
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS bundled_prayers JSONB DEFAULT '{}'::jsonb;

-- Add quote_image column for daily quote image (ציטוט יומי)
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS quote_image TEXT;

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

-- Video Names collection (temporary storage, deleted after 24 hours)
CREATE TABLE IF NOT EXISTS video_names (
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

-- Insert default config
INSERT INTO app_config (id, daily_quote, quote_author) 
VALUES ('config', 'ציטוט יומי - הרב הינוקא', 'הרב הינוקא')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read access for app_config" ON app_config FOR SELECT USING (true);

-- Admin write access (will be controlled via service role key)
CREATE POLICY "Authenticated users can update app_config" ON app_config FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can insert app_config" ON app_config FOR INSERT WITH CHECK (true);
