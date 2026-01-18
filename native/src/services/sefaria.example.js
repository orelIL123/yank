/**
 * דוגמאות שימוש ב-Sefaria API Service
 * 
 * זה קובץ דוגמה - לא להשתמש ישירות באפליקציה
 * העתק את הקוד הרלוונטי למסכים שלך
 */

import {
  getText,
  getParsha,
  getRashi,
  getCommentaries,
  getWeeklyTorahPortion,
  formatTextForDisplay,
  getTextCached,
} from './sefaria'

// ============================================
// דוגמה 1: קבלת פרק מהתורה
// ============================================
async function exampleGetTorahChapter() {
  try {
    // קבלת בראשית פרק א פסוק א
    const text = await getText('Genesis.1.1', { lang: 'he' })
    const formatted = formatTextForDisplay(text)
    
    console.log('Title:', formatted.title)
    console.log('Hebrew:', formatted.hebrew)
    console.log('English:', formatted.english)
    
    return formatted
  } catch (error) {
    console.error('Error fetching text:', error)
  }
}

// ============================================
// דוגמה 2: קבלת פרשה שלמה
// ============================================
async function exampleGetParsha() {
  try {
    // קבלת פרשת בראשית
    const parsha = await getParsha('Bereshit')
    const formatted = formatTextForDisplay(parsha)
    
    return formatted
  } catch (error) {
    console.error('Error fetching parsha:', error)
  }
}

// ============================================
// דוגמה 3: קבלת רש"י על פסוק
// ============================================
async function exampleGetRashi() {
  try {
    // קבלת רש"י על בראשית א:א
    const rashi = await getRashi('Genesis.1.1')
    const formatted = formatTextForDisplay(rashi)
    
    return formatted
  } catch (error) {
    console.error('Error fetching Rashi:', error)
  }
}

// ============================================
// דוגמה 4: קבלת מספר פירושים
// ============================================
async function exampleGetMultipleCommentaries() {
  try {
    const commentaries = await getCommentaries('Genesis.1.1', [
      'Rashi',
      'Ibn Ezra',
      'Ramban'
    ])
    
    // commentaries.Rashi
    // commentaries['Ibn Ezra']
    // commentaries.Ramban
    
    return commentaries
  } catch (error) {
    console.error('Error fetching commentaries:', error)
  }
}

// ============================================
// דוגמה 5: שימוש עם React Component
// ============================================
/*
import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { getText, formatTextForDisplay } from '../services/sefaria'

export default function TorahTextScreen({ tref }) {
  const [text, setText] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchText() {
      try {
        setLoading(true)
        const data = await getText(tref, { lang: 'he' })
        const formatted = formatTextForDisplay(data)
        setText(formatted)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchText()
  }, [tref])

  if (loading) {
    return <ActivityIndicator size="large" />
  }

  if (error) {
    return <Text>שגיאה: {error}</Text>
  }

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
*/

// ============================================
// דוגמה 6: שימוש עם Cache
// ============================================
async function exampleWithCache() {
  try {
    // זה ישמור את התוצאה ב-cache לשעה
    const text = await getTextCached('Genesis.1.1', { lang: 'he' })
    return formatTextForDisplay(text)
  } catch (error) {
    console.error('Error:', error)
  }
}

// ============================================
// דוגמה 7: פרשות הנשיאים (כשתגיד מה בדיוק צריך)
// ============================================
/*
// כשתגיד מה בדיוק צריך מפרשות הנשיאים, נוסיף פונקציה ספציפית כאן
// לדוגמה:
async function getParshiotHaNasiim() {
  // TODO: להגדיר את המבנה המדויק
  // לדוגמה - רשימת פרשות:
  const parshiot = [
    'Bereshit',
    'Noach',
    'Lech Lecha',
    // ... וכו'
  ]
  
  const results = []
  for (const parsha of parshiot) {
    try {
      const data = await getParsha(parsha)
      results.push(formatTextForDisplay(data))
    } catch (error) {
      console.error(`Error fetching ${parsha}:`, error)
    }
  }
  
  return results
}
*/

export {
  exampleGetTorahChapter,
  exampleGetParsha,
  exampleGetRashi,
  exampleGetMultipleCommentaries,
  exampleWithCache,
}
