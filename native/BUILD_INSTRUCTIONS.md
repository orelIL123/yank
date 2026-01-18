# 🛠️ הוראות בניית Development Build

## למה צריך Development Build?

Development Build (dev client) הוא נדרש כי:
1. **Expo Go לא תומך ב-plugins מותאמים אישית** - יש לך `with-firebase-modular-headers`
2. **native modules** - חלק מה-packages דורשים native code
3. **ביצועים טובים יותר** - לא צריך להעביר דרך Expo Go

## שלב 1: התקנת EAS CLI

```bash
npm install -g eas-cli
```

## שלב 2: התחברות ל-Expo

```bash
eas login
```

## שלב 3: בניית Development Build

### iOS (במחשב Mac בלבד):

```bash
cd native
eas build --profile development --platform ios
```

**או אם יש לך Mac עם Xcode:**
```bash
npx expo run:ios
```

### Android:

```bash
cd native
eas build --profile development --platform android
```

**או מקומי (אם יש לך Android Studio):**
```bash
npx expo run:android
```

## שלב 4: התקנה על המכשיר

### iOS:
1. הורד את ה-`.ipa` מה-EAS Dashboard
2. התקן דרך Xcode או דרך `eas build:run`

### Android:
1. הורד את ה-`.apk` מה-EAS Dashboard
2. העתק למכשיר והתקן

## שלב 5: הרצת האפליקציה

לאחר התקנת ה-development build:

```bash
cd native
npm start
```

ואז בחר:
- `i` - ל-iOS simulator/device
- `a` - ל-Android emulator/device

## פתרון בעיות

### הכרטיסים לא מגיבים ב-Expo Go:
- ✅ זה נורמלי! Expo Go לא תומך בכל ה-plugins
- ✅ צריך development build

### שגיאות build:
```bash
# נקה cache
npm start -- --clear
npx expo start -c
```

### בעיות dependencies:
```bash
rm -rf node_modules
npm install
cd ios && pod install && cd .. # רק ל-iOS
```

