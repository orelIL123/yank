# ⚡ תיקון מהיר - google-services.json

## הבעיה:
EAS Build לא מוצא את `google-services.json` כי הקובץ ב-`.gitignore`.

## ✅ פתרון מהיר (2 דקות):

### שלב 1: הוסף את הקובץ ל-git

```bash
cd native

# ודא שהקובץ קיים
ls google-services.json

# הוסף ל-git
git add google-services.json
git commit -m "Add google-services.json for Android build"
```

### שלב 2: בנה מחדש

```bash
eas build --profile preview --platform android
```

---

## ✅ פתרון מומלץ (עם EAS Secrets):

### שלב 1: הוסף Secret

```bash
cd native

# קרא את תוכן הקובץ והעלה כ-Secret
cat google-services.json | eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type string
```

### שלב 2: בנה

```bash
eas build --profile preview --platform android
```

הפלאגין שיצרנו (`with-google-services.js`) יוצר את הקובץ אוטומטית מה-Secret בזמן build.

---

## 🎯 איזה פתרון לבחור?

- **מהיר**: פתרון 1 (הוסף ל-git) - עובד מיד
- **בטוח יותר**: פתרון 2 (EAS Secrets) - הקובץ לא יופיע ב-git

**המלצה**: אם זה repo פרטי, השתמש בפתרון 1. אם זה repo ציבורי, השתמש בפתרון 2.

---

**🎉 אחרי התיקון, הבנייה אמורה לעבוד!**
