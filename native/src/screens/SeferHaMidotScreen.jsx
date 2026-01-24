import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import { getText, getIndexV2, searchBook, getTableOfContents, formatTextForDisplay } from '../services/sefaria'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// קטגוריות ספר המידות - תוכן אמיתי מ-Sefaria API בלבד
// שמות מדויקים כפי שמופיעים ב-Sefaria לפי הסדר האלפביתי
const MIDOT_CATEGORIES = [
  { id: 'truth', title: 'אמת', englishTitle: 'Truth' },
  { id: 'hospitality', title: 'הכנסת אורחים', englishTitle: 'Hospitality' },
  { id: 'love', title: 'אהבה', englishTitle: 'Love' },
  { id: 'faith', title: 'אמונה', englishTitle: 'Faith' },
  { id: 'eating', title: 'אכילה', englishTitle: 'Eating' },
  { id: 'widower', title: 'אלמן', englishTitle: 'A Widower' },
  { id: 'land-of-israel', title: 'ארץ ישראל', englishTitle: 'The Land of Israel' },
  { id: 'lost-objects', title: 'אבידה', englishTitle: 'Lost Objects' },
  { id: 'children', title: 'בנים', englishTitle: 'Children' },
  { id: 'house', title: 'בית', englishTitle: 'A House' },
  { id: 'shame', title: 'בושה', englishTitle: 'Embarrassment; Modesty' },
  { id: 'clothes', title: 'בגדים', englishTitle: 'Clothing' },
  { id: 'trust', title: 'בטחון', englishTitle: 'Trust in God' },
  { id: 'tidings', title: 'בשורה', englishTitle: 'Tidings' },
  { id: 'blessing', title: 'ברכה', englishTitle: 'Blessing' },
  { id: 'crying', title: 'בכייה', englishTitle: 'Crying' },
  { id: 'arrogance', title: 'גאוה', englishTitle: 'Haughtiness' },
  { id: 'theft', title: 'גניבה וגזילה', englishTitle: 'Theft and Robbery' },
  { id: 'knowledge', title: 'דעת', englishTitle: 'Knowledge of God' },
  { id: 'travel', title: 'דרך', englishTitle: 'Traveling' },
  { id: 'judge', title: 'דיין', englishTitle: 'A Judge' },
  { id: 'sweetening', title: 'המתקת דין', englishTitle: 'Mitigating Judgment' },
  { id: 'seclusion', title: 'התבודדות', englishTitle: 'Seclusion' },
  { id: 'thoughts', title: 'הרהורים', englishTitle: 'Improper Thoughts' },
  { id: 'high-position', title: 'התנשאות', englishTitle: 'Prestige and Importance' },
  { id: 'success', title: 'הצלחה', englishTitle: 'Success and Prosperity' },
  { id: 'pregnancy', title: 'הריון', englishTitle: 'Conception; Pregnancy' },
  { id: 'instruction', title: 'הוראה', englishTitle: 'Instruction' },
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
  { id: 'salvation', title: 'ישועה', englishTitle: 'Salvation and Miracles' },
  { id: 'fear', title: 'יראה', englishTitle: 'Fear of God' },
  { id: 'lineage', title: 'יחוס', englishTitle: 'Distinguished Ancestry' },
  { id: 'honor', title: 'כבוד', englishTitle: 'Honor and Respect' },
  { id: 'anger', title: 'כעס', englishTitle: 'Anger' },
  { id: 'sorcery', title: 'כישוף', englishTitle: 'Sorcery' },
  { id: 'strife', title: 'מחלוקת', englishTitle: 'Strife and Quarreling' },
  { id: 'livelihood', title: 'מזונות', englishTitle: 'Livelihood; Sustenance' },
  { id: 'illness', title: 'מחלה', englishTitle: 'Illness' },
  { id: 'war', title: 'מלחמה', englishTitle: 'War' },
  { id: 'death', title: 'מיתה', englishTitle: 'Death' },
  { id: 'heresy', title: 'מינות', englishTitle: 'Heresy' },
  { id: 'leader', title: 'נשיא', englishTitle: 'A Leader' },
  { id: 'soul', title: 'נשמה', englishTitle: 'The Soul' },
  { id: 'prayer', title: 'תפילה', englishTitle: 'Prayer' },
  { id: 'repentance', title: 'תשובה', englishTitle: 'Repentance' },
  { id: 'torah', title: 'תורה', englishTitle: 'Torah Study' },
  { id: 'joy', title: 'שמחה', englishTitle: 'Joy and Happiness' },
  { id: 'peace', title: 'שלום', englishTitle: 'Peace' },
  { id: 'humility', title: 'ענווה', englishTitle: 'Humility' },
  { id: 'charity', title: 'צדקה', englishTitle: 'Charity' },
  { id: 'tzaddik', title: 'צדיק', englishTitle: 'A Tzaddik' },
  { id: 'fasting', title: 'תענית', englishTitle: 'Fasting' },
]

export default function SeferHaMidotScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryContent, setCategoryContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bookFound, setBookFound] = useState(null)

  // Try to find Sefer HaMidot in Sefaria - using correct API endpoint
  useEffect(() => {
    const findBook = async () => {
      try {
        console.log('🔍 Loading Sefer HaMiddot from Sefaria API...')
        // Use the direct API endpoint: https://www.sefaria.org/api/texts/Sefer_HaMiddot
        const correctName = 'Sefer_HaMiddot'
        
        try {
          // First try to get the index/structure
          const index = await getIndexV2(correctName)
          console.log('✅ Found book index:', correctName, index.title || index.heTitle)
          setBookFound({ name: correctName, index })
          
          // Also try to get the full text structure
          try {
            const fullText = await getText(correctName, { lang: 'he' })
            console.log('✅ Got full text structure')
            if (fullText) {
              setBookFound(prev => ({ ...prev, fullText }))
            }
          } catch (e) {
            console.log('⚠️ Could not get full text, will use index structure')
          }
        } catch (e) {
          console.log('❌ Could not get index:', e.message)
          // Try direct text endpoint
          try {
            const textData = await getText(correctName, { lang: 'he' })
            console.log('✅ Got text directly')
            setBookFound({ name: correctName, fullText: textData })
          } catch (err) {
            console.log('❌ Could not get text either:', err.message)
          }
        }
      } catch (error) {
        console.error('Error finding book:', error)
      }
    }
    
    findBook()
  }, [])

  const handleCategoryPress = async (category) => {
    setSelectedCategory(category)
    setLoading(true)
    setCategoryContent(null)

    // Sefaria API requires specific tref format: Sefer HaMiddot, Category, Part I/II
    try {
      const bookName = 'Sefer HaMiddot'
      const englishCategory = category.englishTitle

      console.log(`🔍 Loading from Sefaria: ${bookName}, ${englishCategory}`)

      // Try to load both Part I and Part II and combine them
      const parts = []

      for (const partNum of ['Part I', 'Part II']) {
        try {
          const tref = `${bookName}, ${englishCategory}, ${partNum}`
          console.log(`🔍 Trying: ${tref}`)
          const textData = await getText(tref, { lang: 'he' })

          if (textData && textData.he) {
            console.log(`✅ Loaded ${partNum}`)
            const content = Array.isArray(textData.he) ? textData.he : [textData.he]
            parts.push({
              title: partNum === 'Part I' ? 'חלק ראשון' : 'חלק שני',
              content: content.filter(p => p && p.trim()).join('\n\n')
            })
          }
        } catch (e) {
          console.log(`⚠️ ${partNum} not available: ${e.message}`)
        }
      }

      // If we have content from any part, show it
      if (parts.length > 0) {
        const combinedContent = parts.map(part =>
          `${part.title}\n\n${part.content}`
        ).join('\n\n―――――――――――\n\n')

        setCategoryContent({
          title: category.title,
          content: combinedContent,
          hebrew: combinedContent,
        })
        setLoading(false)
        return
      }

      // If no parts found, show error
      throw new Error('No content found')

    } catch (error) {
      console.error('Error loading from Sefaria:', error)
      Alert.alert(
        'שגיאה',
        `לא ניתן לטעון את התוכן של "${category.title}" מ-Sefaria.\n\nאנא בדוק את החיבור לאינטרנט ונסה שוב.`,
        [
          { text: 'ביטול', onPress: () => setSelectedCategory(null) },
          { text: 'נסה שוב', onPress: () => handleCategoryPress(category) }
        ]
      )
      setSelectedCategory(null)
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null)
    } else {
      navigation.goBack()
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title={selectedCategory?.title || 'ספר המידות'}
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
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title={categoryContent.title || selectedCategory.title}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{selectedCategory.title}</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.textContent}>{categoryContent.hebrew || categoryContent.content}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="ספר המידות"
        subtitle="לרבי נחמן מברסלב"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.introText}>
          בחרו קטגוריה כדי לקרוא את המידות של רבי נחמן מברסלב
        </Text>
        
        <View style={styles.categoriesList}>
          {MIDOT_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryCardContent}>
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
    marginBottom: 16,
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
  textContent: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 32,
  },
})
