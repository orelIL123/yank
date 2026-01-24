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

// Common Siddur sections
const SIDDUR_SECTIONS = [
  { 
    title: 'ברכות השחר', 
    sefariaRef: 'Berakhot 60b',
    description: 'ברכות הבוקר'
  },
  { 
    title: 'פסוקי דזמרה', 
    sefariaRef: 'Psalms 1',
    description: 'תהלים ופסוקי דזמרה'
  },
  { 
    title: 'קריאת שמע וברכותיה', 
    sefariaRef: 'Berakhot 2a',
    description: 'קריאת שמע וברכותיה'
  },
  { 
    title: 'תפילת שחרית', 
    sefariaRef: 'Berakhot 4b',
    description: 'תפילת שחרית'
  },
  { 
    title: 'תפילת מנחה', 
    sefariaRef: 'Berakhot 4b',
    description: 'תפילת מנחה'
  },
  { 
    title: 'תפילת ערבית', 
    sefariaRef: 'Berakhot 2a',
    description: 'תפילת ערבית'
  },
  { 
    title: 'ברכת המזון', 
    sefariaRef: 'Berakhot 48b',
    description: 'ברכת המזון'
  },
  { 
    title: 'קדיש', 
    sefariaRef: 'Berakhot 3a',
    description: 'קדיש'
  },
]

export default function SiddurScreen({ navigation }) {
  const [loading, setLoading] = useState(false)
  const [selectedSection, setSelectedSection] = useState(null)
  const [sectionContent, setSectionContent] = useState(null)

  const fetchSefariaText = async (ref) => {
    try {
      setLoading(true)
      // Sefaria API endpoint for text
      const url = `${SEFARIA_API_BASE}/texts/${ref}?context=0`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Sefaria API')
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching from Sefaria:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSectionPress = async (section) => {
    try {
      setSelectedSection(section)
      const content = await fetchSefariaText(section.sefariaRef)
      setSectionContent(content)
    } catch (error) {
      Alert.alert(
        'שגיאה',
        'לא ניתן לטעון את התוכן. נסה לפתוח את הסידור באתר Sefaria',
        [
          { text: 'ביטול', style: 'cancel' },
          { 
            text: 'פתח באתר', 
            onPress: () => {
              Linking.openURL(`https://www.sefaria.org/${section.sefariaRef}`)
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

          <View style={styles.textContainer}>
            {sectionContent.he && (
              <View style={styles.hebrewText}>
                {Array.isArray(sectionContent.he) ? (
                  sectionContent.he.map((text, idx) => (
                    <Text key={idx} style={styles.hebrewTextLine}>
                      {typeof text === 'string' ? text : text.join(' ')}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.hebrewTextLine}>
                    {typeof sectionContent.he === 'string' 
                      ? sectionContent.he 
                      : JSON.stringify(sectionContent.he)}
                  </Text>
                )}
              </View>
            )}

            {sectionContent.text && (
              <View style={styles.textBlock}>
                {Array.isArray(sectionContent.text) ? (
                  sectionContent.text.map((text, idx) => (
                    <Text key={idx} style={styles.textLine}>
                      {typeof text === 'string' ? text : text.join(' ')}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.textLine}>
                    {typeof sectionContent.text === 'string' 
                      ? sectionContent.text 
                      : JSON.stringify(sectionContent.text)}
                  </Text>
                )}
              </View>
            )}

            <Pressable
              style={styles.externalLinkButton}
              onPress={() => Linking.openURL(`https://www.sefaria.org/${selectedSection.sefariaRef}`)}
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
  hebrewText: {
    marginBottom: 20,
  },
  hebrewTextLine: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 32,
    marginBottom: 12,
  },
  textBlock: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.1)',
  },
  textLine: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#4b5563',
    textAlign: 'left',
    lineHeight: 24,
    marginBottom: 8,
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

