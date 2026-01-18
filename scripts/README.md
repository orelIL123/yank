# 📦 העברת דאטה מ-Firebase ל-Supabase

## 🎯 מה יש כאן?

3 קבצים שיעזרו לך להעביר את כל הדאטה מ-Firebase ל-Supabase:

1. **create-supabase-tables.sql** - יוצר את הטבלאות ב-Supabase
2. **migrate-firebase-to-supabase.js** - מעביר את הדאטה
3. **MIGRATION_GUIDE.md** - מדריך מפורט

---

## 🚀 מדריך מהיר (5 צעדים)

### צעד 1️⃣: צור טבלאות ב-Supabase

1. לך ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לחץ על **SQL Editor** בתפריט השמאלי
4. לחץ **New Query**
5. העתק והדבק את כל הקוד מ-`create-supabase-tables.sql`
6. לחץ **Run** (או Ctrl+Enter)

✅ זהו! כל הטבלאות נוצרו!

---

### צעד 2️⃣: הורד Firebase Service Account

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט שלך
3. לחץ על ⚙️ Settings → **Project Settings**
4. לחץ על **Service Accounts**
5. לחץ **Generate new private key**
6. שמור בשם `firebase-service-account.json` **בתיקייה הראשית** (לא ב-native!)

---

### צעד 3️⃣: הכן את הסקריפט

פתח את `migrate-firebase-to-supabase.js` וערוך:

#### A. Supabase Service Key

שורה 16:
```javascript
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY_HERE';
```

כיצד למצוא:
1. Supabase Dashboard → Settings → API
2. העתק את ה-**service_role** key (לא anon!)
3. הדבק במקום `YOUR_SUPABASE_SERVICE_KEY_HERE`

#### B. Firebase Service Account Path (אופציונלי)

אם שמרת את הקובץ במקום אחר, שנה שורה 19:
```javascript
const FIREBASE_SERVICE_ACCOUNT = require('../firebase-service-account.json');
```

---

### צעד 4️⃣: התקן חבילות

```bash
# מהתיקייה הראשית (לא native!):
npm install firebase-admin @supabase/supabase-js
```

---

### צעד 5️⃣: הרץ את ההעברה!

#### A. קודם בדיקה יבשה (מומלץ!)

```bash
node scripts/migrate-firebase-to-supabase.js --dry-run
```

זה **לא מעביר** דאטה, רק מראה מה יקרה.

#### B. אם הכל נראה טוב - העברה אמיתית!

```bash
node scripts/migrate-firebase-to-supabase.js
```

#### C. אפשרות: להעביר רק קולקשן אחד

```bash
# רק שיעורים קצרים:
node scripts/migrate-firebase-to-supabase.js --collection=shortLessons

# רק ניגונים:
node scripts/migrate-firebase-to-supabase.js --collection=music
```

---

## 📊 מה מועבר?

הסקריפט מעביר **את כל הקולקשנים**:

✅ books - ספרים
✅ music - ניגונים
✅ newsletters - עלונים
✅ news - חדשות
✅ prayers - תפילות
✅ prayerCommitments - התחייבויות תפילה
✅ dailyLearning - לימוד יומי
✅ dailyVideos - סרטונים יומיים
✅ dailyInsights - הבנה יומית
✅ shortLessons - שיעורים קצרים
✅ longLessons - שיעורים ארוכים
✅ tzadikim - צדיקים
✅ notifications - התראות
✅ pidyonNefesh - פדיון נפש
✅ homeCards - כרטיסי דף הבית
✅ chidushim - חידושים
✅ rabbiStudents + videos - תלמידי הרב וסרטונים
✅ beitMidrashVideos - סרטוני בית מדרש

---

## ⏱️ כמה זמן זה לוקח?

תלוי בכמות הדאטה:
- 100 רשומות: ~5 שניות
- 1,000 רשומות: ~30 שניות
- 10,000 רשומות: ~5 דקות

---

## 🎉 אחרי ההעברה

### בדוק שהכל עבר:

1. לך ל-Supabase → **Table Editor**
2. בדוק כל טבלה
3. ראה שיש נתונים

### הרץ את האפליקציה:

```bash
cd native
npm start
```

כנס לכל מסך ובדוק שהדאטה מופיע!

---

## 🐛 פתרון בעיות

### "Cannot find module 'firebase-admin'"
```bash
npm install firebase-admin
```

### "ENOENT: no such file or directory, open 'firebase-service-account.json'"
הורד את ה-Service Account Key מ-Firebase Console (צעד 2).

### "Invalid API key"
ודא שהעתקת את ה-**service_role** key ולא את ה-anon key!

### השגיאות ממשיכות?
קרא את **MIGRATION_GUIDE.md** למדריך מפורט.

---

## 📞 צריך עזרה?

1. קרא את **MIGRATION_GUIDE.md** - יש שם הרבה יותר פרטים
2. הרץ עם `--dry-run` כדי לראות מה יקרה
3. הרץ `--collection=<name>` כדי לנסות קולקשן אחד קודם

---

## ✅ סיכום

```bash
# 1. צור טבלאות ב-Supabase (SQL Editor)
# העתק את create-supabase-tables.sql

# 2. הורד Service Account מ-Firebase
# שמור כ-firebase-service-account.json

# 3. ערוך את migrate-firebase-to-supabase.js
# הוסף Supabase service_role key

# 4. התקן חבילות
npm install firebase-admin @supabase/supabase-js

# 5. הרץ בדיקה
node scripts/migrate-firebase-to-supabase.js --dry-run

# 6. הרץ העברה אמיתית
node scripts/migrate-firebase-to-supabase.js

# 7. בדוק באפליקציה!
cd native && npm start
```

**בהצלחה! 🚀**
