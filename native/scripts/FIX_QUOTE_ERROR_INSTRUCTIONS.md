# תיקון שגיאת שמירת ציטוט - Fix Quote Saving Error

## הבעיה / The Problem
```
ERROR  Error saving quote: [Error: app_config table is missing (PGRST205)]
```

הטבלה `app_config` חסרה במסד הנתונים של Supabase, מה שגורם לשגיאה בעת ניסיון לשמור ציטוט יומי.

The `app_config` table is missing from the Supabase database, causing an error when trying to save a daily quote.

---

## הפתרון / The Solution

### שלב 1: פתח את Supabase Console

1. גש ל: **https://app.supabase.com/project/mtdgmesxbmnspfqfahug**
2. התחבר עם האישורים שלך
3. לחץ על **SQL Editor** בתפריט הצד השמאלי

### שלב 2: הרץ את הסקריפט

1. לחץ על **+ New Query**
2. העתק את כל התוכן מהקובץ: `native/scripts/fix-app-config-table.sql`
3. הדבק אותו בעורך ה-SQL
4. לחץ על **Run** (או Ctrl+Enter)

### שלב 3: וודא שהטבלה נוצרה

הרץ את השאילתה הזו כדי לוודא:
```sql
SELECT * FROM app_config;
```

אתה אמור לראות שורה אחת עם:
- id: `config`
- daily_quote: `ברוך השם יום יום`
- quote_author: `הרב הינוקא`

---

## בדיקה / Testing

אחרי שהרצת את הסקריפט:

1. **רענן את האפליקציה** - Reload the app in Expo
2. **נסה לשמור ציטוט** - Try saving a quote
3. **השגיאה אמורה להיעלם** - The error should be gone

---

## מידע טכני / Technical Details

הטבלה `app_config` משמשת לאחסון הגדרות כלל-אפליקציה, כולל:
- ציטוט יומי (`daily_quote`)
- מחבר הציטוט (`quote_author`)

The `app_config` table is used to store app-wide configuration, including:
- Daily quote (`daily_quote`)
- Quote author (`quote_author`)

---

## אם יש בעיות / If Issues Persist

אם אחרי הרצת הסקריפט עדיין יש שגיאה:

1. וודא שאתה מחובר כמשתמש עם הרשאות מתאימות
2. בדוק שה-RLS policies נוצרו נכון
3. נסה לרענן את ה-schema cache ב-Supabase

---

## קבצים קשורים / Related Files

- SQL Script: `native/scripts/fix-app-config-table.sql`
- Database Service: `native/src/services/database.js` (lines 460-509)
- Home Screen: `native/src/HomeScreen.jsx` (lines 119-144)

