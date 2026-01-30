-- ============================================
-- Supabase Tables Creation Script
-- ============================================
-- Run this in Supabase SQL Editor before migrating data
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- ============================================
-- 1. BOOKS
-- ============================================
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_books_data ON books USING GIN (data);

-- ============================================
-- 2. MUSIC
-- ============================================
CREATE TABLE IF NOT EXISTS music (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_music_created_at ON music(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_music_data ON music USING GIN (data);

-- ============================================
-- 3. NEWSLETTERS
-- ============================================
CREATE TABLE IF NOT EXISTS newsletters (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletters_created_at ON newsletters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_data ON newsletters USING GIN (data);

-- ============================================
-- 4. NEWS
-- ============================================
CREATE TABLE IF NOT EXISTS news (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_data ON news USING GIN (data);

-- ============================================
-- 5. PRAYERS
-- ============================================
CREATE TABLE IF NOT EXISTS prayers (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_data ON prayers USING GIN (data);

-- ============================================
-- 6. PRAYER COMMITMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_commitments (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prayer_commitments_created_at ON prayer_commitments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_commitments_data ON prayer_commitments USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_prayer_commitments_user_id ON prayer_commitments((data->>'userId'));

-- ============================================
-- 7. DAILY LEARNING
-- ============================================
CREATE TABLE IF NOT EXISTS daily_learning (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_learning_created_at ON daily_learning(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_learning_data ON daily_learning USING GIN (data);

-- ============================================
-- 8. DAILY VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_videos (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_videos_created_at ON daily_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_videos_data ON daily_videos USING GIN (data);

-- ============================================
-- 8.5. DAILY TEHILLIM (תהילים יומי)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_tehillim (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_tehillim_created_at ON daily_tehillim(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tehillim_data ON daily_tehillim USING GIN (data);

-- ============================================
-- 9. DAILY INSIGHTS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_insights (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_insights_created_at ON daily_insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_insights_data ON daily_insights USING GIN (data);

-- ============================================
-- 10. SHORT LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS short_lessons (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_lessons_created_at ON short_lessons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_lessons_data ON short_lessons USING GIN (data);

-- ============================================
-- 11. LONG LESSONS
-- ============================================
CREATE TABLE IF NOT EXISTS long_lessons (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_long_lessons_created_at ON long_lessons(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_long_lessons_data ON long_lessons USING GIN (data);

-- ============================================
-- 11.4. BAAL SHEM TOV STORIES (סיפורי הבעל שם טוב - כל מוצש)
-- ============================================
CREATE TABLE IF NOT EXISTS baal_shem_tov_stories (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_baal_shem_tov_stories_created_at ON baal_shem_tov_stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_baal_shem_tov_stories_data ON baal_shem_tov_stories USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_baal_shem_tov_stories_is_active ON baal_shem_tov_stories((data->>'isActive'));

-- ============================================
-- 11.5. HODU LAHASHEM (סיפורי ניסים)
-- ============================================
CREATE TABLE IF NOT EXISTS hodu_la_hashem (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hodu_la_hashem_created_at ON hodu_la_hashem(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hodu_la_hashem_data ON hodu_la_hashem USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_hodu_la_hashem_is_active ON hodu_la_hashem((data->>'isActive'));

-- ============================================
-- 12. TZADIKIM
-- ============================================
CREATE TABLE IF NOT EXISTS tzadikim (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tzadikim_created_at ON tzadikim(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tzadikim_data ON tzadikim USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_tzadikim_name ON tzadikim((data->>'name'));

-- ============================================
-- 13. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_data ON notifications USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_notifications_is_active ON notifications((data->>'isActive'));

-- ============================================
-- 14. PIDYON NEFESH
-- ============================================
CREATE TABLE IF NOT EXISTS pidyon_nefesh (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pidyon_nefesh_created_at ON pidyon_nefesh(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pidyon_nefesh_data ON pidyon_nefesh USING GIN (data);

-- ============================================
-- 15. HOME CARDS
-- ============================================
CREATE TABLE IF NOT EXISTS home_cards (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_home_cards_order ON home_cards((data->>'order'));
CREATE INDEX IF NOT EXISTS idx_home_cards_is_active ON home_cards((data->>'isActive'));
CREATE INDEX IF NOT EXISTS idx_home_cards_data ON home_cards USING GIN (data);

-- ============================================
-- 16. CHIDUSHIM
-- ============================================
CREATE TABLE IF NOT EXISTS chidushim (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chidushim_created_at ON chidushim(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chidushim_data ON chidushim USING GIN (data);

-- ============================================
-- 17. RABBI STUDENTS (Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS rabbi_students (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rabbi_students_order ON rabbi_students((data->>'order'));
CREATE INDEX IF NOT EXISTS idx_rabbi_students_is_active ON rabbi_students((data->>'isActive'));
CREATE INDEX IF NOT EXISTS idx_rabbi_students_data ON rabbi_students USING GIN (data);

-- ============================================
-- 18. RABBI STUDENT VIDEOS (Subcollection)
-- ============================================
CREATE TABLE IF NOT EXISTS rabbi_student_videos (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rabbi_student_videos_category_id ON rabbi_student_videos(category_id);
CREATE INDEX IF NOT EXISTS idx_rabbi_student_videos_created_at ON rabbi_student_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rabbi_student_videos_data ON rabbi_student_videos USING GIN (data);

-- ============================================
-- 19. BEIT MIDRASH VIDEOS
-- ============================================
CREATE TABLE IF NOT EXISTS beit_midrash_videos (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beit_midrash_videos_created_at ON beit_midrash_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beit_midrash_videos_data ON beit_midrash_videos USING GIN (data);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE music ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_learning ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tehillim ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE hodu_la_hashem ENABLE ROW LEVEL SECURITY;
ALTER TABLE baal_shem_tov_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tzadikim ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pidyon_nefesh ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE chidushim ENABLE ROW LEVEL SECURITY;
ALTER TABLE rabbi_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE rabbi_student_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE beit_midrash_videos ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (everyone can read)
CREATE POLICY "Enable read access for all users" ON books FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON music FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON newsletters FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON news FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON prayers FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON prayer_commitments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON daily_learning FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON daily_videos FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON daily_tehillim FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON daily_insights FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON short_lessons FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON long_lessons FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON hodu_la_hashem FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON baal_shem_tov_stories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tzadikim FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON pidyon_nefesh FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON home_cards FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON chidushim FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON rabbi_students FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON rabbi_student_videos FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON beit_midrash_videos FOR SELECT USING (true);

-- ============================================
-- DONE!
-- ============================================
-- Run this script, then you can run the migration script
-- to copy data from Firebase to Supabase
