-- ============================================
-- יצירת טבלת תפילות (prayers) ב-Supabase
-- ============================================
-- הרץ ב-Supabase: Dashboard → SQL Editor → New Query → הדבק והרץ

-- טבלה עם id (מזהה), data (JSONB), תאריכים
CREATE TABLE IF NOT EXISTS prayers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_prayers_created_at ON prayers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prayers_data ON prayers USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_prayers_category ON prayers((data->>'category'));
CREATE INDEX IF NOT EXISTS idx_prayers_title ON prayers((data->>'title'));

-- RLS
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;

-- כולם יכולים לקרוא
CREATE POLICY "Enable read access for all users" ON prayers
  FOR SELECT USING (true);

-- רק אדמינים יכולים להוסיף
CREATE POLICY "Enable insert for admins only" ON prayers
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('admin@hayanuka.com', 'yanuka.admin@gmail.com')
    )
  );

-- רק אדמינים יכולים לעדכן
CREATE POLICY "Enable update for admins only" ON prayers
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('admin@hayanuka.com', 'yanuka.admin@gmail.com')
    )
  );

-- רק אדמינים יכולים למחוק
CREATE POLICY "Enable delete for admins only" ON prayers
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('admin@hayanuka.com', 'yanuka.admin@gmail.com')
    )
  );

-- ============================================
-- סיום – אחרי ההרצה התפילות יעבדו באפליקציה
-- ============================================
