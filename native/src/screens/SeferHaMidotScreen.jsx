import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'
import { getText, getIndex, formatTextForDisplay } from '../services/sefaria'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// קטגוריות ספר המידות - ננסה מספר אפשרויות של tref
const MIDOT_CATEGORIES = [
  { 
    id: 'ahava', 
    title: 'אהבה',
    trefOptions: [
      'Sefer HaMidot.1',
      'Sefer_HaMidot.1',
      'Sefer HaMidot, Love',
      'Likutei Moharan, Sefer HaMidot, Love'
    ]
  },
  { 
    id: 'yira', 
    title: 'יראה',
    trefOptions: [
      'Sefer HaMidot.2',
      'Sefer_HaMidot.2',
      'Sefer HaMidot, Fear',
      'Likutei Moharan, Sefer HaMidot, Fear'
    ]
  },
  { 
    id: 'tefila', 
    title: 'תפילה',
    trefOptions: [
      'Sefer HaMidot.3',
      'Sefer_HaMidot.3',
      'Sefer HaMidot, Prayer',
      'Likutei Moharan, Sefer HaMidot, Prayer'
    ]
  },
  { 
    id: 'tzedaka', 
    title: 'צדקה',
    trefOptions: [
      'Sefer HaMidot.4',
      'Sefer_HaMidot.4',
      'Sefer HaMidot, Charity',
      'Likutei Moharan, Sefer HaMidot, Charity'
    ]
  },
  { 
    id: 'torah', 
    title: 'תורה',
    trefOptions: [
      'Sefer HaMidot.5',
      'Sefer_HaMidot.5',
      'Sefer HaMidot, Torah',
      'Likutei Moharan, Sefer HaMidot, Torah'
    ]
  },
  { 
    id: 'avoda', 
    title: 'עבודה',
    trefOptions: [
      'Sefer HaMidot.6',
      'Sefer_HaMidot.6',
      'Sefer HaMidot, Service',
      'Likutei Moharan, Sefer HaMidot, Service'
    ]
  },
  { 
    id: 'bitachon', 
    title: 'בטחון',
    trefOptions: [
      'Sefer HaMidot.7',
      'Sefer_HaMidot.7',
      'Sefer HaMidot, Trust',
      'Likutei Moharan, Sefer HaMidot, Trust'
    ]
  },
  { 
    id: 'simcha', 
    title: 'שמחה',
    trefOptions: [
      'Sefer HaMidot.8',
      'Sefer_HaMidot.8',
      'Sefer HaMidot, Joy',
      'Likutei Moharan, Sefer HaMidot, Joy'
    ]
  },
]

export default function SeferHaMidotScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryContent, setCategoryContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bookIndex, setBookIndex] = useState(null)
  const [loadingIndex, setLoadingIndex] = useState(true)

  // נסה לטעון את המבנה של הספר מ-Sefaria
  useEffect(() => {
    const loadBookIndex = async () => {
      try {
        // ננסה מספר אפשרויות
        const possibleNames = [
          'Sefer HaMidot',
          'Sefer_HaMidot',
          'Likutei Moharan',
          'Sefer Hamidot'
        ]
        
        for (const name of possibleNames) {
          try {
            const index = await getIndex(name)
            console.log('✅ Found book index:', name)
            setBookIndex(index)
            break
          } catch (e) {
            console.log('❌ Not found:', name)
          }
        }
      } catch (error) {
        console.error('Error loading book index:', error)
      } finally {
        setLoadingIndex(false)
      }
    }
    
    loadBookIndex()
  }, [])

  const handleCategoryPress = async (category) => {
    setSelectedCategory(category)
    setLoading(true)
    setCategoryContent(null)

    try {
      // ננסה כל אפשרות tref עד שזה יעבוד
      let textData = null
      let lastError = null
      
      for (const tref of category.trefOptions) {
        try {
          console.log(`Trying tref: ${tref}`)
          textData = await getText(tref, { lang: 'he' })
          console.log(`✅ Success with tref: ${tref}`)
          break
        } catch (error) {
          console.log(`❌ Failed with tref: ${tref}`, error.message)
          lastError = error
          continue
        }
      }

      if (textData) {
        const formatted = formatTextForDisplay(textData)
        setCategoryContent({
          title: category.title,
          content: formatted.hebrew || formatted.content || '',
          hebrew: formatted.hebrew || formatted.content || '',
        })
      } else {
        // אם לא מצאנו, ננסה דרך ה-index
        if (bookIndex && bookIndex.sections) {
          // ננסה למצוא את הקטגוריה במבנה
          const section = bookIndex.sections.find(s => 
            s.title === category.title || 
            s.heTitle === category.title ||
            s.title?.toLowerCase().includes(category.id)
          )
          
          if (section) {
            try {
              const sectionTref = `${bookIndex.title}.${section.title}`
              textData = await getText(sectionTref, { lang: 'he' })
              const formatted = formatTextForDisplay(textData)
              setCategoryContent({
                title: category.title,
                content: formatted.hebrew || formatted.content || '',
                hebrew: formatted.hebrew || formatted.content || '',
              })
            } catch (e) {
              throw lastError || e
            }
          } else {
            throw lastError || new Error('Category not found')
          }
        } else {
          throw lastError || new Error('Could not load content')
        }
      }
    } catch (error) {
      console.error('Error loading category:', error)
      Alert.alert(
        'שגיאה',
        `לא ניתן לטעון את התוכן של "${category.title}".\n\nנסה שוב מאוחר יותר או בדוק את החיבור לאינטרנט.`,
        [{ text: 'אישור' }]
      )
      setSelectedCategory(null)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null)
      setCategoryContent(null)
    } else {
      navigation.goBack()
    }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="ספר המידות"
          subtitle="לרבי נחמן מברסלב"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען תוכן...</Text>
        </View>
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
