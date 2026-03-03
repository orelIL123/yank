import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AppHeader from '../components/AppHeader'
import seferHaMidotData from '../data/sefer_hamidot_data.json'
import seferHaMidotDailyRabbiSegments from '../data/sefer_hamidot_daily_rabbi_segments.json'
import { t } from '../utils/i18n'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// RTL paragraphs to prevent text direction flip on long Hebrew content
function renderRtlParagraphs(text, textStyle, options = {}) {
  const { onParagraphLayout } = options
  if (!text || typeof text !== 'string') return null
  const paragraphs = String(text).split(/\n\n+/).filter((p) => p.trim())
  if (paragraphs.length === 0) {
    return <Text style={[textStyle, { writingDirection: 'rtl' }]}>{text}</Text>
  }
  return paragraphs.map((paragraph, index) => (
    <Text
      key={index}
      style={[textStyle, { writingDirection: 'rtl', marginBottom: index < paragraphs.length - 1 ? 20 : 0 }]}
      onLayout={(event) => {
        if (typeof onParagraphLayout === 'function') {
          const { y, height } = event.nativeEvent.layout
          onParagraphLayout(index, y, height, paragraph.trim())
        }
      }}
    >
      {paragraph.trim()}
    </Text>
  ))
}

// קטגוריות ספר המידות - טעינה מקומית מהקובץ
// שמות הפרקים כפי שמופיעים בספר המידות
const MIDOT_CATEGORIES = [
  { id: 'lost-objects', title: 'אבידה', englishTitle: 'Lost Objects' },
  { id: 'love', title: 'אהבה', englishTitle: 'Love' },
  { id: 'eating', title: 'אכילה', englishTitle: 'Eating' },
  { id: 'widower', title: 'אלמן', englishTitle: 'A Widower' },
  { id: 'faith', title: 'אמונה', englishTitle: 'Faith' },
  { id: 'truth', title: 'אמת', englishTitle: 'Truth' },
  { id: 'land-of-israel', title: 'ארץ ישראל', englishTitle: 'The Land of Israel' },
  { id: 'clothes', title: 'בגדים', englishTitle: 'Clothing' },
  { id: 'shame', title: 'בושה', englishTitle: 'Embarrassment; Modesty' },
  { id: 'trust', title: 'בטחון', englishTitle: 'Trust in God' },
  { id: 'house', title: 'בית', englishTitle: 'A House' },
  { id: 'crying', title: 'בכייה', englishTitle: 'Crying' },
  { id: 'children', title: 'בנים', englishTitle: 'Children' },
  { id: 'blessing', title: 'ברכה', englishTitle: 'Blessing' },
  { id: 'tidings', title: 'בשורה', englishTitle: 'Tidings' },
  { id: 'arrogance', title: 'גאוה', englishTitle: 'Haughtiness' },
  { id: 'theft', title: 'גניבה וגזילה', englishTitle: 'Theft and Robbery' },
  { id: 'judge', title: 'דיין', englishTitle: 'A Judge' },
  { id: 'knowledge', title: 'דעת', englishTitle: 'Knowledge of God' },
  { id: 'travel', title: 'דרך', englishTitle: 'Traveling' },
  { id: 'instruction', title: 'הוראה', englishTitle: 'Instruction' },
  { id: 'hospitality', title: 'הכנסת אורחים', englishTitle: 'Hospitality' },
  { id: 'sweetening', title: 'המתקת דין', englishTitle: 'Mitigating Judgment' },
  { id: 'success', title: 'הצלחה', englishTitle: 'Success and Prosperity' },
  { id: 'thoughts', title: 'הרהורים', englishTitle: 'Improper Thoughts' },
  { id: 'distancing', title: 'הרחקת רשעים', englishTitle: 'Distancing the Wicked' },
  { id: 'pregnancy', title: 'הריון', englishTitle: 'Conception; Pregnancy' },
  { id: 'seclusion', title: 'התבודדות', englishTitle: 'Seclusion' },
  { id: 'high-position', title: 'התנשאות', englishTitle: 'Prestige and Importance' },
  { id: 'confession', title: 'ודוי דברים', englishTitle: 'Confession' },
  { id: 'defers', title: 'ותרן', englishTitle: 'Easygoing' },
  { id: 'forger', title: 'זיפן', englishTitle: 'A Fraud' },
  { id: 'ancestral-merit', title: 'זכות אבות', englishTitle: 'Ancestral Merit' },
  { id: 'memory', title: 'זכירה', englishTitle: 'Memory' },
  { id: 'elderly', title: 'זקנים', englishTitle: 'Elders' },
  { id: 'zeal', title: 'זריזות', englishTitle: 'Zealousness' },
  { id: 'dream', title: 'חלום', englishTitle: 'Dreams' },
  { id: 'favor', title: 'חן', englishTitle: 'Grace' },
  { id: 'flattery', title: 'חנפה', englishTitle: 'Flattery' },
  { id: 'investigation', title: 'חקירה', englishTitle: 'Philosophical Investigation' },
  { id: 'novelties', title: 'חדושין דאוריתא', englishTitle: 'Original Torah; Sights' },
  { id: 'marriage', title: 'חיתון', englishTitle: 'Marriage' },
  { id: 'nature', title: 'טבע', englishTitle: 'Nature' },
  { id: 'wandering', title: 'טלטול', englishTitle: 'Wandering' },
  { id: 'purity', title: 'טהרה', englishTitle: 'Purity' },
  { id: 'lineage', title: 'יחוס', englishTitle: 'Distinguished Ancestry' },
  { id: 'fear', title: 'יראה', englishTitle: 'Fear of God' },
  { id: 'salvation', title: 'ישועה', englishTitle: 'Salvation and Miracles' },
  { id: 'honor', title: 'כבוד', englishTitle: 'Honor and Respect' },
  { id: 'sorcery', title: 'כישוף', englishTitle: 'Sorcery' },
  { id: 'anger', title: 'כעס', englishTitle: 'Anger' },
  { id: 'torah-study', title: 'לימוד', englishTitle: 'Torah Study' },
  { id: 'derision', title: 'ליצנות', englishTitle: 'Derision and Mockery' },
  { id: 'slander', title: 'לשון הרע', englishTitle: 'Slander' },
  { id: 'circumciser', title: 'מוהל', englishTitle: 'A Circumciser' },
  { id: 'money', title: 'ממון', englishTitle: 'Money' },
  { id: 'informer', title: 'מסור', englishTitle: 'An Informer' },
  { id: 'fame', title: 'מפורסם', englishTitle: 'Fame' },
  { id: 'miscarriage', title: 'מפלת', englishTitle: 'Miscarriage' },
  { id: 'conflict', title: 'מריבה', englishTitle: 'Conflict and Strife' },
  { id: 'messiah', title: 'משיח', englishTitle: 'The Messiah' },
  { id: 'alcohol', title: 'משקה', englishTitle: 'Alcohol' },
  { id: 'song', title: 'נגינה', englishTitle: 'Song' },
  { id: 'menstruation', title: 'נדה', englishTitle: 'Menstruation' },
  { id: 'benefitting', title: 'נהנה מאחרים', englishTitle: 'Benefitting from Others' },
  { id: 'immoral', title: 'ניאוף', englishTitle: 'Immoral Behavior' },
  { id: 'obscene', title: 'ניבול פה', englishTitle: 'Obscene Language' },
  { id: 'test', title: 'ניסיון', englishTitle: 'A Test' },
  { id: 'fall', title: 'נפילה', englishTitle: 'A Fall' },
  { id: 'eternal-flame', title: 'נר תמיד', englishTitle: 'An Eternal Flame' },
  { id: 'remedy', title: 'סגולה', englishTitle: 'A Divine Remedy' },
  { id: 'mysteries', title: 'סוד', englishTitle: 'Mysteries' },
  { id: 'counting-omer', title: 'ספירת העומר', englishTitle: 'Counting the Omer' },
  { id: 'holy-book', title: 'ספר', englishTitle: 'A Holy Book' },
  { id: 'sin', title: 'עבירה', englishTitle: 'Sin' },
  { id: 'punishment', title: 'עונש', englishTitle: 'Punishment' },
  { id: 'arrogance2', title: 'עזות', englishTitle: 'Arrogance' },
  { id: 'humility', title: 'ענוה', englishTitle: 'Humility' },
  { id: 'depression', title: 'עצבות', englishTitle: 'Depression' },
  { id: 'advice', title: 'עצה', englishTitle: 'Advice' },
  { id: 'constipation', title: 'עצירות', englishTitle: 'Constipation' },
  { id: 'laziness', title: 'עצלות', englishTitle: 'Laziness' },
  { id: 'codifiers', title: 'פוסק', englishTitle: 'Halakhic Codifiers' },
  { id: 'fear2', title: 'פחד', englishTitle: 'Fear' },
  { id: 'redeeming', title: 'פדיון שבויים', englishTitle: 'Redeeming Captives' },
  { id: 'abstinence', title: 'פרישות', englishTitle: 'Abstinence' },
  { id: 'tzaddik', title: 'צדיק', englishTitle: 'A Righteous Person' },
  { id: 'charity', title: 'צדקה', englishTitle: 'Charity' },
  { id: 'evil', title: 'קליפה', englishTitle: 'Forces of Evil' },
  { id: 'curse', title: 'קללה', englishTitle: 'A Curse' },
  { id: 'envy', title: 'קנאה', englishTitle: 'Envy and Jealousy' },
  { id: 'emission', title: 'קרי', englishTitle: 'A Seminal Emission' },
  { id: 'childbirth', title: 'קשוי לילד', englishTitle: 'Difficulty in Childbirth' },
  { id: 'vision', title: 'ראיה', englishTitle: 'Vision' },
  { id: 'compassion', title: 'רחמנות', englishTitle: 'Compassion and Mercy' },
  { id: 'healing', title: 'רפואה', englishTitle: 'Healing' },
  { id: 'oaths', title: 'שבועה', englishTitle: 'Oaths' },
  { id: 'sabbath', title: 'שבת', englishTitle: 'The Sabbath' },
  { id: 'bribery', title: 'שוחד', englishTitle: 'Bribery' },
  { id: 'slaughterer', title: 'שוחט', englishTitle: 'A Ritual Slaughterer' },
  { id: 'sleep', title: 'שינה', englishTitle: 'Sleep' },
  { id: 'drunkenness', title: 'שכרות', englishTitle: 'Drunkenness' },
  { id: 'peace', title: 'שלום', englishTitle: 'Peace' },
  { id: 'joy', title: 'שמחה', englishTitle: 'Joy and Happiness' },
  { id: 'officials', title: 'שרים', englishTitle: 'Public Officials' },
  { id: 'rebuke', title: 'תוכחה', englishTitle: 'Rebuke' },
  { id: 'prayer', title: 'תפילה', englishTitle: 'Prayer' },
  { id: 'repentance', title: 'תשובה', englishTitle: 'Repentance' },
]

const MIDOT_CONTENT_MAP = Object.fromEntries(
  (seferHaMidotData?.chapters || []).map((chapter) => [chapter.title, chapter.content || ''])
)
const MIDOT_BOOKMARK_KEY = 'sefer_hamidot_bookmark_v1'
const DAILY_RABBI_SEGMENTS_DAYS = Array.isArray(seferHaMidotDailyRabbiSegments?.days) ? seferHaMidotDailyRabbiSegments.days : []

export default function SeferHaMidotScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryContent, setCategoryContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bookmark, setBookmark] = useState(null)
  const [bookmarkNoteDraft, setBookmarkNoteDraft] = useState('')
  const [showBookmarkEditor, setShowBookmarkEditor] = useState(false)
  const [showRabbiPlanChapters, setShowRabbiPlanChapters] = useState(false)
  const chapterScrollRef = useRef(null)
  const currentScrollYRef = useRef(0)
  const contentHeightRef = useRef(0)
  const viewportHeightRef = useRef(0)
  const pendingRestoreYRef = useRef(null)
  const pendingRestoreParagraphIndexRef = useRef(null)
  const paragraphLayoutsRef = useRef([])

  useEffect(() => {
    const loadBookmark = async () => {
      try {
        const raw = await AsyncStorage.getItem(MIDOT_BOOKMARK_KEY)
        if (raw) {
          setBookmark(JSON.parse(raw))
        }
      } catch (error) {
        console.error('Error loading Sefer HaMidot bookmark:', error)
      }
    }

    loadBookmark()
  }, [])

  const saveBookmark = async (category, note = '') => {
    const maxScrollable = Math.max(contentHeightRef.current - viewportHeightRef.current, 0)
    const clampedY = Math.max(0, Math.min(Math.round(currentScrollYRef.current), Math.round(maxScrollable)))
    const progress = maxScrollable > 0 ? Math.round((clampedY / maxScrollable) * 100) : 0
    const focusY = currentScrollYRef.current + (viewportHeightRef.current * 0.25)
    let paragraphIndex = null
    let paragraphText = ''

    for (const paragraph of paragraphLayoutsRef.current) {
      if (!paragraph) continue
      if (focusY >= paragraph.y) {
        paragraphIndex = paragraph.index
        paragraphText = paragraph.text || ''
      } else {
        break
      }
    }

    const next = {
      id: category.id,
      title: category.title,
      note: String(note || '').trim(),
      scrollY: clampedY,
      progress,
      paragraphIndex,
      paragraphPreview: paragraphText ? `${paragraphText.slice(0, 80)}${paragraphText.length > 80 ? '…' : ''}` : '',
      savedAt: new Date().toISOString(),
    }
    setBookmark(next)
    try {
      await AsyncStorage.setItem(MIDOT_BOOKMARK_KEY, JSON.stringify(next))
    } catch (error) {
      console.error('Error saving Sefer HaMidot bookmark:', error)
    }
  }

  const handleCategoryPress = async (category) => {
    setSelectedCategory(category)
    setLoading(true)
    setCategoryContent(null)
    currentScrollYRef.current = 0
    contentHeightRef.current = 0
    viewportHeightRef.current = 0
    paragraphLayoutsRef.current = []
    pendingRestoreYRef.current = bookmark?.id === category.id && Number.isFinite(bookmark?.scrollY)
      ? Math.max(0, bookmark.scrollY)
      : null
    pendingRestoreParagraphIndexRef.current = bookmark?.id === category.id && Number.isFinite(bookmark?.paragraphIndex)
      ? bookmark.paragraphIndex
      : null

    try {
      const localContent = MIDOT_CONTENT_MAP[category.title]
      if (localContent && localContent.trim()) {
        setCategoryContent({
          title: category.title,
          content: localContent,
          hebrew: localContent,
        })
      } else {
        setCategoryContent({
          title: category.title,
          content: 'התוכן לפרק זה עדיין לא נטען בקובץ המקומי.',
          hebrew: 'התוכן לפרק זה עדיין לא נטען בקובץ המקומי.',
        })
      }
    } catch (error) {
      console.error('Error loading local Sefer HaMidot content:', error)
      setLoading(false)
      return
    }
    setLoading(false)
  }

  const maybeRestoreScroll = () => {
    if (!chapterScrollRef.current) return

    const paragraphIndex = pendingRestoreParagraphIndexRef.current
    if (Number.isFinite(paragraphIndex)) {
      const paragraph = paragraphLayoutsRef.current[paragraphIndex]
      if (paragraph && Number.isFinite(paragraph.y)) {
        const maxScrollable = Math.max(contentHeightRef.current - viewportHeightRef.current, 0)
        const finalY = Math.max(0, Math.min(Math.max(0, paragraph.y - 8), maxScrollable))
        chapterScrollRef.current.scrollTo({ y: finalY, animated: false })
        currentScrollYRef.current = finalY
        pendingRestoreParagraphIndexRef.current = null
        pendingRestoreYRef.current = null
        return
      }
    }

    const targetY = pendingRestoreYRef.current
    if (Number.isFinite(targetY)) {
      const maxScrollable = Math.max(contentHeightRef.current - viewportHeightRef.current, 0)
      const finalY = Math.max(0, Math.min(targetY, maxScrollable))
      chapterScrollRef.current.scrollTo({ y: finalY, animated: false })
      currentScrollYRef.current = finalY
      pendingRestoreYRef.current = null
    }
  }

  const handleParagraphLayout = (index, y, height, text) => {
    paragraphLayoutsRef.current[index] = { index, y, height, text }
    maybeRestoreScroll()
  }

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null)
    } else {
      navigation.goBack()
    }
  }

  const todayDailySegment = (() => {
    if (!DAILY_RABBI_SEGMENTS_DAYS.length) return null
    const now = new Date()
    const utcDayNumber = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000)
    const dayIndex = ((utcDayNumber % DAILY_RABBI_SEGMENTS_DAYS.length) + DAILY_RABBI_SEGMENTS_DAYS.length) % DAILY_RABBI_SEGMENTS_DAYS.length
    for (let offset = 0; offset < DAILY_RABBI_SEGMENTS_DAYS.length; offset += 1) {
      const candidate = DAILY_RABBI_SEGMENTS_DAYS[(dayIndex + offset) % DAILY_RABBI_SEGMENTS_DAYS.length]
      if (candidate?.content && String(candidate.content).trim()) {
        return candidate
      }
    }
    return DAILY_RABBI_SEGMENTS_DAYS[dayIndex] || null
  })()
  const isDailySegment = selectedCategory?.id === 'daily-rabbi-segment'

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title={selectedCategory?.title || t('ספר המידות')}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען תוכן...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (selectedCategory && categoryContent) {
    const isCurrentBookmarked = bookmark?.id === selectedCategory.id
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title={categoryContent.title || selectedCategory.title}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <ScrollView
          ref={chapterScrollRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          scrollEventThrottle={16}
          onScroll={(event) => {
            currentScrollYRef.current = event.nativeEvent.contentOffset.y || 0
          }}
          onLayout={(event) => {
            viewportHeightRef.current = event.nativeEvent.layout.height || 0
            maybeRestoreScroll()
          }}
          onContentSizeChange={(_, height) => {
            contentHeightRef.current = height || 0
            maybeRestoreScroll()
          }}
        >
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{selectedCategory.title}</Text>
            {!isDailySegment ? (
              <>
                <TouchableOpacity
                  style={[styles.bookmarkButton, isCurrentBookmarked && styles.bookmarkButtonActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setBookmarkNoteDraft(isCurrentBookmarked ? (bookmark?.note || '') : '')
                    setShowBookmarkEditor(true)
                  }}
                >
                  <Ionicons name={isCurrentBookmarked ? 'create-outline' : 'bookmark-outline'} size={16} color={PRIMARY_BLUE} />
                  <Text style={[styles.bookmarkButtonText, isCurrentBookmarked && styles.bookmarkButtonTextActive]}>
                    {isCurrentBookmarked ? 'עדכן סימניה' : 'הוסף סימניה'}
                  </Text>
                </TouchableOpacity>
                {showBookmarkEditor ? (
                  <View style={styles.bookmarkEditor}>
                    <Text style={styles.bookmarkEditorLabel}>איפה עצרת? (טקסט חופשי)</Text>
                    <TextInput
                      value={bookmarkNoteDraft}
                      onChangeText={setBookmarkNoteDraft}
                      placeholder="לדוגמה: אחרי הפסקה על שמחה ואמונה"
                      textAlign="right"
                      style={styles.bookmarkEditorInput}
                    />
                    <View style={styles.bookmarkEditorActions}>
                      <TouchableOpacity
                        style={[styles.bookmarkEditorBtn, styles.bookmarkEditorCancelBtn]}
                        onPress={() => {
                          setShowBookmarkEditor(false)
                          setBookmarkNoteDraft('')
                        }}
                      >
                        <Text style={styles.bookmarkEditorCancelText}>ביטול</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.bookmarkEditorBtn, styles.bookmarkEditorSaveBtn]}
                        onPress={async () => {
                          await saveBookmark(selectedCategory, bookmarkNoteDraft)
                          setShowBookmarkEditor(false)
                        }}
                      >
                        <Text style={styles.bookmarkEditorSaveText}>שמור סימניה</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}
                {isCurrentBookmarked && Number.isFinite(bookmark?.progress) ? (
                  <Text style={styles.bookmarkMetaText}>
                    המיקום השמור: {bookmark.progress}%{Number.isFinite(bookmark?.paragraphIndex) ? ` | פסקה ${bookmark.paragraphIndex + 1}` : ''}
                  </Text>
                ) : null}
                {isCurrentBookmarked && bookmark?.note ? (
                  <Text style={styles.bookmarkManualNote}>הערה שלך: {bookmark.note}</Text>
                ) : null}
                {isCurrentBookmarked && bookmark?.paragraphPreview ? (
                  <Text style={styles.bookmarkPreviewText}>“{bookmark.paragraphPreview}”</Text>
                ) : null}
                <View style={styles.divider} />
              </>
            ) : null}
          </View>
          
          <View style={[styles.textContainer, styles.textContainerRtl]}>
            {renderRtlParagraphs(
              categoryContent.hebrew || categoryContent.content || '',
              styles.textContent,
              { onParagraphLayout: handleParagraphLayout }
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t('ספר המידות')}
        subtitle={t('לרבי נחמן מברסלב')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.introText}>
          בחרו קטגוריה כדי לקרוא את המידות של רבי נחמן מברסלב
        </Text>

        {bookmark ? (
          <TouchableOpacity
            style={styles.resumeCard}
            activeOpacity={0.8}
            onPress={() => {
              const chapter = MIDOT_CATEGORIES.find((item) => item.id === bookmark.id)
              if (chapter) handleCategoryPress(chapter)
            }}
          >
            <View style={styles.resumeHeader}>
              <Ionicons name="bookmark" size={18} color={PRIMARY_BLUE} />
              <Text style={styles.resumeTitle}>המשך מהמקום שעצרת</Text>
            </View>
            <Text style={styles.resumeChapter}>{bookmark.title}</Text>
            {bookmark?.note ? (
              <Text style={styles.resumeNote}>הוספת: {bookmark.note}</Text>
            ) : null}
            {Number.isFinite(bookmark?.progress) ? (
              <Text style={styles.resumeProgress}>
                מיקום שמור: {bookmark.progress}%{Number.isFinite(bookmark?.paragraphIndex) ? ` | פסקה ${bookmark.paragraphIndex + 1}` : ''}
              </Text>
            ) : null}
            {bookmark?.paragraphPreview ? (
              <Text style={styles.resumePreview}>“{bookmark.paragraphPreview}”</Text>
            ) : null}
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.dailyCard}
          activeOpacity={0.85}
          onPress={() => setShowRabbiPlanChapters((prev) => !prev)}
        >
          <View style={styles.dailyHeader}>
            <Ionicons name="calendar-outline" size={18} color={PRIMARY_BLUE} />
            <Text style={styles.dailyTitle}>ספר הלימוד</Text>
            <Ionicons
              name={showRabbiPlanChapters ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={PRIMARY_BLUE}
            />
          </View>
          <Text style={styles.dailySubtitle}>3 דפים ביום חלוקה ע״פ הרב</Text>
          {showRabbiPlanChapters && todayDailySegment?.content ? (
            <View style={styles.dailyPlanButtons}>
              <TouchableOpacity
                style={styles.dailyPlanButton}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedCategory({ id: 'daily-rabbi-segment', title: 'ספר המידות' })
                  setCategoryContent({
                    title: 'ספר המידות',
                    content: todayDailySegment.content,
                    hebrew: todayDailySegment.content,
                  })
                }}
              >
                <Text style={styles.dailyPlanButtonText}>
                  {todayDailySegment.title || 'לימוד יומי'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={PRIMARY_BLUE} />
              </TouchableOpacity>
            </View>
          ) : null}
        </TouchableOpacity>
        
        <View style={styles.categoriesList}>
          {MIDOT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryCardContent}>
                {bookmark?.id === category.id ? (
                  <Ionicons name="bookmark" size={18} color={PRIMARY_BLUE} />
                ) : (
                  <View style={styles.categorySpacer} />
                )}
                <Text style={styles.categoryCardTitle}>{category.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={DEEP_BLUE} />
              </View>
            </TouchableOpacity>
          ))}
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  resumeCard: {
    backgroundColor: 'rgba(30,58,138,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.18)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  resumeHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  resumeTitle: {
    fontSize: 15,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  resumeChapter: {
    fontSize: 14,
    fontFamily: 'Heebo_500Medium',
    color: '#334155',
    textAlign: 'right',
  },
  resumeProgress: {
    fontSize: 12,
    fontFamily: 'Heebo_400Regular',
    color: '#64748b',
    textAlign: 'right',
    marginTop: 4,
  },
  resumeNote: {
    fontSize: 12,
    fontFamily: 'Heebo_500Medium',
    color: '#334155',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 18,
  },
  resumePreview: {
    fontSize: 12,
    fontFamily: 'Heebo_400Regular',
    color: '#475569',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 18,
  },
  dailyCard: {
    backgroundColor: 'rgba(30,58,138,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.18)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dailyHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dailyTitle: {
    fontSize: 15,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  dailySubtitle: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 6,
  },
  dailyPlanButtons: {
    marginTop: 8,
    gap: 8,
  },
  dailyPlanButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.20)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  dailyPlanButtonText: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  categoryCardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  categorySpacer: {
    width: 18,
    height: 18,
  },
  categoryCardTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  categoryHeader: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 28,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 10,
  },
  bookmarkButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.25)',
    backgroundColor: 'rgba(30,58,138,0.05)',
    marginBottom: 10,
  },
  bookmarkButtonActive: {
    borderColor: 'rgba(30,58,138,0.35)',
    backgroundColor: 'rgba(30,58,138,0.10)',
  },
  bookmarkButtonText: {
    fontSize: 13,
    fontFamily: 'Heebo_600SemiBold',
    color: PRIMARY_BLUE,
    textAlign: 'right',
  },
  bookmarkButtonTextActive: {
    color: PRIMARY_BLUE,
  },
  bookmarkMetaText: {
    fontSize: 12,
    fontFamily: 'Heebo_400Regular',
    color: '#64748b',
    textAlign: 'right',
    marginBottom: 8,
  },
  bookmarkManualNote: {
    fontSize: 12,
    fontFamily: 'Heebo_500Medium',
    color: '#334155',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 18,
  },
  bookmarkPreviewText: {
    fontSize: 12,
    fontFamily: 'Heebo_400Regular',
    color: '#475569',
    textAlign: 'right',
    marginBottom: 8,
    lineHeight: 18,
  },
  bookmarkEditor: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  bookmarkEditorLabel: {
    fontSize: 12,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 6,
  },
  bookmarkEditorInput: {
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.15)',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    marginBottom: 8,
  },
  bookmarkEditorActions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  bookmarkEditorBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkEditorSaveBtn: {
    backgroundColor: PRIMARY_BLUE,
  },
  bookmarkEditorCancelBtn: {
    backgroundColor: '#eef2ff',
  },
  bookmarkEditorSaveText: {
    fontSize: 13,
    fontFamily: 'Heebo_600SemiBold',
    color: '#fff',
  },
  bookmarkEditorCancelText: {
    fontSize: 13,
    fontFamily: 'Heebo_600SemiBold',
    color: PRIMARY_BLUE,
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(11,27,58,0.1)',
    marginBottom: 24,
  },
  textContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  textContainerRtl: {
    direction: 'rtl',
  },
  textContent: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 32,
    writingDirection: 'rtl',
  },
})
