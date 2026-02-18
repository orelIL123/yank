# 🚀 בניית APK - הוראות מהירות

## ✅ מה כבר מוכן:

- ✅ Android app מוגדר ב-Firebase (`com.hayanuka.app`)
- ✅ `app.json` מוגדר נכון
- ✅ `eas.json` מוכן לבנייה
- ✅ סנכרון עם iOS מוגדר (גרסה 1.2)

## 📥 מה צריך לעשות עכשיו:

### שלב 1: הוסף google-services.json

1. לך ל-[Firebase Console](https://console.firebase.google.com/project/yank-99f79/settings/general)
2. לחץ על **⚙️ Project Settings**
3. גלול למטה ל-**Your apps** → **Android app** (`com.hayanuka.app`)
4. לחץ על **⚙️ Settings** (ליד שם האפליקציה)
5. לחץ על **Download google-services.json**
6. העתק את הקובץ ל-`native/google-services.json`

### שלב 2: בנה APK

```bash
cd native
eas build --profile preview --platform android
```

### שלב 3: הורד והתקן

1. לך ל-[EAS Dashboard](https://expo.dev/accounts/orel895/projects/yanuka/builds)
2. חכה שהבנייה תסתיים (5-15 דקות)
3. הורד את ה-APK
4. העתק למכשיר אנדרואיד והתקן

---

## 🎉 אחרי הבנייה:

### עדכונים OTA (ללא build מחדש):

```bash
cd native
eas update --branch production --message "עדכון חדש"
```

העדכון יישלח אוטומטית ל-iOS ואנדרואיד!

---

## 📚 מדריכים נוספים:

- **מדריך מפורט**: `ANDROID_BUILD_GUIDE.md`
- **הגדרת Firebase**: `FIREBASE_ANDROID_SETUP.md`
- **הוראות מהירות**: `QUICK_ANDROID_BUILD.md`

---

**🎊 מוכן לבנייה! רק צריך להוסיף את google-services.json!**
