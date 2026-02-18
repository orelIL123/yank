# 📱 מדריך בניית APK לאנדרואיד - הינוקא

## ✅ סנכרון מלא בין iOS ואנדרואיד

האפליקציה מוגדרת עם **runtimeVersion** שמסנכרן את הגרסאות בין iOS ואנדרואיד:
- **runtimeVersion policy**: `appVersion` (גרסה 1.2)
- **OTA Updates**: מופעל עם Expo Updates
- **עדכונים**: ניתן לשלוח עדכונים OTA לשני הפלטפורמות באותה גרסה

---

## 🔧 דרישות מוקדמות

1. **EAS CLI מותקן**:
   ```bash
   npm install -g eas-cli
   ```

2. **התחברות ל-Expo**:
   ```bash
   eas login
   ```

3. **google-services.json** (חובה ל-Firebase):
   - הורד מ-Firebase Console → Project Settings → Your apps → Android app
   - העתק ל-`native/google-services.json`

---

## 🚀 בניית APK

### אפשרות 1: Preview Build (מומלץ לבדיקות)

```bash
cd native
eas build --profile preview --platform android
```

**תוצאה**: קובץ APK להורדה מה-EAS Dashboard

### אפשרות 2: Production Build (לפרסום)

```bash
cd native
eas build --profile production --platform android
```

**תוצאה**: קובץ APK מוכן לפרסום (עם חתימה)

---

## 📥 הורדת ה-APK

לאחר שהבנייה מסתיימת:

1. לך ל-[EAS Dashboard](https://expo.dev/accounts/orel895/projects/yanuka/builds)
2. לחץ על ה-build שביצעת
3. הורד את ה-APK
4. העתק למכשיר אנדרואיד והתקן

**או דרך CLI**:
```bash
eas build:list --platform android
# העתק את ה-URL מה-build והדבק בדפדפן
```

---

## 🔄 עדכונים OTA (Over-The-Air)

### שליחת עדכון לשני הפלטפורמות (iOS + Android)

```bash
cd native

# 1. צור עדכון חדש
eas update --branch production --message "עדכון חדש"

# 2. או עדכן branch ספציפי
eas update --branch preview --message "עדכון preview"
```

**חשוב**: 
- העדכון יישלח רק למשתמשים עם אותה `runtimeVersion` (1.2)
- iOS ואנדרואיד יקבלו את אותו עדכון
- לא צריך לבנות מחדש - העדכון נשלח אוטומטית

### בדיקת עדכונים

```bash
# רשימת עדכונים אחרונים
eas update:list

# פרסום עדכון ל-channel ספציפי
eas update --branch production --channel production
```

---

## 📋 הגדרות חשובות

### app.json

```json
{
  "version": "1.2",                    // גרסת האפליקציה
  "android": {
    "versionCode": 12,                  // מספר build לאנדרואיד
    "package": "com.hayanuka.app"       // Package name
  },
  "runtimeVersion": {
    "policy": "appVersion"               // סנכרון גרסאות
  }
}
```

### eas.json

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"              // APK לבדיקות
      }
    },
    "production": {
      "android": {
        "buildType": "apk"              // APK לפרסום
      }
    }
  }
}
```

---

## 🔥 הגדרת Firebase לאנדרואיד

### שלב 1: הורדת google-services.json

1. לך ל-[Firebase Console](https://console.firebase.google.com/)
2. בחר את הפרויקט `yank-99f79`
3. Project Settings → Your apps → Android app
4. הורד את `google-services.json`
5. העתק ל-`native/google-services.json`

### שלב 2: וידוא שהקובץ מוגדר ב-app.json

```json
{
  "android": {
    "googleServicesFile": "./google-services.json"
  }
}
```

✅ כבר מוגדר!

---

## 🎯 סנכרון גרסאות בין iOS ואנדרואיד

### איך זה עובד:

1. **runtimeVersion**: `policy: "appVersion"` משתמש בגרסה מ-`app.json` (1.2)
2. **iOS buildNumber**: 9
3. **Android versionCode**: 12
4. **שניהם חולקים את אותה runtimeVersion**: 1.2

### עדכונים:

- עדכון OTA נשלח לכל המכשירים עם `runtimeVersion: "1.2"`
- iOS ואנדרואיד מקבלים את אותו עדכון
- לא צריך לבנות מחדש - רק לפרסם עדכון

### עדכון גרסה:

כשמשדרגים גרסה (למשל 1.2 → 1.3):

1. עדכן `version` ב-`app.json` ל-`1.3`
2. עדכן `buildNumber` ל-iOS (למשל 10)
3. עדכן `versionCode` ל-Android (למשל 13)
4. בנה מחדש את שני הפלטפורמות:
   ```bash
   eas build --profile production --platform all
   ```

---

## 🐛 פתרון בעיות

### שגיאת google-services.json לא נמצא

```bash
# ודא שהקובץ קיים
ls native/google-services.json

# אם לא קיים, הורד מ-Firebase Console
```

### שגיאת build

```bash
# נקה cache
eas build:cancel
eas build --profile preview --platform android --clear-cache
```

### עדכונים לא מגיעים

```bash
# בדוק את ה-runtimeVersion
eas update:list

# ודא שהמכשיר מחובר לאינטרנט
# ודא שה-runtimeVersion תואם
```

### Firebase לא עובד באנדרואיד

1. ודא ש-`google-services.json` קיים ב-`native/`
2. ודא שהקובץ מוגדר ב-`app.json`
3. ודא שה-Android app רשום ב-Firebase Console
4. ודא שה-SHA-256 fingerprint מוגדר ב-Firebase (לחתימה)

---

## 📊 בדיקת סטטוס Build

```bash
# רשימת builds אחרונים
eas build:list --platform android

# פרטים על build ספציפי
eas build:view [BUILD_ID]

# ביטול build
eas build:cancel [BUILD_ID]
```

---

## 🎉 סיכום

✅ **APK מוכן לבנייה** - השתמש ב-`eas build --profile preview --platform android`

✅ **סנכרון מלא** - iOS ואנדרואיד חולקים את אותה `runtimeVersion`

✅ **עדכונים OTA** - ניתן לשלוח עדכונים לשני הפלטפורמות בלי לבנות מחדש

✅ **Firebase מוגדר** - רק צריך להוסיף `google-services.json`

---

## 📞 צעדים הבאים

1. **הוסף google-services.json** מ-Firebase Console
2. **בנה APK**: `eas build --profile preview --platform android`
3. **התקן על מכשיר** ובדוק שהכל עובד
4. **פרסם עדכונים**: `eas update --branch production`

**🎊 בהצלחה!**
