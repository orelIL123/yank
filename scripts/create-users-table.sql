-- ============================================
-- יצירת טבלת משתמשים (users) ב-Supabase
-- ============================================
-- הרץ ב-Supabase: Dashboard → SQL Editor → New Query → הדבק והרץ

-- טבלה עם id (מזהה משתמש), data (JSONB), תאריכים
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_data ON users USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_users_email ON users((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_users_role ON users((data->>'role'));
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users((data->>'permissions'));

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- כולם יכולים לקרוא (למצוא משתמשים)
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

-- רק אדמינים יכולים להוסיף משתמשים
CREATE POLICY "Enable insert for admins only" ON users
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('admin@hayanuka.com', 'yanuka.admin@gmail.com')
    )
  );

-- רק אדמינים יכולים לעדכן משתמשים
CREATE POLICY "Enable update for admins only" ON users
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('admin@hayanuka.com', 'yanuka.admin@gmail.com')
    )
  );

-- רק אדמינים יכולים למחוק משתמשים
CREATE POLICY "Enable delete for admins only" ON users
  FOR DELETE USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email IN ('admin@hayanuka.com', 'yanuka.admin@gmail.com')
    )
  );

-- ============================================
-- סיום – אחרי ההרצה ניהול משתמשים יעבוד באפליקציה
-- ============================================
