import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Modal, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'
import db from '../services/database'
import { auth } from '../config/firebase'
import { tehillimData, tehillimDays } from '../data/tehillim'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Hebrew year number to letters (e.g. 5786 -> תשפ"ו)
function yearToHebrew(yearNum) {
  const y = parseInt(yearNum, 10)
  if (!y || y < 5000) return String(yearNum)
  let n = y - 5000 // 5786 -> 786
  const values = [
    [400, 'ת'], [300, 'ש'], [200, 'ר'], [100, 'ק'], [90, 'צ'], [80, 'פ'], [70, 'ע'], [60, 'ס'], [50, 'נ'],
    [40, 'מ'], [30, 'ל'], [20, 'כ'], [10, 'י'], [9, 'ט'], [8, 'ח'], [7, 'ז'], [6, 'ו'], [5, 'ה'], [4, 'ד'], [3, 'ג'], [2, 'ב'], [1, 'א']
  ]
  let s = ''
  for (const [val, letter] of values) {
    while (n >= val) {
      s += letter
      n -= val
    }
  }
  if (s.length > 1) {
    s = s.slice(0, -1) + '"' + s.slice(-1)
  }
  return s || 'א'
}

function getHebrewDay(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    calendar: 'hebrew'
  })
  const dayText = formatter.format(date)
  let day = parseInt(String(dayText).replace(/\D/g, ''), 10) || 1
  if (day < 1) day = 1
  if (day > 30) day = 30
  return day
}

// Get Hebrew date: day of month (1–30) and formatted string with year in Hebrew letters
function getHebrewDateInfo() {
  const date = new Date()
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    calendar: 'hebrew'
  }
  const formatter = new Intl.DateTimeFormat('he-IL', options)
  const parts = formatter.formatToParts(date)
  
  const dayPart = parts.find(p => p.type === 'day')?.value
  const monthPart = parts.find(p => p.type === 'month')?.value
  const yearPart = parts.find(p => p.type === 'year')?.value
  
  let day = parseInt(String(dayPart).replace(/\D/g, ''), 10) || 1
  if (day < 1) day = 1
  if (day > 30) day = 30
  
  const yearHebrew = yearPart ? yearToHebrew(yearPart) : ''
  const fullDate = [day, monthPart, yearHebrew].filter(Boolean).join(' ')

  // Detect if current Hebrew month has 29 days (only relevant near month end).
  const tomorrow = new Date(date)
  tomorrow.setDate(date.getDate() + 1)
  const tomorrowHebrewDay = getHebrewDay(tomorrow)
  const monthLength = day === 29 && tomorrowHebrewDay === 1 ? 29 : 30
  
  return { day, fullDate, monthLength }
}

// Convert number to Hebrew letters (e.g., 6 -> ו׳, 118 -> קי״ח)
function numberToHebrew(num) {
  if (num < 1 || num > 150) return String(num)
  
  const hebrewLetters = [
    '', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', // 0-9
    'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', // 10-19
    'כ', 'כא', 'כב', 'כג', 'כד', 'כה', 'כו', 'כז', 'כח', 'כט', // 20-29
    'ל', 'לא', 'לב', 'לג', 'לד', 'לה', 'לו', 'לז', 'לח', 'לט', // 30-39
    'מ', 'מא', 'מב', 'מג', 'מד', 'מה', 'מו', 'מז', 'מח', 'מט', // 40-49
    'נ', 'נא', 'נב', 'נג', 'נד', 'נה', 'נו', 'נז', 'נח', 'נט', // 50-59
    'ס', 'סא', 'סב', 'סג', 'סד', 'סה', 'סו', 'סז', 'סח', 'סט', // 60-69
    'ע', 'עא', 'עב', 'עג', 'עד', 'עה', 'עו', 'עז', 'עח', 'עט', // 70-79
    'פ', 'פא', 'פב', 'פג', 'פד', 'פה', 'פו', 'פז', 'פח', 'פט', // 80-89
    'צ', 'צא', 'צב', 'צג', 'צד', 'צה', 'צו', 'צז', 'צח', 'צט', // 90-99
    'ק', 'קא', 'קב', 'קג', 'קד', 'קה', 'קו', 'קז', 'קח', 'קט', // 100-109
    'קי', 'קיא', 'קיב', 'קיג', 'קיד', 'קטו', 'קטז', 'קיז', 'קיח', 'קיט', // 110-119
    'קכ', 'קכא', 'קכב', 'קכג', 'קכד', 'קכה', 'קכו', 'קכז', 'קכח', 'קכט', // 120-129
    'קל', 'קלא', 'קלב', 'קלג', 'קלד', 'קלה', 'קלו', 'קלז', 'קלח', 'קלט', // 130-139
    'קמ', 'קמא', 'קמב', 'קמג', 'קמד', 'קמה', 'קמו', 'קמז', 'קמח', 'קמט', 'קנ' // 140-150
  ]
  
  return hebrewLetters[num] || String(num)
}

function getTehillimDayPlan(day, monthLength = 30) {
  const dayInfo = tehillimDays.find(d => d.day === day) || tehillimDays[0]
  let chapters = [...(dayInfo?.chapters || [])]
  let note = ''

  if (day === 29 && monthLength === 29) {
    const day30 = tehillimDays.find(d => d.day === 30)
    if (day30?.chapters?.length) {
      chapters = Array.from(new Set([...chapters, ...day30.chapters])).sort((a, b) => a - b)
      note = 'בחודש חסר (כט ימים) אומרים ביום כט גם את פרקי יום ל.'
    }
  }

  return { chapters, note }
}

function getLocalChapter(chapterNum) {
  const chapter = tehillimData.find(c => c.chapter === chapterNum)
  if (!chapter) {
    console.error(`Chapter ${chapterNum} not found in tehillimData`)
    return null
  }
  return chapter.verses
}

function buildDailyChapterTexts(chapters) {
  return chapters
    .map((chapterNum) => ({
      chapterNum,
      verses: getLocalChapter(chapterNum) || [],
    }))
    .filter(item => item.verses.length > 0)
}

export default function TehillimScreen({ navigation, userRole }) {
  const [loading, setLoading] = useState(true)
  const [dailyContent, setDailyContent] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editChapters, setEditChapters] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [hebrewDateInfo, setHebrewDateInfo] = useState(getHebrewDateInfo())

  useEffect(() => {
    checkAdmin()
  }, [userRole])

  // Refresh date and daily chapters when screen is focused (so it updates each time you open the screen)
  useFocusEffect(
    useCallback(() => {
      loadDailyContent()
    }, [])
  )

  const checkAdmin = () => {
    setIsAdmin(userRole === 'admin' || userRole === 'superadmin')
  }

  const loadDailyContent = async () => {
    try {
      setLoading(true)
      const dateInfo = getHebrewDateInfo()
      const { fullDate } = dateInfo
      setHebrewDateInfo(dateInfo)
      
      // Get chapters for today from local data
      const defaultChapters = ''
      const defaultContent = {
        title: `תהילים יומי - ${fullDate}`,
        chapters: defaultChapters,
        imageUrl: '',
        updatedAt: new Date().toISOString()
      }

      // Load from DB only if table exists (daily_tehillim may not be in schema)
      try {
        const content = await db.getDocument('dailyTehillim', 'current')
        if (content && (content.title || content.chapters || content.imageUrl)) {
          setDailyContent(content)
          setEditTitle(content.title || defaultContent.title)
          setEditChapters(content.chapters || defaultChapters)
          setEditImageUrl(content.imageUrl || '')
        } else {
          setDailyContent(defaultContent)
          setEditTitle(defaultContent.title)
          setEditChapters(defaultChapters)
          setEditImageUrl('')
        }
      } catch (_) {
        // Table daily_tehillim doesn't exist – use local data only
        setDailyContent(defaultContent)
        setEditTitle(defaultContent.title)
        setEditChapters(defaultChapters)
        setEditImageUrl('')
      }
    } catch (error) {
      const dateInfo = getHebrewDateInfo()
      const { fullDate } = dateInfo
      setHebrewDateInfo(dateInfo)
      const defaultChapters = ''
      setDailyContent({
        title: `תהילים יומי - ${fullDate}`,
        chapters: defaultChapters,
        imageUrl: '',
        updatedAt: new Date().toISOString()
      })
      setEditTitle(`תהילים יומי - ${fullDate}`)
      setEditChapters(defaultChapters)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editTitle.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת')
      return
    }

    setSaving(true)
    try {
      const updatedContent = {
        title: editTitle.trim(),
        chapters: editChapters.trim(),
        imageUrl: editImageUrl.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid,
      }

      await db.updateDocument('dailyTehillim', 'current', updatedContent)
      setDailyContent(updatedContent)
      setEditModalVisible(false)
      Alert.alert('הצלחה', 'תהילים יומי עודכן בהצלחה')
    } catch (error) {
      const code = error?.code || error?.message || ''
      if (String(code).includes('PGRST205') || String(code).includes('daily_tehillim')) {
        Alert.alert('לא זמין', 'שמירת תוכן יומי אינה זמינה כרגע (טבלה לא קיימת במערכת). התוכן המקומי יוצג.')
      } else {
        Alert.alert('שגיאה', 'לא ניתן לשמור את התוכן')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'מחיקת תוכן',
      'האם אתה בטוח שברצונך למחוק את התוכן?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.updateDocument('dailyTehillim', 'current', {
                title: '',
                chapters: '',
                imageUrl: '',
                updatedAt: new Date().toISOString(),
              })
              setDailyContent({ title: '', chapters: '', imageUrl: '', updatedAt: new Date().toISOString() })
              setEditTitle('')
              setEditChapters('')
              setEditImageUrl('')
              setEditModalVisible(false)
              Alert.alert('הצלחה', 'התוכן נמחק')
            } catch (error) {
              const code = error?.code || error?.message || ''
              if (String(code).includes('PGRST205') || String(code).includes('daily_tehillim')) {
                setDailyContent({ title: '', chapters: '', imageUrl: '', updatedAt: new Date().toISOString() })
                setEditTitle('')
                setEditChapters('')
                setEditImageUrl('')
                setEditModalVisible(false)
                Alert.alert('הערה', 'טבלת תהילים יומי אינה קיימת במערכת. התוכן המקומי נוקה.')
              } else {
                Alert.alert('שגיאה', 'לא ניתן למחוק')
              }
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title={t('תהילים יומי')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען תהילים יומי...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const todayPlan = getTehillimDayPlan(hebrewDateInfo.day, hebrewDateInfo.monthLength)
  const todayChapterTexts = buildDailyChapterTexts(todayPlan.chapters)

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title={t('תהילים יומי')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon={isAdmin ? "create-outline" : undefined}
        onRightIconPress={isAdmin ? () => setEditModalVisible(true) : undefined}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="book" size={48} color={PRIMARY_BLUE} />
          </View>
          <Text style={styles.mainTitle}>תהילים יומי</Text>
          <Text style={styles.hebrewDate}>{hebrewDateInfo.fullDate}</Text>
        </View>

        <View style={styles.dailyFullCard}>
          <Text style={styles.dailyFullTitle}>
            יום {numberToHebrew(hebrewDateInfo.day)} לחודש ({hebrewDateInfo.fullDate})
          </Text>
          {todayPlan.note ? <Text style={styles.dailyNote}>{todayPlan.note}</Text> : null}
          {todayChapterTexts.map((chapter) => (
            <View key={chapter.chapterNum} style={styles.dailyChapterBlock}>
              <Text style={styles.dailyChapterTitle}>
                תהלים פרק {numberToHebrew(chapter.chapterNum)}
              </Text>
              {chapter.verses.map((verse, idx) => (
                <View key={`${chapter.chapterNum}-${idx}`} style={styles.verseRow}>
                  <Text style={styles.verseNum}>{numberToHebrew(idx + 1)}</Text>
                  <Text style={styles.verseText}>{verse}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={DEEP_BLUE} />
                </Pressable>
                <Text style={styles.modalTitle}>עריכת תהילים יומי</Text>
              </View>

              <ScrollView
                style={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
              <View style={styles.formGroup}>
                <Text style={styles.label}>כותרת (תאריך עברי)</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="תהילים יומי - תאריך עברי"
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>פרקים (למשל: פרקים א-י, כ-כה)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editChapters}
                  onChangeText={setEditChapters}
                  placeholder="הזן את הפרקים הרלוונטים..."
                  multiline
                  numberOfLines={4}
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>קישור לתמונה</Text>
                <TextInput
                  style={styles.input}
                  value={editImageUrl}
                  onChangeText={setEditImageUrl}
                  placeholder="https://example.com/image.jpg"
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>

              {editImageUrl ? (
                <View style={styles.imagePreview}>
                  <Text style={styles.label}>תצוגה מקדימה:</Text>
                  <Image
                    source={{ uri: editImageUrl }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>מחק</Text>
              </Pressable>

              <View style={styles.modalButtonGroup}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>שמור</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'center',
    marginBottom: 8,
  },
  hebrewDate: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  dailyFullCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  dailyFullTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  dailyNote: {
    marginBottom: 12,
    fontSize: 13,
    fontFamily: 'Heebo_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 20,
  },
  dailyChapterBlock: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  dailyChapterTitle: {
    fontSize: 17,
    fontFamily: 'Heebo_700Bold',
    color: PRIMARY_BLUE,
    textAlign: 'right',
    marginBottom: 10,
  },
  verseRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
    direction: 'rtl',
  },
  verseNum: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
    width: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  verseText: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePreview: {
    marginTop: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    backgroundColor: DEEP_BLUE,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
  cancelButtonText: {
    color: DEEP_BLUE,
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
})
