import React, { useState, useEffect } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'
import db from '../services/database'
import { canManagePrayers } from '../utils/permissions'
import { BUNDLED_PRAYERS } from '../data/bundledPrayers'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Available languages (Hebrew default, then English, Russian, French)
const LANGUAGES = [
  { code: 'he', label: 'עברית', flag: '🇮🇱' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
]

export default function PrayersScreen({ navigation, userRole, userPermissions }) {
  const [prayers, setPrayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState('he')
  const [showAllPrayers, setShowAllPrayers] = useState(false)
  const [bundledPrayersData, setBundledPrayersData] = useState({})
  const canManage = canManagePrayers(userRole, userPermissions)

  useEffect(() => {
    loadPrayers()
    loadBundledPrayersData()
  }, [])

  const loadBundledPrayersData = async () => {
    try {
      const config = await db.getAppConfig()
      setBundledPrayersData(config?.bundled_prayers || {})
    } catch (err) {
      console.error('Error loading bundled prayers data:', err)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      loadPrayers()
      return undefined
    }, [])
  )

  const loadPrayers = async () => {
    try {
      const prayersData = await db.getCollection('prayers', {
        orderBy: { field: 'createdAt', direction: 'desc' }
      })
      setPrayers(prayersData)
    } catch (error) {
      console.error('Error loading prayers:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את התפילות')
    } finally {
      setLoading(false)
    }
  }

  const handlePrayerPress = (prayer) => {
    // Navigate to prayer detail with selected language
    navigation.navigate('PrayerDetail', { prayer, language: selectedLanguage })
  }

  const handleEditPrayer = (prayer) => {
    navigation.navigate('EditPrayer', { prayer })
  }

  const handleDeletePrayer = (prayer) => {
    Alert.alert(
      'מחיקת תפילה',
      `האם אתה בטוח שברצונך למחוק את התפילה "${prayer.title}"?`,
      [
        {
          text: 'ביטול',
          style: 'cancel'
        },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteDocument('prayers', prayer.id)
              Alert.alert('הצלחה', 'התפילה נמחקה בהצלחה')
              loadPrayers() // Reload prayers
            } catch (error) {
              console.error('Error deleting prayer:', error)
              Alert.alert('שגיאה', 'לא ניתן למחוק את התפילה')
            }
          }
        }
      ]
    )
  }

  const handleSharePrayer = async (prayer) => {
    try {
      // Get the PDF URL for the selected language
      const pdfUrl = prayer.pdfUrls?.[selectedLanguage] || prayer.pdfUrl

      if (pdfUrl) {
        // Download PDF to cache
        const fileUri = FileSystem.cacheDirectory + `prayer_${prayer.id}.pdf`
        const downloadResumable = FileSystem.createDownloadResumable(
          pdfUrl,
          fileUri
        )

        const { uri } = await downloadResumable.downloadAsync()

        // Check if sharing is available
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: prayer.title
          })
        } else {
          // Fallback to basic share
          await Share.share({
            message: `${prayer.title}\n\n${prayer.description || ''}`,
            url: pdfUrl
          })
        }
      } else {
        // If no PDF, share text
        await Share.share({
          message: `${prayer.title}\n\n${prayer.description || ''}`
        })
      }
    } catch (error) {
      console.error('Error sharing prayer:', error)
      Alert.alert('שגיאה', 'לא ניתן לשתף תפילה')
    }
  }

  const handleBundledPrayerPress = async (item) => {
    const prayerData = bundledPrayersData[item.id]
    const images = prayerData?.images || []

    if (images.length === 0) {
      Alert.alert(
        'אין תוכן זמין',
        'האדמין עדיין לא העלה תמונות לתפילה זו. אנא נסה שוב מאוחר יותר.',
        [{ text: 'אישור' }]
      )
      return
    }

    // Navigate to image viewer with the prayer images
    navigation.navigate('PrayerDetail', {
      prayer: {
        id: item.id,
        title: item.title,
        imageUrls: images,
      }
    })
  }

  // Build display list: group items with same groupKey into one card "לאיש / לאישה"
  const bundledDisplayList = React.useMemo(() => {
    const seen = new Set()
    const result = []
    for (const p of BUNDLED_PRAYERS) {
      if (p.groupKey) {
        if (seen.has(p.groupKey)) continue
        seen.add(p.groupKey)
        const items = BUNDLED_PRAYERS.filter(x => x.groupKey === p.groupKey)
        result.push({ type: 'group', groupKey: p.groupKey, title: p.title, items })
      } else {
        result.push({ type: 'single', item: p })
      }
    }
    return result
  }, [])

  const onBundledPress = (entry) => {
    if (entry.type === 'single') {
      handleBundledPrayerPress(entry.item)
      return
    }
    Alert.alert(
      entry.title,
      'בחר גרסה:',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'לאיש',
          onPress: () => {
            const man = entry.items.find(i => i.gender === 'man')
            if (man) handleBundledPrayerPress(man)
          }
        },
        {
          text: 'לאישה',
          onPress: () => {
            const woman = entry.items.find(i => i.gender === 'woman')
            if (woman) handleBundledPrayerPress(woman)
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title={t('תפילות הינוקא')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען תפילות...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // If showing all prayers – same format as תפילות הינוקא (grid, no PDF; images only)
  if (showAllPrayers) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title={t('תפילות בנושאים שונים')}
          showBackButton={true}
          onBackPress={() => setShowAllPrayers(false)}
          rightIcon={canManage ? 'add' : undefined}
          onRightIconPress={canManage ? () => navigation.navigate('AddPrayer') : undefined}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>בחרו שפה / Choose language</Text>
          <View style={styles.languageTabsRow}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.languageTab,
                  selectedLanguage === lang.code && styles.languageTabActive
                ]}
                onPress={() => setSelectedLanguage(lang.code)}
                accessibilityRole="button"
              >
                <Text style={[
                  styles.languageTabText,
                  selectedLanguage === lang.code && styles.languageTabTextActive
                ]}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {prayers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>אין תפילות זמינות כרגע</Text>
              <Text style={styles.emptySubtext}>התפילות יתווספו בקרוב</Text>
            </View>
          ) : (
            <View style={styles.bundledGrid}>
              {prayers.map((prayer) => {
                const hasImages = (prayer.imageUrls && prayer.imageUrls.length > 0) || (prayer.imageUrl && prayer.imageUrl.trim())
                const title = (prayer.title_he && selectedLanguage === 'he') || (prayer.title_en && selectedLanguage === 'en') || (prayer.title_ru && selectedLanguage === 'ru') || (prayer.title_fr && selectedLanguage === 'fr') || prayer.title || ''
                return (
                  <View key={prayer.id} style={styles.bundledCardWrapper}>
                    <Pressable
                      style={[styles.bundledCard, !hasImages && styles.bundledCardDisabled]}
                      onPress={() => hasImages && handlePrayerPress(prayer)}
                      disabled={!hasImages}
                      accessibilityRole="button"
                      accessibilityLabel={`תפילה ${title}`}
                    >
                      <View style={styles.bundledCardInner}>
                        <Ionicons name="document-text-outline" size={22} color={PRIMARY_BLUE} />
                        <View style={styles.bundledCardText}>
                          <Text style={styles.bundledCardTitle} numberOfLines={2}>{title}</Text>
                          {hasImages ? (
                            <Text style={styles.genderBadge}>תוכן זמין</Text>
                          ) : (
                            <Text style={styles.bundledCardSubtext}>טוען תוכן...</Text>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={PRIMARY_BLUE} />
                      </View>
                    </Pressable>
                    {canManage && (
                      <View style={styles.allPrayersActions}>
                        <Pressable style={styles.allPrayersActionBtn} onPress={() => handleEditPrayer(prayer)}>
                          <Ionicons name="create-outline" size={18} color={PRIMARY_BLUE} />
                        </Pressable>
                        <Pressable style={styles.allPrayersActionBtn} onPress={() => handleDeletePrayer(prayer)}>
                          <Ionicons name="trash-outline" size={18} color="#ef4444" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>

      </SafeAreaView>
    )
  }

  // Main screen with cards
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title={t('תפילות הינוקא')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon={canManage ? 'add' : undefined}
        onRightIconPress={canManage ? () => navigation.navigate('AddPrayer') : undefined}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>תפילות מיוחדות וסגולות</Text>

        {/* Prayer Commitment Button */}
        <Pressable
          style={styles.commitmentButton}
          onPress={() => navigation.navigate('PrayerCommitment')}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[PRIMARY_BLUE, '#1e40af']}
            style={styles.commitmentButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="heart" size={24} color="#fff" />
            <View style={styles.commitmentButtonTextContainer}>
              <Text style={styles.commitmentButtonTitle}>התחייבות תפילה שבועית</Text>
              <Text style={styles.commitmentButtonDesc}>התחייב להתפלל עבור מישהו אחר</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>

        {/* 9 Bundled Prayers – grid (grouped: לאיש/לאישה on one card) */}
        <View style={styles.bundledGrid}>
          {bundledDisplayList.map((entry) => (
            <Pressable
              key={entry.type === 'single' ? entry.item.id : entry.groupKey}
              style={styles.bundledCard}
              onPress={() => onBundledPress(entry)}
              accessibilityRole="button"
            >
              <View style={styles.bundledCardInner}>
                <Ionicons name="document-text-outline" size={22} color={PRIMARY_BLUE} />
                <View style={styles.bundledCardText}>
                  <Text style={styles.bundledCardTitle} numberOfLines={2}>
                    {entry.type === 'single' ? entry.item.title : entry.title}
                  </Text>
                  {entry.type === 'single' && entry.item.gender === 'man' && (
                    <Text style={styles.genderBadge}>לאיש</Text>
                  )}
                  {entry.type === 'single' && entry.item.gender === 'woman' && (
                    <Text style={styles.genderBadge}>לאישה</Text>
                  )}
                  {entry.type === 'group' && (
                    <Text style={styles.genderBadge}>לאיש / לאישה</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={PRIMARY_BLUE} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* תפילות בנושאים שונים – opens all prayers */}
        <Pressable
          style={styles.mainCard}
          onPress={() => setShowAllPrayers(true)}
          accessibilityRole="button"
        >
          <View style={styles.mainCardContent}>
            <View style={styles.mainCardIconContainer}>
              <Ionicons name="list" size={40} color={PRIMARY_BLUE} />
            </View>
            <View style={styles.mainCardTextContainer}>
              <Text style={styles.mainCardTitle}>תפילות בנושאים שונים</Text>
              <Text style={styles.mainCardSubtitle}>
                {prayers.length} תפילות זמינות · שפות: עברית, English, Français
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={28} color={PRIMARY_BLUE} />
          </View>
        </Pressable>
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
    paddingBottom: 32,
    gap: 14,
  },
  languageSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  languageLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: DEEP_BLUE,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.2)',
  },
  languageSelectorText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  languageTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 8,
  },
  languageTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.3)',
  },
  languageTabActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  languageTabText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  languageTabTextActive: {
    color: '#fff',
  },
  subtitle: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Poppins_400Regular',
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(30,58,138,0.15)',
  },
  mainCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mainCardIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 16,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  mainCardTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  mainCardSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
    textAlign: 'right',
  },
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  quickPrayerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  quickPrayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickPrayerIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPrayerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quickPrayerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 2,
  },
  quickPrayerDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  prayerCard: {
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
  prayerContentPressable: {
    flex: 1,
  },
  prayerCardFirst: {
    marginTop: 6,
  },
  prayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  prayerIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  prayerTitle: {
    color: DEEP_BLUE,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'right',
  },
  prayerDesc: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  pdfIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  pdfIndicatorText: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(11,27,58,0.1)',
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: PRIMARY_BLUE,
  },
  deleteActionButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderColor: '#ef4444',
  },
  quickActionText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  deleteActionText: {
    color: '#ef4444',
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
  commitmentButton: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 20,
    marginTop: 8,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  commitmentButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 12,
  },
  commitmentButtonTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  commitmentButtonTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    textAlign: 'right',
  },
  commitmentButtonDesc: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
  },
  bundledGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  bundledCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  bundledCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bundledCardText: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bundledCardTitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  genderBadge: {
    fontSize: 10,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
    marginTop: 4,
    textAlign: 'right',
  },
  bundledCardWrapper: {
    width: '48%',
    marginBottom: 8,
  },
  bundledCardDisabled: {
    opacity: 0.7,
  },
  bundledCardSubtext: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'right',
  },
  allPrayersActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  allPrayersActionBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
  },
  modalBody: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 2,
    borderColor: PRIMARY_BLUE,
  },
  languageOptionText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
})
