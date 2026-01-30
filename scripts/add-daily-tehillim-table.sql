-- ============================================
-- הוספת טבלת תהילים יומי (daily_tehillim) ל-Supabase
-- ============================================
-- 1. הרץ ב-Supabase: Dashboard → SQL Editor → New Query → הדבק והרץ
-- 2. אם אחרי ההרצה האפליקציה עדיין כותבת "table not found":
--    Project Settings → API → יש כפתור "Reload schema cache" (או חכה דקה־שתיים)
-- 3. וודא שאתה באותו פרויקט שהאפליקציה מתחברת אליו (אותו URL ו־anon key)

-- טבלה עם id (מזהה מסמך), data (JSONB), תאריכים
CREATE TABLE IF NOT EXISTS daily_tehillim (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- אינדקסים
CREATE INDEX IF NOT EXISTS idx_daily_tehillim_created_at ON daily_tehillim(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tehillim_data ON daily_tehillim USING GIN (data);

-- RLS
ALTER TABLE daily_tehillim ENABLE ROW LEVEL SECURITY;

-- כולם יכולים לקרוא
CREATE POLICY "Enable read access for all users" ON daily_tehillim
  FOR SELECT USING (true);

-- כולם יכולים להוסיף (למשל מסמך id='current' בפעם הראשונה)
CREATE POLICY "Enable insert for all users" ON daily_tehillim
  FOR INSERT WITH CHECK (true);

-- כולם יכולים לעדכן (עריכת תהילים יומי על ידי אדמין)
CREATE POLICY "Enable update for all users" ON daily_tehillim
  FOR UPDATE USING (true);

-- שורה התחלתית (האפליקציה מחפשת id='current')
INSERT INTO daily_tehillim (id, data)
VALUES ('current', '{"title":"","chapters":"","imageUrl":"","updatedAt":""}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- סיום – אחרי ההרצה עריכת תהילים יומי באפליקציה תעבוד
-- ============================================
