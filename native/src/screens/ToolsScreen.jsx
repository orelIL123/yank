import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import db from '../services/database'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const { width: SCREEN_WIDTH } = Dimensions.get('window')

// ─── Gematria ────────────────────────────────────────────────────────────────
const GEMATRIA_MAP = {
  '\u05D0': 1, '\u05D1': 2, '\u05D2': 3, '\u05D3': 4, '\u05D4': 5, '\u05D5': 6, '\u05D6': 7,
  '\u05D7': 8, '\u05D8': 9, '\u05D9': 10, '\u05DA': 20, '\u05DB': 20, '\u05DC': 30, '\u05DD': 40,
  '\u05DE': 40, '\u05DF': 50, '\u05E0': 50, '\u05E1': 60, '\u05E2': 70, '\u05E3': 80, '\u05E4': 80,
  '\u05E5': 90, '\u05E6': 90, '\u05E7': 100, '\u05E8': 200, '\u05E9': 300, '\u05EA': 400,
}
function gematriaSum(str) {
  if (!str || typeof str !== 'string') return 0
  let sum = 0
  for (let i = 0; i < str.length; i++) {
    const v = GEMATRIA_MAP[str[i]]
    if (v !== undefined) sum += v
  }
  return sum
}

// ─── Zmanim fetch ────────────────────────────────────────────────────────────
async function fetchZmanim(lat, lon) {
  try {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const url = `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${y}-${m}-${d}`
    const res = await fetch(url)
    const data = await res.json()
    if (!data?.times) return null
    const t = data.times
    const p = (k) => (t[k] ? new Date(t[k]) : null)
    return {
      alotHaShachar: p('alotHaShachar'), misheyakir: p('misheyakir'), sunrise: p('sunrise'),
      sofZmanShma: p('sofZmanShma'), sofZmanShmaMGA: p('sofZmanShmaMGA'),
      sofZmanTfilla: p('sofZmanTfilla'), sofZmanTfillaMGA: p('sofZmanTfillaMGA'),
      chatzot: p('chatzot'), minchaGedola: p('minchaGedola'), minchaKetana: p('minchaKetana'),
      plagHaMincha: p('plagHamincha'), sunset: p('sunset'),
      tzeit7083deg: p('tzeit7083deg'), tzeit85deg: p('tzeit85deg'), tzeit: p('tzeit'),
      chatzotNight: p('chatzotNight'),
    }
  } catch (e) {
    console.error('Error fetching zmanim:', e)
    return null
  }
}

// ─── HebCal calendar fetch (parsha, shabbat times, omer, holidays) ──────────
async function fetchCalendarData(lat, lon, isJerusalem) {
  try {
    const candles = isJerusalem ? 40 : 18
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&year=now&month=now&ss=on&mf=on&c=on&latitude=${lat}&longitude=${lon}&b=${candles}&M=on&s=on`
    const res = await fetch(url)
    const data = await res.json()
    if (!data?.items) return null
    return data.items
  } catch (e) {
    console.error('Error fetching calendar:', e)
    return null
  }
}

// ─── Cities ──────────────────────────────────────────────────────────────────
const CITY_GROUPS = [
  {
    region: 'ארץ ישראל',
    cities: [
      { name: 'ירושלים', lat: 31.7683, lon: 35.2137, jerusalem: true },
      { name: 'תל אביב', lat: 32.0853, lon: 34.7818 },
      { name: 'חיפה', lat: 32.7940, lon: 34.9896 },
      { name: 'בני ברק', lat: 32.0840, lon: 34.8335 },
      { name: 'אשדוד', lat: 31.8044, lon: 34.6553 },
      { name: 'באר שבע', lat: 31.2530, lon: 34.7915 },
      { name: 'נתניה', lat: 32.3215, lon: 34.8532 },
      { name: 'צפת', lat: 32.9646, lon: 35.4960 },
      { name: 'טבריה', lat: 32.7922, lon: 35.5312 },
      { name: 'פתח תקוה', lat: 32.0841, lon: 34.8878 },
      { name: 'אילת', lat: 29.5577, lon: 34.9519 },
    ],
  },
  {
    region: 'צפון אמריקה',
    cities: [
      { name: 'ניו יורק', lat: 40.7128, lon: -74.0060 },
      { name: 'לוס אנג׳לס', lat: 34.0522, lon: -118.2437 },
      { name: 'מיאמי', lat: 25.7617, lon: -80.1918 },
      { name: 'שיקגו', lat: 41.8781, lon: -87.6298 },
      { name: 'טורונטו', lat: 43.6532, lon: -79.3832 },
      { name: 'מונטריאול', lat: 45.5017, lon: -73.5673 },
      { name: 'מקסיקו סיטי', lat: 19.4326, lon: -99.1332 },
    ],
  },
  {
    region: 'דרום אמריקה',
    cities: [
      { name: 'בואנוס איירס', lat: -34.6037, lon: -58.3816 },
      { name: 'סאו פאולו', lat: -23.5505, lon: -46.6333 },
    ],
  },
  {
    region: 'אירופה',
    cities: [
      { name: 'לונדון', lat: 51.5074, lon: -0.1278 },
      { name: 'פריז', lat: 48.8566, lon: 2.3522 },
      { name: 'ברלין', lat: 52.5200, lon: 13.4050 },
      { name: 'מרסיי', lat: 43.2965, lon: 5.3698 },
      { name: 'אנטוורפן', lat: 51.2194, lon: 4.4025 },
      { name: 'אמסטרדם', lat: 52.3676, lon: 4.9041 },
      { name: 'רומא', lat: 41.9028, lon: 12.4964 },
      { name: 'מוסקבה', lat: 55.7558, lon: 37.6173 },
      { name: 'מנצ׳סטר', lat: 53.4808, lon: -2.2426 },
      { name: 'ז׳נבה', lat: 46.2044, lon: 6.1432 },
    ],
  },
  {
    region: 'אוסטרליה ואסיה',
    cities: [
      { name: 'מלבורן', lat: -37.8136, lon: 144.9631 },
      { name: 'סידני', lat: -33.8688, lon: 151.2093 },
      { name: 'בנגקוק', lat: 13.7563, lon: 100.5018 },
      { name: 'מומבאי', lat: 19.0760, lon: 72.8777 },
    ],
  },
  {
    region: 'אפריקה',
    cities: [
      { name: 'יוהנסבורג', lat: -26.2041, lon: 28.0473 },
      { name: 'קזבלנקה', lat: 33.5731, lon: -7.5898 },
    ],
  },
]

// ─── Zmanim display definitions ─────────────────────────────────────────────
const ZMANIM_LIST = [
  { key: 'alotHaShachar', label: 'עלות השחר', icon: 'moon-outline', color: '#6366f1' },
  { key: 'misheyakir', label: 'משיכיר', icon: 'cloudy-night-outline', color: '#818cf8' },
  { key: 'sunrise', label: 'הנץ החמה', icon: 'sunny-outline', color: '#f59e0b' },
  { key: 'sofZmanShma', label: 'סוף זמן ק״ש (גר״א)', icon: 'book-outline', color: '#10b981' },
  { key: 'sofZmanShmaMGA', label: 'סוף זמן ק״ש (מג״א)', icon: 'book-outline', color: '#059669' },
  { key: 'sofZmanTfilla', label: 'סוף זמן תפילה (גר״א)', icon: 'time-outline', color: '#3b82f6' },
  { key: 'sofZmanTfillaMGA', label: 'סוף זמן תפילה (מג״א)', icon: 'time-outline', color: '#2563eb' },
  { key: 'chatzot', label: 'חצות היום', icon: 'sunny', color: '#eab308' },
  { key: 'minchaGedola', label: 'מנחה גדולה', icon: 'partly-sunny-outline', color: '#f97316' },
  { key: 'minchaKetana', label: 'מנחה קטנה', icon: 'partly-sunny-outline', color: '#ea580c' },
  { key: 'plagHaMincha', label: 'פלג המנחה', icon: 'cloudy-outline', color: '#d946ef' },
  { key: 'sunset', label: 'שקיעת החמה', icon: 'sunset-outline', color: '#ef4444' },
  { key: 'tzeit7083deg', label: 'צאת הכוכבים (3 כוכבים)', icon: 'star-outline', color: '#8b5cf6' },
  { key: 'tzeit', label: 'צאת הכוכבים (ר״ת)', icon: 'moon-outline', color: '#6d28d9' },
  { key: 'chatzotNight', label: 'חצות הלילה', icon: 'moon', color: '#312e81' },
]

function getNextZmanKey(zmanim) {
  if (!zmanim) return null
  const now = new Date()
  let closest = null, closestDiff = Infinity
  for (const z of ZMANIM_LIST) {
    const time = zmanim[z.key]
    if (time && time > now) {
      const diff = time - now
      if (diff < closestDiff) { closestDiff = diff; closest = z.key }
    }
  }
  return closest
}

// ─── Omer text helper ────────────────────────────────────────────────────────
const OMER_UNITS = ['', 'אחד', 'שני', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה', 'שמונה', 'תשעה', 'עשרה',
  'אחד עשר', 'שנים עשר', 'שלושה עשר', 'ארבעה עשר', 'חמישה עשר', 'שישה עשר', 'שבעה עשר', 'שמונה עשר', 'תשעה עשר',
  'עשרים', 'עשרים ואחד', 'עשרים ושניים', 'עשרים ושלושה', 'עשרים וארבעה', 'עשרים וחמישה', 'עשרים ושישה',
  'עשרים ושבעה', 'עשרים ושמונה', 'עשרים ותשעה', 'שלושים', 'שלושים ואחד', 'שלושים ושניים', 'שלושים ושלושה',
  'שלושים וארבעה', 'שלושים וחמישה', 'שלושים ושישה', 'שלושים ושבעה', 'שלושים ושמונה', 'שלושים ותשעה',
  'ארבעים', 'ארבעים ואחד', 'ארבעים ושניים', 'ארבעים ושלושה', 'ארבעים וארבעה', 'ארבעים וחמישה',
  'ארבעים ושישה', 'ארבעים ושבעה', 'ארבעים ושמונה', 'ארבעים ותשעה']

function getOmerText(dayNum) {
  if (dayNum < 1 || dayNum > 49) return ''
  const weeks = Math.floor(dayNum / 7)
  const days = dayNum % 7
  const dayWord = dayNum === 1 ? 'יום' : 'ימים'
  let base = `היום ${OMER_UNITS[dayNum]} ${dayWord} לעומר`
  if (weeks > 0) {
    const weekWord = weeks === 1 ? 'שבוע אחד' : `${OMER_UNITS[weeks]} שבועות`
    if (days === 0) {
      base += `, שהם ${weekWord}`
    } else {
      const extraDayWord = days === 1 ? 'יום אחד' : `${OMER_UNITS[days]} ימים`
      base += `, שהם ${weekWord} ו${extraDayWord}`
    }
  }
  return base
}

// ─── Sefirot of the Omer ─────────────────────────────────────────────────────
const SEFIROT = ['חסד', 'גבורה', 'תפארת', 'נצח', 'הוד', 'יסוד', 'מלכות']
function getOmerSefira(dayNum) {
  if (dayNum < 1 || dayNum > 49) return ''
  const inner = SEFIROT[(dayNum - 1) % 7]
  const outer = SEFIROT[Math.floor((dayNum - 1) / 7)]
  return `${inner} שב${outer}`
}

// ─── Hebrew date formatting with Hebrew letters ─────────────────────────────
const HEBREW_NUMERALS = {
  1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳',
  10: 'י׳', 11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו', 16: 'ט״ז',
  17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳', 21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג',
  24: 'כ״ד', 25: 'כ״ה', 26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳',
}

// Convert Hebrew year number (e.g. 5786) to Hebrew letters (e.g. התשפ״ו)
function hebrewYearToLetters(year) {
  // Remove the thousands (ה)
  const remainder = year % 1000
  const hundreds = Math.floor(remainder / 100)
  const tens = Math.floor((remainder % 100) / 10)
  const ones = remainder % 10

  const hundredsLetters = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק']
  const tensLetters = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ']
  const onesLetters = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט']

  // Special cases for 15 and 16
  let result = 'ה' + hundredsLetters[hundreds]
  if (tens === 1 && ones === 5) {
    result += 'ט״ו'
  } else if (tens === 1 && ones === 6) {
    result += 'ט״ז'
  } else {
    const t = tensLetters[tens]
    const o = onesLetters[ones]
    if (t && o) {
      result += t + '״' + o
    } else if (t) {
      result += t + '׳'
    } else if (o) {
      result += '״' + o
    }
  }
  return result
}

function getHebrewDateFormatted() {
  try {
    const now = new Date()
    // Get Hebrew day
    const dayFormatter = new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric' })
    const dayNum = parseInt(dayFormatter.format(now), 10)
    
    // Get Hebrew month name
    const monthFormatter = new Intl.DateTimeFormat('he-u-ca-hebrew', { month: 'long' })
    const monthName = monthFormatter.format(now)
    
    // Get Hebrew year
    const yearFormatter = new Intl.DateTimeFormat('en-u-ca-hebrew', { year: 'numeric' })
    const yearStr = yearFormatter.format(now)
    // yearStr is like "5786 AM" or just "5786"
    const yearNum = parseInt(yearStr.replace(/\D/g, ''), 10)

    const dayHeb = HEBREW_NUMERALS[dayNum] || String(dayNum)
    const yearHeb = hebrewYearToLetters(yearNum)
    
    return `${dayHeb} ${monthName} ${yearHeb}`
  } catch {
    return ''
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function ToolsScreen({ navigation }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gematriaInput, setGematriaInput] = useState('')
  const [gematriaResult, setGematriaResult] = useState(0)
  const [selectedCity, setSelectedCity] = useState(CITY_GROUPS[0].cities[0])
  const [selectedRegion, setSelectedRegion] = useState(CITY_GROUPS[0].region)
  const [zmanim, setZmanim] = useState(null)
  const [loadingZmanim, setLoadingZmanim] = useState(true)

  // Calendar data
  const [calendarItems, setCalendarItems] = useState(null)
  const [loadingCalendar, setLoadingCalendar] = useState(true)
  // Manual parasha override (admin sets in app_config)
  const [parashaOverride, setParashaOverride] = useState(null)

  // Clock tick
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Gematria
  useEffect(() => { setGematriaResult(gematriaSum(gematriaInput)) }, [gematriaInput])

  // Zmanim
  useEffect(() => {
    const load = async () => {
      setLoadingZmanim(true)
      const data = await fetchZmanim(selectedCity.lat, selectedCity.lon)
      setZmanim(data)
      setLoadingZmanim(false)
    }
    load()
  }, [selectedCity])

  // Calendar (parsha, shabbat, omer)
  useEffect(() => {
    const load = async () => {
      setLoadingCalendar(true)
      const items = await fetchCalendarData(selectedCity.lat, selectedCity.lon, !!selectedCity.jerusalem)
      setCalendarItems(items)
      setLoadingCalendar(false)
    }
    load()
  }, [selectedCity])

  // Load parasha override from app_config
  useEffect(() => {
    const load = async () => {
      try {
        const config = await db.getAppConfig()
        setParashaOverride(config?.parasha_override_he || null)
      } catch (_) {}
    }
    load()
  }, [])

  // ─── Derived data ────────────────────────────────────────────────
  const timeStr = currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = currentTime.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hebrewDateStr = getHebrewDateFormatted()

  const formatTime = (date) => {
    if (!date) return '--:--'
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }
  const formatTimeFromStr = (isoStr) => {
    if (!isoStr) return '--:--'
    try {
      return new Date(isoStr).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    } catch { return '--:--' }
  }

  const nextZmanKey = getNextZmanKey(zmanim)
  const regionCities = CITY_GROUPS.find(g => g.region === selectedRegion)?.cities || []

  // ─── Extract parsha, shabbat times, omer from calendar ────────────
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 5=Fri, 6=Sat

  // Parashat HaShavua – manual override (admin) or from HebCal
  let parashaName = null
  let parashaHebrew = null
  if (parashaOverride && parashaOverride.trim()) {
    parashaHebrew = parashaOverride.trim()
    parashaName = parashaOverride.trim()
  } else if (calendarItems) {
    const parashaItem = calendarItems.find(item => item.category === 'parashat')
    if (parashaItem) {
      parashaName = parashaItem.title
      parashaHebrew = parashaItem.hebrew
    }
  }

  // Shabbat times (only show from Wed=3 through Shabbat=6)
  let candleLighting = null
  let havdalah = null
  const showShabbatTimes = dayOfWeek >= 3 || dayOfWeek === 0 // Wed-Sat (and show havdalah on motzei shabbat = Sat night which is still day 6)
  // Actually: show from Wednesday (3) through Saturday (6)
  const showShabbat = dayOfWeek >= 3
  if (showShabbat && calendarItems) {
    const candleItem = calendarItems.find(item => item.category === 'candles')
    const havdalahItem = calendarItems.find(item => item.category === 'havdalah')
    if (candleItem) candleLighting = candleItem.date
    if (havdalahItem) havdalah = havdalahItem.date
  }

  // Omer count – look for "Counting of the Omer" in items
  let omerDay = null
  if (calendarItems) {
    const omerItem = calendarItems.find(item =>
      item.category === 'omer' ||
      (item.title && item.title.includes('Omer')) ||
      (item.hebrew && item.hebrew.includes('עומר'))
    )
    if (omerItem) {
      // Extract day number from title like "18th day of the Omer"
      const match = omerItem.title?.match(/(\d+)/)
      if (match) omerDay = parseInt(match[1], 10)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <AppHeader title="כלי עזר" showBackButton onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >

        {/* ══════ Siddur (סידור) ══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.sectionTitle}>סידור תפילה</Text>
          </View>
          <Pressable
            style={styles.siddurCard}
            onPress={() => navigation.navigate('Siddur')}
          >
            <LinearGradient
              colors={[PRIMARY_BLUE, '#1e40af']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.siddurCardGradient}
            >
              <Ionicons name="book" size={36} color="rgba(255,255,255,0.9)" />
              <View style={styles.siddurCardText}>
                <Text style={styles.siddurCardTitle}>סידור תפילה</Text>
                <Text style={styles.siddurCardSubtitle}>Sefaria – שחרית, מנחה, ערבית ועוד</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#fff" />
            </LinearGradient>
          </Pressable>
        </View>

        {/* ══════ Parashat HaShavua ══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="book-outline" size={24} color="#7c3aed" />
            <Text style={styles.sectionTitle}>פרשת השבוע</Text>
          </View>
          <LinearGradient
            colors={['#7c3aed', '#6d28d9', '#5b21b6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.parshaCard}
          >
            {loadingCalendar ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : parashaHebrew ? (
              <>
                <Ionicons name="library" size={32} color="rgba(255,255,255,0.3)" style={styles.parshaIcon} />
                <Text style={styles.parshaTitle}>{parashaHebrew}</Text>
                <Text style={styles.parshaSubtitle}>{parashaName}</Text>
              </>
            ) : (
              <Text style={styles.parshaTitle}>לא נמצאה פרשה</Text>
            )}
          </LinearGradient>
        </View>

        {/* ══════ Shabbat Times (Wed-Sat only) ══════ */}
        {showShabbat && (candleLighting || havdalah) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flame-outline" size={24} color="#f59e0b" />
              <Text style={styles.sectionTitle}>זמני שבת - {selectedCity.name}</Text>
            </View>
            <View style={styles.shabbatCard}>
              {candleLighting && (
                <View style={styles.shabbatRow}>
                  <View style={[styles.shabbatIconBg, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
                    <Ionicons name="flame" size={22} color="#f59e0b" />
                  </View>
                  <View style={styles.shabbatTextCol}>
                    <Text style={styles.shabbatLabel}>הדלקת נרות</Text>
                    <Text style={styles.shabbatNote}>יום שישי</Text>
                  </View>
                  <Text style={styles.shabbatTime}>{formatTimeFromStr(candleLighting)}</Text>
                </View>
              )}
              {candleLighting && havdalah && <View style={styles.shabbatDivider} />}
              {havdalah && (
                <View style={styles.shabbatRow}>
                  <View style={[styles.shabbatIconBg, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
                    <Ionicons name="star" size={22} color="#8b5cf6" />
                  </View>
                  <View style={styles.shabbatTextCol}>
                    <Text style={styles.shabbatLabel}>הבדלה</Text>
                    <Text style={styles.shabbatNote}>מוצאי שבת</Text>
                  </View>
                  <Text style={styles.shabbatTime}>{formatTimeFromStr(havdalah)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══════ Sefirat HaOmer (only during Omer period) ══════ */}
        {omerDay && omerDay >= 1 && omerDay <= 49 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="analytics-outline" size={24} color="#eab308" />
              <Text style={styles.sectionTitle}>ספירת העומר</Text>
            </View>
            <LinearGradient
              colors={['#fbbf24', '#f59e0b', '#d97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.omerCard}
            >
              <View style={styles.omerDayCircle}>
                <Text style={styles.omerDayNumber}>{omerDay}</Text>
              </View>
              <Text style={styles.omerText}>{getOmerText(omerDay)}</Text>
              <View style={styles.omerSefiraContainer}>
                <Text style={styles.omerSefiraLabel}>ספירה:</Text>
                <Text style={styles.omerSefira}>{getOmerSefira(omerDay)}</Text>
              </View>
              {/* Progress bar */}
              <View style={styles.omerProgressBg}>
                <View style={[styles.omerProgressFill, { width: `${(omerDay / 49) * 100}%` }]} />
              </View>
              <Text style={styles.omerProgressText}>{omerDay} מתוך 49 ימים</Text>
            </LinearGradient>
          </View>
        )}

        {/* ══════ Zmanim ══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.sectionTitle}>זמני היום</Text>
          </View>
          <View style={styles.card}>
            {/* Clock */}
            <View style={styles.clockContainer}>
              <Text style={styles.clockText}>{timeStr}</Text>
              <Text style={styles.dateText}>{dateStr}</Text>
              {hebrewDateStr ? <Text style={styles.hebrewDateText}>{hebrewDateStr}</Text> : null}
            </View>

            {/* Region Tabs */}
            <Text style={styles.cityLabel}>בחר אזור:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionPicker}>
              {CITY_GROUPS.map((group) => (
                <Pressable
                  key={group.region}
                  style={[styles.regionChip, selectedRegion === group.region && styles.regionChipActive]}
                  onPress={() => { setSelectedRegion(group.region); setSelectedCity(group.cities[0]) }}
                >
                  <Text style={[styles.regionChipText, selectedRegion === group.region && styles.regionChipTextActive]}>
                    {group.region}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* City Chips */}
            <Text style={styles.cityLabel}>בחר עיר:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityPicker}>
              {regionCities.map((city) => (
                <Pressable
                  key={city.name}
                  style={[styles.cityChip, selectedCity.name === city.name && styles.cityChipActive]}
                  onPress={() => setSelectedCity(city)}
                >
                  <Text style={[styles.cityChipText, selectedCity.name === city.name && styles.cityChipTextActive]}>
                    {city.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Zmanim List */}
            {loadingZmanim ? (
              <View style={styles.loadingZmanim}>
                <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                <Text style={styles.loadingText}>טוען זמנים מדויקים...</Text>
              </View>
            ) : (
              <>
                <View style={styles.zmanimGrid}>
                  {ZMANIM_LIST.map((z) => {
                    const time = zmanim?.[z.key]
                    if (!time) return null
                    const isNext = z.key === nextZmanKey
                    return (
                      <View key={z.key} style={[styles.zmanItem, isNext && styles.zmanItemNext]}>
                        <View style={[styles.zmanIconContainer, { backgroundColor: `${z.color}18` }]}>
                          <Ionicons name={z.icon} size={18} color={z.color} />
                        </View>
                        <Text style={[styles.zmanLabel, isNext && styles.zmanLabelNext]}>{z.label}</Text>
                        {isNext && (
                          <View style={styles.nextBadge}><Text style={styles.nextBadgeText}>הבא</Text></View>
                        )}
                        <Text style={[styles.zmanTime, isNext && styles.zmanTimeNext]}>{formatTime(time)}</Text>
                      </View>
                    )
                  })}
                </View>
                <Text style={styles.disclaimer}>
                  זמנים הלכתיים מדויקים לפי מיקום {selectedCity.name} | מקור: HebCal API
                </Text>
              </>
            )}
          </View>
        </View>

        {/* ══════ Gematria ══════ */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.sectionTitle}>גימטריה</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.label}>הקלידו טקסט בעברית</Text>
            <TextInput
              style={styles.input}
              value={gematriaInput}
              onChangeText={setGematriaInput}
              placeholder="אותיות עבריות..."
              placeholderTextColor="#9ca3af"
              multiline
              textAlign="right"
            />
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>סיכום גימטריה:</Text>
              <Text style={styles.resultValue}>{gematriaResult}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Styles
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Section
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: 'Heebo_700Bold', color: DEEP_BLUE },

  // ─── Siddur ───────────────────────────────────────
  siddurCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  siddurCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  siddurCardText: { flex: 1 },
  siddurCardTitle: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
    textAlign: 'right',
  },
  siddurCardSubtitle: {
    fontSize: 13,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'right',
    marginTop: 4,
  },

  // ─── Parsha ────────────────────────────────────────
  parshaCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    overflow: 'hidden',
  },
  parshaIcon: { position: 'absolute', right: 16, top: 16 },
  parshaTitle: {
    fontSize: 28,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  parshaSubtitle: {
    fontSize: 15,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 6,
  },

  // ─── Shabbat ───────────────────────────────────────
  shabbatCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  shabbatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  shabbatIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shabbatTextCol: { flex: 1 },
  shabbatLabel: {
    fontSize: 16,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  shabbatNote: {
    fontSize: 12,
    fontFamily: 'Heebo_400Regular',
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 2,
  },
  shabbatTime: {
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    color: PRIMARY_BLUE,
  },
  shabbatDivider: {
    height: 1,
    backgroundColor: 'rgba(11,27,58,0.06)',
    marginVertical: 14,
  },

  // ─── Omer ──────────────────────────────────────────
  omerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  omerDayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  omerDayNumber: {
    fontSize: 32,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
  },
  omerText: {
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 10,
  },
  omerSefiraContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  omerSefiraLabel: {
    fontSize: 13,
    fontFamily: 'Heebo_500Medium',
    color: 'rgba(255,255,255,0.8)',
  },
  omerSefira: {
    fontSize: 14,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
  },
  omerProgressBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  omerProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  omerProgressText: {
    fontSize: 12,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
  },

  // ─── Clock ─────────────────────────────────────────
  clockContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.06)',
  },
  clockText: {
    fontSize: 40,
    fontFamily: 'Heebo_700Bold',
    color: PRIMARY_BLUE,
    textAlign: 'center',
    letterSpacing: 2,
  },
  dateText: {
    fontSize: 15,
    fontFamily: 'Heebo_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
  },
  hebrewDateText: {
    fontSize: 14,
    fontFamily: 'Heebo_500Medium',
    color: PRIMARY_BLUE,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.8,
  },

  // ─── City / Region pickers ─────────────────────────
  cityLabel: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  regionPicker: { flexDirection: 'row', marginBottom: 14 },
  regionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  regionChipActive: { backgroundColor: DEEP_BLUE, borderColor: DEEP_BLUE },
  regionChipText: { fontSize: 13, fontFamily: 'Heebo_600SemiBold', color: '#475569' },
  regionChipTextActive: { color: '#fff' },
  cityPicker: { flexDirection: 'row', marginBottom: 16 },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityChipActive: { backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE },
  cityChipText: { fontSize: 12, fontFamily: 'Heebo_500Medium', color: '#64748b' },
  cityChipTextActive: { color: '#fff' },

  // ─── Card ──────────────────────────────────────────
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  // ─── Zmanim ────────────────────────────────────────
  loadingZmanim: { paddingVertical: 40, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: 'Heebo_400Regular', color: '#6b7280' },
  zmanimGrid: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.06)',
    gap: 4,
  },
  zmanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  zmanItemNext: {
    backgroundColor: 'rgba(30,58,138,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.15)',
  },
  zmanIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zmanLabel: { flex: 1, fontSize: 14, fontFamily: 'Heebo_500Medium', color: '#4b5563', textAlign: 'right' },
  zmanLabelNext: { color: PRIMARY_BLUE, fontFamily: 'Heebo_700Bold' },
  nextBadge: { backgroundColor: PRIMARY_BLUE, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  nextBadgeText: { fontSize: 10, fontFamily: 'Heebo_700Bold', color: '#fff' },
  zmanTime: { fontSize: 16, fontFamily: 'Heebo_700Bold', color: DEEP_BLUE, minWidth: 55, textAlign: 'left' },
  zmanTimeNext: { color: PRIMARY_BLUE, fontSize: 17 },
  disclaimer: { fontSize: 11, fontFamily: 'Heebo_400Regular', color: '#9ca3af', textAlign: 'center', marginTop: 14, lineHeight: 18 },

  // ─── Gematria ──────────────────────────────────────
  label: { fontSize: 14, fontFamily: 'Heebo_600SemiBold', color: DEEP_BLUE, marginBottom: 8, textAlign: 'right' },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.2)',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    backgroundColor: '#f9fafb',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.08)',
  },
  resultLabel: { fontSize: 15, fontFamily: 'Heebo_600SemiBold', color: DEEP_BLUE },
  resultValue: { fontSize: 24, fontFamily: 'Heebo_700Bold', color: PRIMARY_BLUE },
})
