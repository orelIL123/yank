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
const MIDOT_CATEGORIES = [
  { id: 'ahava', title: 'אהבה' },
  { id: 'yira', title: 'יראה' },
  { id: 'tefila', title: 'תפילה' },
  { id: 'tzedaka', title: 'צדקה' },
  { id: 'torah', title: 'תורה' },
  { id: 'avoda', title: 'עבודה' },
  { id: 'bitachon', title: 'בטחון' },
  { id: 'simcha', title: 'שמחה' },
]

export default function SeferHaMidotScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryContent, setCategoryContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [bookFound, setBookFound] = useState(null)

  // Try to find Sefer HaMidot in Sefaria - using correct name: Sefer_HaMiddot
  useEffect(() => {
    const findBook = async () => {
      try {
        console.log('🔍 Searching for Sefer HaMiddot in Sefaria...')
        // The correct name according to Sefaria URL is Sefer_HaMiddot (with double d)
        const correctName = 'Sefer_HaMiddot'
        
        try {
          const index = await getIndexV2(correctName)
          console.log('✅ Found book:', correctName, index.title || index.heTitle)
          setBookFound({ name: correctName, index })
        } catch (e) {
          console.log('❌ Not found:', correctName, e.message)
          // Fallback: try other variations
          const possibleNames = [
            'Sefer HaMiddot',
            'Sefer_HaMidot',
            'Sefer HaMidot'
          ]
          
          for (const name of possibleNames) {
            try {
              const index = await getIndexV2(name)
              console.log('✅ Found book:', name)
              setBookFound({ name, index })
              break
            } catch (err) {
              console.log('❌ Not found:', name)
            }
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

    // First try Sefaria API if book was found
    if (bookFound) {
      try {
        // According to Sefaria structure at https://www.sefaria.org/Sefer_HaMiddot
        // Map Hebrew titles to English category names as they appear in Sefaria
        const categoryMap = {
          'אהבה': 'Love',
          'יראה': 'Fear of God',
          'תפילה': 'Prayer',
          'צדקה': 'Charity',
          'תורה': 'Torah Study',
          'עבודה': 'Torah Study', // Service/Work - using Torah Study as closest match
          'בטחון': 'Trust in God',
          'שמחה': 'Joy and Happiness'
        }
        
        const englishCategory = categoryMap[category.title] || category.title
        
        // Try different tref formats based on Sefaria structure
        const trefOptions = [
          `${bookFound.name}, ${englishCategory}`,
          `${bookFound.name}.${englishCategory}`,
          `${bookFound.name}, ${englishCategory}, Part I`,
          `${bookFound.name}, ${englishCategory}, Part II`,
        ]
        
        for (const tref of trefOptions) {
          try {
            console.log(`🔍 Trying tref: ${tref}`)
            const textData = await getText(tref, { lang: 'he' })
            const formatted = formatTextForDisplay(textData)
            if (formatted.hebrew || formatted.content) {
              console.log(`✅ Success! Loaded content from Sefaria`)
              setCategoryContent({
                title: category.title,
                content: formatted.hebrew || formatted.content,
                hebrew: formatted.hebrew || formatted.content,
              })
              setLoading(false)
              return
            }
          } catch (e) {
            console.log(`❌ Failed: ${tref} - ${e.message}`)
          }
        }
        
        // If specific category not found, try to get the index structure
        if (bookFound.index && bookFound.index.nodes) {
          // Search in the index structure for matching category
          const findCategoryInIndex = (nodes, searchTitle) => {
            for (const node of nodes) {
              if (node.title === searchTitle || node.heTitle === searchTitle || 
                  node.title?.includes(englishCategory) || node.heTitle?.includes(category.title)) {
                return node
              }
              if (node.nodes) {
                const found = findCategoryInIndex(node.nodes, searchTitle)
                if (found) return found
              }
            }
            return null
          }
          
          const categoryNode = findCategoryInIndex(bookFound.index.nodes, category.title)
          if (categoryNode && categoryNode.ref) {
            try {
              const textData = await getText(categoryNode.ref, { lang: 'he' })
              const formatted = formatTextForDisplay(textData)
              if (formatted.hebrew || formatted.content) {
                console.log(`✅ Success! Loaded via index structure`)
                setCategoryContent({
                  title: category.title,
                  content: formatted.hebrew || formatted.content,
                  hebrew: formatted.hebrew || formatted.content,
                })
                setLoading(false)
                return
              }
            } catch (e) {
              console.log(`❌ Failed to load via index: ${e.message}`)
            }
          }
        }
      } catch (error) {
        console.error('Error loading from Sefaria:', error)
      }
    }

    // If we couldn't load from Sefaria, show error
    if (!categoryContent) {
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
