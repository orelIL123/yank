import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Hebrew gematria: alef=1 through tav=400 (standard; final letters same value as regular)
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

// Fetch accurate zmanim from HebCal API
async function fetchZmanim(lat, lon) {
  try {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth() + 1
    const day = today.getDate()

    // HebCal API endpoint for accurate zmanim
    const url = `https://www.hebcal.com/zmanim?cfg=json&latitude=${lat}&longitude=${lon}&date=${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

    const response = await fetch(url)
    const data = await response.json()

    if (data && data.times) {
      return {
        sunrise: data.times.sunrise ? new Date(data.times.sunrise) : null,
        sunset: data.times.sunset ? new Date(data.times.sunset) : null,
        alotHaShachar: data.times.alotHaShachar ? new Date(data.times.alotHaShachar) : null,
        misheyakir: data.times.misheyakir ? new Date(data.times.misheyakir) : null,
        sofZmanShma: data.times.sofZmanShma ? new Date(data.times.sofZmanShma) : null,
        sofZmanTfilla: data.times.sofZmanTfilla ? new Date(data.times.sofZmanTfilla) : null,
        chatzot: data.times.chatzot ? new Date(data.times.chatzot) : null,
        minchaGedola: data.times.minchaGedola ? new Date(data.times.minchaGedola) : null,
        minchaKetana: data.times.minchaKetana ? new Date(data.times.minchaKetana) : null,
        plagHamincha: data.times.plagHamincha ? new Date(data.times.plagHamincha) : null,
        tzeit: data.times.tzeit ? new Date(data.times.tzeit) : null,
      }
    }

    return null
  } catch (error) {
    console.error('Error fetching zmanim:', error)
    return null
  }
}

const CITIES = [
  { name: 'ירושלים', lat: 31.7683, lon: 35.2137 },
  { name: 'תל אביב', lat: 32.0853, lon: 34.7818 },
  { name: 'חיפה', lat: 32.7940, lon: 34.9896 },
  { name: 'בני ברק', lat: 32.0840, lon: 34.8335 },
  { name: 'אשדוד', lat: 31.8044, lon: 34.6553 },
  { name: 'באר שבע', lat: 31.2530, lon: 34.7915 },
  { name: 'נתניה', lat: 32.3215, lon: 34.8532 },
  { name: 'ניו יורק', lat: 40.7128, lon: -74.0060 },
  { name: 'לונדון', lat: 51.5074, lon: -0.1278 },
  { name: 'פריז', lat: 48.8566, lon: 2.3522 },
  { name: 'מוסקבה', lat: 55.7558, lon: 37.6173 },
]

export default function ToolsScreen({ navigation }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gematriaInput, setGematriaInput] = useState('')
  const [gematriaResult, setGematriaResult] = useState(0)
  const [selectedCity, setSelectedCity] = useState(CITIES[0])
  const [zmanim, setZmanim] = useState(null)
  const [loadingZmanim, setLoadingZmanim] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setGematriaResult(gematriaSum(gematriaInput))
  }, [gematriaInput])

  // Load zmanim when city changes
  useEffect(() => {
    const loadZmanim = async () => {
      setLoadingZmanim(true)
      const data = await fetchZmanim(selectedCity.lat, selectedCity.lon)
      setZmanim(data)
      setLoadingZmanim(false)
    }
    loadZmanim()
  }, [selectedCity])

  const timeStr = currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = currentTime.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const formatTime = (date) => {
    if (!date) return '--:--'
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }

  const sunriseStr = zmanim?.sunrise ? formatTime(zmanim.sunrise) : '--:--'
  const sunsetStr = zmanim?.sunset ? formatTime(zmanim.sunset) : '--:--'
  const alotStr = zmanim?.alotHaShachar ? formatTime(zmanim.alotHaShachar) : '--:--'
  const sofZmanShmaStr = zmanim?.sofZmanShma ? formatTime(zmanim.sofZmanShma) : '--:--'
  const sofZmanTfillaStr = zmanim?.sofZmanTfilla ? formatTime(zmanim.sofZmanTfilla) : '--:--'
  const chatzotStr = zmanim?.chatzot ? formatTime(zmanim.chatzot) : '--:--'
  const tzeitStr = zmanim?.tzeit ? formatTime(zmanim.tzeit) : '--:--'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="כלי עזר"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Zmanim - Times of day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.sectionTitle}>זמני היום</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cityLabel}>בחר עיר:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cityPicker}>
              {CITIES.map((city) => (
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

            <Text style={styles.clockText}>{timeStr}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>

            {loadingZmanim ? (
              <View style={styles.loadingZmanim}>
                <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                <Text style={styles.loadingText}>טוען זמנים מדויקים...</Text>
              </View>
            ) : (
              <>
                <View style={styles.zmanimGrid}>
                  <View style={styles.zmanItem}>
                    <Ionicons name="sunny-outline" size={18} color={PRIMARY_BLUE} />
                    <Text style={styles.zmanLabel}>עלות השחר</Text>
                    <Text style={styles.zmanTime}>{alotStr}</Text>
                  </View>
                  <View style={styles.zmanItem}>
                    <Ionicons name="sunrise-outline" size={18} color={PRIMARY_BLUE} />
                    <Text style={styles.zmanLabel}>הנץ החמה</Text>
                    <Text style={styles.zmanTime}>{sunriseStr}</Text>
                  </View>
                  <View style={styles.zmanItem}>
                    <Ionicons name="book-outline" size={18} color={PRIMARY_BLUE} />
                    <Text style={styles.zmanLabel}>סוף זמן ק״ש</Text>
                    <Text style={styles.zmanTime}>{sofZmanShmaStr}</Text>
                  </View>
                  <View style={styles.zmanItem}>
                    <Ionicons name="time-outline" size={18} color={PRIMARY_BLUE} />
                    <Text style={styles.zmanLabel}>סוף זמן תפילה</Text>
                    <Text style={styles.zmanTime}>{sofZmanTfillaStr}</Text>
                  </View>
                  <View style={styles.zmanItem}>
                    <Ionicons name="sunny" size={18} color={PRIMARY_BLUE} />
                    <Text style={styles.zmanLabel}>חצות היום</Text>
                    <Text style={styles.zmanTime}>{chatzotStr}</Text>
                  </View>
                  <View style={styles.zmanItem}>
                    <Ionicons name="partly-sunny-outline" size={18} color={PRIMARY_BLUE} />
                    <Text style={styles.zmanLabel}>שקיעה</Text>
                    <Text style={styles.zmanTime}>{sunsetStr}</Text>
                  </View>
                  <View style={styles.zmanItem}>
                    <Ionicons name="moon-outline" size={18} color={PRIMARY_BLUE} />
                    <Text style={styles.zmanLabel}>צאת הכוכבים</Text>
                    <Text style={styles.zmanTime}>{tzeitStr}</Text>
                  </View>
                </View>
                <Text style={styles.disclaimer}>זמנים מדויקים מ-HebCal API לפי מיקום {selectedCity.name}</Text>
              </>
            )}
          </View>
        </View>

        {/* Gematria */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
  },
  cityLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  cityPicker: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cityChipActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  cityChipText: {
    fontSize: 12,
    fontFamily: 'Heebo_500Medium',
    color: '#64748b',
  },
  cityChipTextActive: {
    color: '#fff',
  },
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
  clockText: {
    fontSize: 36,
    fontFamily: 'Heebo_700Bold',
    color: PRIMARY_BLUE,
    textAlign: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  loadingZmanim: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
  },
  zmanimGrid: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.06)',
    gap: 12,
  },
  zmanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  zmanLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Heebo_500Medium',
    color: '#6b7280',
    textAlign: 'right',
  },
  zmanTime: {
    fontSize: 16,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    minWidth: 60,
    textAlign: 'left',
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
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
  resultLabel: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  resultValue: {
    fontSize: 24,
    fontFamily: 'Heebo_700Bold',
    color: PRIMARY_BLUE,
  },
})
