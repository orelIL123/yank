import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'
import { getText, formatTextForDisplay } from '../services/sefaria'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// קטגוריות ספר המידות לפי Sefaria
const MIDOT_CATEGORIES = [
  { 
    id: 'ahava', 
    title: 'אהבה', 
    tref: 'Sefer HaMidot, Love',
    icon: 'heart',
    gradient: ['#ff6b6b', '#ee5a6f']
  },
  { 
    id: 'yira', 
    title: 'יראה', 
    tref: 'Sefer HaMidot, Fear',
    icon: 'shield',
    gradient: ['#4facfe', '#00f2fe']
  },
  { 
    id: 'tefila', 
    title: 'תפילה', 
    tref: 'Sefer HaMidot, Prayer',
    icon: 'hands',
    gradient: ['#a8edea', '#fed6e3']
  },
  { 
    id: 'tzedaka', 
    title: 'צדקה', 
    tref: 'Sefer HaMidot, Charity',
    icon: 'gift',
    gradient: ['#ffecd2', '#fcb69f']
  },
  { 
    id: 'torah', 
    title: 'תורה', 
    tref: 'Sefer HaMidot, Torah',
    icon: 'book',
    gradient: ['#667eea', '#764ba2']
  },
  { 
    id: 'avoda', 
    title: 'עבודה', 
    tref: 'Sefer HaMidot, Service',
    icon: 'flame',
    gradient: ['#f093fb', '#f5576c']
  },
  { 
    id: 'bitachon', 
    title: 'בטחון', 
    tref: 'Sefer HaMidot, Trust',
    icon: 'lock-closed',
    gradient: ['#4facfe', '#00f2fe']
  },
  { 
    id: 'simcha', 
    title: 'שמחה', 
    tref: 'Sefer HaMidot, Joy',
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

    try {
      // נסה למשוך את התוכן מ-Sefaria
      // אם זה לא עובד, נשתמש בתוכן מקומי
      const textData = await getText(category.tref, { lang: 'he' })
      const formatted = formatTextForDisplay(textData)
      setCategoryContent(formatted)
    } catch (error) {
      console.error('Error loading category:', error)
      // אם Sefaria לא עובד, נציג הודעה
      setCategoryContent({
        title: category.title,
        content: `תוכן ${category.title} - יטען בקרוב`,
        hebrew: `תוכן ${category.title} - יטען בקרוב`,
      })
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

