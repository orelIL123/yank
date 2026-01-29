import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
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

// Simple sunrise/sunset for a given date at Israel (approx Tel Aviv: 32.08, 34.78)
// Based on NOAA algorithm - pure JS, no API
function getSunTimes(lat, lon, date) {
  const d = new Date(date)
  const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
  const lngHour = lon / 15
  const tRise = n + (6 - lngHour) / 24
  const tSet = n + (18 - lngHour) / 24
  // Simplified: approximate sunrise/sunset in UTC, then we show in local
  const rise = new Date(d)
  rise.setUTCHours(0, 0, 0, 0)
  rise.setUTCMinutes(Math.floor((tRise % 1) * 60))
  rise.setUTCHours(Math.floor(tRise) + 3) // approx Israel UTC+3
  const set = new Date(d)
  set.setUTCHours(0, 0, 0, 0)
  set.setUTCMinutes(Math.floor((tSet % 1) * 60))
  set.setUTCHours(Math.floor(tSet) + 3)
  return { sunrise: rise, sunset: set }
}

const ISRAEL_LAT = 32.08
const ISRAEL_LON = 34.78

export default function ToolsScreen({ navigation }) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gematriaInput, setGematriaInput] = useState('')
  const [gematriaResult, setGematriaResult] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setGematriaResult(gematriaSum(gematriaInput))
  }, [gematriaInput])

  const sunTimes = getSunTimes(ISRAEL_LAT, ISRAEL_LON, currentTime)
  const timeStr = currentTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const dateStr = currentTime.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const sunriseStr = sunTimes.sunrise.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const sunsetStr = sunTimes.sunset.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="כלי עזר"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Zmanim - Times of day */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.sectionTitle}>זמני היום</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.clockText}>{timeStr}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
            <View style={styles.sunRow}>
              <View style={styles.sunItem}>
                <Ionicons name="sunny-outline" size={20} color={PRIMARY_BLUE} />
                <Text style={styles.sunLabel}>הנץ החמה (קרוב)</Text>
                <Text style={styles.sunTime}>{sunriseStr}</Text>
              </View>
              <View style={styles.sunItem}>
                <Ionicons name="moon-outline" size={20} color={PRIMARY_BLUE} />
                <Text style={styles.sunLabel}>שקיעה (קרוב)</Text>
                <Text style={styles.sunTime}>{sunsetStr}</Text>
              </View>
            </View>
            <Text style={styles.disclaimer}>זמנים משוערים לאזור ישראל. לזמנים מדויקים לפי מיקום השתמשו באפליקציה ייעודית.</Text>
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
  sunRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.06)',
  },
  sunItem: {
    alignItems: 'center',
    gap: 4,
  },
  sunLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  sunTime: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
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
