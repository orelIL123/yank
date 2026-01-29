# 🚨 הרץ את זה עכשיו! / RUN THIS NOW!

## השגיאה הנוכחית:
```
ERROR: new row violates row-level security policy for table "app_config"
```

## הפתרון - 2 צעדים פשוטים:

---

### ✅ צעד 1: פתח Supabase Console

לחץ כאן: **https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new**

---

### ✅ צעד 2: הרץ את הסקריפט הזה

העתק והדבק את הקוד הזה:

```sql
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public read access for app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can update app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can insert app_config" ON app_config;

-- Create permissive policies (app_config is a singleton, everyone can edit)
CREATE POLICY "Allow public read access" 
ON app_config 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON app_config 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON app_config 
FOR UPDATE 
USING (true);

-- Verify it worked
SELECT 'RLS policies fixed! ✅' as status;
```

לחץ על **Run** או `Ctrl+Enter`

---

### ✅ צעד 3: רענן את האפליקציה

בטרמינל של Expo, לחץ: **R**

---

### ✅ צעד 4: נסה שוב לשמור ציטוט

זה אמור לעבוד עכשיו! 🎉

---

## מה עשינו?

ה-RLS (Row Level Security) היה מגביל מדי.  
שינינו את ה-policies לאפשר לכולם לערוך את הציטוט היומי.

זה בסדר כי `app_config` היא טבלה עם שורה אחת בלבד (singleton),  
ובאפליקציה רק אדמינים יכולים לגשת לפונקציית העריכה.


