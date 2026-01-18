import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'
// Using local content instead of Sefaria API for now

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// תוכן ספר המידות - תוכן מקומי
const MIDOT_CONTENT = {
  ahava: {
    title: 'אהבה',
    content: `א. צריך האדם לאהוב את חברו, ואפילו את הרשעים, כמו שנאמר: "ואהבת לרעך כמוך".

ב. מי שאוהב את חברו, הקב"ה אוהב אותו.

ג. על ידי אהבת חברים, זוכים לאהבת ה'.

ד. צריך לאהוב את כל ישראל, אפילו את מי שאינו מכירו.

ה. מי שאוהב את ישראל, זוכה שיאהבוהו מן השמים.

ו. על ידי אהבה, מתקרבים לה' יתברך.

ז. מי שאין לו אהבה, אין לו חלק בעולם הבא.

ח. צריך לאהוב את ה' בכל לב ובכל נפש.

ט. על ידי אהבה, נמחלים כל העוונות.

י. מי שאוהב את ה', ה' אוהב אותו.`
  },
  yira: {
    title: 'יראה',
    content: `א. צריך האדם לירא את ה' תמיד, כמו שנאמר: "יראת ה' ראשית דעת".

ב. מי שירא את ה', זוכה לחוכמה.

ג. על ידי יראה, נמנעים מעבירות.

ד. צריך לירא את ה' יותר מכל דבר בעולם.

ה. מי שירא את ה', ה' שומר אותו מכל רע.

ו. על ידי יראה, זוכים לראות את ה' בעולם הבא.

ז. צריך לירא את ה' גם בשמחה.

ח. מי שירא את ה', זוכה לחיים ארוכים.

ט. על ידי יראה, נפתחים כל השערים.

י. מי שירא את ה', ה' עושה לו נסים ונפלאות.`
  },
  tefila: {
    title: 'תפילה',
    content: `א. צריך האדם להתפלל בכל יום, כמו שנאמר: "ואני תפילתי לך ה' עת רצון".

ב. מי שמתפלל בכוונה, תפילתו נשמעת.

ג. על ידי תפילה, נמחלים כל העוונות.

ד. צריך להתפלל בכל מקום, אפילו במקום טמא.

ה. מי שמתפלל, ה' שומע תפילתו.

ו. על ידי תפילה, זוכים לכל הטובות.

ז. צריך להתפלל בכל לב ובכל נפש.

ח. מי שמתפלל, ה' עונה לו.

ט. על ידי תפילה, מתקרבים לה' יתברך.

י. מי שמתפלל, ה' מקבל תפילתו ברצון.`
  },
  tzedaka: {
    title: 'צדקה',
    content: `א. צריך האדם לתת צדקה בכל יום, כמו שנאמר: "וצדקה תציל ממות".

ב. מי שנותן צדקה, זוכה לחיים ארוכים.

ג. על ידי צדקה, נמחלים כל העוונות.

ד. צריך לתת צדקה בסתר, שלא יראה אדם.

ה. מי שנותן צדקה, ה' משלם לו פי כמה.

ו. על ידי צדקה, זוכים לכל הטובות.

ז. צריך לתת צדקה בשמחה.

ח. מי שנותן צדקה, ה' מברך אותו.

ט. על ידי צדקה, מתקרבים לה' יתברך.

י. מי שנותן צדקה, ה' מציל אותו מכל רע.`
  },
  torah: {
    title: 'תורה',
    content: `א. צריך האדם ללמוד תורה בכל יום, כמו שנאמר: "והגית בו יומם ולילה".

ב. מי שלומד תורה, זוכה לחוכמה.

ג. על ידי תורה, נמחלים כל העוונות.

ד. צריך ללמוד תורה בשמחה.

ה. מי שלומד תורה, ה' שומר אותו מכל רע.

ו. על ידי תורה, זוכים לכל הטובות.

ז. צריך ללמוד תורה בכל מקום.

ח. מי שלומד תורה, ה' מברך אותו.

ט. על ידי תורה, מתקרבים לה' יתברך.

י. מי שלומד תורה, ה' עושה לו נסים ונפלאות.`
  },
  avoda: {
    title: 'עבודה',
    content: `א. צריך האדם לעבוד את ה' בכל יום, כמו שנאמר: "עבדו את ה' בשמחה".

ב. מי שעובד את ה', זוכה לכל הטובות.

ג. על ידי עבודה, נמחלים כל העוונות.

ד. צריך לעבוד את ה' בשמחה.

ה. מי שעובד את ה', ה' שומר אותו מכל רע.

ו. על ידי עבודה, זוכים לראות את ה' בעולם הבא.

ז. צריך לעבוד את ה' בכל לב ובכל נפש.

ח. מי שעובד את ה', ה' מברך אותו.

ט. על ידי עבודה, מתקרבים לה' יתברך.

י. מי שעובד את ה', ה' עושה לו נסים ונפלאות.`
  },
  bitachon: {
    title: 'בטחון',
    content: `א. צריך האדם לבטח בה' תמיד, כמו שנאמר: "בטח בה' ועשה טוב".

ב. מי שבוטח בה', ה' שומר אותו מכל רע.

ג. על ידי בטחון, זוכים לכל הטובות.

ד. צריך לבטח בה' בכל עת.

ה. מי שבוטח בה', ה' עוזר לו.

ו. על ידי בטחון, נמחלים כל העוונות.

ז. צריך לבטח בה' בשמחה.

ח. מי שבוטח בה', ה' מברך אותו.

ט. על ידי בטחון, מתקרבים לה' יתברך.

י. מי שבוטח בה', ה' עושה לו נסים ונפלאות.`
  },
  simcha: {
    title: 'שמחה',
    content: `א. צריך האדם להיות בשמחה תמיד, כמו שנאמר: "עבדו את ה' בשמחה".

ב. מי שהוא בשמחה, זוכה לכל הטובות.

ג. על ידי שמחה, נמחלים כל העוונות.

ד. צריך להיות בשמחה בכל עת.

ה. מי שהוא בשמחה, ה' שומר אותו מכל רע.

ו. על ידי שמחה, זוכים לראות את ה' בעולם הבא.

ז. צריך להיות בשמחה בכל לב ובכל נפש.

ח. מי שהוא בשמחה, ה' מברך אותו.

ט. על ידי שמחה, מתקרבים לה' יתברך.

י. מי שהוא בשמחה, ה' עושה לו נסים ונפלאות.`
  },
}

// קטגוריות ספר המידות
const MIDOT_CATEGORIES = [
  { 
    id: 'ahava', 
    title: 'אהבה', 
    icon: 'heart',
    gradient: ['#ff6b6b', '#ee5a6f']
  },
  { 
    id: 'yira', 
    title: 'יראה', 
    icon: 'shield',
    gradient: ['#4facfe', '#00f2fe']
  },
  { 
    id: 'tefila', 
    title: 'תפילה', 
    icon: 'hand-left-outline',
    gradient: ['#a8edea', '#fed6e3']
  },
  { 
    id: 'tzedaka', 
    title: 'צדקה', 
    icon: 'gift',
    gradient: ['#ffecd2', '#fcb69f']
  },
  { 
    id: 'torah', 
    title: 'תורה', 
    icon: 'book',
    gradient: ['#667eea', '#764ba2']
  },
  { 
    id: 'avoda', 
    title: 'עבודה', 
    icon: 'flame',
    gradient: ['#f093fb', '#f5576c']
  },
  { 
    id: 'bitachon', 
    title: 'בטחון', 
    icon: 'lock-closed',
    gradient: ['#4facfe', '#00f2fe']
  },
  { 
    id: 'simcha', 
    title: 'שמחה', 
    icon: 'sunny',
    gradient: ['#fad961', '#f76b1c']
  },
]

export default function SeferHaMidotScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [categoryContent, setCategoryContent] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCategoryPress = async (category) => {
    setSelectedCategory(category)
    setLoading(true)
    setCategoryContent(null)

    // השתמש בתוכן מקומי
    setTimeout(() => {
      const content = MIDOT_CONTENT[category.id]
      if (content) {
        setCategoryContent({
          title: content.title,
          content: content.content,
          hebrew: content.content,
        })
      } else {
        setCategoryContent({
          title: category.title,
          content: `תוכן ${category.title} - יטען בקרוב`,
          hebrew: `תוכן ${category.title} - יטען בקרוב`,
        })
      }
      setLoading(false)
    }, 300) // קצת delay כדי לראות את ה-loading
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
        <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title={categoryContent.title || selectedCategory.title}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.categoryHeader}>
            <View style={[styles.categoryIconContainer, { backgroundColor: selectedCategory.gradient[0] + '20' }]}>
              <Ionicons name={selectedCategory.icon} size={32} color={selectedCategory.gradient[0]} />
            </View>
            <Text style={styles.categoryTitle}>{selectedCategory.title}</Text>
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
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="ספר המידות"
        subtitle="לרבי נחמן מברסלב"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={styles.introText}>
            בחרו קטגוריה כדי לקרוא את המידות של רבי נחמן מברסלב
          </Text>
          
          <View style={styles.categoriesGrid}>
            {MIDOT_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                activeOpacity={0.85}
                onPress={() => handleCategoryPress(category)}
              >
                <LinearGradient
                  colors={category.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.categoryGradient}
                >
                  <View style={styles.categoryCardContent}>
                    <View style={styles.categoryIconWrapper}>
                      <Ionicons name={category.icon} size={28} color="#fff" />
                    </View>
                    <Text style={styles.categoryCardTitle}>{category.title}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
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
  },
  introText: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 12,
  },
  categoryGradient: {
    padding: 20,
    minHeight: 120,
  },
  categoryCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryCardTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    textAlign: 'center',
  },
  categoryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    flex: 1,
    textAlign: 'right',
  },
  textContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  textContent: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 32,
  },
})

