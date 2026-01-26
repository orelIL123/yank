import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { WebView } from 'react-native-webview'

import AppHeader from '../components/AppHeader'
import { getText, formatSefariaContent } from '../services/sefaria'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Calculate daily Tehillim chapter based on day of month (1-30/31)
// Day 1 = Chapter 1, Day 2 = Chapter 2, etc.
// Cycles through 1-150 (so day 151 = chapter 1, etc.)
function getDailyTehillimChapter() {
  const today = new Date()
  const dayOfMonth = today.getDate()
  
  // Simple mapping: day of month maps to chapter number
  // If day > 150, cycle back (day 151 = chapter 1, day 152 = chapter 2, etc.)
  const chapter = ((dayOfMonth - 1) % 150) + 1
  return chapter
}

// Generate all 150 chapters
const TEHILLIM_CHAPTERS = Array.from({ length: 150 }, (_, i) => i + 1)

export default function TehillimScreen({ navigation }) {
  const [selectedChapter, setSelectedChapter] = useState(null)
  const [chapterContent, setChapterContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState('he') // 'he' for Hebrew, 'en' for English
  const [dailyChapter, setDailyChapter] = useState(null)
  const [dailyContent, setDailyContent] = useState(null)
  const [loadingDaily, setLoadingDaily] = useState(true)

  useEffect(() => {
    loadDailyChapter()
  }, [])

  const loadDailyChapter = async () => {
    try {
      setLoadingDaily(true)
      const chapter = getDailyTehillimChapter()
      setDailyChapter(chapter)
      
      // Load daily chapter content
      const tref = `Psalms.${chapter}`
      const textData = await getText(tref, { lang: language })
      
      const formatted = formatSefariaContent(textData, {
        preserveStructure: true,
        language: language,
        addChapterNumbers: false,
      })
      
      setDailyContent(formatted)
    } catch (error) {
      console.error('Error loading daily chapter:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את הפרק היומי')
    } finally {
      setLoadingDaily(false)
    }
  }

  const handleChapterPress = async (chapter) => {
    setSelectedChapter(chapter)
    setLoading(true)
    
    try {
      const tref = `Psalms.${chapter}`
      const textData = await getText(tref, { lang: language })
      
      const formatted = formatSefariaContent(textData, {
        preserveStructure: true,
        language: language,
        addChapterNumbers: false,
      })
      
      setChapterContent(formatted)
    } catch (error) {
      console.error('Error loading chapter:', error)
      Alert.alert('שגיאה', `לא ניתן לטעון את פרק ${chapter}`)
      setSelectedChapter(null)
    } finally {
      setLoading(false)
    }
  }

  const buildSefariaUrl = (chapter, lang) => {
    const langParam = lang === 'en' ? 'en' : 'he'
    return `https://www.sefaria.org/Psalms.${chapter}?lang=${langParam}`
  }

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang)
    if (selectedChapter) {
      // Reload current chapter with new language
      handleChapterPress(selectedChapter)
    } else if (dailyChapter) {
      // Reload daily chapter with new language
      loadDailyChapter()
    }
  }

  // If a chapter is selected, show its content
  if (selectedChapter && chapterContent) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title={`תהילים פרק ${selectedChapter}`}
          showBackButton={true}
          onBackPress={() => {
            setSelectedChapter(null)
            setChapterContent(null)
          }}
        />

        <View style={styles.webViewHeader}>
          {/* Language Toggle */}
          <View style={styles.languageToggle}>
            <Pressable
              style={[styles.languageButton, language === 'he' && styles.languageButtonActive]}
              onPress={() => handleLanguageChange('he')}
            >
              <Text style={[styles.languageButtonText, language === 'he' && styles.languageButtonTextActive]}>
                עברית
              </Text>
            </Pressable>
            <Pressable
              style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
              onPress={() => handleLanguageChange('en')}
            >
              <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
                English
              </Text>
            </Pressable>
          </View>

          {/* Open in Browser Button */}
          <Pressable
            style={styles.externalLinkButton}
            onPress={() => Linking.openURL(buildSefariaUrl(selectedChapter, language))}
          >
            <Ionicons name="open-outline" size={18} color={PRIMARY_BLUE} />
            <Text style={styles.externalLinkText}>פתח באתר</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_BLUE} />
            <Text style={styles.loadingText}>טוען תוכן...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.contentView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.contentHeader}>
              <Text style={styles.contentTitle}>תהילים פרק {selectedChapter}</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.textContainer}>
              <Text style={[
                styles.textContent,
                language === 'en' && {
                  fontFamily: 'Poppins_400Regular',
                  textAlign: 'left',
                  writingDirection: 'ltr',
                }
              ]}>
                {language === 'he' ? (chapterContent.hebrew || chapterContent.content) : (chapterContent.english || chapterContent.content)}
              </Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    )
  }

  // Main screen - show daily chapter and list of all chapters
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="תהילים"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Chapter Section */}
        <View style={styles.dailySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>פרק יומי</Text>
            <View style={styles.languageToggle}>
              <Pressable
                style={[styles.languageButtonSmall, language === 'he' && styles.languageButtonActive]}
                onPress={() => handleLanguageChange('he')}
              >
                <Text style={[styles.languageButtonTextSmall, language === 'he' && styles.languageButtonTextActive]}>
                  עברית
                </Text>
              </Pressable>
              <Pressable
                style={[styles.languageButtonSmall, language === 'en' && styles.languageButtonActive]}
                onPress={() => handleLanguageChange('en')}
              >
                <Text style={[styles.languageButtonTextSmall, language === 'en' && styles.languageButtonTextActive]}>
                  English
                </Text>
              </Pressable>
            </View>
          </View>

          {loadingDaily ? (
            <View style={styles.dailyLoadingContainer}>
              <ActivityIndicator size="small" color={PRIMARY_BLUE} />
            </View>
          ) : dailyContent ? (
            <Pressable
              style={styles.dailyCard}
              onPress={() => {
                setSelectedChapter(dailyChapter)
                setChapterContent(dailyContent)
              }}
            >
              <LinearGradient
                colors={['rgba(30,58,138,0.1)', 'rgba(30,58,138,0.05)']}
                style={styles.dailyCardGradient}
              >
                <View style={styles.dailyCardContent}>
                  <View style={styles.dailyChapterNumber}>
                    <Text style={styles.dailyChapterNumberText}>{dailyChapter}</Text>
                  </View>
                  <View style={styles.dailyCardText}>
                    <Text style={styles.dailyCardTitle}>פרק {dailyChapter} - תהילים יומי</Text>
                    <Text style={styles.dailyCardDescription} numberOfLines={3}>
                      {language === 'he' 
                        ? (dailyContent.hebrew || dailyContent.content || '').substring(0, 100) + '...'
                        : (dailyContent.english || dailyContent.content || '').substring(0, 100) + '...'
                      }
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={PRIMARY_BLUE} />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            <View style={styles.dailyEmptyContainer}>
              <Text style={styles.emptyText}>לא ניתן לטעון את הפרק היומי</Text>
            </View>
          )}
        </View>

        {/* All Chapters Section */}
        <View style={styles.chaptersSection}>
          <Text style={styles.sectionTitle}>כל הפרקים</Text>
          <Text style={styles.sectionSubtitle}>לחץ על פרק לצפייה</Text>

          <View style={styles.chaptersGrid}>
            {TEHILLIM_CHAPTERS.map((chapter) => (
              <Pressable
                key={chapter}
                style={[
                  styles.chapterCard,
                  chapter === dailyChapter && styles.chapterCardDaily
                ]}
                onPress={() => handleChapterPress(chapter)}
              >
                <Text style={[
                  styles.chapterNumber,
                  chapter === dailyChapter && styles.chapterNumberDaily
                ]}>
                  {chapter}
                </Text>
                {chapter === dailyChapter && (
                  <View style={styles.dailyBadge}>
                    <Text style={styles.dailyBadgeText}>יומי</Text>
                  </View>
                )}
              </Pressable>
            ))}
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  dailySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 16,
  },
  languageToggle: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonSmall: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    backgroundColor: PRIMARY_BLUE,
  },
  languageButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
  },
  languageButtonTextSmall: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
  },
  languageButtonTextActive: {
    color: '#ffffff',
  },
  dailyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  dailyCardGradient: {
    padding: 20,
  },
  dailyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dailyChapterNumber: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dailyChapterNumberText: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  dailyCardText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dailyCardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 6,
  },
  dailyCardDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 20,
  },
  dailyLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  dailyEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  chaptersSection: {
    marginTop: 8,
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-end',
  },
  chapterCard: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    position: 'relative',
  },
  chapterCardDaily: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderColor: PRIMARY_BLUE,
    borderWidth: 2,
  },
  chapterNumber: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
  },
  chapterNumberDaily: {
    color: PRIMARY_BLUE,
  },
  dailyBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dailyBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  webViewHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  externalLinkText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
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
  contentView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  contentHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  contentTitle: {
    fontSize: 26,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  divider: {
    height: 3,
    backgroundColor: DEEP_BLUE,
    opacity: 0.2,
    borderRadius: 2,
    marginBottom: 8,
  },
  textContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textContent: {
    fontSize: 19,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 38,
    writingDirection: 'rtl',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'center',
  },
})

