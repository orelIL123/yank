import React, { useState, useEffect, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Modal, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import AppHeader from '../components/AppHeader'
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
  
  return { day, fullDate }
}

const TEHILLIM_CHAPTERS = 150

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

function getLocalChapter(chapterNum) {
  const chapter = tehillimData.find(c => c.chapter === chapterNum)
  if (!chapter) {
    console.error(`Chapter ${chapterNum} not found in tehillimData`)
    return null
  }
  return chapter.verses
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
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [chapterVerses, setChapterVerses] = useState([])
  const [loadingChapter, setLoadingChapter] = useState(false)
  const [chapterError, setChapterError] = useState(null)
  const [chapterInput, setChapterInput] = useState('')
  const [dailyChaptersList, setDailyChapters] = useState([])

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
      const { day, fullDate } = getHebrewDateInfo()
      
      // Get chapters for today from local data
      const dayInfo = tehillimDays.find(d => d.day === day) || tehillimDays[0]
      setDailyChapters(dayInfo.chapters)

      const defaultChapters = dayInfo.chapters.length
        ? `פרקים מ${numberToHebrew(dayInfo.chapters[0])}־${numberToHebrew(dayInfo.chapters[dayInfo.chapters.length - 1])}`
        : ''
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
      const { day, fullDate } = getHebrewDateInfo()
      const dayInfo = tehillimDays.find(d => d.day === day) || tehillimDays[0]
      const defaultChapters = dayInfo.chapters.length
        ? `פרקים מ${numberToHebrew(dayInfo.chapters[0])}־${numberToHebrew(dayInfo.chapters[dayInfo.chapters.length - 1])}`
        : ''
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

  const loadChapter = (num) => {
    if (num < 1 || num > TEHILLIM_CHAPTERS) {
      Alert.alert('שגיאה', `מספר פרק לא תקין. יש להזין מספר בין 1 ל־${TEHILLIM_CHAPTERS}`)
      return
    }
    
    setSelectedChapter(num)
    setLoadingChapter(true)
    setChapterError(null)
    
    // Verify the chapter exists in data
    const chapter = tehillimData.find(c => c.chapter === num)
    if (!chapter) {
      console.error(`Chapter ${num} not found in tehillimData`)
      setChapterError(`פרק ${numberToHebrew(num)} לא נמצא במערכת`)
      setChapterVerses([])
      setLoadingChapter(false)
      return
    }
    
    const verses = chapter.verses
    if (verses && verses.length > 0) {
      setChapterVerses(verses)
      setLoadingChapter(false)
    } else {
      setChapterError(`פרק ${numberToHebrew(num)} נמצא אבל אין בו פסוקים`)
      setChapterVerses([])
      setLoadingChapter(false)
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
          title="תהילים יומי"
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

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="תהילים יומי"
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
          <Text style={styles.hebrewDate}>{getHebrewDateInfo().fullDate}</Text>
        </View>

        {/* Daily Chapters Quick Access */}
        {dailyChaptersList.length > 0 && (
          <View style={styles.dailyChaptersRow}>
            <Text style={styles.dailyChaptersLabel}>פרקי היום:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {dailyChaptersList.map(num => (
                <Pressable
                  key={num}
                  style={[styles.miniChapterChip, selectedChapter === num && styles.chapterChipActive]}
                  onPress={() => loadChapter(num)}
                >
                  <Text style={[styles.miniChapterChipText, selectedChapter === num && styles.chapterChipTextActive]}>{numberToHebrew(num)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Daily Content Card */}
        {dailyContent && (dailyContent.title || dailyContent.chapters || dailyContent.imageUrl) ? (
          <View style={styles.contentCard}>
            {dailyContent.title && (
              <Text style={styles.contentTitle}>{dailyContent.title}</Text>
            )}

            {dailyContent.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: dailyContent.imageUrl }}
                  style={styles.contentImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {(() => {
              const { day } = getHebrewDateInfo()
              const dayInfo = tehillimDays.find(d => d.day === day) || tehillimDays[0]
              const chaptersLabel = dayInfo.chapters.length
                ? `פרקים מ${numberToHebrew(dayInfo.chapters[0])}־${numberToHebrew(dayInfo.chapters[dayInfo.chapters.length - 1])}`
                : ''
              return chaptersLabel ? (
                <View style={styles.chaptersContainer}>
                  <Text style={styles.chaptersTitle}>פרקים להיום:</Text>
                  <Text style={styles.chaptersText}>{chaptersLabel}</Text>
                </View>
              ) : null
            })()}

            {dailyContent.updatedAt && (
              <Text style={styles.updateTime}>
                עודכן לאחרונה: {new Date(dailyContent.updatedAt).toLocaleString('he-IL')}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין תוכן זמין להיום</Text>
            {isAdmin && (
              <Pressable
                style={styles.addButton}
                onPress={() => setEditModalVisible(true)}
              >
                <Text style={styles.addButtonText}>הוסף תוכן</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Read full chapter */}
        <View style={styles.readChapterCard}>
          <Text style={styles.readChapterTitle}>קרא פרק מלא</Text>
          <Text style={styles.readChapterSubtitle}>לחיצה: פרקים א–ל. להצגת פרק 31–150 הקלד מספר ולחץ הצג</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chapterChipsRow}
          >
            {Array.from({ length: 30 }, (_, i) => i + 1).map((num) => (
              <Pressable
                key={num}
                style={[styles.chapterChip, selectedChapter === num && styles.chapterChipActive]}
                onPress={() => loadChapter(num)}
                disabled={loadingChapter}
              >
                <Text style={[styles.chapterChipText, selectedChapter === num && styles.chapterChipTextActive]}>{numberToHebrew(num)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.chapterInputRow}>
            <Pressable
              style={styles.chapterGoButton}
              onPress={() => {
                const n = parseInt(chapterInput, 10)
                if (n >= 1 && n <= TEHILLIM_CHAPTERS) loadChapter(n)
                else Alert.alert('שגיאה', `הזן מספר בין 1 ל־${TEHILLIM_CHAPTERS}`)
              }}
              disabled={loadingChapter}
            >
              <Text style={styles.chapterGoButtonText}>הצג פרק</Text>
            </Pressable>
            <TextInput
              style={styles.chapterInput}
              value={chapterInput}
              onChangeText={setChapterInput}
              placeholder="הקלד פרק 1–150"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
          {loadingChapter && (
            <View style={styles.chapterLoading}>
              <ActivityIndicator size="small" color={PRIMARY_BLUE} />
              <Text style={styles.chapterLoadingText}>טוען פרק...</Text>
            </View>
          )}
          {chapterError && (
            <Text style={styles.chapterError}>{chapterError}</Text>
          )}
          {!loadingChapter && chapterVerses.length > 0 && (
            <View style={styles.versesContainer}>
              <Text style={styles.versesTitle}>תהלים פרק {numberToHebrew(selectedChapter)}</Text>
              {chapterVerses.map((verse, idx) => (
                <View key={idx} style={styles.verseRow}>
                  <Text style={styles.verseNum}>{numberToHebrew(idx + 1)}</Text>
                  <Text style={styles.verseText}>{verse}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={PRIMARY_BLUE} />
          <Text style={styles.infoText}>
            תוכן זה מתעדכן יומית על ידי האדמין ומציג את פרקי התהילים הרלוונטים ליום
          </Text>
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
  dailyChaptersRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  dailyChaptersLabel: {
    fontSize: 16,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    marginLeft: 12,
  },
  miniChapterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(30,58,138,0.08)',
    marginHorizontal: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  miniChapterChipText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  contentTitle: {
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 16,
  },
  imageContainer: {
    marginVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  contentImage: {
    width: '100%',
    height: 250,
  },
  chaptersContainer: {
    backgroundColor: 'rgba(30,58,138,0.05)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  chaptersTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  chaptersText: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 28,
  },
  updateTime: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  readChapterCard: {
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
  readChapterTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  readChapterSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 12,
  },
  chapterChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    flexWrap: 'nowrap',
  },
  chapterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.25)',
    minWidth: 44,
    alignItems: 'center',
  },
  chapterChipActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  chapterChipText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  chapterChipTextActive: {
    color: '#fff',
  },
  chapterInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  chapterInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    backgroundColor: '#f9fafb',
    textAlign: 'right',
  },
  chapterGoButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY_BLUE,
  },
  chapterGoButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  chapterLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  chapterLoadingText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
  },
  chapterError: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#ef4444',
    textAlign: 'center',
    paddingVertical: 12,
  },
  versesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.08)',
  },
  versesTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: PRIMARY_BLUE,
    textAlign: 'right',
    marginBottom: 12,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 22,
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
