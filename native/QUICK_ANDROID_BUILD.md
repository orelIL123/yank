# ⚡ בניית APK לאנדרואיד - הוראות מהירות

## 🎯 מה נעשה?

✅ **הוגדר versionCode** לאנדרואיד (12)  
✅ **הוגדר buildType: "apk"** ב-production profile  
✅ **runtimeVersion מוגדר** לסנכרון מלא עם iOS  
✅ **OTA Updates מופעל** - ניתן לשלוח עדכונים ללא build מחדש  

---

## 🚀 בניית APK (3 שלבים)

### 1. הוסף google-services.json

```bash
# הורד מ-Firebase Console:
# Firebase Console → Project Settings → Your apps → Android app
# העתק ל-native/google-services.json
```

📖 **מדריך מפורט**: ראה `FIREBASE_ANDROID_SETUP.md`

### 2. בנה APK

```bash
cd native
eas build --profile preview --platform android
```

### 3. הורד והתקן

- לך ל-[EAS Dashboard](https://expo.dev/accounts/orel895/projects/yanuka/builds)
- הורד את ה-APK
- העתק למכשיר והתקן

---

## 🔄 עדכונים OTA (ללא build מחדש)

```bash
cd native
eas update --branch production --message "עדכון חדש"
```

**העדכון יישלח אוטומטית ל-iOS ואנדרואיד!**

---

## 📚 מדריכים נוספים

- **מדריך מפורט**: `ANDROID_BUILD_GUIDE.md`
- **הגדרת Firebase**: `FIREBASE_ANDROID_SETUP.md`

---

## ✅ סנכרון עם iOS

- **גרסה**: 1.2 (זהה לשני הפלטפורמות)
- **runtimeVersion**: 1.2 (מסנכרן עדכונים)
- **עדכונים**: נשלחים לשני הפלטפורמות יחד

🎉 **מוכן לבנייה!**
