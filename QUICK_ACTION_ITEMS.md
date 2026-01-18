# ⚡ פעולות דחופות - Yanuka App Security & Performance

## 🚨 עשה עכשיו (5 דקות):

### 1. הרץ SQL ב-Supabase
```
1. כנס: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new
2. העתק את כל התוכן מ: scripts/fix-security-policies.sql
3. לחץ RUN
4. ודא: "✅ Security policies updated!"
```

### 2. בדוק שהאפליקציה עובדת
```bash
cd native
npm start
```

**תבדוק:**
- ✅ מסך בית נטען
- ✅ כרטיסים מוצגים
- ✅ ניגונים מוצגים
- ✅ אין "פדיון נפש" במסך הבית

---

## ✅ מה כבר תוקן בקוד:

1. **אבטחה:** הוסרה חשיפת pidyon_nefesh מהמסך הבית
2. **ביצועים:** Queries רצים במקביל (Promise.all)
3. **ביצועים:** הוספת caching (30 דקות)
4. **ביצועים:** Pagination ל-notifications (limit 30)
5. **ביצועים:** הסרת polling כל 30 שניות

---

## 📁 קבצים שהשתנו:

- ✏️ `native/src/HomeScreen.jsx` - תיקוני ביצועים ואבטחה
- ➕ `native/src/utils/cache.js` - caching layer חדש
- ➕ `scripts/fix-security-policies.sql` - SQL לנעילת טבלאות

---

## 🔍 בדיקות אחרי ההרצה:

### בדיקת אבטחה:
```javascript
// בקונסול - צריך להיכשל:
const { data, error } = await supabase.from('pidyon_nefesh').select('*')
// Expected: error - "insufficient permissions"
```

### בדיקת ביצועים:
- פתח את המסך הבית → סגור → פתח שוב
- הפעם השנייה צריכה להיות **מהירה מאוד** (cache!)

---

## ⚠️ חשוב - database.js

יש אי-התאמה בין `database.js` (JSONB) לבין הסכימה שלך (columns).

**בדוק:**
```bash
# כנס ל-Supabase Dashboard:
https://app.supabase.com/project/mtdgmesxbmnspfqfahug/editor

# בדוק אם בטבלה 'music' יש column בשם 'data' (JSONB)
# או שיש columns רגילים: title, artist, url, וכו'
```

**אם אין `data` column:**
```bash
cd native/src/services
mv database.js database-old.js
mv database-fixed.js database.js
npm start  # בדוק שהכל עובד
```

---

## 📖 מסמכים נוספים:

- **מפורט:** [URGENT_FIXES_APPLIED.md](URGENT_FIXES_APPLIED.md)
- **ארכיטקטורה:** [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md)

---

**זמן משוער:** 5-10 דקות לביצוע + בדיקה
