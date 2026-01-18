# 🔄 מדריך העברת דאטה מ-Firebase ל-Supabase

## 📋 דרישות מוקדמות

לפני שמריצים את הסקריפט, צריך:

### 1. Firebase Service Account Key

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך (yank-99f79)
3. לחץ על ⚙️ Settings → Project Settings
4. לחץ על טאב "Service Accounts"
5. לחץ "Generate new private key"
6. שמור את הקובץ בשם `firebase-service-account.json` בתיקיה הראשית של הפרויקט

### 2. Supabase Service Key

1. לך ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-Settings → API
4. העתק את ה-`service_role` key (לא את ה-anon key!)
5. הדבק אותו בסקריפט במקום `YOUR_SUPABASE_SERVICE_KEY_HERE`

### 3. התקנת חבילות

```bash
# אם אתה בתיקיית native, צא לתיקייה הראשית:
cd ..

# התקן את החבילות הדרושות:
npm install firebase-admin @supabase/supabase-js

# או אם אתה משתמש ב-yarn:
yarn add firebase-admin @supabase/supabase-js
```

---

## 🚀 הרצת הסקריפט

### שלב 1: בדיקה יבשה (Dry Run)

**מומלץ מאוד לעשות קודם!**

```bash
node scripts/migrate-firebase-to-supabase.js --dry-run
```

זה יראה לך מה יועבר **בלי להעביר באמת**.

### שלב 2: העברה אמיתית

אחרי שבדקת שהכל נראה טוב:

```bash
node scripts/migrate-firebase-to-supabase.js
```

### שלב 3: בדיקה

בדוק ב-Supabase Dashboard שהדאטה הועבר:
- לך ל-Table Editor
- בדוק כל טבלה
- ודא שיש נתונים

---

## ⚙️ אפשרויות נוספות

### להעביר רק קולקשן אחד

```bash
# להעביר רק שיעורים קצרים:
node scripts/migrate-firebase-to-supabase.js --collection=shortLessons

# להעביר רק ניגונים:
node scripts/migrate-firebase-to-supabase.js --collection=music
```

### לשנות גודל batch

```bash
# להעביר 50 documents בכל פעם במקום 100:
node scripts/migrate-firebase-to-supabase.js --batch-size=50
```

### לשלב אפשרויות

```bash
# dry run על קולקשן אחד:
node scripts/migrate-firebase-to-supabase.js --collection=books --dry-run
```

---

## 📊 מה הסקריפט מעביר?

הסקריפט מעביר את הקולקשנים הבאים:

✅ **books** - ספרים
✅ **music** - ניגונים
✅ **newsletters** - עלונים
✅ **news** - חדשות
✅ **prayers** - תפילות
✅ **prayerCommitments** - התחייבויות תפילה
✅ **dailyLearning** - לימוד יומי
✅ **dailyVideos** - סרטונים יומיים
✅ **dailyInsights** - הבנה יומית
✅ **shortLessons** - שיעורים קצרים
✅ **longLessons** - שיעורים ארוכים
✅ **tzadikim** - צדיקים
✅ **notifications** - התראות
✅ **pidyonNefesh** - פדיון נפש
✅ **homeCards** - כרטיסי דף הבית
✅ **chidushim** - חידושים
✅ **rabbiStudents** - תלמידי הרב + הסרטונים שלהם
✅ **beitMidrashVideos** - סרטוני בית מדרש

---

## 🔧 מבנה הטבלאות ב-Supabase

כל טבלה צריכה להיות במבנה הזה:

```sql
CREATE TABLE table_name (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- אינדקס לביצועים:
CREATE INDEX idx_table_name_created_at ON table_name(created_at);
CREATE INDEX idx_table_name_data ON table_name USING GIN (data);
```

### טבלאות מיוחדות:

**rabbi_student_videos** (subcollection):
```sql
CREATE TABLE rabbi_student_videos (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rabbi_student_videos_category
  ON rabbi_student_videos(category_id);
```

---

## 🐛 פתרון בעיות

### שגיאה: "Cannot find module 'firebase-admin'"

```bash
npm install firebase-admin
```

### שגיאה: "Cannot find module '@supabase/supabase-js'"

```bash
npm install @supabase/supabase-js
```

### שגיאה: "ENOENT: no such file or directory, open 'firebase-service-account.json'"

צריך להוריד את ה-Service Account Key מ-Firebase Console (ראה למעלה).

### שגיאה: "Invalid API key"

הקפד שהעתקת את ה-`service_role` key ולא את ה-`anon` key!

### שגיאה: "Row count exceeds the maximum allowed"

תקטין את ה-batch size:
```bash
node scripts/migrate-firebase-to-supabase.js --batch-size=10
```

---

## 📈 מה קורה בזמן ההעברה?

1. **קריאה מ-Firebase** - הסקריפט קורא את כל הדאטה
2. **המרת Timestamps** - ממיר Firestore Timestamps ל-ISO strings
3. **חלוקה ל-batches** - מעביר בקבוצות של 100 documents
4. **upsert ל-Supabase** - מעדכן או מוסיף לטבלה
5. **דיווח** - מראה התקדמות בזמן אמת

---

## ⏱️ כמה זמן זה לוקח?

תלוי בכמות הדאטה:

- **100 documents:** ~5 שניות
- **1,000 documents:** ~30 שניות
- **10,000 documents:** ~5 דקות
- **100,000 documents:** ~30 דקות

---

## ✅ אחרי ההעברה

### 1. בדוק את הדאטה

לך ל-Supabase Dashboard → Table Editor ובדוק:
- כמות השורות תואמת ל-Firebase
- הדאטה נראה תקין
- אין שגיאות

### 2. הרץ את האפליקציה

```bash
cd native
npm start
```

כנס לכל מסך ובדוק שהדאטה מופיע!

### 3. אם הכל עובד

🎉 **מזל טוב!** הדאטה הועבר בהצלחה!

עכשיו אפשר:
- לכבות את Firebase Firestore (אבל תשאיר את Auth!)
- לחסוך כסף
- להנות מהמהירות של PostgreSQL

---

## 🔄 להריץ שוב את ההעברה

הסקריפט משתמש ב-`upsert`:
- אם document כבר קיים - הוא מתעדכן
- אם לא קיים - הוא נוסף

אז **בטוח להריץ שוב** אם משהו השתבש!

---

## 📝 לוג של ההעברה

הסקריפט מדפיס לוג מפורט:

```
🚀 Firebase to Supabase Data Migration
=======================================

📦 Migrating: shortLessons -> short_lessons
────────────────────────────────────────────────────────────
  📖 Reading from Firebase...
  📊 Found 45 documents
  📤 Processing batch 1/1 (45 docs)...
  ✅ Batch migrated successfully

  ✨ Migration complete for shortLessons
     ✅ Success: 45
     ❌ Errors: 0

============================================================
📊 MIGRATION SUMMARY
============================================================
⏱️  Duration: 2.34s
✅ Success: 45 documents
❌ Errors: 0 documents
⏭️  Skipped: 0 documents

Per Collection:
  shortLessons:
    ✅ 45 | ❌ 0 | ⏭️  0
============================================================

🎉 Migration completed successfully!
```

---

## 🆘 צריך עזרה?

אם משהו לא עובד:

1. הרץ עם `--dry-run` ובדוק את הלוג
2. בדוק ש-Service Keys תקינים
3. בדוק שהטבלאות קיימות ב-Supabase
4. הפעל עם `--batch-size=10` למספרים קטנים

---

**בהצלחה! 🚀**
