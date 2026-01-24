import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import AppHeader from '../components/AppHeader'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Sefaria API base URL
const SEFARIA_API_BASE = 'https://www.sefaria.org/api'

// Common Siddur sections - using Sefaria references
const SIDDUR_SECTIONS = [
  { 
    title: 'ברכות השחר', 
    sefariaRef: 'Siddur_Ashkenaz, Weekday, Shacharit, Preparatory Prayers, Morning Blessings',
    description: 'ברכות הבוקר המלאות',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Preparatory_Prayers%2C_Morning_Blessings'
  },
  { 
    title: 'פסוקי דזמרה', 
    sefariaRef: 'Siddur_Ashkenaz, Weekday, Shacharit, Pesukei D\'Zimrah',
    description: 'תהלים ופסוקי דזמרה',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Pesukei_D%27Zimrah'
  },
  { 
    title: 'קריאת שמע וברכותיה', 
    sefariaRef: 'Siddur_Ashkenaz, Weekday, Shacharit, Shema and its Blessings',
    description: 'קריאת שמע וברכותיה',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Shema_and_its_Blessings'
  },
  { 
    title: 'תפילת שחרית', 
    sefariaRef: 'Siddur_Ashkenaz, Weekday, Shacharit, Amidah',
    description: 'תפילת שחרית',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Shacharit%2C_Amidah'
  },
  { 
    title: 'תפילת מנחה', 
    sefariaRef: 'Siddur_Ashkenaz, Weekday, Mincha',
    description: 'תפילת מנחה',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Mincha'
  },
  { 
    title: 'תפילת ערבית', 
    sefariaRef: 'Siddur_Ashkenaz, Weekday, Maariv',
    description: 'תפילת ערבית',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Weekday%2C_Maariv'
  },
  { 
    title: 'ברכת המזון', 
    sefariaRef: 'Siddur_Ashkenaz, Birkat_Hamazon',
    description: 'ברכת המזון',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Birkat_Hamazon'
  },
  { 
    title: 'קדיש', 
    sefariaRef: 'Siddur_Ashkenaz, Mourner\'s Kaddish',
    description: 'קדיש',
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Mourner\'s_Kaddish'
  },
]

export default function SiddurScreen({ navigation }) {
  const [loading, setLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [sectionContent, setSectionContent] = useState(null)
  const [language, setLanguage] = useState('he') // 'he' for Hebrew, 'en' for English

  const fetchSefariaText = async (ref) => {
    try {
      setLoading(true)
      // Sefaria API endpoint - try multiple approaches for better content
      // First try: Direct text API with full context
      let url = `${SEFARIA_API_BASE}/texts/${ref}?context=1`
      
      console.log('Fetching from Sefaria:', url)
      let response = await fetch(url)
      
      if (!response.ok) {
        // Try with different encoding
        const encodedRef = encodeURIComponent(ref)
        url = `${SEFARIA_API_BASE}/texts/${encodedRef}?context=1`
        console.log('Trying encoded URL:', url)
        response = await fetch(url)
      }
      
      if (!response.ok) {
        // Try v2 API
        const encodedRef = encodeURIComponent(ref)
        url = `${SEFARIA_API_BASE}/v2/texts/${encodedRef}`
        console.log('Trying v2 API:', url)
        response = await fetch(url)
      }
      
      if (!response.ok) {
        console.warn('Sefaria API returned error:', response.status)
        return null
      }
      
      const data = await response.json()
      console.log('Sefaria API response structure:', Object.keys(data))
      return data
    } catch (error) {
      console.error('Error fetching from Sefaria:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  // Helper function to extract text from Sefaria API response
  const extractText = (content, lang) => {
    if (!content) return null
    
    // Handle different response structures from Sefaria API
    // Structure 1: Direct he/text properties
    if (lang === 'he' && content.he) {
      return content.he
    }
    if (lang === 'en' && content.text) {
      return content.text
    }
    
    // Structure 2: Nested versions array
    if (content.versions && Array.isArray(content.versions)) {
      const hebrewVersion = content.versions.find(v => v.language === 'he' || v.lang === 'he')
      const englishVersion = content.versions.find(v => v.language === 'en' || v.lang === 'en')
      
      if (lang === 'he' && hebrewVersion) {
        return hebrewVersion.text || hebrewVersion.he
      }
      if (lang === 'en' && englishVersion) {
        return englishVersion.text
      }
    }
    
    // Structure 3: Nested text object
    if (content.text) {
      if (typeof content.text === 'object') {
        if (lang === 'he' && content.text.he) {
          return content.text.he
        }
        if (lang === 'en' && content.text.en) {
          return content.text.en
        }
      }
    }
    
    // Structure 4: Array of segments
    if (Array.isArray(content)) {
      return content.map(item => {
        if (lang === 'he' && item.he) return item.he
        if (lang === 'en' && item.text) return item.text
        return item
      })
    }
    
    // Fallback: return what we have
    if (lang === 'he') {
      return content.he || content.text
    }
    if (lang === 'en') {
      return content.text || content.en
    }
    
    return null
  }

  // Format text for display
  const formatTextForDisplay = (text) => {
    if (!text) return []
    
    // Handle string
    if (typeof text === 'string') {
      // Split by newlines and filter empty lines
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0)
      return lines.length > 0 ? lines : [text]
    }
    
    // Handle array
    if (Array.isArray(text)) {
      const result = []
      text.forEach(item => {
        if (typeof item === 'string') {
          const lines = item.split('\n').map(line => line.trim()).filter(line => line.length > 0)
          result.push(...lines)
        } else if (Array.isArray(item)) {
          // Nested array - flatten it
          item.forEach(subItem => {
            if (typeof subItem === 'string') {
              const lines = subItem.split('\n').map(line => line.trim()).filter(line => line.length > 0)
              result.push(...lines)
            } else {
              result.push(String(subItem))
            }
          })
        } else if (item && typeof item === 'object') {
          // Object - try to extract text
          if (item.he) result.push(item.he)
          else if (item.text) result.push(item.text)
          else result.push(JSON.stringify(item))
        } else {
          result.push(String(item))
        }
      })
      return result.filter(line => line && line.length > 0)
    }
    
    // Handle object
    if (typeof text === 'object') {
      if (text.he) return formatTextForDisplay(text.he)
      if (text.text) return formatTextForDisplay(text.text)
      return [JSON.stringify(text)]
    }
    
    return [String(text)]
  }

  const handleSectionPress = async (section) => {
    try {
      setSelectedSection(section)
      setLoading(true)
      const content = await fetchSefariaText(section.sefariaRef)
      
      if (content) {
        setSectionContent(content)
      } else {
        // If API failed, show option to open directly in browser
        Alert.alert(
          'פתח באתר Sefaria',
          'לצפייה מלאה בתוכן, נא לפתוח את הסידור באתר Sefaria',
          [
            { text: 'ביטול', style: 'cancel', onPress: () => {
              setSelectedSection(null)
              setSectionContent(null)
            }},
            { 
              text: 'פתח באתר', 
              onPress: () => {
                const link = section.directLink || `https://www.sefaria.org/${section.sefariaRef}`
                Linking.openURL(link)
                setSelectedSection(null)
                setSectionContent(null)
              }
            }
          ]
        )
      }
    } catch (error) {
      Alert.alert(
        'שגיאה',
        'לא ניתן לטעון את התוכן. נסה לפתוח את הסידור באתר Sefaria',
        [
          { text: 'ביטול', style: 'cancel', onPress: () => {
            setSelectedSection(null)
            setSectionContent(null)
          }},
          { 
            text: 'פתח באתר', 
            onPress: () => {
              const link = section.directLink || `https://www.sefaria.org/${section.sefariaRef}`
              Linking.openURL(link)
              setSelectedSection(null)
              setSectionContent(null)
            }
          }
        ]
      )
    }
  }

  const openSefariaWebsite = () => {
    Linking.openURL('https://www.sefaria.org/Siddur_Ashkenaz')
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="סידור"
        subtitle="סידור תפילה"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon="open-outline"
        onRightIconPress={openSefariaWebsite}
      />

      {selectedSection && sectionContent ? (
        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => {
              setSelectedSection(null)
              setSectionContent(null)
            }}
          >
            <Ionicons name="arrow-back" size={20} color={PRIMARY_BLUE} />
            <Text style={styles.backButtonText}>חזור לרשימה</Text>
          </Pressable>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{selectedSection.title}</Text>
            <Text style={styles.sectionDescription}>{selectedSection.description}</Text>
          </View>

          {/* Language Toggle */}
          <View style={styles.languageToggle}>
            <Pressable
              style={[styles.languageButton, language === 'he' && styles.languageButtonActive]}
              onPress={() => setLanguage('he')}
            >
              <Text style={[styles.languageButtonText, language === 'he' && styles.languageButtonTextActive]}>
                עברית
              </Text>
            </Pressable>
            <Pressable
              style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
              onPress={() => setLanguage('en')}
            >
              <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
                English
              </Text>
            </Pressable>
          </View>

          <View style={styles.textContainer}>
            {(() => {
              const text = extractText(sectionContent, language)
              const formattedText = formatTextForDisplay(text)
              
              if (!formattedText || formattedText.length === 0) {
                return (
                  <View style={styles.noContentContainer}>
                    <Ionicons name="information-circle-outline" size={48} color={PRIMARY_BLUE} style={{ opacity: 0.5 }} />
                    <Text style={styles.noContentText}>
                      {language === 'he' 
                        ? 'התוכן לא זמין בשפה זו. נא לפתוח באתר Sefaria לצפייה מלאה.'
                        : 'Content not available in this language. Please open in Sefaria website for full view.'}
                    </Text>
                    <Pressable
                      style={styles.externalLinkButton}
                      onPress={() => {
                        const link = selectedSection.directLink || `https://www.sefaria.org/${selectedSection.sefariaRef}`
                        Linking.openURL(link)
                      }}
                    >
                      <Ionicons name="open-outline" size={18} color={PRIMARY_BLUE} />
                      <Text style={styles.externalLinkText}>פתח באתר Sefaria</Text>
                    </Pressable>
                  </View>
                )
              }

              return (
                <View style={language === 'he' ? styles.hebrewText : styles.englishText}>
                  {formattedText.map((line, idx) => (
                    <Text 
                      key={idx} 
                      style={language === 'he' ? styles.hebrewTextLine : styles.englishTextLine}
                    >
                      {line}
                    </Text>
                  ))}
                </View>
              )
            })()}

            <Pressable
              style={styles.externalLinkButton}
              onPress={() => {
                const link = selectedSection.directLink || `https://www.sefaria.org/${selectedSection.sefariaRef}`
                Linking.openURL(link)
              }}
            >
              <Ionicons name="open-outline" size={18} color={PRIMARY_BLUE} />
              <Text style={styles.externalLinkText}>פתח באתר Sefaria</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.content} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Ionicons name="book-outline" size={48} color={PRIMARY_BLUE} />
            <Text style={styles.infoTitle}>סידור תפילה</Text>
            <Text style={styles.infoText}>
              בחרו חלק מהסידור לצפייה. התוכן מגיע מספריית Sefaria.
            </Text>
            <Pressable
              style={styles.sefariaButton}
              onPress={openSefariaWebsite}
            >
              <Ionicons name="globe-outline" size={18} color="#fff" />
              <Text style={styles.sefariaButtonText}>פתח באתר Sefaria</Text>
            </Pressable>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
              <Text style={styles.loadingText}>טוען תוכן...</Text>
            </View>
          )}

          {SIDDUR_SECTIONS.map((section, idx) => (
            <Pressable
              key={idx}
              style={[styles.sectionCard, idx === 0 && styles.sectionCardFirst]}
              onPress={() => handleSectionPress(section)}
              accessibilityRole="button"
              accessibilityLabel={`${section.title} - ${section.description}`}
            >
              <View style={styles.sectionCardContent}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="book" size={28} color={PRIMARY_BLUE} />
                </View>
                <View style={styles.sectionTextBlock}>
                  <Text style={styles.sectionCardTitle}>{section.title}</Text>
                  <Text style={styles.sectionCardDesc}>{section.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={PRIMARY_BLUE} />
              </View>
            </Pressable>
          ))}

          <View style={styles.footerCard}>
            <Ionicons name="information-circle-outline" size={32} color={PRIMARY_BLUE} />
            <View style={styles.footerTextBlock}>
              <Text style={styles.footerTitle}>על הסידור</Text>
              <Text style={styles.footerDesc}>
                הסידור מגיע מספריית Sefaria - ספרייה דיגיטלית פתוחה של טקסטים יהודיים.
                למידע נוסף, בקרו באתר Sefaria.org
              </Text>
            </View>
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
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  infoTitle: {
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    marginTop: 16,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  sefariaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  sefariaButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  sectionCardFirst: {
    marginTop: 6,
  },
  sectionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sectionIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  sectionCardTitle: {
    color: DEEP_BLUE,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'right',
  },
  sectionCardDesc: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  backButtonText: {
    color: PRIMARY_BLUE,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionHeader: {
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    color: DEEP_BLUE,
    fontSize: 24,
    fontFamily: 'Heebo_700Bold',
    marginBottom: 6,
  },
  sectionDescription: {
    color: '#6b7280',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  textContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  languageToggle: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonActive: {
    backgroundColor: PRIMARY_BLUE,
  },
  languageButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
  },
  languageButtonTextActive: {
    color: '#ffffff',
  },
  hebrewText: {
    marginBottom: 20,
  },
  hebrewTextLine: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 36,
    marginBottom: 16,
  },
  englishText: {
    marginBottom: 20,
  },
  englishTextLine: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#4b5563',
    textAlign: 'left',
    lineHeight: 28,
    marginBottom: 12,
  },
  noContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  noContentText: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderRadius: 12,
  },
  externalLinkText: {
    color: PRIMARY_BLUE,
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  footerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  footerTitle: {
    color: DEEP_BLUE,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerDesc: {
    color: '#4b5563',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
})

