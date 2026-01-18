# ⚡ בנייה מהירה - Development Build

## הבעיה עם Expo Go

הכרטיסים וחלק מהדברים לא מגיבים ב-**Expo Go** כי:
- ❌ Expo Go לא תומך ב-**plugins מותאמים אישית** (כמו `with-firebase-modular-headers`)
- ❌ חלק מה-**native modules** לא עובדים ב-Expo Go
- ✅ צריך **Development Build** מותאם אישית

---

## 🚀 אופציה 1: בנייה דרך EAS (מומלץ)

### iOS:

```bash
cd native
eas build --profile development --platform ios
```

### Android:

```bash
cd native
eas build --profile development --platform android
```

### שתיהן:

```bash
cd native
./build-dev.sh
```

**מה קורה:**
1. EAS בונה את האפליקציה בענן
2. תקבל לינק להורדה ב-EAS Dashboard
3. התקן על המכשיר
4. הרץ `npm start` לחיבור ל-development server

---

## 🛠️ אופציה 2: בנייה מקומית (מהיר יותר)

### iOS (Mac בלבד):

```bash
cd native
export LANG=en_US.UTF-8
npx expo run:ios
```

### Android:

```bash
cd native
npx expo run:android
```

**דרישות:**
- **iOS:** Xcode מותקן
- **Android:** Android Studio + Emulator או מכשיר מחובר

---

## 📥 לאחר ההתקנה

1. **התקן את ה-build** על המכשיר:
   - iOS: `.ipa` דרך Xcode או TestFlight
   - Android: `.apk` - העתק למכשיר והתקן

2. **הרץ development server:**
   ```bash
   cd native
   npm start
   ```

3. **בחר:**
   - `i` - לחיבור ל-iOS device/simulator
   - `a` - לחיבור ל-Android device/emulator

---

## ✅ מה שיקרה אחרי זה

- ✅ כל ה-**plugins** יעבדו
- ✅ הכרטיסים יעבדו
- ✅ כל ה-**native modules** יעבדו
- ✅ ביצועים טובים יותר

---

## 🔧 פתרון בעיות

### CocoaPods Error:
```bash
export LANG=en_US.UTF-8
cd ios
pod install
```

### Cache issues:
```bash
npm start -- --clear
npx expo start -c
```

### Dependencies:
```bash
rm -rf node_modules
npm install
```

