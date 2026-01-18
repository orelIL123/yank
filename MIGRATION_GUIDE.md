# מדריך מעבר מ-Firestore ל-Supabase

## שלב 1: הרצת ה-Schema ב-Supabase

1. לך ל-Supabase SQL Editor:
   https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new

2. העתק את כל התוכן מהקובץ `supabase-schema.sql`

3. הדבק ב-SQL Editor ולחץ על "Run"

4. וודא שכל הטבלאות נוצרו בהצלחה בלשונית "Table Editor"

## שלב 2: העברת הנתונים מ-Firestore ל-Supabase

יש לך כמה אפשרויות:

### אפשרות א': סקריפט העברה אוטומטי (מומלץ)
אני יכול ליצור לך סקריפט Node.js שיעתיק את כל הנתונים מ-Firestore ל-Supabase.

### אפשרות ב': העברה ידנית
אם יש לך מעט נתונים, תוכל להשתמש ב-Admin Panel שלך כדי להעתיק ידנית.

### אפשרות ג': התחלה מחדש
אם אין לך הרבה נתונים חיוניים, תוכל פשוט להתחיל מחדש עם Supabase.

## שלב 3: שימוש ב-Database Service החדש

### דוגמאות לשימוש:

#### קריאת כל המוזיקה (במקום Firestore):
```javascript
// Before (Firestore):
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'

const q = query(collection(db, 'music'), orderBy('createdAt', 'desc'))
const snapshot = await getDocs(q)
const songs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

// After (Supabase):
import { db } from '../services/database'

const songs = await db.getCollection('music', {
  orderBy: { field: 'createdAt', direction: 'desc' }
})
```

#### הוספת שיר חדש:
```javascript
// Before (Firestore):
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../config/firebase'

const docRef = await addDoc(collection(db, 'music'), {
  title: 'שיר חדש',
  artist: 'אמן',
  url: 'https://...'
})

// After (Supabase):
import { db } from '../services/database'

const newSong = await db.addDocument('music', {
  title: 'שיר חדש',
  artist: 'אמן',
  url: 'https://...'
})
```

#### עדכון מסמך:
```javascript
// Before (Firestore):
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

await updateDoc(doc(db, 'music', songId), {
  title: 'כותרת מעודכנת'
})

// After (Supabase):
import { db } from '../services/database'

await db.updateDocument('music', songId, {
  title: 'כותרת מעודכנת'
})
```

#### מחיקת מסמך:
```javascript
// Before (Firestore):
import { doc, deleteDoc } from 'firebase/firestore'
import { db } from '../config/firebase'

await deleteDoc(doc(db, 'music', songId))

// After (Supabase):
import { db } from '../services/database'

await db.deleteDocument('music', songId)
```

#### שאילתות מורכבות:
```javascript
// Before (Firestore):
const q = query(
  collection(db, 'prayers'),
  where('category', '==', 'תפילות'),
  orderBy('createdAt', 'desc'),
  limit(10)
)

// After (Supabase):
const prayers = await db.getCollection('prayers', {
  where: [['category', '==', 'תפילות']],
  orderBy: { field: 'createdAt', direction: 'desc' },
  limit: 10
})
```

## שלב 4: החלפת הקוד במסכים

כדי להחליף מסך ספציפי, תצטרך:

1. להסיר את ה-imports של Firestore
2. להוסיף import של database service
3. להחליף את הקריאות ל-API

### דוגמה מלאה - MusicScreen:

```javascript
// OLD imports to remove:
// import { collection, getDocs, query, orderBy } from 'firebase/firestore'
// import { db } from '../config/firebase'

// NEW import to add:
import { db } from '../services/database'

// OLD code in loadSongs():
// const q = query(collection(db, 'music'), orderBy('createdAt', 'desc'))
// const querySnapshot = await getDocs(q)
// const songsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

// NEW code in loadSongs():
const songsData = await db.getCollection('music', {
  orderBy: { field: 'createdAt', direction: 'desc' }
})
```

## שלב 5: בדיקה

לאחר ההחלפה:
1. בדוק שכל המסכים עובדים
2. וודא שהנתונים נטענים כראוי
3. בדוק שהוספה/עדכון/מחיקה עובדים

## יתרונות המעבר ל-Supabase

✅ **חינם יותר** - 500MB Database, 1GB File Storage, 2GB Bandwidth
✅ **מהיר יותר** - PostgreSQL מהיר מאוד
✅ **גמיש יותר** - SQL מלא
✅ **Real-time** - WebSocket subscriptions
✅ **Auth משולב** - אפשר גם להעביר את ה-Auth בעתיד

## שמירת Firebase Auth

כרגע, Firebase Auth נשאר כפי שהוא:
- המשתמשים ממשיכים להתחבר דרך Firebase
- רק הדאטה עוברת ל-Supabase
- אפשר בעתיד לשקול גם להעביר את ה-Auth

## צעדים הבאים

1. ✅ הרץ את ה-schema ב-Supabase
2. ⏳ העבר את הנתונים (אני יכול ליצור לך סקריפט)
3. ⏳ החלף מסך אחרי מסך (נתחיל ב-MusicScreen כדוגמה)
4. ⏳ בדוק שהכל עובד
5. ⏳ מחק את Firestore (לאחר שהכל עובד!)

## זקוק לעזרה?

אני כאן לעזור בכל שלב! 🚀
