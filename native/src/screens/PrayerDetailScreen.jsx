import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Share, ActivityIndicator, Dimensions, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

import AppHeader from '../components/AppHeader'
import { scheduleNotification } from '../utils/notifications'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const { width } = Dimensions.get('window')

export default function PrayerDetailScreen({ route, navigation }) {
  const { prayer, language = 'he' } = route.params || {}
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [sharingPDF, setSharingPDF] = useState(false)
  const [reminderScheduled, setReminderScheduled] = useState(false)

  // Get all images - support both single imageUrl and multiple imageUrls
  const getImages = () => {
    const images = []

    // Check for imageUrls array (multiple images) - this is the main field
    if (prayer?.imageUrls && Array.isArray(prayer.imageUrls)) {
      prayer.imageUrls.forEach(url => {
        if (typeof url === 'string' && url.trim() !== '' && url.startsWith('http')) {
          images.push({ uri: url })
        }
      })
    }

    // Check for language-specific images if no default images
    if (images.length === 0 && prayer?.imageUrls?.[language] && Array.isArray(prayer.imageUrls[language])) {
      prayer.imageUrls[language].forEach(url => {
        if (typeof url === 'string' && url.trim() !== '' && url.startsWith('http')) {
          images.push({ uri: url })
        }
      })
    }

    // Also check for single imageUrl (backward compatibility)
    if (images.length === 0 && prayer?.imageUrl) {
      if (typeof prayer.imageUrl === 'string' && prayer.imageUrl.trim() !== '') {
        if (prayer.imageUrl.startsWith('http')) {
          images.push({ uri: prayer.imageUrl })
        }
      }
    }

    return images
  }

  const images = getImages()

  // Get PDF URL for selected language
  const getPDFUrl = () => {
    // Check for language-specific PDF
    if (prayer?.pdfUrls?.[language]) {
      return prayer.pdfUrls[language]
    }
    // Fallback to default PDF
    return prayer?.pdfUrl || null
  }

  const pdfUrl = getPDFUrl()

  // Debug logging
  React.useEffect(() => {
    if (prayer) {
      console.log('Prayer data:', {
        id: prayer.id,
        title: prayer.title,
        language: language,
        hasImages: images.length > 0,
        hasPDF: !!pdfUrl
      })
    }
  }, [prayer, language, images, pdfUrl])

  const handleSharePDF = async () => {
    if (!pdfUrl) {
      Alert.alert('שגיאה', 'אין PDF זמין')
      return
    }

    setSharingPDF(true)
    try {
      // Download PDF to cache
      const fileUri = FileSystem.cacheDirectory + `prayer_${prayer.id}_${language}.pdf`
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
    } catch (error) {
      console.error('Error sharing PDF:', error)
      Alert.alert('שגיאה', 'לא ניתן לשתף את ה-PDF')
    } finally {
      setSharingPDF(false)
    }
  }

  const handleShare = async () => {
    if (pdfUrl) {
      await handleSharePDF()
    } else {
      // Share text/images if no PDF
      try {
        await Share.share({
          message: `${prayer.title}\n\n${prayer.description || ''}`
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  const handleRemindLater = () => {
    if (reminderScheduled) {
      Alert.alert('נקבע', 'ההתראה להזכיר כבר נקבעה')
      return
    }
    const options = [
      { text: 'ביטול', style: 'cancel' },
      { text: 'בעוד 30 דקות', onPress: () => scheduleReminder(30) },
      { text: 'בעוד שעה', onPress: () => scheduleReminder(60) },
      { text: 'בעוד 3 שעות', onPress: () => scheduleReminder(180) },
    ]
    Alert.alert('הזכר לי לקרוא בהמשך', 'מתי להזכיר?', options)
  }

  const scheduleReminder = async (minutesFromNow) => {
    try {
      const triggerDate = new Date(Date.now() + minutesFromNow * 60 * 1000)
      await scheduleNotification({
        title: 'הזכרה לתפילה',
        body: `${prayer.title} – הזמן לקרוא בהמשך`,
        data: { screen: 'Prayers', prayerId: prayer.id },
        triggerDate,
      })
      setReminderScheduled(true)
      Alert.alert('נקבע', `תזכורת נקבעה ל־${minutesFromNow} דקות מעכשיו`)
    } catch (error) {
      console.error('Error scheduling reminder:', error)
      Alert.alert('שגיאה', 'לא ניתן לקבוע תזכורת. בדוק הרשאות התראות.')
    }
  }

  if (!prayer) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="תפילה"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="document-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
          <Text style={styles.errorText}>לא נמצאה תפילה</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />

      <AppHeader
        title={prayer.title}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon="share-social-outline"
        onRightIconPress={handleShare}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Prayer Title */}
        <Text style={styles.title}>{prayer.title}</Text>

        {/* Prayer Description */}
        {prayer.description && (
          <Text style={styles.description}>{prayer.description}</Text>
        )}

        {/* Prayer Category */}
        {prayer.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{prayer.category}</Text>
          </View>
        )}

        {/* PDF View Button */}
        {pdfUrl ? (
          <Pressable
            style={styles.pdfButton}
            onPress={() => {
              console.log('Opening PDF:', pdfUrl)
              navigation.navigate('PdfViewer', {
                pdf: { uri: pdfUrl },
                title: prayer.title
              })
            }}
            accessibilityRole="button"
          >
            <Ionicons name="document-text-outline" size={24} color="#fff" />
            <Text style={styles.pdfButtonText}>פתח תפילה ב-PDF</Text>
          </Pressable>
        ) : null}

        {/* Prayer Images Gallery */}
        {images.length > 0 ? (
          <View style={styles.imagesContainer}>
            <Text style={styles.sectionTitle}>תצוגת תפילה</Text>
            {images.length === 1 ? (
              // Single image - full width
              <View style={styles.imageContainer}>
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                  </View>
                )}
                <Image
                  source={images[0]}
                  style={styles.prayerImage}
                  resizeMode="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={(error) => {
                    console.error('Image load error:', error.nativeEvent.error)
                    setImageError(true)
                    setImageLoading(false)
                  }}
                />
                {imageError && (
                  <View style={styles.imageErrorContainer}>
                    <Ionicons name="image-outline" size={48} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                    <Text style={styles.imageErrorText}>לא ניתן לטעון תמונה</Text>
                  </View>
                )}
              </View>
            ) : (
              // Multiple images - scrollable horizontal gallery
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={true}
                contentContainerStyle={styles.imagesGallery}
              >
                {images.map((img, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image
                      source={img}
                      style={styles.prayerImage}
                      resizeMode="contain"
                      onLoadStart={() => setImageLoading(true)}
                      onLoadEnd={() => setImageLoading(false)}
                      onError={(error) => {
                        console.error('Image load error:', error.nativeEvent.error)
                        setImageError(true)
                        setImageLoading(false)
                      }}
                    />
                    {images.length > 1 && (
                      <View style={styles.imageCounter}>
                        <Text style={styles.imageCounterText}>
                          {index + 1} / {images.length}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : pdfUrl ? (
          // If no images but has PDF, show a placeholder
          <View style={styles.pdfPlaceholder}>
            <Ionicons name="document-text" size={80} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.pdfPlaceholderText}>
              התפילה זמינה בפורמט PDF
            </Text>
            <Text style={styles.pdfPlaceholderSubtext}>
              לחץ על הכפתור למעלה לצפייה
            </Text>
          </View>
        ) : (
          // No content available
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.2 }} />
            <Text style={styles.placeholderText}>אין תוכן זמין</Text>
          </View>
        )}

        {/* Remind me later */}
        <Pressable
          style={styles.remindButton}
          onPress={handleRemindLater}
          disabled={reminderScheduled}
          accessibilityRole="button"
        >
          <Ionicons name="notifications-outline" size={22} color={PRIMARY_BLUE} />
          <Text style={styles.remindButtonText}>
            {reminderScheduled ? 'תזכורת נקבעה' : 'הזכר לי לקרוא בהמשך'}
          </Text>
        </Pressable>

        {/* Share Buttons */}
        <View style={styles.shareButtons}>
          <Pressable
            style={styles.shareButton}
            onPress={handleShare}
            disabled={sharingPDF}
            accessibilityRole="button"
          >
            {sharingPDF ? (
              <ActivityIndicator size="small" color={PRIMARY_BLUE} />
            ) : (
              <>
                <Ionicons name="share-social" size={22} color={PRIMARY_BLUE} />
                <Text style={styles.shareButtonText}>שתף תפילה</Text>
              </>
            )}
          </Pressable>

          {pdfUrl && (
            <Pressable
              style={[styles.shareButton, styles.shareButtonWhatsApp]}
              onPress={async () => {
                // Share specifically to WhatsApp
                try {
                  await Sharing.shareAsync(pdfUrl, {
                    mimeType: 'application/pdf',
                    dialogTitle: prayer.title,
                    UTI: 'com.adobe.pdf'
                  })
                } catch (error) {
                  console.error('Error sharing to WhatsApp:', error)
                  await handleShare()
                }
              }}
              disabled={sharingPDF}
              accessibilityRole="button"
            >
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
              <Text style={[styles.shareButtonText, { color: '#25D366' }]}>WhatsApp</Text>
            </Pressable>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Ionicons name="heart" size={24} color={PRIMARY_BLUE} style={{ opacity: 0.5 }} />
          <Text style={styles.footerText}>תפילה זו נכתבה על ידי הגאון הינוקא שליט"א</Text>
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
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 20,
    lineHeight: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.14)',
    marginBottom: 20,
  },
  categoryText: {
    color: PRIMARY_BLUE,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pdfButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 16,
  },
  imagesContainer: {
    marginBottom: 24,
  },
  imagesGallery: {
    gap: 0,
  },
  imageContainer: {
    width: width - 40,
    height: 400,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    position: 'relative',
    backgroundColor: '#f5f5f5',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  prayerImage: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    zIndex: 10,
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imageErrorText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
  },
  imagePlaceholder: {
    width: '100%',
    height: 300,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  placeholderText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  pdfPlaceholder: {
    width: '100%',
    paddingVertical: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: 'rgba(30,58,138,0.1)',
    borderStyle: 'dashed',
  },
  pdfPlaceholderText: {
    marginTop: 16,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  pdfPlaceholderSubtext: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
  },
  remindButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(30,58,138,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.2)',
    marginBottom: 16,
  },
  remindButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1.5,
    borderColor: PRIMARY_BLUE,
  },
  shareButtonWhatsApp: {
    backgroundColor: 'rgba(37,211,102,0.1)',
    borderColor: '#25D366',
  },
  shareButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
})
