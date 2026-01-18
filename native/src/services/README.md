# Sefaria API Service

שירות לשליפת תוכן מ-Sefaria API באפליקציה.

## התקנה

השירות מוכן לשימוש! אין צורך בהתקנת חבילות נוספות - `fetch` זמין כבר ב-React Native.

## שימוש בסיסי

```javascript
import { getText, formatTextForDisplay } from '../services/sefaria'

// קבלת טקסט
const text = await getText('Genesis.1.1', { lang: 'he' })
const formatted = formatTextForDisplay(text)

console.log(formatted.title)   // שם הטקסט
console.log(formatted.hebrew)  // התוכן בעברית
console.log(formatted.english) // התוכן באנגלית
```

## פונקציות זמינות

### `getText(tref, options)`
מביא טקסט לפי reference.

**פרמטרים:**
- `tref` (string) - הפניה לטקסט (לדוגמה: "Genesis.1.1", "Rashi on Genesis.1.1")
- `options` (object) - אופציות:
  - `lang` - שפה ('he' או 'en')
  - `version` - גרסה ספציפית
  - `commentary` - האם לכלול פירושים

**דוגמה:**
```javascript
const text = await getText('Genesis.1.1', { lang: 'he' })
```

### `getParsha(parshaName)`
מביא פרשה שלמה.

**דוגמה:**
```javascript
const parsha = await getParsha('Bereshit')
```

### `getRashi(tref)`
מביא את פירוש רש"י על טקסט.

**דוגמה:**
```javascript
const rashi = await getRashi('Genesis.1.1')
```

### `getCommentaries(tref, commentaries)`
מביא מספר פירושים על טקסט.

**דוגמה:**
```javascript
const commentaries = await getCommentaries('Genesis.1.1', ['Rashi', 'Ibn Ezra'])
// commentaries.Rashi
// commentaries['Ibn Ezra']
```

### `getTextCached(tref, options)`
מביא טקסט עם cache (שעה).

**דוגמה:**
```javascript
const text = await getTextCached('Genesis.1.1', { lang: 'he' })
```

### `formatTextForDisplay(textData)`
מעצב את התגובה מהשירות לפורמט נוח לתצוגה.

**דוגמה:**
```javascript
const raw = await getText('Genesis.1.1')
const formatted = formatTextForDisplay(raw)
```

## שימוש ב-React Component

```javascript
import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { getText, formatTextForDisplay } from '../services/sefaria'

export default function TorahTextScreen({ tref }) {
  const [text, setText] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchText() {
      try {
        const data = await getText(tref, { lang: 'he' })
        const formatted = formatTextForDisplay(data)
        setText(formatted)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchText()
  }, [tref])

  if (loading) return <ActivityIndicator size="large" />
  if (!text) return <Text>לא נמצא תוכן</Text>

  return (
    <View>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        {text.title}
      </Text>
      <Text style={{ fontSize: 18, textAlign: 'right' }}>
        {text.hebrew}
      </Text>
    </View>
  )
}
```

## מה הלאה?

כשתהיה מוכן, תגיד מה בדיוק צריך מפרשות הנשיאים (או כל תוכן אחר מ-Sefaria) ואני אוסיף פונקציות ספציפיות.

## הערות

- השירות משתמש ב-`fetch` שזמין כבר ב-React Native
- יש תמיכה ב-cache פשוט (בזיכרון) - ניתן לשדרג ל-AsyncStorage אם צריך
- כל הפונקציות מחזירות Promise - יש להשתמש ב-`async/await` או `.then()`

## קישורים

- [Sefaria API Documentation](https://www.sefaria.org/api)
- [Sefaria GitHub Wiki](https://github.com/Sefaria/Sefaria-Project/wiki/API-Documentation)
