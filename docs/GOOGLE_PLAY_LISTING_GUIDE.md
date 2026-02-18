# מדריך מפורט – מילוי רישום אפליקציה ב-Google Play

מסמך זה מתאר **בדיוק מה למלא** כשמעלים את אפליקציית **הינוקא** (Hayanuka) ל-Google Play Console.

---

## 1. גישה ל-Google Play Console

- כניסה: [https://play.google.com/console](https://play.google.com/console)
- חשבון מפתח: דמי רישום חד־פעמי **$25** (פעם אחת לכל החשבון).
- יצירת אפליקציה חדשה: **"Create app"** → מילוי שם האפליקציה, שפת ברירת מחדל וסוג (אפליקציה / משחק).

---

## 2. מדיניות ואסמכתאות (Policy & programs)

לפני פרסום חייבים להשלים:

| פריט | מה לעשות |
|------|----------|
| **Developer Program Policies** | לקרוא ולוודא שהאפליקציה עומדת בהנחיות (תוכן, פרטיות, אבטחה). |
| **US export laws** | לאשר שהאפליקציה עומדת בחוקי הייצוא (בדרך כלל "No" – אין הצפנה מותאמת). |
| **Developer Distribution Agreement** | לאשר את הסכם ההפצה. |

---

## 3. הגדרת האפליקציה (App content)

### 3.1 פרטיות (Privacy policy)

| שדה | חובה? | מה למלא |
|-----|--------|----------|
| **Privacy policy URL** | ✅ כן | קישור לדף אינטרנט עם מדיניות פרטיות (HTTPS). יש להסביר אילו נתונים נאספים, איך משתמשים בהם, שיתוף עם צד שלישי, זכויות המשתמש. |

**דוגמאות נושאים:** איסוף נתונים (אימייל, מכשיר, שימוש), Firebase/Analytics, Supabase, התראות, שמירת נתונים מקומית.

---

### 3.2 אבטחת אפליקציה (App access)

| שדה | חובה? | מה למלא |
|-----|--------|----------|
| **Special access** | אם יש | אם האפליקציה דורשת התחברות – לספק פרטי בדיקה (אימייל/סיסמה או הוראות) כדי ש-Google יוכלו לבדוק. |
| **Login / demo** | אם יש התחברות | להסביר איך להיכנס (למשל: "התחברות עם אימייל" + פרטי חשבון בדיקה). |

---

### 3.3 פרסום (Ads) – אם יש פרסומות

| שדה | חובה? | מה למלא |
|-----|--------|----------|
| **Contains ads** | כן | לסמן "Yes" או "No". |
| **Ad SDK / declaration** | אם Yes | לציין אילו SDK של פרסומות משתמשים (למשל Google AdMob) ולוודא התאמה למדיניות. |

---

### 3.4 תוכן האפליקציה (Content questionnaire)

| נושא | מה למלא |
|------|----------|
| **Target audience** | גיל: ילדים / גיל 13+ / מבוגרים בלבד וכו'. |
| **News app** | האם האפליקציה מוצגת ככלי חדשות – Yes/No. |
| **COVID-19** | האם קשורה ל-COVID – בדרך כלל No. |
| **Data safety** | ראה סעיף 4. |
| **Government / elections** | האם קשורה לממשל/בחירות – Yes/No. |
| **Financial features** | האם יש תשלומים/הלוואות/השקעות – Yes/No. |
| **Health** | האם מציגה מידע רפואי/בריאות – Yes/No. |
| **Other declarations** | לפי השאלות – לענות בהתאם לאפליקציה. |

---

## 4. Data safety (בטיחות נתונים)

זה החלק שמוצג למשתמשים ב-Play Store. **חובה** למלא.

| קטגוריה | מה להגדיר |
|---------|------------|
| **Does your app collect or share user data?** | Yes / No. אם יש איסוף (התחברות, Analytics, Supabase, Firebase וכו') – Yes. |
| **Data types** | לסמן את סוגי הנתונים: למשל **Email**, **User IDs**, **App interactions** (Analytics), **Crash data**, **Device ID** וכו'. |
| **Is this data collected, shared, or both?** | Collected / Shared / Both. |
| **Is this data processed ephemerally?** | האם נשמר רק בזיכרון/זמני – Yes/No. |
| **Is this data required or optional?** | Required for app / Optional. |
| **Purpose** | למשל: App functionality, Analytics, Account management. |

**טיפ:** אם משתמשים ב-Firebase (Analytics/Crashlytics) ו-Supabase – לסמן בהתאם: מזהים, אינטראקציות, קריסות. אם יש רק התחברות – אימייל/מזהה משתמש.

---

## 5. Store listing (רישום החנות)

### 5.1 שפות ורישום בסיסי

| שדה | חובה? | דרישות / המלצות |
|-----|--------|------------------|
| **App name** | ✅ | עד **30 תווים**. לדוגמה: **הינוקא**. |
| **Short description** | ✅ | עד **80 תווים**. משפט אחד שמתאר את האפליקציה (מופיע בתוצאות חיפוש). |
| **Full description** | ✅ | עד **4,000 תווים**. תיאור מפורט: מה האפליקציה עושה, למי היא מתאימה, יתרונות. |

**דוגמה Short description (עברית):**  
"לימוד ותרגול עם שיעורים, סיכומים והתראות – הכל במקום אחד."

**דוגמה Full description:**  
פסקה או שתיים על הינוקא: מטרה (לימוד/תרגול), פיצ'רים (שיעורים, PDF, סיכומים, התראות), ולמי מיועד (תלמידים/סטודנטים וכו').

---

### 5.2 גרפיקה (Graphics)

| asset | גודל / פורמט | הערות |
|---------|----------------|--------|
| **App icon** | 512×512 px | PNG, 32-bit, ללא transparency בפועל (Google ממליץ). |
| **Feature graphic** | 1024×500 px | באנר בראש דף האפליקציה. JPG או PNG. |
| **Phone screenshots** | מינימום 2, מקסימום 8 | יחס 16:9 או 9:16. מומלץ 1080×1920 או 1080×2340. |
| **7-inch tablet** (אם תומכים) | אופציונלי | 1200×1920 או דומה. |
| **10-inch tablet** (אם תומכים) | אופציונלי | 1600×2560 או דומה. |

**טיפ:** אפשר להשתמש באייקון הקיים מהפרויקט (`native/assets/icon.png`) – לוודא שהוא 512×512 ל-Play. ליצור Feature graphic ייעודי (לוגו + טקסט/סלוגן).

---

### 5.3 סיווג (Categorization)

| שדה | מה לבחור |
|-----|-----------|
| **App category** | למשל: **Education** (חינוך) או **Productivity**. |
| **Tags** | תגיות חיפוש (אם זמין בממשק). |
| **Contact details** | אימייל ו/או אתר ליצירת קשר. |

---

### 5.4 תוכן (Content rating)

| שלב | מה לעשות |
|-----|----------|
| **Questionnaire** | למלא שאלון על תוכן: אלימות, תכנים מיניים, שפה, הימורים וכו'. |
| **תוצאה** | מתקבל דירוג (למשל Everyone, Teen). |
| **Certificate** | להוריד את האישור ולהוסיף ל-Console אם נדרש. |

לאפליקציית לימוד/תרגול בדרך כלל יתקבל דירוג נמוך (Everyone / 3+).

---

### 5.5 קהל יעד (Target audience)

| שדה | מה למלא |
|-----|----------|
| **Target age groups** | לסמן טווח גילאים (למשל 13 ומעלה, או כולל ילדים – אז יש דרישות נוספות). |
| **Store presence** | האם להציג במדינות מסוימות בלבד או globally. |

---

### 5.6 News app (אם רלוונטי)

אם האפליקציה לא מוגדרת כאפליקציית חדשות – לסמן "No". אם כן – יש להשלים את כל דרישות אפליקציות החדשות.

---

### 5.7 COVID-19 apps

אם האפליקציה לא קשורה ל-COVID-19 – לסמן "No".

---

### 5.8 Crypto / Financial

אם אין מטבעות קריפטו או שירותים פיננסיים – לסמן בהתאם (No).

---

## 6. Pricing & distribution (מחיר והפצה)

| שדה | אפשרויות |
|-----|----------|
| **Countries** | לבחור באילו מדינות האפליקציה זמינה (למשל ישראל + כל העולם, או רשימה מצומצמת). |
| **Free / Paid** | Free או Paid. אם Paid – להגדיר מחיר. |
| **Contains ads** | Yes / No (עקבי עם מה שמילאת בסעיף 3.3). |
| **In-app purchases** | Yes / No. אם Yes – להגדיר מוצרים ב-Console. |
| **Primary audience** | למשל "All ages" או "Children" (עם דרישות נוספות). |
| **COVID-19 contact tracing / status** | בדרך כלל No. |

---

## 7. Release (שחרור גרסאות)

### 7.1 סוגי release

| סוג | שימוש |
|-----|--------|
| **Production** | גרסה שכל המשתמשים רואים. |
| **Open testing** | בדיקה פתוחה (כל אחד יכול להצטרף). |
| **Closed testing** | בדיקה סגורה (רשימת משתמשים/קבוצות). |
| **Internal testing** | עד 100 משבצים – לבדיקה פנימית מהירה. |

### 7.2 מה להעלות

| פריט | פורמט |
|------|--------|
| **Android App Bundle** | קובץ **.aab** (לא .apk). ב-Expo/EAS: `eas build --platform android --profile production` (או profile מתאים). |
| **Release name** | למשל "1.2 (12)" – תואם ל-version ו-versionCode ב-`app.json`. |
| **Release notes** | מה חדש בגרסה (לכל שפה אם יש כמה). |

---

## 8. בדיקות לפני שליחה (Pre-launch report)

אחרי העלאת ה-.aab, Google מריצים בדיקות אוטומטיות. מומלץ:

- לעבור על **Pre-launch report** ולוודא שאין קריסות או בעיות בולטות.
- לבדוק על מכשירים ורזולוציות שונות אם אפשר.

---

## 9. סיכום רשימת פעולות (Checklist)

- [ ] יצירת אפליקציה ב-Play Console + תשלום $25 (אם ראשון).
- [ ] מדיניות ואסמכתאות: Policies, Export, Distribution Agreement.
- [ ] **Privacy policy** – URL חוקי.
- [ ] **App access** – פרטי גישה אם יש התחברות.
- [ ] **Ads** – Yes/No + הצהרה אם יש פרסומות.
- [ ] **Content questionnaire** – גיל, חדשות, COVID, פיננסי, בריאות וכו'.
- [ ] **Data safety** – סוגי נתונים, איסוף/שיתוף, מטרה.
- [ ] **Store listing:** שם, תיאור קצר, תיאור מלא.
- [ ] **Graphics:** אייקון 512×512, Feature graphic 1024×500, לפחות 2 צילומי מסך.
- [ ] **Category** + פרטי קשר.
- [ ] **Content rating** – שאלון + אישור.
- [ ] **Target audience** + מדינות.
- [ ] **Pricing & distribution** – חינם/בתשלום, מדינות, פרסומות, קהל.
- [ ] **Release:** העלאת קובץ .aab + release name + release notes.
- [ ] **Pre-launch report** – סקירה ותיקון בעיות אם יש.

---

## 10. קובץ האפליקציה (Build)

בפרויקט Expo (הינוקא) עם EAS:

- **Package:** `com.hayanuka.app`
- **Version:** מוגדר ב-`app.json` (כרגע version "1.2", versionCode 12).

פקודה לדוגמה ל-build ל-Production:

```bash
cd native
eas build --platform android --profile production
```

אחרי ה-build להוריד את קובץ ה-**AAB** ולהעלות ב-Play Console תחת **Release** → **Production** (או Testing) → **Create new release** → **Upload** AAB.

---

בהצלחה עם ההעלאה ל-Google Play.
