# 🧠 ארכיטקטורה - מידע לביקורת

## 🔐 1. Firebase ↔ Supabase Connection (JWT / UID)

### מצב נוכחי: **אין חיבור בין Firebase Auth ל-Supabase**

**פרטים:**
- ✅ **Firebase Auth**: משמש לאימות משתמשים (Email/Password)
- ✅ **Supabase Database**: משמש לאחסון נתונים בלבד
- ❌ **אין מיפוי JWT/UID**: אין חיבור בין Firebase UID ל-Supabase JWT

**איך זה עובד:**
```javascript
// Firebase Auth - native/src/config/firebase.js
import { initializeAuth } from 'firebase/auth'
// משתמשים מתחברים דרך Firebase Auth
// UID נשמר ב-Firestore (אם יש users collection שם)

// Supabase - native/src/config/supabase.js
import { createClient } from '@supabase/supabase-js'
const SUPABASE_ANON_KEY = 'eyJhbGci...' // Public anon key
// משתמש ב-anon key - לא דורש אימות!
// כל הקריאות הן anonymous
```

**השלכות:**
- ⚠️ **אבטחה**: Supabase משתמש ב-RLS (Row Level Security) עם `PUBLIC SELECT` policies
- ⚠️ **ללא בקרת גישה**: אין יכולת לזהות מי המשתמש ב-Supabase
- ⚠️ **ללא הרשאות**: כל המשתמשים רואים את כל הנתונים

**טבלאות ללא אבטחה:**
- כל הטבלאות עם `CREATE POLICY "Public read access" ... USING (true)`
- אין שימוש ב-`auth.uid()` ב-policies (חוץ מ-`prayer_commitments` ו-`notifications`)

---

## 📊 2. סכימת טבלאות Supabase

**מקור:** `supabase-schema.sql`

### מבנה כללי:
כל טבלה משתמשת ב-**JSONB** column בשם `data` לאחסון הנתונים:

```sql
CREATE TABLE table_name (
  id UUID PRIMARY KEY,
  data JSONB,  -- הנתונים האמיתיים כאן!
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

### רשימת טבלאות:

1. **books** - ספרים
   - Fields: `id`, `title`, `description`, `url`, `image_url`, `created_at`, `updated_at`

2. **music** - מוזיקה
   - Fields: `id`, `title`, `artist`, `url`, `youtube_url`, `image_url`, `duration`, `created_at`, `updated_at`

3. **newsletters** - עלונים
   - Fields: `id`, `title`, `content`, `pdf_url`, `image_url`, `published`, `created_at`, `updated_at`

4. **news** - חדשות
   - Fields: `id`, `title`, `content`, `image_url`, `link`, `created_at`, `updated_at`

5. **prayers** - תפילות
   - Fields: `id`, `title`, `hebrew_title`, `description`, `content`, `pdf_url`, `image_url`, `category`, `created_at`, `updated_at`

6. **prayer_commitments** - התחייבויות תפילה
   - Fields: `id`, `user_id` (TEXT - Firebase UID), `prayer_id`, `user_name`, `user_email`, `commitment_text`, `created_at`, `updated_at`
   - ⚠️ יש RLS policy: `auth.uid()::text = user_id`

7. **daily_learning** - לימוד יומי
   - Fields: `id`, `title`, `content`, `pdf_url`, `audio_url`, `video_url`, `date`, `hebrew_date`, `created_at`, `updated_at`

8. **daily_videos** - סרטונים יומיים
   - Fields: `id`, `title`, `youtube_url`, `description`, `date`, `created_at`, `updated_at`

9. **daily_insights** - תובנות יומיות
   - Fields: `id`, `title`, `content`, `image_url`, `date`, `hebrew_date`, `created_at`, `updated_at`

10. **short_lessons** - שיעורים קצרים
    - Fields: `id`, `title`, `description`, `youtube_url`, `duration`, `category`, `tags[]`, `created_at`, `updated_at`

11. **long_lessons** - שיעורים ארוכים
    - Fields: `id`, `title`, `description`, `youtube_url`, `duration`, `category`, `series`, `episode_number`, `tags[]`, `created_at`, `updated_at`

12. **tzadikim** - צדיקים
    - Fields: `id`, `name`, `hebrew_name`, `description`, `biography`, `image_url`, `birth_date`, `death_date`, `burial_place`, `category`, `created_at`, `updated_at`

13. **notifications** - התראות
    - Fields: `id`, `title`, `message`, `type`, `link`, `read`, `user_id` (TEXT), `created_at`, `updated_at`
    - ⚠️ יש RLS policy: `auth.uid()::text = user_id`

14. **pidyon_nefesh** - פדיון נפש
    - Fields: `id`, `user_name`, `user_email`, `phone`, `request_text`, `prayer_type`, `status`, `created_at`, `updated_at`

15. **home_cards** - כרטיסי בית
    - Fields: `id`, `title`, `subtitle`, `image_url`, `link`, `action`, `order_index`, `active`, `created_at`, `updated_at`

16. **chidushim** - חידושים
    - Fields: `id`, `title`, `content`, `author`, `parsha`, `category`, `created_at`, `updated_at`

17. **rabbi_students** - קטגוריות תלמידים
    - Fields: `id`, `name`, `description`, `image_url`, `order_index`, `created_at`, `updated_at`

18. **rabbi_student_videos** - סרטוני תלמידים
    - Fields: `id`, `category_id` (FK), `title`, `youtube_url`, `description`, `duration`, `created_at`, `updated_at`

19. **beit_midrash_videos** - סרטוני בית מדרש
    - Fields: `id`, `title`, `youtube_url`, `description`, `category`, `speaker`, `duration`, `created_at`, `updated_at`

### Indexes:
- `created_at DESC` על רוב הטבלאות
- `category` על: `prayers`, `short_lessons`, `long_lessons`, `tzadikim`
- `user_id` על: `notifications`, `prayer_commitments`
- `category_id` על: `rabbi_student_videos`

### RLS Policies:
- **רוב הטבלאות**: `PUBLIC SELECT USING (true)` - כל אחד יכול לקרוא
- **INSERT/UPDATE/DELETE**: `WITH CHECK (true)` - כל authenticated user יכול לערוך (אבל אין auth!)
- **יוצאים מהכלל**: `prayer_commitments` ו-`notifications` משתמשים ב-`auth.uid()`

---

## 📱 3. איך האפליקציה מושכת פיד (Queries)

**מקור:** `native/src/HomeScreen.jsx`

### HomeScreen מבצע **4 queries נפרדים** בטעינה:

#### Query 1: Home Cards
```javascript
const cardsData = await db.getCollection('homeCards', {
  where: [['isActive', '==', true]],
  orderBy: { field: 'order', direction: 'asc' }
})
```
- **טבלה:** `home_cards`
- **תנאי:** `active = true`
- **מיון:** `order_index ASC`

#### Query 2: Music (Songs)
```javascript
const songsData = await db.getCollection('music', {
  orderBy: { field: 'createdAt', direction: 'desc' },
  limit: 3
})
```
- **טבלה:** `music`
- **מיון:** `created_at DESC`
- **הגבלה:** 3 תוצאות

#### Query 3: Pidyon Nefesh
```javascript
const pidyonData = await db.getCollection('pidyonNefesh', {
  // No filters - gets ALL records
})
```
- **טבלה:** `pidyon_nefesh`
- **ללא פילטרים:** מושך **את כל הרשומות!**

#### Query 4: Notifications
```javascript
const notificationsData = await db.getCollection('notifications', {
  orderBy: { field: 'createdAt', direction: 'desc' }
})
```
- **טבלה:** `notifications`
- **מיון:** `created_at DESC`
- **ללא הגבלה:** מושך **את כל הרשומות!**

### Database Service Layer:

**קובץ:** `native/src/services/database.js`

השירות משתמש ב-**JSONB queries**:
```javascript
// דוגמה לשאילתא:
query = supabase.from(tableName).select('*')
query = query.eq(`data->>${field}`, value)  // JSONB field access
query = query.order('created_at', { ascending: false })
```

**בעיות ביצועים:**
- ⚠️ **JSONB queries איטיות**: `data->>field` לא יכול להשתמש ב-indexes ביעילות
- ⚠️ **4 queries נפרדות**: אין batching או parallelization
- ⚠️ **ללא pagination**: `pidyonNefesh` ו-`notifications` מושכים הכל
- ⚠️ **ללא caching**: כל טעינה = קריאות חדשות ל-DB

### תזמון:
- כל ה-queries רצות ב-`useEffect` - **sequential** (לא parallel)
- `notifications` מתעדכן כל 30 שניות: `setInterval(loadNotifications, 30000)`

---

## ▶️ 4. איך אתה מנגן YouTube

**מקור:** `native/src/screens/MusicScreen.jsx`, `native/src/screens/ShortLessonsScreen.jsx`, וכו'

### ספרייה: `react-native-youtube-iframe`

**Package:** `"react-native-youtube-iframe": "^2.4.1"`

**שימוש:**
```javascript
import YoutubePlayer from 'react-native-youtube-iframe'

<YoutubePlayer
  height={300}
  videoId={youtubeId}
  play={playing}
  onChangeState={onStateChange}
  webViewStyle={{ opacity: 0.99 }}
/>
```

### איך זה עובד:
1. **מחלץ YouTube ID** מהקישור:
   ```javascript
   function extractYouTubeId(url) {
     const patterns = [
       /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
       /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
       /youtube\.com\/shorts\/([^&\n?#/]+)/
     ]
     // מחזיר את ה-ID
   }
   ```

2. **משתמש ב-WebView** פנימי (הספרייה משתמשת ב-`react-native-webview`)
3. **לא iframe ישיר** - זו wrapper על WebView עם YouTube IFrame API

### מקומות שימוש:
- ✅ `MusicScreen` - נגינת שירים
- ✅ `ShortLessonsScreen` - שיעורים קצרים
- ✅ `LongLessonsScreen` - שיעורים ארוכים
- ✅ `DailyLearningScreen` - לימוד יומי
- ✅ `MiBeitRabeinuScreen` - בית מדרש

### אחסון נתונים:
- YouTube URLs נשמרים ב-Supabase כ-`youtube_url` TEXT field
- חלק מה-tables גם שומרים `youtubeId` ב-JSONB

---

## 🔔 5. פושים - Push Notifications

**מקור:** `native/src/utils/notifications.js`, `native/package.json`

### מצב נוכחי: **Expo Push Notifications**

**Package:** `"expo-notifications": "~0.32.14"`

### איך זה עובד:

#### 1. רישום Token:
```javascript
import * as Notifications from 'expo-notifications'

token = await Notifications.getExpoPushTokenAsync()
// מחזיר: Expo Push Token (לא FCM token)
```

#### 2. האפליקציה מקבלת Token:
- Token נוצר דרך Expo Push Notification Service
- **לא Firebase Cloud Messaging (FCM)**
- **לא Apple Push Notification Service (APNs) ישירות**

#### 3. שליחה:
**לא מומש כרגע באפליקציה!**

יש תיעוד ב-`native/ADMIN_PANEL_GUIDE.md` שמתאר:
- שליחה דרך **Expo Push API**: `https://exp.host/--/api/v2/push/send`
- Token נשמר ב-Firestore (`users.fcmTokens`) - אבל זה לא FCM!
- צריך להפעיל Cloud Functions ל-send (לא מומש)

### מה חסר:
- ❌ **אין backend לשליחת פושים**
- ❌ **Token לא נשמר ב-Supabase/Firebase**
- ❌ **אין integration עם Firebase Cloud Messaging**
- ❌ **אין שליחת פושים אוטומטית**

### מה יש:
- ✅ **רישום Token** (אם יש קוד שקורא ל-`registerForPushNotificationsAsync`)
- ✅ **קבלת פושים** (אם שולחים דרך Expo)
- ✅ **Local notifications** (`sendLocalNotification`)

### תשתית:
- **Android**: Expo מנהל notification channel
- **iOS**: צריך APNs certificates (דרך Expo)
- **Backend**: צריך לשלוח דרך Expo Push API או Firebase Cloud Messaging

---

## 📝 סיכום טכני

### Stack:
- **Auth**: Firebase Authentication
- **Database**: Supabase (PostgreSQL + JSONB)
- **Storage**: Firebase Storage (עבור images/files)
- **Push**: Expo Push Notifications (לא מומש)
- **Video**: react-native-youtube-iframe (WebView wrapper)

### נקודות קריטיות לביקורת:
1. ⚠️ **אין חיבור Auth**: Supabase משתמש ב-anon key בלבד
2. ⚠️ **JSONB queries איטיות**: לא יכולות להשתמש ב-indexes
3. ⚠️ **4 queries נפרדות** ב-HomeScreen
4. ⚠️ **ללא pagination** על notifications/pidyon
5. ⚠️ **Push לא מומש** - רק infrastructure קיים
6. ⚠️ **YouTube דרך WebView** - לא native player

---

**מוכן לביקורת! 🚀**


