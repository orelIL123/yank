import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { WebView } from 'react-native-webview'
import AsyncStorage from '@react-native-async-storage/async-storage'

import AppHeader from '../components/AppHeader'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Sefaria API base URL
const SEFARIA_API_BASE = 'https://www.sefaria.org/api'

// Common Siddur sections - using Sefaria references with proper URLs
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
    directLink: 'https://www.sefaria.org/Siddur_Ashkenaz%2C_Mourner%27s_Kaddish'
  },
]

export default function SiddurScreen({ navigation }) {
  const [loading, setLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [sectionUrl, setSectionUrl] = useState(null)
  const [language, setLanguage] = useState('he') // 'he' for Hebrew, 'en' for English
  const [cachedSections, setCachedSections] = useState({})
  const [downloading, setDownloading] = useState(false)

  // Load cached sections on mount
  useEffect(() => {
    const loadCachedSections = async () => {
      try {
        const cached = await AsyncStorage.getItem('siddur_cached_sections')
        if (cached) {
          setCachedSections(JSON.parse(cached))
        }
      } catch (error) {
        console.error('Error loading cached sections:', error)
      }
    }
    loadCachedSections()
  }, [])

  // Build Sefaria URL with language parameter
  const buildSefariaUrl = (section, lang) => {
    // Always use directLink - it's already properly formatted
    let baseUrl = section.directLink
    
    if (!baseUrl) {
      // Fallback: build from sefariaRef
      const ref = section.sefariaRef.replace(/, /g, ',')
      const encodedRef = encodeURIComponent(ref)
      baseUrl = `https://www.sefaria.org/${encodedRef}`
    }
    
    // Remove any existing lang parameter first
    baseUrl = baseUrl.split('?')[0].split('&')[0]
    
    // Add language parameter - Sefaria uses 'lang' parameter
    const langParam = lang === 'en' ? 'en' : 'he'
    
    // Return clean URL with language
    return `${baseUrl}?lang=${langParam}`
  }

  const handleSectionPress = (section) => {
    setSelectedSection(section)
    const url = buildSefariaUrl(section, language)
    setSectionUrl(url)
    setLoading(true)
  }

  const handleDownloadSection = async () => {
    if (!selectedSection) return
    
    try {
      setDownloading(true)
      const url = buildSefariaUrl(selectedSection, language)
      
      // Mark section as cached
      const newCached = {
        ...cachedSections,
        [selectedSection.title]: {
          url,
          cachedAt: new Date().toISOString(),
          language
        }
      }
      
      await AsyncStorage.setItem('siddur_cached_sections', JSON.stringify(newCached))
      setCachedSections(newCached)
      
      Alert.alert('הצלחה', 'התוכן נשמר במטמון וזמין גם ללא חיבור לאינטרנט')
    } catch (error) {
      console.error('Error caching section:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את התוכן במטמון')
    } finally {
      setDownloading(false)
    }
  }

  const isSectionCached = (section) => {
    return cachedSections[section.title] !== undefined
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
        onBackPress={() => {
          // If viewing a section, go back to list. Otherwise, go back to previous screen
          if (selectedSection) {
            setSelectedSection(null)
            setSectionUrl(null)
            setLoading(false)
          } else {
            navigation.goBack()
          }
        }}
        rightIcon="open-outline"
        onRightIconPress={openSefariaWebsite}
      />

      {selectedSection && sectionUrl ? (
        <View style={styles.webViewContainer}>
          {/* Header with controls */}
          <View style={styles.webViewHeader}>
            <Pressable
              style={styles.backButton}
              onPress={() => {
                setSelectedSection(null)
                setSectionUrl(null)
                setLoading(false)
              }}
            >
              <Ionicons name="arrow-back" size={20} color={PRIMARY_BLUE} />
              <Text style={styles.backButtonText}>חזור לרשימה</Text>
            </Pressable>

            <View style={styles.webViewControls}>
              {/* Language Toggle */}
              <View style={styles.languageToggle}>
                <Pressable
                  style={[styles.languageButton, language === 'he' && styles.languageButtonActive]}
                  onPress={() => {
                    setLanguage('he')
                    const newUrl = buildSefariaUrl(selectedSection, 'he')
                    setSectionUrl(newUrl)
                  }}
                >
                  <Text style={[styles.languageButtonText, language === 'he' && styles.languageButtonTextActive]}>
                    עברית
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
                  onPress={() => {
                    setLanguage('en')
                    const newUrl = buildSefariaUrl(selectedSection, 'en')
                    setSectionUrl(newUrl)
                  }}
                >
                  <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
                    English
                  </Text>
                </Pressable>
              </View>

              {/* Download/Cache Button */}
              <Pressable
                style={[styles.downloadButton, isSectionCached(selectedSection) && styles.downloadButtonCached]}
                onPress={handleDownloadSection}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                ) : (
                  <Ionicons 
                    name={isSectionCached(selectedSection) ? "checkmark-circle" : "download-outline"} 
                    size={18} 
                    color={isSectionCached(selectedSection) ? "#10b981" : PRIMARY_BLUE} 
                  />
                )}
                <Text style={[styles.downloadButtonText, isSectionCached(selectedSection) && styles.downloadButtonTextCached]}>
                  {isSectionCached(selectedSection) ? 'נשמר' : 'הורד'}
                </Text>
              </Pressable>

              {/* Open in Browser Button */}
              <Pressable
                style={styles.externalLinkButtonSmall}
                onPress={() => {
                  const link = selectedSection.directLink || `https://www.sefaria.org/${selectedSection.sefariaRef}`
                  Linking.openURL(link)
                }}
              >
                <Ionicons name="open-outline" size={18} color={PRIMARY_BLUE} />
              </Pressable>
            </View>
          </View>

          {/* WebView for full content */}
          {loading && (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color={PRIMARY_BLUE} />
              <Text style={styles.loadingText}>טוען תוכן...</Text>
            </View>
          )}
          
          <WebView
            source={{ uri: sectionUrl }}
            style={styles.webView}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent
              console.error('WebView HTTP error: ', nativeEvent)
              setLoading(false)
              // Don't show alert on HTTP errors - let user see the error page
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent
              console.error('WebView error: ', nativeEvent)
              setLoading(false)
              // Only show alert for critical errors
              if (nativeEvent.code === -1009 || nativeEvent.code === -1001) {
                Alert.alert(
                  'שגיאת חיבור',
                  'לא ניתן להתחבר לשרת. בדוק את החיבור לאינטרנט.',
                  [
                    { text: 'ביטול', style: 'cancel' },
                    { 
                      text: 'נסה שוב', 
                      onPress: () => {
                        const url = buildSefariaUrl(selectedSection, language)
                        setSectionUrl(url)
                        setLoading(true)
                      }
                    }
                  ]
                )
              }
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            allowsBackForwardNavigationGestures={true}
            userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
            injectedJavaScript={`
              (function() {
                try {
                  // Hide Sefaria header/footer for cleaner view
                  const style = document.createElement('style');
                  style.textContent = \`
                    header, footer, .header, .footer, 
                    .siteHeader, .siteFooter,
                    .mobile-header, .mobile-footer,
                    .site-header, .site-footer,
                    nav.site-nav {
                      display: none !important;
                    }
                    body {
                      padding-top: 0 !important;
                      padding-bottom: 0 !important;
                      margin-top: 0 !important;
                    }
                    .content {
                      padding-top: 10px !important;
                    }
                  \`;
                  document.head.appendChild(style);
                  
                  // Also try to hide after page loads
                  setTimeout(function() {
                    const headers = document.querySelectorAll('header, .header, .site-header, nav.site-nav');
                    const footers = document.querySelectorAll('footer, .footer, .site-footer');
                    headers.forEach(el => el.style.display = 'none');
                    footers.forEach(el => el.style.display = 'none');
                  }, 1000);
                } catch(e) {
                  console.log('Error in injected script:', e);
                }
              })();
              true;
            `}
          />
        </View>
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
                  {isSectionCached(section) && (
                    <View style={styles.cachedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    </View>
                  )}
                </View>
                <View style={styles.sectionTextBlock}>
                  <Text style={styles.sectionCardTitle}>{section.title}</Text>
                  <Text style={styles.sectionCardDesc}>{section.description}</Text>
                  {isSectionCached(section) && (
                    <Text style={styles.cachedLabel}>נשמר במטמון</Text>
                  )}
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
  webViewContainer: {
    flex: 1,
  },
  webViewHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.1)',
    gap: 12,
  },
  webViewControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: PRIMARY_BLUE,
  },
  downloadButtonCached: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderColor: '#10b981',
  },
  downloadButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  downloadButtonTextCached: {
    color: '#10b981',
  },
  externalLinkButtonSmall: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  cachedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  cachedLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#10b981',
    marginTop: 4,
  },
})

