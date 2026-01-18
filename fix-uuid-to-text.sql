-- Change all IDs from UUID to TEXT to preserve Firestore IDs
-- This is much simpler and allows us to keep the original Firestore document IDs

-- Drop all existing tables and recreate with TEXT ids
DROP TABLE IF EXISTS rabbi_student_videos CASCADE;
DROP TABLE IF EXISTS prayer_commitments CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS music CASCADE;
DROP TABLE IF EXISTS newsletters CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS prayers CASCADE;
DROP TABLE IF EXISTS daily_learning CASCADE;
DROP TABLE IF EXISTS daily_videos CASCADE;
DROP TABLE IF EXISTS daily_insights CASCADE;
DROP TABLE IF EXISTS short_lessons CASCADE;
DROP TABLE IF EXISTS long_lessons CASCADE;
DROP TABLE IF EXISTS tzadikim CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS pidyon_nefesh CASCADE;
DROP TABLE IF EXISTS home_cards CASCADE;
DROP TABLE IF EXISTS chidushim CASCADE;
DROP TABLE IF EXISTS rabbi_students CASCADE;
DROP TABLE IF EXISTS beit_midrash_videos CASCADE;

-- Now create tables with TEXT ids and flexible schema
CREATE TABLE books (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE music (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE newsletters (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE news (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE prayers (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE prayer_commitments (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE daily_learning (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE daily_videos (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE daily_insights (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE short_lessons (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE long_lessons (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE tzadikim (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE pidyon_nefesh (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE home_cards (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE chidushim (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE rabbi_students (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE rabbi_student_videos (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE TABLE beit_midrash_videos (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL
);

-- Enable RLS
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

-- Public read policies
CREATE POLICY "Public read" ON books FOR SELECT USING (true);
CREATE POLICY "Public read" ON music FOR SELECT USING (true);
CREATE POLICY "Public read" ON newsletters FOR SELECT USING (true);
CREATE POLICY "Public read" ON news FOR SELECT USING (true);
CREATE POLICY "Public read" ON prayers FOR SELECT USING (true);
CREATE POLICY "Public read" ON daily_learning FOR SELECT USING (true);
CREATE POLICY "Public read" ON daily_videos FOR SELECT USING (true);
CREATE POLICY "Public read" ON daily_insights FOR SELECT USING (true);
CREATE POLICY "Public read" ON short_lessons FOR SELECT USING (true);
CREATE POLICY "Public read" ON long_lessons FOR SELECT USING (true);
CREATE POLICY "Public read" ON tzadikim FOR SELECT USING (true);
CREATE POLICY "Public read" ON home_cards FOR SELECT USING (true);
CREATE POLICY "Public read" ON chidushim FOR SELECT USING (true);
CREATE POLICY "Public read" ON rabbi_students FOR SELECT USING (true);
CREATE POLICY "Public read" ON rabbi_student_videos FOR SELECT USING (true);
CREATE POLICY "Public read" ON beit_midrash_videos FOR SELECT USING (true);
CREATE POLICY "Public read" ON prayer_commitments FOR SELECT USING (true);
CREATE POLICY "Public read" ON notifications FOR SELECT USING (true);
CREATE POLICY "Public read" ON pidyon_nefesh FOR SELECT USING (true);

-- Allow all operations for now (restrict later)
CREATE POLICY "Allow all" ON books FOR ALL USING (true);
CREATE POLICY "Allow all" ON music FOR ALL USING (true);
CREATE POLICY "Allow all" ON newsletters FOR ALL USING (true);
CREATE POLICY "Allow all" ON news FOR ALL USING (true);
CREATE POLICY "Allow all" ON prayers FOR ALL USING (true);
CREATE POLICY "Allow all" ON prayer_commitments FOR ALL USING (true);
CREATE POLICY "Allow all" ON daily_learning FOR ALL USING (true);
CREATE POLICY "Allow all" ON daily_videos FOR ALL USING (true);
CREATE POLICY "Allow all" ON daily_insights FOR ALL USING (true);
CREATE POLICY "Allow all" ON short_lessons FOR ALL USING (true);
CREATE POLICY "Allow all" ON long_lessons FOR ALL USING (true);
CREATE POLICY "Allow all" ON tzadikim FOR ALL USING (true);
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all" ON pidyon_nefesh FOR ALL USING (true);
CREATE POLICY "Allow all" ON home_cards FOR ALL USING (true);
CREATE POLICY "Allow all" ON chidushim FOR ALL USING (true);
CREATE POLICY "Allow all" ON rabbi_students FOR ALL USING (true);
CREATE POLICY "Allow all" ON rabbi_student_videos FOR ALL USING (true);
CREATE POLICY "Allow all" ON beit_midrash_videos FOR ALL USING (true);
