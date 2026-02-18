# Environment Variables (אבטחה)

ה-API keys לא נשמרים יותר בקוד. צריך להגדיר אותם ב־`.env`.

## פעולה חד-פעמית

1. **העתק את קובץ הדוגמה:**
   ```bash
   cd native
   cp .env.example .env
   ```

2. **ערוך את `native/.env`** והכנס את הערכים האמיתיים:
   - Supabase: מ־[Supabase Dashboard](https://app.supabase.com) → Project → Settings → API
   - Firebase: מ־[Firebase Console](https://console.firebase.google.com) → Project settings

3. **הפעל מחדש את Expo:**
   ```bash
   npx expo start --clear
   ```

אל תעלה את קובץ `.env` ל-Git (הוא כבר ב-.gitignore).
