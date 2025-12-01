# ✅ iOS Preview Build - Checklist

## בדיקות לפני בנייה:

### ✅ 1. קונפיגורציה של EAS
- **eas.json** - ✅ תקין
  - `preview` profile מוגדר
  - `ios.simulator: false` (בנייה למכשיר פיזי)
  - `distribution: internal`

### ✅ 2. הגדרות iOS ב-app.json
- **bundleIdentifier**: `com.hayanuka.app` ✅
- **supportsTablet**: `true` ✅
- **infoPlist**: `ITSAppUsesNonExemptEncryption: false` ✅

### ✅ 3. Assets
- **icon.png** - ✅ קיים ב-`assets/icon.png`
- **splash-icon.png** - ✅ קיים ב-`assets/splash-icon.png`

### ⚠️ 4. iOS Credentials (נדרש!)
צריך להגדיר credentials ל-iOS לפני בנייה:
```bash
cd native
eas credentials
# בחר: iOS
# בחר: Set up credentials for internal distribution
```

### 📝 5. GoogleService-Info.plist
הקובץ נמצא ב: `/Users/x/Documents/yanuka/GoogleService-Info-10.plist`
- צריך להעתיק ל-`native/` או להוסיף דרך plugin ב-app.json
- Bundle ID תואם: `com.hayanuka.app` ✅

## פקודות להרצה:

### שלב 1: הגדרת Credentials (פעם אחת)
```bash
cd native
eas credentials
# בחר: iOS
# בחר: Set up credentials for internal distribution
# בחר: Let EAS handle credentials automatically
```

### שלב 2: בניית iOS Preview
```bash
cd native
eas build --platform ios --profile preview
```

## הערות חשובות:
1. **Credentials** - EAS יכול לנהל את זה אוטומטית, אבל צריך להגדיר פעם אחת
2. **GoogleService-Info.plist** - אם לא מוגדר, Firebase לא יעבוד ב-iOS
3. **Build time** - בניית iOS preview לוקחת כ-15-20 דקות

## אם יש שגיאות:
- **"No credentials"** → הרץ `eas credentials` קודם
- **"Missing GoogleService-Info.plist"** → העתק את הקובץ ל-native/
- **"Bundle ID mismatch"** → בדוק ש-bundleIdentifier ב-app.json תואם ל-Firebase

