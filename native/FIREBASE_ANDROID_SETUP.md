# 🔥 הגדרת Firebase לאנדרואיד

## שלב 1: הורדת google-services.json

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט: **yank-99f79**
3. לחץ על ⚙️ **Project Settings** (הגדרות פרויקט)
4. גלול למטה ל-**Your apps** → **Android app**
5. אם אין Android app, לחץ על **Add app** → **Android**
   - **Package name**: `com.hayanuka.app`
   - **App nickname** (אופציונלי): הינוקא Android
   - לחץ **Register app**
6. הורד את `google-services.json`
7. העתק את הקובץ ל-`native/google-services.json`

## שלב 2: וידוא שהקובץ מוגדר

הקובץ `app.json` כבר מוגדר עם:
```json
{
  "android": {
    "googleServicesFile": "./google-services.json"
  }
}
```

## שלב 3: הוספת SHA-256 Fingerprint (לחתימה)

אם אתה בונה APK עם חתימה:

1. Firebase Console → Project Settings → Your apps → Android app
2. לחץ על **Add fingerprint**
3. קבל את ה-SHA-256:
   ```bash
   # אם יש לך keystore
   keytool -list -v -keystore your-keystore.jks -alias your-alias
   
   # או מ-EAS Build
   eas build:list --platform android
   # העתק את ה-SHA-256 מה-build
   ```
4. הדבק ב-Firebase Console

## ✅ סיום

לאחר הוספת `google-services.json`, תוכל לבנות APK:

```bash
cd native
eas build --profile preview --platform android
```

---

**⚠️ חשוב**: הקובץ `google-services.json` מכיל מידע רגיש - אל תעלה אותו ל-GitHub!

הקובץ כבר מוגדר ב-`.gitignore` כך שלא יועלה בטעות.
