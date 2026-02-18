# 🔧 פתרון שגיאת google-services.json

## הבעיה:
EAS Build מעלה רק קבצים שמופיעים ב-git, אבל `google-services.json` ב-`.gitignore`.

## ✅ פתרון 1: הוסף ל-git (מהיר)

**⚠️ אזהרה**: הקובץ יכיל מידע רגיש, אבל זה רק config ולא מפתחות פרטיים.

### שלבים:

1. **הוסף את הקובץ ל-git**:
   ```bash
   cd native
   git add google-services.json
   git commit -m "Add google-services.json for Android build"
   ```

2. **בנה מחדש**:
   ```bash
   eas build --profile preview --platform android
   ```

---

## ✅ פתרון 2: EAS Secrets (מומלץ - בטוח יותר)

### שלב 1: הוסף את הקובץ כ-Secret

```bash
cd native

# קרא את תוכן הקובץ
cat google-services.json | eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type string
```

**או דרך Dashboard:**
1. לך ל-[EAS Dashboard → Secrets](https://expo.dev/accounts/orel895/projects/yanuka/secrets)
2. לחץ **Create Secret**
3. שם: `GOOGLE_SERVICES_JSON`
4. העתק את כל התוכן מ-`google-services.json`
5. שמור

### שלב 2: צור build hook

צור קובץ `eas-hooks/build.sh`:

```bash
#!/bin/bash
set -euo pipefail

# הורד את ה-Secret וכתוב לקובץ
echo "$GOOGLE_SERVICES_JSON" > google-services.json

echo "✅ google-services.json created from EAS Secret"
```

### שלב 3: עדכן eas.json

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "env": {
        "GOOGLE_SERVICES_JSON": "$GOOGLE_SERVICES_JSON"
      }
    }
  }
}
```

---

## ✅ פתרון 3: Plugin אוטומטי (הכי נוח)

צור plugin שיוריד את הקובץ מ-Secrets בזמן build.

### שלב 1: צור plugin

צור קובץ `plugins/with-google-services.js`:

```javascript
const fs = require('fs');
const path = require('path');

module.exports = function withGoogleServices(config) {
  // אם יש Secret, כתוב אותו לקובץ
  if (process.env.GOOGLE_SERVICES_JSON) {
    const googleServicesPath = path.join(__dirname, '..', 'google-services.json');
    fs.writeFileSync(googleServicesPath, process.env.GOOGLE_SERVICES_JSON);
    console.log('✅ google-services.json created from EAS Secret');
  }
  
  return config;
};
```

### שלב 2: הוסף ל-app.json

```json
{
  "plugins": [
    "./plugins/with-firebase-modular-headers",
    "./plugins/with-google-services",
    "expo-localization"
  ]
}
```

### שלב 3: הוסף Secret (כמו בפתרון 2)

```bash
cat google-services.json | eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type string
```

---

## 🎯 המלצה

**למהירות**: השתמש בפתרון 1 (הוסף ל-git)

**לבטיחות**: השתמש בפתרון 2 או 3 (EAS Secrets)

---

## 📝 אחרי התיקון

לאחר שתבחר פתרון ותבנה:

```bash
eas build --profile preview --platform android
```

הבנייה אמורה לעבוד! 🎉
