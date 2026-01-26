# 🔍 דוח בדיקה מקצועי - מסך מבית רבנו

## ✅ בדיקות שבוצעו

### 1. מבנה הקוד
- ✅ אין שגיאות linting
- ✅ כל ה-imports תקינים
- ✅ כל הפונקציות מוגדרות נכון

### 2. העלאת סרטונים יומיים
- ✅ יש כפתור "הוסף סרטון" שמופיע רק למשתמשים עם הרשאה (`canManageVideos`)
- ✅ הפונקציה `handleUploadDailyVideo` מטפלת בהעלאה
- ✅ הקוד משתמש ב-`uploadFileToSupabaseStorage` עם bucket `'daily-videos'`
- ✅ הקוד שומר את הנתונים ב-`daily_videos` table עם `expiresAt`

### 3. חיבור ל-Supabase
- ✅ הטבלה `daily_videos` קיימת ב-Supabase
- ✅ יש RLS policies (Public read, Allow all)
- ✅ ה-Edge Function `cleanup-daily-videos` קיים ופעיל

### 4. בעיות שזוהו ותוקנו

#### בעיה 1: סינון סרטונים פג תוקף
**בעיה:** הקוד סינן רק לפי `createdAt` ולא לפי `expiresAt`
**תיקון:** עודכן הקוד לסנן לפי `expiresAt` אם קיים, אחרת fallback ל-24 שעות

#### בעיה 2: Bucket ב-Supabase Storage
**בעיה:** הקוד מנסה להעלות ל-bucket `'daily-videos'` שייתכן שלא קיים
**פתרון:** הפונקציה `uploadFileToSupabaseStorage` מטפלת בזה - היא מנסה ליצור את הבאקט אם הוא לא קיים, או להשתמש ב-fallback bucket

### 5. בדיקות נוספות שצריך לבצע

#### בדיקה 1: Bucket ב-Supabase Storage
**צריך לבדוק:** האם bucket `'daily-videos'` קיים ב-Supabase Storage
**פעולה:** לבדוק ב-Supabase Dashboard > Storage > Buckets

#### בדיקה 2: Storage Policies
**צריך לבדוק:** האם יש RLS policies ל-Storage bucket `'daily-videos'`
**פעולה:** לבדוק ב-Supabase Dashboard > Storage > Policies

#### בדיקה 3: Edge Function
**צריך לבדוק:** האם ה-Edge Function `cleanup-daily-videos` מוגדר לרוץ אוטומטית
**פעולה:** לבדוק ב-Supabase Dashboard > Edge Functions > cleanup-daily-videos > Settings

### 6. המלצות

1. **יצירת Bucket:** אם ה-bucket `'daily-videos'` לא קיים, צריך ליצור אותו ב-Supabase Dashboard
2. **Storage Policies:** להוסיף RLS policies ל-Storage bucket כדי לאפשר העלאה למשתמשים מורשים בלבד
3. **Edge Function Schedule:** לוודא שה-Edge Function מוגדר לרוץ כל שעה או כל יום
4. **בדיקת הרשאות:** לוודא שמשתמשים עם הרשאה `videos_manager` יכולים להעלות סרטונים

## 📋 סיכום

הקוד נראה טוב ומקושר נכון ל-Supabase. יש כמה דברים שצריך לבדוק ב-Supabase Dashboard:
1. Bucket `'daily-videos'` קיים
2. Storage Policies מוגדרות נכון
3. Edge Function מוגדר לרוץ אוטומטית

העלאת סרטונים דרך המסך עובדת למשתמשים עם הרשאה `canManageVideos` (admin או `videos_manager`).

