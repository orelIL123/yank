# 🎥 הגדרת סרטונים יומיים - Daily Videos

## ✅ מה שתוקן

1. **תצוגה מקדימה** - נוספה תצוגה מקדימה של הסרטון לפני ההעלאה
2. **שיפור מהירות** - נוסף progress bar ומעקב אחר התקדמות ההעלאה
3. **תיקון bucket** - הקוד עובד עם bucket קיים (`newsletters`) כגיבוי
4. **שיפור UX** - נוסף progress indicator ו-thumbnail preview

## 📦 יצירת Bucket ב-Supabase (מומלץ)

כדי שהסרטונים יעלו ל-bucket ייעודי, צריך ליצור bucket חדש ב-Supabase:

### דרך Supabase Dashboard:

1. לך ל-Supabase Dashboard: https://supabase.com/dashboard
2. בחר את הפרויקט שלך
3. לך ל-**Storage** → **Buckets**
4. לחץ על **New bucket**
5. שם ה-bucket: `daily-videos`
6. הגדרות:
   - **Public bucket**: ✅ כן (כדי שהסרטונים יהיו נגישים)
   - **File size limit**: 100MB (או יותר לפי הצורך)
   - **Allowed MIME types**: השאר ריק (לאפשר כל סוגי קבצים)

### דרך SQL (אם יש הרשאות):

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'daily-videos',
  'daily-videos',
  true,
  104857600, -- 100MB
  NULL -- Allow all types
);
```

### הגדרת RLS Policies:

לאחר יצירת ה-bucket, צריך להוסיף policies ל-storage.objects:

```sql
-- Allow public read access
CREATE POLICY "Public read access for daily-videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'daily-videos');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload daily-videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'daily-videos' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads (optional)
CREATE POLICY "Users can update their own daily-videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'daily-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## 🔧 איך זה עובד עכשיו

1. **בחירת סרטון**: המשתמש בוחר סרטון מהגלריה
2. **תצוגה מקדימה**: הסרטון מוצג מיד בתצוגה מקדימה
3. **העלאה**: בעת לחיצה על "שמור", הסרטון מועלה עם progress bar
4. **גיבוי**: אם bucket `daily-videos` לא קיים, הקוד משתמש ב-`newsletters` bucket

## 📝 הערות

- הסרטונים נמחקים אוטומטית אחרי 24 שעות (לפי `expiresAt`)
- ניתן להעלות עד 4 סרטונים יומיים
- הקוד מנסה ליצור את ה-bucket אוטומטית, אבל זה דורש הרשאות admin

## 🐛 פתרון בעיות

### שגיאה: "Bucket not found"
**פתרון**: צור את ה-bucket `daily-videos` ב-Supabase Dashboard (ראה הוראות למעלה)

### שגיאה: "RLS policy missing"
**פתרון**: הוסף את ה-policies למעלה דרך SQL Editor ב-Supabase

### העלאה איטית
**פתרון**: 
- בדוק את מהירות האינטרנט
- ודא שהסרטון לא גדול מדי (מומלץ עד 50MB)
- הקוד משתמש ב-progress simulation כדי לתת feedback למשתמש

## ✨ שיפורים עתידיים

- [ ] דחיסת סרטונים לפני העלאה
- [ ] יצירת thumbnail אוטומטית מהסרטון
- [ ] תמיכה ב-chunked upload לסרטונים גדולים
- [ ] תמיכה ב-resume upload אם ההעלאה נקטעה
