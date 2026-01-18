import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// תוכן מלא של ספר המידות - לרבי נחמן מברסלב
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

  const handleCategoryPress = (category) => {
    setSelectedCategory(category)
  }

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null)
    } else {
      navigation.goBack()
    }
  }

  if (selectedCategory) {
    const content = MIDOT_CONTENT[selectedCategory.id]
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title={content.title}
          showBackButton={true}
          onBackPress={handleBack}
        />
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{content.title}</Text>
            <View style={styles.divider} />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.textContent}>{content.content}</Text>
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
