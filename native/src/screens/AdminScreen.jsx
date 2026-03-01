import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Platform, Image, ActivityIndicator, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
// DocumentPicker will be imported dynamically when needed

import { auth, db as firestoreDb } from '../config/firebase'
import { collection, getDocs } from 'firebase/firestore'
import db from '../services/database'
import { pickImage, uploadImageToStorage, generateCardImagePath, generateNewsImagePath, pickPDF, uploadPDFToStorage, generatePrayerPDFPath, uploadFileToSupabaseStorage } from '../utils/storage'
import { sendPushNotifications } from '../utils/notifications'
import { BUNDLED_PRAYERS } from '../data/bundledPrayers'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

const TABS = [
  { id: 'featured', label: 'נושא מרכזי', icon: 'star-outline' },
  { id: 'cards', label: 'כרטיסיות', icon: 'grid-outline' },
  { id: 'books', label: 'ספרים', icon: 'book-outline' },
  { id: 'prayers', label: 'תפילות', icon: 'heart-outline' },
  { id: 'bundled_prayers', label: 'תפילות מובנות', icon: 'albums-outline' },
  { id: 'news', label: 'חדשות', icon: 'newspaper-outline' },
  { id: 'newsletters', label: 'עלונים', icon: 'document-text-outline' },
  { id: 'dailyLearning', label: 'לימוד יומי', icon: 'school-outline' },
  { id: 'shortLessons', label: 'קטעי לימוד קצרים', icon: 'videocam-outline' },
  { id: 'longLessons', label: 'שיעורים ארוכים', icon: 'film-outline' },
  { id: 'hoduLaHashem', label: 'הודו לה\'', icon: 'sparkles-outline' },
  { id: 'music', label: 'ניגונים', icon: 'musical-notes-outline' },
  { id: 'notifications', label: 'התראות', icon: 'notifications-outline' },
  { id: 'parasha', label: 'פרשת השבוע', icon: 'book-outline' },
]

const PRAYER_LANGUAGES = [
  { code: 'he', label: 'עברית' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'ru', label: 'Русский' },
]

export default function AdminScreen({ navigation, route, userRole, userPermissions }) {

  // Guard: allow access only to admins (role is computed in App.js without Firestore)
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
          </Pressable>
          <Text style={styles.headerTitle}>🔐 פאנל אדמין</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.loadingContainer}>
          <Ionicons name="lock-closed-outline" size={56} color={PRIMARY_BLUE} style={{ opacity: 0.4 }} />
          <Text style={styles.loadingText}>אין הרשאה לפאנל אדמין</Text>
          <Text style={[styles.loadingText, { fontSize: 14, color: '#6b7280', marginTop: 6 }]}>
            אם זה אמור לעבוד אצלך—צריך להגדיר אותך כאדמין (Firebase Claims או app_config ב‑Supabase).
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Check if initialTab was passed from navigation
  const initialTab = route?.params?.initialTab || 'books';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>🔐 פאנל אדמין</Text>
        <Pressable
          style={styles.permissionsBtn}
          onPress={() => navigation.navigate('ManagePermissions')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="people" size={24} color={PRIMARY_BLUE} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map(tab => (
            <Pressable
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={20}
                color={activeTab === tab.id ? PRIMARY_BLUE : '#6b7280'}
              />
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'featured' && <FeaturedTopicForm />}
        {activeTab === 'cards' && <CardsForm />}
        {activeTab === 'books' && <BooksForm />}
        {activeTab === 'prayers' && <PrayersForm />}
        {activeTab === 'bundled_prayers' && <BundledPrayersForm />}
        {activeTab === 'news' && <NewsForm />}
        {activeTab === 'newsletters' && <NewslettersForm />}
        {activeTab === 'dailyLearning' && <DailyLearningForm />}
        {activeTab === 'shortLessons' && <ShortLessonsForm />}
        {activeTab === 'longLessons' && <LongLessonsForm />}
        {activeTab === 'hoduLaHashem' && <HoduLaHashemForm />}
        {activeTab === 'music' && <MusicForm />}
        {activeTab === 'notifications' && <NotificationsForm />}
        {activeTab === 'parasha' && <ParashaForm />}
      </ScrollView>
    </SafeAreaView>
  )
}

// ========== FEATURED TOPIC FORM ==========
function FeaturedTopicForm() {
  const [config, setConfig] = useState({
    featured_topic_enabled: false,
    featured_topic_title: '',
    featured_topic_description: '',
    featured_topic_type: 'image',
    featured_topic_image_url: '',
    featured_topic_youtube_id: '',
    featured_topic_video_url: '',
    featured_topic_link_url: '',
    featured_topic_button_text: 'למידע נוסף',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageUri, setImageUri] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const appConfig = await db.getAppConfig()
      if (appConfig) {
        setConfig({
          featured_topic_enabled: appConfig.featured_topic_enabled || false,
          featured_topic_title: appConfig.featured_topic_title || '',
          featured_topic_description: appConfig.featured_topic_description || '',
          featured_topic_type: appConfig.featured_topic_type || 'image',
          featured_topic_image_url: appConfig.featured_topic_image_url || '',
          featured_topic_youtube_id: appConfig.featured_topic_youtube_id || '',
          featured_topic_video_url: appConfig.featured_topic_video_url || '',
          featured_topic_link_url: appConfig.featured_topic_link_url || '',
          featured_topic_button_text: appConfig.featured_topic_button_text || 'למידע נוסף',
        })
      }
    } catch (error) {
      console.error('Error loading config:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את ההגדרות')
    } finally {
      setLoading(false)
    }
  }

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setImageUri(image.uri)
    }
  }

  const handleUploadImage = async () => {
    if (!imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const path = `featured/featured-topic-${Date.now()}.jpg`
      let url
      try {
        url = await uploadImageToStorage(imageUri, path, (progress) => {
          console.log(`Upload progress: ${progress}%`)
        })
      } catch (firebaseError) {
        console.warn('Firebase upload failed, trying Supabase:', firebaseError?.message)
        url = await uploadFileToSupabaseStorage(imageUri, 'newsletters', path, () => {})
      }
      setConfig({ ...config, featured_topic_image_url: url })
      setImageUri(null)
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  // Helper function to extract YouTube ID from URL or clean existing ID
  const cleanYouTubeId = (input) => {
    if (!input) return ''
    
    // Remove whitespace
    input = input.trim()
    
    // If it's a full YouTube URL, extract the ID (including live streams)
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/  // YouTube Live streams
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    // If it's just an ID (possibly with ?si= or other params), clean it
    const cleanId = input.split('?')[0].split('&')[0]
    
    // Validate it's a proper YouTube ID (11 characters, alphanumeric + _ -)
    if (/^[a-zA-Z0-9_-]{11}$/.test(cleanId)) {
      return cleanId
    }
    
    // If nothing matches, return the cleaned version anyway
    return cleanId
  }

  const handleSave = async () => {
    if (config.featured_topic_enabled) {
      if (!config.featured_topic_title?.trim()) {
        Alert.alert('שגיאה', 'יש להזין כותרת')
        return
      }

      if (config.featured_topic_type === 'image' && !config.featured_topic_image_url?.trim()) {
        Alert.alert('שגיאה', 'יש להעלות תמונה או להזין קישור לתמונה')
        return
      }

      if (config.featured_topic_type === 'youtube' && !config.featured_topic_youtube_id?.trim()) {
        Alert.alert('שגיאה', 'יש להזין מזהה יוטיוב')
        return
      }

      if (config.featured_topic_type === 'live_video' && !config.featured_topic_video_url?.trim()) {
        Alert.alert('שגיאה', 'יש להזין קישור לסרטון')
        return
      }
    }

    setSaving(true)
    try {
      // Clean YouTube ID before saving
      const cleanedYouTubeId = config.featured_topic_type === 'youtube' 
        ? cleanYouTubeId(config.featured_topic_youtube_id)
        : config.featured_topic_youtube_id.trim()

      await db.updateAppConfig({
        featured_topic_enabled: config.featured_topic_enabled,
        featured_topic_title: config.featured_topic_title.trim(),
        featured_topic_description: config.featured_topic_description.trim(),
        featured_topic_type: config.featured_topic_type,
        featured_topic_image_url: config.featured_topic_image_url.trim(),
        featured_topic_youtube_id: cleanedYouTubeId,
        featured_topic_video_url: config.featured_topic_video_url.trim(),
        featured_topic_link_url: config.featured_topic_link_url.trim(),
        featured_topic_button_text: config.featured_topic_button_text.trim(),
      })
      
      // Update local state with cleaned ID
      if (config.featured_topic_type === 'youtube') {
        setConfig({ ...config, featured_topic_youtube_id: cleanedYouTubeId })
      }
      
      Alert.alert('הצלחה!', 'הנושא המרכזי עודכן בהצלחה')
    } catch (error) {
      console.error('Error saving config:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את ההגדרות')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        <Text style={styles.loadingText}>טוען...</Text>
      </View>
    )
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>ניהול נושא מרכזי (חזון)</Text>
      <Text style={styles.formSubtitle}>
        הנושא המרכזי יופיע בראש מסך הבית ויכול להכיל תמונה, סרטון יוטיוב או סרטון לייב
      </Text>

      {/* Enable/Disable Toggle */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>הצג נושא מרכזי במסך הבית</Text>
        <Pressable
          style={[styles.toggleButton, config.featured_topic_enabled && styles.toggleButtonActive]}
          onPress={() => setConfig({ ...config, featured_topic_enabled: !config.featured_topic_enabled })}
        >
          <Text style={[styles.toggleButtonText, config.featured_topic_enabled && styles.toggleButtonTextActive]}>
            {config.featured_topic_enabled ? 'מופעל ✓' : 'כבוי'}
          </Text>
        </Pressable>
      </View>

      {config.featured_topic_enabled && (
        <>
          {/* Content Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>סוג תוכן *</Text>
            <View style={styles.typeButtons}>
              <Pressable
                style={[styles.typeButton, config.featured_topic_type === 'image' && styles.typeButtonActive]}
                onPress={() => setConfig({ ...config, featured_topic_type: 'image' })}
              >
                <Ionicons
                  name="image"
                  size={20}
                  color={config.featured_topic_type === 'image' ? PRIMARY_BLUE : '#6b7280'}
                />
                <Text style={[styles.typeButtonText, config.featured_topic_type === 'image' && styles.typeButtonTextActive]}>
                  תמונה
                </Text>
              </Pressable>

              <Pressable
                style={[styles.typeButton, config.featured_topic_type === 'youtube' && styles.typeButtonActive]}
                onPress={() => setConfig({ ...config, featured_topic_type: 'youtube' })}
              >
                <Ionicons
                  name="logo-youtube"
                  size={20}
                  color={config.featured_topic_type === 'youtube' ? PRIMARY_BLUE : '#6b7280'}
                />
                <Text style={[styles.typeButtonText, config.featured_topic_type === 'youtube' && styles.typeButtonTextActive]}>
                  יוטיוב
                </Text>
              </Pressable>

              <Pressable
                style={[styles.typeButton, config.featured_topic_type === 'live_video' && styles.typeButtonActive]}
                onPress={() => setConfig({ ...config, featured_topic_type: 'live_video' })}
              >
                <Ionicons
                  name="videocam"
                  size={20}
                  color={config.featured_topic_type === 'live_video' ? PRIMARY_BLUE : '#6b7280'}
                />
                <Text style={[styles.typeButtonText, config.featured_topic_type === 'live_video' && styles.typeButtonTextActive]}>
                  סרטון לייב
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>כותרת *</Text>
            <TextInput
              style={styles.input}
              value={config.featured_topic_title}
              onChangeText={(text) => setConfig({ ...config, featured_topic_title: text })}
              placeholder="הזן כותרת..."
              textAlign="right"
            />
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>תיאור</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={config.featured_topic_description}
              onChangeText={(text) => setConfig({ ...config, featured_topic_description: text })}
              placeholder="הזן תיאור..."
              multiline
              numberOfLines={3}
              textAlign="right"
            />
          </View>

          {/* Image Upload (for image type) */}
          {config.featured_topic_type === 'image' && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>תמונה *</Text>
                <View style={styles.imageUploadContainer}>
                  <Pressable style={styles.pickImageBtn} onPress={handlePickImage}>
                    <Ionicons name="image-outline" size={20} color={PRIMARY_BLUE} />
                    <Text style={styles.pickImageText}>בחר תמונה</Text>
                  </Pressable>

                  {imageUri && (
                    <Pressable
                      style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
                      onPress={handleUploadImage}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                          <Text style={styles.uploadBtnText}>העלה</Text>
                        </>
                      )}
                    </Pressable>
                  )}
                </View>

                {imageUri && (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                )}

                {config.featured_topic_image_url && !imageUri && (
                  <Image source={{ uri: config.featured_topic_image_url }} style={styles.previewImage} />
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>או הזן קישור לתמונה</Text>
                <TextInput
                  style={styles.input}
                  value={config.featured_topic_image_url}
                  onChangeText={(text) => setConfig({ ...config, featured_topic_image_url: text })}
                  placeholder="https://..."
                  textAlign="right"
                  keyboardType="url"
                />
              </View>
            </>
          )}

          {/* YouTube ID (for youtube type) */}
          {config.featured_topic_type === 'youtube' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>מזהה יוטיוב (YouTube ID) *</Text>
              <TextInput
                style={styles.input}
                value={config.featured_topic_youtube_id}
                onChangeText={(text) => setConfig({ ...config, featured_topic_youtube_id: text })}
                placeholder="לדוגמה: dQw4w9WgXcQ או הדבק את כל הקישור"
                textAlign="right"
              />
              <Text style={styles.helperText}>
                💡 טיפ: אפשר להדביק את כל הקישור מיוטיוב (כולל לייב) והמערכת תחלץ את המזהה אוטומטית!{'\n'}
                דוגמאות:{'\n'}
                • youtube.com/watch?v=VIDEO_ID{'\n'}
                • youtube.com/live/VIDEO_ID (לייב){'\n'}
                • youtu.be/VIDEO_ID{'\n'}
                • או רק: VIDEO_ID
              </Text>
            </View>
          )}

          {/* Video URL (for live_video type) */}
          {config.featured_topic_type === 'live_video' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>קישור לסרטון *</Text>
              <TextInput
                style={styles.input}
                value={config.featured_topic_video_url}
                onChangeText={(text) => setConfig({ ...config, featured_topic_video_url: text })}
                placeholder="https://..."
                textAlign="right"
                keyboardType="url"
              />
              <Text style={styles.helperText}>
                קישור ישיר לקובץ וידאו (mp4, m3u8 וכו')
              </Text>
            </View>
          )}

          {/* Link URL */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>קישור (אופציונלי)</Text>
            <TextInput
              style={styles.input}
              value={config.featured_topic_link_url}
              onChangeText={(text) => setConfig({ ...config, featured_topic_link_url: text })}
              placeholder="https://..."
              textAlign="right"
              keyboardType="url"
            />
            <Text style={styles.helperText}>
              קישור שייפתח בלחיצה על הכרטיס (רלוונטי לתמונה)
            </Text>
          </View>

          {/* Button Text */}
          {config.featured_topic_type === 'image' && config.featured_topic_link_url && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>טקסט כפתור</Text>
              <TextInput
                style={styles.input}
                value={config.featured_topic_button_text}
                onChangeText={(text) => setConfig({ ...config, featured_topic_button_text: text })}
                placeholder="למידע נוסף"
                textAlign="right"
              />
            </View>
          )}
        </>
      )}

      {/* Save Button */}
      <Pressable
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>שמור שינויים</Text>
          </>
        )}
      </Pressable>
    </View>
  )
}

// ========== CARDS FORM ==========
function CardsForm() {
  const [form, setForm] = useState({
    key: '',
    title: '',
    desc: '',
    icon: 'grid-outline',
    locked: false,
    order: 0,
    imageUri: null,
    imageUrl: null,
  })
  const [uploading, setUploading] = useState(false)

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const path = generateCardImagePath(form.key, 'card-image.jpg')
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.key || !form.title) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות הנדרשים')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    setSaving(true)
    try {
      // Save to Firestore
      const cardRef = doc(db, 'homeCards', form.key)
      await setDoc(cardRef, {
        key: form.key,
        title: form.title,
        desc: form.desc,
        icon: form.icon,
        imageUrl: form.imageUrl || '',
        locked: form.locked,
        order: form.order || 0,
        isActive: true,
        route: form.key, // Navigation route
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true })

      Alert.alert(
        'הצלחה! 🎴',
        'הכרטיסייה נשמרה בהצלחה ותופיע במסך הבית',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                key: '',
                title: '',
                desc: '',
                icon: 'grid-outline',
                locked: false,
                order: 0,
                imageUri: null,
                imageUrl: '',
              })
            }
          }
        ]
      )
      console.log('Card saved successfully:', form.key)
    } catch (error) {
      console.error('Error saving card:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הכרטיסייה. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🎴 עריכת כרטיסיות ראשיות</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>מזהה כרטיס (Key) *</Text>
        <TextInput
          style={styles.input}
          value={form.key}
          onChangeText={text => setForm({ ...form, key: text.replace(/\s/g, '-').toLowerCase() })}
          placeholder="לדוגמה: daily-insight"
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>המזהה צריך להיות ייחודי (ללא רווחים, באנגלית)</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הכרטיס</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="ערך יומי"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.desc}
          onChangeText={text => setForm({ ...form, desc: text })}
          placeholder="תובנה מעוררת השראה ליום שלך"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>אייקון (Ionicons name)</Text>
        <TextInput
          style={styles.input}
          value={form.icon}
          onChangeText={text => setForm({ ...form, icon: text })}
          placeholder="bulb-outline"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Pressable
          style={styles.checkbox}
          onPress={() => setForm({ ...form, locked: !form.locked })}
        >
          <View style={[styles.checkboxBox, form.locked && styles.checkboxBoxChecked]}>
            {form.locked && <Ionicons name="checkmark" size={16} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>🔒 כרטיס נעול (רק למשתמשים רשומים)</Text>
        </Pressable>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונת רקע</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונת רקע'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.separator} />

      <Text style={styles.sectionSubtitle}>כותרת ראשית מעל הכרטיסיות</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>סדר (Order) *</Text>
        <TextInput
          style={styles.input}
          value={form.order?.toString() || '0'}
          onChangeText={text => setForm({ ...form, order: parseInt(text) || 0 })}
          placeholder="0"
          keyboardType="numeric"
        />
        <Text style={styles.helpText}>מספר קטן יותר = יופיע ראשון</Text>
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        <Ionicons name="save" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>שמור שינויים</Text>
      </Pressable>

      <Text style={styles.note}>
        💡 שינויים יופיעו מיידית לאחר שמירה ב-Firestore. התמונות יועלו ל-Firebase Storage.
      </Text>
    </View>
  )
}

// ========== BOOKS FORM ==========
function BooksForm() {
  const [form, setForm] = useState({
    title: '',
    note: '',
    price: '',
    link: '',
    imageUri: null,
    imageUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [adminBooksList, setAdminBooksList] = useState([])
  const [loadingBooks, setLoadingBooks] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', note: '', price: '', link: '', imageUrl: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchAdminBooks = async () => {
    setLoadingBooks(true)
    try {
      const list = await db.getCollection('books', { orderBy: { field: 'createdAt', direction: 'desc' } })
      setAdminBooksList(list)
    } catch (e) {
      console.error('Error fetching books for admin:', e)
    } finally {
      setLoadingBooks(false)
    }
  }

  useEffect(() => {
    fetchAdminBooks()
  }, [])

  const handlePickImage = async () => {
    try {
      const image = await pickImage({ aspect: [3, 4], quality: 0.85 })
      if (!image?.uri) return
      setUploading(true)
      setForm(prev => ({ ...prev, imageUri: image.uri, imageUrl: '' }))
      try {
        const timestamp = Date.now()
        const path = `books/${timestamp}/image.jpg`
        let url
        try {
          url = await uploadImageToStorage(image.uri, path)
        } catch (firebaseErr) {
          console.warn('Firebase upload failed, trying Supabase:', firebaseErr?.message)
          url = await uploadFileToSupabaseStorage(image.uri, 'newsletters', `book-images/${path}`, () => {})
        }
        setForm(prev => ({ ...prev, imageUrl: url }))
        Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה ✅')
      } catch (error) {
        Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה. נסה שנית.')
        console.error('Book image upload error:', error)
        setForm(prev => ({ ...prev, imageUri: null, imageUrl: '' }))
      } finally {
        setUploading(false)
      }
    } catch (e) {
      console.error('Image pick error:', e)
    }
  }

  const handleEditBook = (book) => {
    setEditingBook(book)
    setEditForm({
      title: book.title || '',
      note: book.note || '',
      price: book.price || '',
      link: book.link || '',
      imageUrl: book.imageUrl || '',
    })
  }

  const handleSaveEditBook = async () => {
    if (!editingBook || !editForm.title.trim()) {
      Alert.alert('שגיאה', 'כותרת חובה')
      return
    }
    setSavingEdit(true)
    try {
      await db.updateDocument('books', editingBook.id, {
        title: editForm.title.trim(),
        note: editForm.note || '',
        price: editForm.price || '',
        link: editForm.link || '',
        imageUrl: editForm.imageUrl || '',
      })
      setEditingBook(null)
      fetchAdminBooks()
    } catch (e) {
      Alert.alert('שגיאה', 'לא ניתן לשמור שינויים')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteBook = (book) => {
    Alert.alert(
      'מחיקת מוצר',
      `למחוק את "${book.title}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteDocument('books', book.id)
              fetchAdminBooks()
            } catch (e) {
              Alert.alert('שגיאה', 'לא ניתן למחוק')
            }
          },
        },
      ]
    )
  }

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert('שגיאה', 'אנא הזן כותרת הספר')
      return
    }

    if (uploading) {
      Alert.alert('שים לב', 'ממתין לסיום העלאת התמונה...')
      return
    }

    try {
      setSaving(true)
      await db.addDocument('books', {
        title: form.title,
        note: form.note || '',
        price: form.price || '',
        link: form.link || '',
        imageUrl: form.imageUrl || '',
        createdAt: new Date().toISOString(),
      })

      Alert.alert(
        'הצלחה! 📚',
        'הספר נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                title: '',
                note: '',
                price: '',
                link: '',
                imageUri: null,
                imageUrl: '',
              })
              fetchAdminBooks()
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving book:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הספר. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📚 הוספת ספר/מוצר</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הספר/מוצר *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: ליקוטי מוהר״ן"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור/הערה</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.note}
          onChangeText={text => setForm({ ...form, note: text })}
          placeholder="תיאור קצר על הספר..."
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.formRow}>
        <View style={[styles.formGroup, { flex: 1 }]}>
          <Text style={styles.label}>מחיר (אופציונלי)</Text>
          <TextInput
            style={styles.input}
            value={form.price}
            onChangeText={text => setForm({ ...form, price: text })}
            placeholder="₪99"
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור לרכישה (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.link}
          onChangeText={text => setForm({ ...form, link: text })}
          placeholder="https://..."
          autoCapitalize="none"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונת הספר/מוצר (אופציונלי)</Text>
        {form.imageUri ? (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {uploading && (
              <View style={[styles.uploadedBadge, { backgroundColor: 'rgba(30,58,138,0.12)' }]}>
                <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                <Text style={[styles.uploadedText, { color: PRIMARY_BLUE }]}>מעלה...</Text>
              </View>
            )}
            {form.imageUrl && !uploading && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה ✅</Text>
              </View>
            )}
          </View>
        ) : null}
        <Pressable
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={handlePickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color={PRIMARY_BLUE} />
          ) : (
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
          )}
          <Text style={styles.uploadButtonText}>
            {uploading ? 'מעלה תמונה...' : form.imageUri ? 'החלף תמונה' : 'בחר ועלה תמונה'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="book" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף ספר/מוצר'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 הספר יישמר ב-Firestore ויופיע באפליקציה במסך "ספרים".
      </Text>

      {/* רשימת ספרים קיימים - עריכה ומחיקה */}
      <Text style={[styles.formTitle, { marginTop: 24, marginBottom: 12 }]}>📋 ספרים קיימים</Text>
      {loadingBooks ? (
        <ActivityIndicator size="small" color={PRIMARY_BLUE} style={{ marginVertical: 16 }} />
      ) : adminBooksList.length === 0 ? (
        <Text style={[styles.note, { marginTop: 0 }]}>אין ספרים עדיין.</Text>
      ) : (
        <View style={styles.adminBooksList}>
          {adminBooksList.map((book) => (
            <View key={book.id} style={styles.adminBookRow}>
              <Text style={styles.adminBookTitle} numberOfLines={1}>{book.title}</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable onPress={() => handleEditBook(book)} style={styles.adminBookBtn}>
                  <Ionicons name="pencil" size={18} color={PRIMARY_BLUE} />
                </Pressable>
                <Pressable onPress={() => handleDeleteBook(book)} style={[styles.adminBookBtn, { backgroundColor: 'rgba(220,38,38,0.1)' }]}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* מודל עריכת ספר */}
      <Modal visible={!!editingBook} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>עריכת מוצר</Text>
              <Pressable onPress={() => setEditingBook(null)}>
                <Ionicons name="close" size={28} color={DEEP_BLUE} />
              </Pressable>
            </View>
            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>כותרת *</Text>
              <TextInput style={styles.input} value={editForm.title} onChangeText={(t) => setEditForm((f) => ({ ...f, title: t }))} placeholder="כותרת" placeholderTextColor="#9ca3af" />
              <Text style={styles.label}>הערה</Text>
              <TextInput style={[styles.input, styles.textArea]} value={editForm.note} onChangeText={(t) => setEditForm((f) => ({ ...f, note: t }))} placeholder="הערה" placeholderTextColor="#9ca3af" multiline />
              <Text style={styles.label}>מחיר</Text>
              <TextInput style={styles.input} value={editForm.price} onChangeText={(t) => setEditForm((f) => ({ ...f, price: t }))} placeholder="מחיר" placeholderTextColor="#9ca3af" />
              <Text style={styles.label}>קישור לרכישה</Text>
              <TextInput style={styles.input} value={editForm.link} onChangeText={(t) => setEditForm((f) => ({ ...f, link: t }))} placeholder="https://..." placeholderTextColor="#9ca3af" autoCapitalize="none" />
              <Text style={styles.label}>כתובת תמונה</Text>
              <TextInput style={styles.input} value={editForm.imageUrl} onChangeText={(t) => setEditForm((f) => ({ ...f, imageUrl: t }))} placeholder="https://..." placeholderTextColor="#9ca3af" autoCapitalize="none" />
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable style={styles.modalCancelBtn} onPress={() => setEditingBook(null)}>
                <Text style={styles.modalCancelText}>ביטול</Text>
              </Pressable>
              <Pressable style={styles.modalSaveBtn} onPress={handleSaveEditBook} disabled={savingEdit}>
                <Text style={styles.modalSaveText}>{savingEdit ? 'שומר...' : 'שמור'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ========== NEWSLETTERS FORM ==========
function NewslettersForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'פרשת השבוע',
    fileType: 'pdf',
    fileUri: null,
    fileUrl: null,
    thumbnailUri: null,
    thumbnailUrl: null,
  })
  const [uploading, setUploading] = useState(false)

  const handlePickFile = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker')
      const result = await DocumentPicker.getDocumentAsync({
        type: form.fileType === 'pdf' ? 'application/pdf' : 'image/*',
        copyToCacheDirectory: true,
      })

      if (result.type === 'success' || !result.canceled) {
        const file = result.assets ? result.assets[0] : result
        setForm({ ...form, fileUri: file.uri })
      }
    } catch (error) {
      console.error('Error picking file:', error)
      Alert.alert('שגיאה', 'לא ניתן לבחור קובץ')
    }
  }

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [3, 4] })
    if (image) {
      setForm({ ...form, fileUri: image.uri, fileType: 'image' })
    }
  }

  const handleUploadFile = async () => {
    if (!form.fileUri) {
      Alert.alert('שגיאה', 'אנא בחר קובץ תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const extension = form.fileType === 'pdf' ? 'pdf' : 'jpg'
      const path = `${timestamp}/newsletter.${extension}`

      const url = await uploadFileToSupabaseStorage(form.fileUri, 'newsletters', path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })

      setForm({ ...form, fileUrl: url })
      Alert.alert('הצלחה!', 'הקובץ הועלה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את הקובץ')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handlePickThumbnail = async () => {
    const image = await pickImage({ aspect: [4, 3] })
    if (image) setForm({ ...form, thumbnailUri: image.uri, thumbnailUrl: null })
  }

  const handleUploadThumbnail = async () => {
    if (!form.thumbnailUri) return
    setUploading(true)
    try {
      const path = `thumbnails/${Date.now()}_thumb.jpg`
      const url = await uploadFileToSupabaseStorage(form.thumbnailUri, 'newsletters', path, () => {})
      setForm({ ...form, thumbnailUrl: url })
      Alert.alert('הצלחה!', 'תמונת התצוגה המקדימה הועלתה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert('שגיאה', 'אנא הזן כותרת')
      return
    }

    if (form.fileUri && !form.fileUrl) {
      Alert.alert('שים לב', 'אנא העלה את הקובץ לפני השמירה')
      return
    }

    try {
      setUploading(true)

      // Save to Firestore
      await db.addDocument('newsletters', {
        title: form.title,
        description: form.description,
        category: form.category,
        fileType: form.fileType,
        fileUrl: form.fileUrl || '',
        thumbnailUrl: form.thumbnailUrl || (form.fileType === 'image' ? form.fileUrl : '') || '',
        publishDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })

      Alert.alert(
        'הצלחה! 📰',
        'העלון נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              // Reset form
              setForm({
                title: '',
                description: '',
                category: 'פרשת השבוע',
                fileType: 'pdf',
                fileUri: null,
                fileUrl: null,
                thumbnailUri: null,
                thumbnailUrl: null,
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving newsletter:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את העלון. אנא נסה שנית.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📰 הוספת עלון חדש</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת העלון</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: פרשת בראשית"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור (אופציונלי)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={text => setForm({ ...form, description: text })}
          placeholder="תיאור קצר של העלון..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['פרשת השבוע', 'חגים ומועדים', 'הלכה', 'כללי'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>סוג קובץ</Text>
        <View style={styles.radioGroup}>
          {[
            { value: 'pdf', label: '📄 PDF' },
            { value: 'image', label: '🖼️ תמונה' }
          ].map(option => (
            <Pressable
              key={option.value}
              style={[styles.radioButton, form.fileType === option.value && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, fileType: option.value, fileUri: null, fileUrl: null })}
            >
              <Text style={[styles.radioText, form.fileType === option.value && styles.radioTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קובץ העלון</Text>
        {form.fileUri && (
          <View style={styles.imagePreview}>
            {form.fileType === 'image' ? (
              <Image source={{ uri: form.fileUri }} style={styles.previewImage} />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
                <Ionicons name="document-text" size={60} color={PRIMARY_BLUE} />
                <Text style={{ marginTop: 8, color: PRIMARY_BLUE, fontFamily: 'Poppins_500Medium' }}>PDF נבחר</Text>
              </View>
            )}
            {form.fileUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={form.fileType === 'pdf' ? handlePickFile : handlePickImage}
            disabled={uploading}
          >
            <Ionicons name={form.fileType === 'pdf' ? 'document-outline' : 'image-outline'} size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.fileUri ? 'בחר קובץ אחר' : `בחר ${form.fileType === 'pdf' ? 'PDF' : 'תמונה'}`}
            </Text>
          </Pressable>
          {form.fileUri && !form.fileUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadFile}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה קובץ'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תצוגה מקדימה (אופציונלי)</Text>
        {(form.thumbnailUri || form.thumbnailUrl) && (
          <View style={styles.imagePreview}>
            <Image
              source={{ uri: form.thumbnailUrl || form.thumbnailUri }}
              style={styles.previewImage}
            />
            {form.thumbnailUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable style={styles.uploadButton} onPress={handlePickThumbnail} disabled={uploading}>
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.thumbnailUri || form.thumbnailUrl ? 'בחר תמונה אחרת' : 'בחר תמונת תצוגה מקדימה'}
            </Text>
          </Pressable>
          {form.thumbnailUri && !form.thumbnailUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadThumbnail}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>{uploading ? 'מעלה...' : 'העלה תצוגה מקדימה'}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable style={styles.submitButton} onPress={handleSubmit}>
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.submitButtonText}>הוסף עלון</Text>
      </Pressable>

      <Text style={styles.note}>
        💡 העלון יישמר ב-Firestore ויהיה זמין לצפייה והורדה באפליקציה.
      </Text>
    </View>
  )
}

// ========== MUSIC FORM ==========
function MusicForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    category: 'ניגונים',
    order: 0,
  })
  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingSong, setEditingSong] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadSongs()
  }, [])

  const loadSongs = async () => {
    try {
      setLoading(true)
      const songsData = await db.getCollection('music', {
        orderBy: { field: 'order', direction: 'asc' }
      })
      setSongs(songsData || [])
    } catch (error) {
      console.error('Error loading songs:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את הניגונים')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to extract YouTube ID from URL
  const extractYouTubeId = (url) => {
    if (!url) return null
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#/]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.youtubeUrl.trim()) {
      Alert.alert('שגיאה', 'אנא מלא כותרת וקישור YouTube')
      return
    }

    const youtubeId = extractYouTubeId(form.youtubeUrl)
    if (!youtubeId) {
      Alert.alert('שגיאה', 'קישור YouTube לא תקין. אנא השתמש בקישור מלא מ-YouTube')
      return
    }

    try {
      setSaving(true)

      if (editingSong) {
        // Update existing song
        await db.updateDocument('music', editingSong.id, {
          title: form.title.trim(),
          description: form.description.trim() || '',
          youtubeId: youtubeId,
          youtubeUrl: form.youtubeUrl.trim(),
          category: form.category.trim() || 'ניגונים',
          order: parseInt(form.order) || 0,
          imageUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        })

        Alert.alert('הצלחה! 🎵', 'הניגון עודכן בהצלחה')
      } else {
        // Add new song
        await db.addDocument('music', {
          title: form.title.trim(),
          description: form.description.trim() || '',
          youtubeId: youtubeId,
          youtubeUrl: form.youtubeUrl.trim(),
          category: form.category.trim() || 'ניגונים',
          order: parseInt(form.order) || songs.length,
          imageUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
          createdAt: new Date().toISOString(),
        })

        Alert.alert('הצלחה! 🎵', 'הניגון נוסף בהצלחה ויופיע באפליקציה')
      }

      // Reset form
      setForm({
        title: '',
        description: '',
        youtubeUrl: '',
        category: 'ניגונים',
        order: songs.length,
      })
      setEditingSong(null)
      setShowEditModal(false)
      loadSongs()
    } catch (error) {
      console.error('Error saving music:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הניגון. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (song) => {
    setEditingSong(song)
    setForm({
      title: song.title || '',
      description: song.description || '',
      youtubeUrl: song.youtubeUrl || (song.youtubeId ? `https://www.youtube.com/watch?v=${song.youtubeId}` : ''),
      category: song.category || 'ניגונים',
      order: song.order || 0,
    })
    setShowEditModal(true)
  }

  const handleDelete = (song) => {
    Alert.alert(
      'מחיקת ניגון',
      `האם אתה בטוח שברצונך למחוק את הניגון "${song.title}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteDocument('music', song.id)
              Alert.alert('הצלחה', 'הניגון נמחק בהצלחה')
              loadSongs()
            } catch (error) {
              console.error('Error deleting song:', error)
              Alert.alert('שגיאה', 'לא ניתן למחוק את הניגון')
            }
          }
        }
      ]
    )
  }

  const handleMoveUp = async (song, index) => {
    if (index === 0) return
    try {
      const prevSong = songs[index - 1]
      const currentOrder = song.order || index
      const prevOrder = prevSong.order || (index - 1)

      await Promise.all([
        db.updateDocument('music', song.id, { order: prevOrder }),
        db.updateDocument('music', prevSong.id, { order: currentOrder }),
      ])

      loadSongs()
    } catch (error) {
      console.error('Error moving song:', error)
      Alert.alert('שגיאה', 'לא ניתן לשנות את הסדר')
    }
  }

  const handleMoveDown = async (song, index) => {
    if (index === songs.length - 1) return
    try {
      const nextSong = songs[index + 1]
      const currentOrder = song.order || index
      const nextOrder = nextSong.order || (index + 1)

      await Promise.all([
        db.updateDocument('music', song.id, { order: nextOrder }),
        db.updateDocument('music', nextSong.id, { order: currentOrder }),
      ])

      loadSongs()
    } catch (error) {
      console.error('Error moving song:', error)
      Alert.alert('שגיאה', 'לא ניתן לשנות את הסדר')
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🎵 ניהול ניגונים</Text>

      {/* Add/Edit Form */}
      <View style={styles.formSection}>
        <Text style={styles.sectionSubtitle}>
          {editingSong ? 'עריכת ניגון' : 'הוספת ניגון חדש'}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>כותרת הניגון *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={text => setForm({ ...form, title: text })}
            placeholder='לדוגמה: "שרו של ים"'
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>תיאור (אופציונלי)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.description}
            onChangeText={text => setForm({ ...form, description: text })}
            placeholder="תיאור קצר של הניגון..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>קישור YouTube *</Text>
          <TextInput
            style={styles.input}
            value={form.youtubeUrl}
            onChangeText={text => setForm({ ...form, youtubeUrl: text })}
            placeholder="https://www.youtube.com/watch?v=..."
            autoCapitalize="none"
            keyboardType="url"
          />
          <Text style={styles.helpText}>
            העתק את הקישור המלא מ-YouTube (לדוגמה: https://www.youtube.com/watch?v=VIDEO_ID)
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>קטגוריה</Text>
          <TextInput
            style={styles.input}
            value={form.category}
            onChangeText={text => setForm({ ...form, category: text })}
            placeholder="ניגונים"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>סדר הצגה</Text>
          <TextInput
            style={styles.input}
            value={form.order?.toString() || '0'}
            onChangeText={text => setForm({ ...form, order: parseInt(text) || 0 })}
            placeholder="0"
            keyboardType="numeric"
          />
          <Text style={styles.helpText}>מספר קטן יותר = יופיע ראשון</Text>
        </View>

        <Pressable
          style={[styles.submitButton, saving && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name={editingSong ? "checkmark-circle" : "add-circle"} size={20} color="#fff" />
              <Text style={styles.submitButtonText}>
                {editingSong ? 'עדכן ניגון' : 'הוסף ניגון'}
              </Text>
            </>
          )}
        </Pressable>

        {editingSong && (
          <Pressable
            style={[styles.cancelButton, { marginTop: 12 }]}
            onPress={() => {
              setEditingSong(null)
              setForm({
                title: '',
                description: '',
                youtubeUrl: '',
                category: 'ניגונים',
                order: songs.length,
              })
              setShowEditModal(false)
            }}
          >
            <Text style={styles.cancelButtonText}>ביטול עריכה</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.separator} />

      {/* Songs List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionSubtitle}>רשימת ניגונים ({songs.length})</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          </View>
        ) : songs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes-outline" size={48} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין ניגונים עדיין</Text>
          </View>
        ) : (
          <ScrollView style={styles.songsList}>
            {songs.map((song, index) => (
              <View key={song.id} style={styles.songItem}>
                <View style={styles.songInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {song.title || 'ללא כותרת'}
                  </Text>
                  {song.description && (
                    <Text style={styles.songDescription} numberOfLines={1}>
                      {song.description}
                    </Text>
                  )}
                  <Text style={styles.songMeta}>
                    סדר: {song.order || index} | קטגוריה: {song.category || 'ניגונים'}
                  </Text>
                </View>
                <View style={styles.songActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleMoveUp(song, index)}
                    disabled={index === 0}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={20}
                      color={index === 0 ? '#9ca3af' : PRIMARY_BLUE}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleMoveDown(song, index)}
                    disabled={index === songs.length - 1}
                  >
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={index === songs.length - 1 ? '#9ca3af' : PRIMARY_BLUE}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleEdit(song)}
                  >
                    <Ionicons name="create-outline" size={20} color={PRIMARY_BLUE} />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDelete(song)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Text style={styles.note}>
        💡 הניגונים יופיעו באפליקציה לפי הסדר שקבעת. ניתן לשנות את הסדר באמצעות החצים.
      </Text>
    </View>
  )
}

// ========== DAILY LEARNING FORM ==========
function DailyLearningForm() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'תפילה',
    author: '',
    date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
    audioUri: null,
    audioUrl: '',
    imageUri: null,
    imageUrl: '',
    youtubeId: '',
    videoUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const handlePickAudio = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker')
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      })

      if (result.type === 'success' || !result.canceled) {
        const file = result.assets ? result.assets[0] : result
        setForm({ ...form, audioUri: file.uri })
      }
    } catch (error) {
      console.error('Error picking audio:', error)
      Alert.alert('שגיאה', 'לא ניתן לבחור קובץ אודיו')
    }
  }

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadAudio = async () => {
    if (!form.audioUri) {
      Alert.alert('שגיאה', 'אנא בחר קובץ אודיו תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `dailyLearning/audio/${timestamp}/audio.mp3`
      const url = await uploadImageToStorage(form.audioUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, audioUrl: url })
      Alert.alert('הצלחה!', 'הקובץ האודיו הועלה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את קובץ האודיו')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `dailyLearning/images/${timestamp}/image.jpg`
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title) {
      Alert.alert('שגיאה', 'אנא הזן כותרת')
      return
    }

    if ((form.audioUri && !form.audioUrl) || (form.imageUri && !form.imageUrl)) {
      Alert.alert('שים לב', 'אנא העלה את הקבצים לפני השמירה')
      return
    }

    try {
      setSaving(true)

      // Convert date string to Firestore Timestamp
      let learningDate
      if (form.date) {
        learningDate = new Date(form.date)
        learningDate.setHours(8, 0, 0, 0) // Set to 8:00 AM
      } else {
        learningDate = new Date()
        learningDate.setHours(8, 0, 0, 0)
      }

      // Save to Firestore
      await db.addDocument('dailyLearning', {
        title: form.title,
        content: form.content || '',
        category: form.category,
        author: form.author || 'הרב שלמה יהודה בארי',
        date: learningDate.toISOString(),
        audioUrl: form.audioUrl || '',
        imageUrl: form.imageUrl || '',
        youtubeId: form.youtubeId || '',
        videoUrl: form.videoUrl || '',
        viewCount: 0,
        playCount: 0,
        soulElevations: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      })

      Alert.alert(
        'הצלחה! 📚',
        'הלימוד היומי נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              // Reset form
              setForm({
                title: '',
                content: '',
                category: 'תפילה',
                author: '',
                date: new Date().toISOString().split('T')[0],
                audioUri: null,
                audioUrl: '',
                imageUri: null,
                imageUrl: '',
                youtubeId: '',
                videoUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving daily learning:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הלימוד. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📚 הוספת לימוד יומי</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הלימוד *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: חשיבות התפילה"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן הלימוד</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({ ...form, content: text })}
          placeholder="כתוב את תוכן הלימוד כאן..."
          multiline
          numberOfLines={8}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['תפילה', 'תורה', 'חיזוק', 'הלכה', 'מוסר', 'כללי'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>שם הכותב</Text>
        <TextInput
          style={styles.input}
          value={form.author}
          onChangeText={text => setForm({ ...form, author: text })}
          placeholder="הרב שלמה יהודה בארי"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תאריך הלימוד</Text>
        <TextInput
          style={styles.input}
          value={form.date}
          onChangeText={text => setForm({ ...form, date: text })}
          placeholder="YYYY-MM-DD"
        />
        <Text style={styles.note}>
          💡 פורמט: YYYY-MM-DD (לדוגמה: 2025-11-29)
        </Text>
      </View>

      {/* Audio Upload */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>הקלטה (אופציונלי)</Text>
        {form.audioUri && (
          <View style={styles.audioPreview}>
            <Ionicons name="musical-notes" size={40} color={PRIMARY_BLUE} />
            <Text style={styles.audioPreviewText}>קובץ אודיו נבחר</Text>
            {form.audioUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickAudio}
            disabled={uploading}
          >
            <Ionicons name="musical-notes-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.audioUri ? 'בחר קובץ אחר' : 'בחר קובץ אודיו'}
            </Text>
          </Pressable>
          {form.audioUri && !form.audioUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadAudio}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה אודיו'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Image Upload */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונה (אופציונלי)</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* YouTube Video */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>YouTube Video ID (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.youtubeId}
          onChangeText={text => setForm({ ...form, youtubeId: text })}
          placeholder="cB4tvSWyeMg"
          autoCapitalize="none"
        />
        <Text style={styles.note}>
          💡 העתק את ה-ID מהקישור של YouTube. לדוגמה: מהקישור https://www.youtube.com/watch?v=cB4tvSWyeMg העתק רק את cB4tvSWyeMg
        </Text>
      </View>

      {/* Video URL */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור לסרטון (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.videoUrl}
          onChangeText={text => setForm({ ...form, videoUrl: text })}
          placeholder="https://..."
          autoCapitalize="none"
        />
        <Text style={styles.note}>
          💡 אם אין YouTube ID, ניתן להזין קישור ישיר לסרטון
        </Text>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="book" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף לימוד יומי'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 הלימוד יישמר ב-Firestore ויופיע באפליקציה. ניתן להוסיף הקלטה, תמונה או סרטון.
      </Text>
    </View>
  )
}

// ========== PRAYERS FORM ==========
function PrayersForm() {
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'תפילה',
    imageUri: null,
    imageUrl: '',
    pdfUri: null,
    pdfUrl: '',
  })
  const [uploading, setUploading] = useState(false)
  const [uploadingPDF, setUploadingPDF] = useState(false)
  const [saving, setSaving] = useState(false)

  // תפילה שבועית מהעלון (app_config)
  const [weeklyPrayerTitle, setWeeklyPrayerTitle] = useState('')
  const [weeklyPrayerPdfUrl, setWeeklyPrayerPdfUrl] = useState('')
  const [weeklyPrayerPdfUri, setWeeklyPrayerPdfUri] = useState(null)
  const [weeklyPrayerPdfName, setWeeklyPrayerPdfName] = useState('')
  const [loadingWeekly, setLoadingWeekly] = useState(true)
  const [savingWeekly, setSavingWeekly] = useState(false)
  const [uploadingWeeklyPdf, setUploadingWeeklyPdf] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const config = await db.getAppConfig()
        if (config) {
          setWeeklyPrayerTitle(config.weekly_prayer_title || '')
          setWeeklyPrayerPdfUrl(config.weekly_prayer_pdf_url || '')
        }
      } catch (e) {
        console.error('Error loading weekly prayer config:', e)
      } finally {
        setLoadingWeekly(false)
      }
    }
    load()
  }, [])

  const handlePickWeeklyPdf = async () => {
    const pdf = await pickPDF()
    if (pdf) {
      setWeeklyPrayerPdfUri(pdf.uri)
      setWeeklyPrayerPdfName(pdf.name || '')
    }
  }

  const handleSaveWeeklyPrayer = async () => {
    let pdfUrl = weeklyPrayerPdfUrl
    if (weeklyPrayerPdfUri) {
      setUploadingWeeklyPdf(true)
      try {
        const path = `weekly-prayer/${Date.now()}_${weeklyPrayerPdfName || 'prayer.pdf'}`
        pdfUrl = await uploadFileToSupabaseStorage(weeklyPrayerPdfUri, 'newsletters', path, () => {})
        setWeeklyPrayerPdfUrl(pdfUrl)
        setWeeklyPrayerPdfUri(null)
      } catch (err) {
        console.error(err)
        Alert.alert('שגיאה', 'לא ניתן להעלות את קובץ ה-PDF')
        setUploadingWeeklyPdf(false)
        return
      }
      setUploadingWeeklyPdf(false)
    }
    setSavingWeekly(true)
    try {
      await db.updateAppConfig({
        weekly_prayer_title: weeklyPrayerTitle.trim() || 'תפילה שבועית מהעלון',
        weekly_prayer_pdf_url: pdfUrl || '',
      })
      Alert.alert('הצלחה', 'תפילה שבועית נשמרה בהצלחה')
    } catch (err) {
      console.error(err)
      Alert.alert('שגיאה', 'לא ניתן לשמור')
    } finally {
      setSavingWeekly(false)
    }
  }

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9] })
    if (image) {
      setForm({ ...form, imageUri: image.uri })
    }
  }

  const handleUploadImage = async () => {
    if (!form.imageUri) {
      Alert.alert('שגיאה', 'אנא בחר תמונה תחילה')
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const path = `prayers/${timestamp}/image.jpg`
      const url = await uploadImageToStorage(form.imageUri, path, (progress) => {
        console.log(`Upload progress: ${progress}%`)
      })
      setForm({ ...form, imageUrl: url })
      Alert.alert('הצלחה!', 'התמונה הועלתה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונה')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const handlePickPDF = async () => {
    const pdf = await pickPDF()
    if (pdf) {
      setForm({ ...form, pdfUri: pdf.uri, pdfName: pdf.name })
    }
  }

  const handleUploadPDF = async () => {
    if (!form.pdfUri) {
      Alert.alert('שגיאה', 'אנא בחר קובץ PDF תחילה')
      return
    }

    setUploadingPDF(true)
    try {
      const timestamp = Date.now()
      const filename = form.pdfName || `prayer_${timestamp}.pdf`
      const path = generatePrayerPDFPath(timestamp.toString(), filename)
      const url = await uploadPDFToStorage(form.pdfUri, path, (progress) => {
        console.log(`PDF upload progress: ${progress}%`)
      })
      setForm({ ...form, pdfUrl: url })
      Alert.alert('הצלחה!', 'קובץ ה-PDF הועלה בהצלחה')
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן להעלות את קובץ ה-PDF')
      console.error(error)
    } finally {
      setUploadingPDF(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title || !form.content) {
      Alert.alert('שגיאה', 'אנא מלא כותרת ותוכן')
      return
    }

    if (form.imageUri && !form.imageUrl) {
      Alert.alert('שים לב', 'אנא העלה את התמונה לפני השמירה')
      return
    }

    if (form.pdfUri && !form.pdfUrl) {
      Alert.alert('שים לב', 'אנא העלה את קובץ ה-PDF לפני השמירה')
      return
    }

    try {
      setSaving(true)
      await db.addDocument('prayers', {
        title: form.title,
        content: form.content,
        category: form.category,
        imageUrl: form.imageUrl || '',
        pdfUrl: form.pdfUrl || '',
        createdAt: new Date().toISOString(),
      })

      Alert.alert(
        'הצלחה! 💜',
        'התפילה נוספה בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({
                title: '',
                content: '',
                category: 'תפילה',
                imageUri: null,
                imageUrl: '',
                pdfUri: null,
                pdfUrl: '',
              })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving prayer:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את התפילה. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      {/* תפילה שבועית מהעלון */}
      <Text style={styles.formTitle}>📿 תפילה שבועית מהעלון</Text>
      <Text style={styles.formSubtitle}>
        התפילה שמוצגת כשמשתמש לוחץ על "תפילה שבועית מהעלון" במסך התפילות
      </Text>
      {loadingWeekly ? (
        <View style={styles.formGroup}>
          <ActivityIndicator size="small" color={PRIMARY_BLUE} />
        </View>
      ) : (
        <>
          <View style={styles.formGroup}>
            <Text style={styles.label}>כותרת התפילה השבועית</Text>
            <TextInput
              style={styles.input}
              value={weeklyPrayerTitle}
              onChangeText={setWeeklyPrayerTitle}
              placeholder="תפילה שבועית מהעלון"
              textAlign="right"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>קובץ PDF</Text>
            {(weeklyPrayerPdfUri || weeklyPrayerPdfUrl) && (
              <View style={styles.imagePreview}>
                {weeklyPrayerPdfUri ? (
                  <View style={{ padding: 12, alignItems: 'center' }}>
                    <Ionicons name="document-text" size={40} color={PRIMARY_BLUE} />
                    <Text style={styles.pdfName} numberOfLines={1}>{weeklyPrayerPdfName || 'PDF'}</Text>
                  </View>
                ) : (
                  <View style={{ padding: 12, alignItems: 'center' }}>
                    <Ionicons name="document-text" size={40} color={PRIMARY_BLUE} />
                    <Text style={styles.pdfName}>קובץ קיים</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.uploadSection}>
              <Pressable
                style={styles.uploadButton}
                onPress={handlePickWeeklyPdf}
                disabled={uploadingWeeklyPdf || savingWeekly}
              >
                <Ionicons name="document-text-outline" size={24} color={PRIMARY_BLUE} />
                <Text style={styles.uploadButtonText}>
                  {weeklyPrayerPdfUri ? 'בחר קובץ אחר' : 'בחר קובץ PDF'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.uploadButton, (savingWeekly || uploadingWeeklyPdf) && styles.uploadButtonDisabled]}
                onPress={handleSaveWeeklyPrayer}
                disabled={savingWeekly || uploadingWeeklyPdf}
              >
                {savingWeekly || uploadingWeeklyPdf ? (
                  <ActivityIndicator color={PRIMARY_BLUE} size="small" />
                ) : (
                  <Ionicons name="checkmark-circle-outline" size={24} color={PRIMARY_BLUE} />
                )}
                <Text style={styles.uploadButtonText}>
                  {savingWeekly ? 'שומר...' : uploadingWeeklyPdf ? 'מעלה...' : 'שמור תפילה שבועית'}
                </Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', marginTop: 20, paddingTop: 20 }} />
      <Text style={[styles.formTitle, { marginTop: 8 }]}>💜 הוספת תפילה</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת התפילה *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="לדוגמה: תפילה לשלום עם ישראל"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן התפילה *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({ ...form, content: text })}
          placeholder="כתוב את תוכן התפילה כאן..."
          multiline
          numberOfLines={10}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <View style={styles.radioGroup}>
          {['תפילה', 'סגולה', 'ברכה', 'כללי'].map(cat => (
            <Pressable
              key={cat}
              style={[styles.radioButton, form.category === cat && styles.radioButtonActive]}
              onPress={() => setForm({ ...form, category: cat })}
            >
              <Text style={[styles.radioText, form.category === cat && styles.radioTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תמונה (אופציונלי)</Text>
        {form.imageUri && (
          <View style={styles.imagePreview}>
            <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
            {form.imageUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickImage}
            disabled={uploading || uploadingPDF}
          >
            <Ionicons name="image-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.imageUri ? 'בחר תמונה אחרת' : 'בחר תמונה'}
            </Text>
          </Pressable>
          {form.imageUri && !form.imageUrl && (
            <Pressable
              style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
              onPress={handleUploadImage}
              disabled={uploading || uploadingPDF}
            >
              {uploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploading ? 'מעלה...' : 'העלה תמונה'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קובץ PDF (אופציונלי)</Text>
        {form.pdfUri && (
          <View style={styles.pdfPreview}>
            <Ionicons name="document-text" size={48} color={PRIMARY_BLUE} />
            <Text style={styles.pdfName} numberOfLines={1}>
              {form.pdfName || 'קובץ PDF'}
            </Text>
            {form.pdfUrl && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.uploadedText}>הועלה</Text>
              </View>
            )}
          </View>
        )}
        <View style={styles.uploadSection}>
          <Pressable
            style={styles.uploadButton}
            onPress={handlePickPDF}
            disabled={uploading || uploadingPDF}
          >
            <Ionicons name="document-text-outline" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.uploadButtonText}>
              {form.pdfUri ? 'בחר PDF אחר' : 'בחר קובץ PDF'}
            </Text>
          </Pressable>
          {form.pdfUri && !form.pdfUrl && (
            <Pressable
              style={[styles.uploadButton, uploadingPDF && styles.uploadButtonDisabled]}
              onPress={handleUploadPDF}
              disabled={uploading || uploadingPDF}
            >
              {uploadingPDF ? (
                <ActivityIndicator color={PRIMARY_BLUE} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {uploadingPDF ? 'מעלה...' : 'העלה PDF'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable
        style={[styles.submitButton, (saving || uploading || uploadingPDF) && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving || uploading || uploadingPDF}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name="heart" size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? 'שומר...' : 'הוסף תפילה'}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 התפילה תישמר ב-Firestore ויופיע באפליקציה. PDFs יועלו ל-Firebase Storage.
      </Text>
    </View>
  )
}

// ========== NEWS FORM ==========
function NewsForm() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      setLoading(true)
      const articlesData = await db.getCollection('news', {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 20
      })
      setArticles(articlesData || [])
    } catch (error) {
      console.error('Error loading articles:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את החדשות')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteArticle = (article) => {
    Alert.alert(
      'מחיקת כתבה',
      `האם אתה בטוח שברצונך למחוק את הכתבה "${article.title}"?`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteDocument('news', article.id)
              Alert.alert('הצלחה', 'הכתבה נמחקה בהצלחה')
              loadArticles()
            } catch (error) {
              console.error('Error deleting article:', error)
              Alert.alert('שגיאה', 'לא ניתן למחוק את הכתבה')
            }
          }
        }
      ]
    )
  }

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('he-IL')
    if (date.toDate) {
      return date.toDate().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return new Date(date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📰 ניהול חדשות</Text>
      <Text style={styles.formSubtitle}>
        ניהול כתבות חדשות מבית המדרש
      </Text>

      <View style={styles.separator} />

      {/* Articles List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionSubtitle}>רשימת כתבות ({articles.length})</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          </View>
        ) : articles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="newspaper-outline" size={48} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין כתבות עדיין</Text>
            <Text style={styles.helpText}>
              ניתן להוסיף כתבות חדשות דרך מסך החדשות באפליקציה (כפתור +)
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.articlesList}>
            {articles.map((article) => (
              <View key={article.id} style={styles.articleItem}>
                <View style={styles.articleInfo}>
                  <Text style={styles.articleTitle} numberOfLines={2}>
                    {article.title || 'ללא כותרת'}
                  </Text>
                  {article.summary && (
                    <Text style={styles.articleDescription} numberOfLines={2}>
                      {article.summary}
                    </Text>
                  )}
                  <Text style={styles.articleMeta}>
                    תאריך: {formatDate(article.date)}
                  </Text>
                </View>
                <View style={styles.articleActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleDeleteArticle(article)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Text style={styles.note}>
        💡 ניהול מלא של חדשות (הוספה/עריכה) זמין דרך מסך החדשות באפליקציה. כאן ניתן רק לצפות ולמחוק.
      </Text>
    </View>
  )
}

// ========== NOTIFICATIONS FORM ==========
function NotificationsForm() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    icon: 'notifications',
    link: '',
  })
  const [saving, setSaving] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const iconOptions = [
    { value: 'notifications', label: 'התראה כללית', icon: 'notifications' },
    { value: 'information-circle', label: 'מידע', icon: 'information-circle' },
    { value: 'warning', label: 'אזהרה', icon: 'warning' },
    { value: 'checkmark-circle', label: 'הצלחה', icon: 'checkmark-circle' },
    { value: 'calendar', label: 'אירוע', icon: 'calendar' },
    { value: 'musical-notes', label: 'ניגון', icon: 'musical-notes' },
    { value: 'book', label: 'תורה', icon: 'book' },
    { value: 'heart', label: 'תפילה', icon: 'heart' },
  ]

  const handleSubmit = async () => {
    if (!form.title || !form.message) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות הנדרשים')
      return
    }

    if (form.message.length > 500) {
      Alert.alert('שגיאה', 'ההודעה ארוכה מדי (מקסימום 500 תווים)')
      return
    }

    // Validate scheduled date/time if scheduling is enabled
    let scheduledAt = null
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        Alert.alert('שגיאה', 'יש להזין תאריך ושעה לתזמון ההתראה')
        return
      }
      // Parse date: DD/MM/YYYY and time: HH:MM
      const [day, month, year] = scheduledDate.split('/')
      const [hours, minutes] = scheduledTime.split(':')
      scheduledAt = new Date(year, month - 1, day, hours, minutes)
      if (isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
        Alert.alert('שגיאה', 'יש להזין תאריך ושעה עתידיים תקינים')
        return
      }
    }

    try {
      setSaving(true)

      // First, save notification to database
      const notificationData = {
        title: form.title,
        message: form.message,
        icon: form.icon,
        link: form.link?.trim() || null,
        isActive: !isScheduled, // Not active until scheduled time if scheduled
        readBy: [],
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'admin',
        ...(scheduledAt && { scheduledAt: scheduledAt.toISOString(), isScheduled: true }),
      }

      const savedNotification = await db.addDocument('notifications', notificationData)

      const resetForm = () => {
        setForm({ title: '', message: '', icon: 'notifications', link: '' })
        setIsScheduled(false)
        setScheduledDate('')
        setScheduledTime('')
      }

      // If scheduled, don't send push now - just save and inform
      if (isScheduled) {
        Alert.alert(
          'התראה תוזמנה ✅',
          `ההתראה נשמרה ותשלח בתאריך ${scheduledDate} בשעה ${scheduledTime}.\nניתן לראות ולמחוק התראות מתוזמנות במסך ניהול ההתראות.`,
          [{ text: 'אישור', onPress: resetForm }]
        )
        return
      }

      // Get all users with push tokens from Firestore
      console.log('📱 Collecting push tokens from all users...')
      const usersSnapshot = await getDocs(collection(firestoreDb, 'users'))
      const pushTokens = []
      let firestoreTokenCount = 0
      let supabaseTokenCount = 0

      usersSnapshot.forEach((doc) => {
        const userData = doc.data()
        // Get all expo push tokens for this user
        if (userData.expoPushTokens && Array.isArray(userData.expoPushTokens)) {
          const valid = userData.expoPushTokens.filter(token => token && token.length > 0)
          pushTokens.push(...valid)
          firestoreTokenCount += valid.length
        }
        if (typeof userData.expoPushToken === 'string' && userData.expoPushToken.trim()) {
          pushTokens.push(userData.expoPushToken.trim())
          firestoreTokenCount += 1
        }
      })

      // Fallback: also pull tokens from Supabase users table (for users not synced to Firestore)
      try {
        const supaUsers = await db.getCollection('users', { limit: 10000 })
        supaUsers.forEach((userData) => {
          if (Array.isArray(userData?.expoPushTokens)) {
            const valid = userData.expoPushTokens.filter(token => token && token.length > 0)
            pushTokens.push(...valid)
            supabaseTokenCount += valid.length
          }
          if (typeof userData?.expoPushToken === 'string' && userData.expoPushToken.trim()) {
            pushTokens.push(userData.expoPushToken.trim())
            supabaseTokenCount += 1
          }
        })
      } catch (supaErr) {
        console.log('Could not collect push tokens from Supabase:', supaErr?.message || supaErr)
      }

      const uniquePushTokens = Array.from(new Set(pushTokens))
      const expoFormatTokens = uniquePushTokens.filter(token =>
        typeof token === 'string' && /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token.trim())
      )

      console.log(`📱 Found tokens: Firestore=${firestoreTokenCount}, Supabase=${supabaseTokenCount}, Unique=${uniquePushTokens.length}, ExpoFormat=${expoFormatTokens.length}`)

      // Send push notifications to all users
      if (uniquePushTokens.length > 0) {
        console.log('📤 Sending push notifications...')
        const pushResult = await sendPushNotifications(
          uniquePushTokens,
          form.title,
          form.message,
          {
            notificationId: savedNotification.id,
            screen: 'Notifications',
            icon: form.icon
          }
        )

        console.log(`✅ Push notifications sent: ${pushResult.sent} successful, ${pushResult.failed} failed`)
        const reasonsText = pushResult?.errorReasons
          ? Object.entries(pushResult.errorReasons)
              .map(([reason, count]) => `${reason}: ${count}`)
              .join('\n')
          : ''
        const unauthorizedHint = pushResult?.errorReasons?.UNAUTHORIZED
          ? '\n\nנדרש Expo Access Token או ביטול Push Security בפרויקט Expo.'
          : ''
        const authModeText = `\nמצב אימות Expo: ${pushResult?.usingExpoAccessToken ? 'Bearer Token' : 'ללא טוקן'}`

        Alert.alert(
          'הצלחה! 🔔',
          `ההתראה נשלחה בהצלחה!\n\nנשלחו ${pushResult.sent} התראות push\n${pushResult.failed > 0 ? `${pushResult.failed} נכשלו` : 'כולן הצליחו'}\n\nטוקנים: Firestore ${firestoreTokenCount}, Supabase ${supabaseTokenCount}, Expo ${expoFormatTokens.length}${authModeText}${reasonsText ? `\n\nסיבות כשל:\n${reasonsText}` : ''}${unauthorizedHint}`,
          [{ text: 'אישור', onPress: resetForm }]
        )
      } else {
        // No push tokens found, but notification was saved
        Alert.alert(
          'התראה נשמרה ⚠️',
          `ההתראה נשמרה בהצלחה, אבל לא נמצאו push tokens לשליחה.\n\nטוקנים: Firestore ${firestoreTokenCount}, Supabase ${supabaseTokenCount}, Expo ${expoFormatTokens.length}\n\nהמשתמשים יראו את ההתראה כשהם יפתחו את האפליקציה.`,
          [{ text: 'אישור', onPress: resetForm }]
        )
      }
    } catch (error) {
      console.error('Error saving/sending notification:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור/לשלוח את ההתראה. אנא נסה שנית.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🔔 שליחת התראה חדשה</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת ההתראה *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder='לדוגמה: "עדכון חשוב"'
          maxLength={100}
        />
        <Text style={styles.charCount}>{form.title.length}/100</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>הודעה *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.message}
          onChangeText={text => setForm({ ...form, message: text })}
          placeholder="כתוב את תוכן ההתראה..."
          multiline
          numberOfLines={6}
          maxLength={500}
        />
        <Text style={styles.charCount}>{form.message.length}/500</Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור (אופציונלי)</Text>
        <TextInput
          style={styles.input}
          value={form.link}
          onChangeText={text => setForm({ ...form, link: text })}
          placeholder="https://..."
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          keyboardType="url"
          textAlign="right"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>אייקון</Text>
        <View style={styles.radioGroup}>
          {iconOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.radioButton,
                form.icon === option.value && styles.radioButtonActive
              ]}
              onPress={() => setForm({ ...form, icon: option.value })}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={form.icon === option.value ? PRIMARY_BLUE : '#6b7280'}
              />
              <Text
                style={[
                  styles.radioText,
                  form.icon === option.value && styles.radioTextActive
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Scheduling section */}
      <View style={styles.formGroup}>
        <Pressable
          style={styles.scheduleToggleRow}
          onPress={() => setIsScheduled(!isScheduled)}
        >
          <View style={[styles.scheduleToggleBox, isScheduled && styles.scheduleToggleBoxActive]}>
            {isScheduled && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.label}>תזמן התראה לתאריך/שעה עתידי</Text>
        </Pressable>

        {isScheduled && (
          <View style={styles.scheduleInputsRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.scheduleInputLabel}>תאריך (DD/MM/YYYY)</Text>
              <TextInput
                style={styles.input}
                value={scheduledDate}
                onChangeText={setScheduledDate}
                placeholder="27/05/2025"
                keyboardType="numbers-and-punctuation"
                textAlign="center"
                maxLength={10}
              />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.scheduleInputLabel}>שעה (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={scheduledTime}
                onChangeText={setScheduledTime}
                placeholder="20:00"
                keyboardType="numbers-and-punctuation"
                textAlign="center"
                maxLength={5}
              />
            </View>
          </View>
        )}
      </View>

      <Pressable
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Ionicons name={isScheduled ? 'time' : 'send'} size={20} color="#fff" />
        )}
        <Text style={styles.submitButtonText}>
          {saving ? (isScheduled ? 'מתזמן...' : 'שולח...') : (isScheduled ? 'תזמן התראה' : 'שלח התראה')}
        </Text>
      </Pressable>

      <Text style={styles.note}>
        💡 ההתראה תישלח לכל המשתמשים ותופיע במסך ההתראות. משתמשים יוכלו לראות אותה כשלוחצים על אייקון הפעמון.
      </Text>
    </View>
  )
}

// ========== PARASHA FORM (manual override for פרשת השבוע) ==========
function ParashaForm() {
  const [parashaName, setParashaName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const config = await db.getAppConfig()
      setParashaName(config?.parasha_override_he || '')
    } catch (_) {
      setParashaName('')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await db.updateAppConfig({ parasha_override_he: parashaName.trim() || null })
      Alert.alert('הצלחה', 'שם הפרשה עודכן. יוצג במסך כלי עזר.')
    } catch (e) {
      console.error(e)
      Alert.alert('שגיאה', 'לא ניתן לשמור')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.formContainer}>
        <ActivityIndicator size="small" color={PRIMARY_BLUE} />
      </View>
    )
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📖 פרשת השבוע – שינוי ידני</Text>
      <Text style={[styles.note, { marginBottom: 16 }]}>
        אם מוזן כאן – במסך "כלי עזר" יוצג השם הזה במקום הפרשה האוטומטית מ-HebCal. השאר ריק כדי להציג אוטומטית.
      </Text>
      <View style={styles.formGroup}>
        <Text style={styles.label}>שם הפרשה (עברית)</Text>
        <TextInput
          style={styles.input}
          value={parashaName}
          onChangeText={setParashaName}
          placeholder="לדוגמה: ויקהל-פקודי"
          textAlign="right"
        />
      </View>
      <Pressable
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={20} color="#fff" />}
        <Text style={styles.submitButtonText}>{saving ? 'שומר...' : 'שמור'}</Text>
      </Pressable>
    </View>
  )
}

// ========== SHORT LESSONS FORM ==========
function ShortLessonsForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    category: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.youtubeUrl.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת וקישור YouTube')
      return
    }

    // Extract YouTube ID
    const youtubeIdPattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/
    const match = form.youtubeUrl.match(youtubeIdPattern)
    if (!match || !match[1]) {
      Alert.alert('שגיאה', 'קישור YouTube לא תקין. אנא השתמש בקישור מלא מ-YouTube')
      return
    }

    setSaving(true)
    try {
      await db.addDocument('shortLessons', {
        title: form.title.trim(),
        description: form.description.trim() || '',
        youtubeUrl: form.youtubeUrl.trim(),
        category: form.category.trim() || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        order: 0
      })

      Alert.alert(
        'הצלחה! 🎬',
        'השיעור הקצר נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({ title: '', description: '', youtubeUrl: '', category: '' })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving short lesson:', error)
      const errorMessage = error.code === 'permission-denied' 
        ? 'אין הרשאה להוסיף שיעור. ודא שאתה מחובר כמנהל.'
        : error.message || 'לא ניתן להוסיף את השיעור. אנא נסה שנית.'
      Alert.alert('שגיאה', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🎬 הוספת שיעור קצר</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת השיעור הקצר *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="הכנס כותרת השיעור"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={text => setForm({ ...form, description: text })}
          placeholder="הכנס תיאור (אופציונלי)"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור YouTube *</Text>
        <TextInput
          style={styles.input}
          value={form.youtubeUrl}
          onChangeText={text => setForm({ ...form, youtubeUrl: text })}
          placeholder="https://www.youtube.com/watch?v=..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.helpText}>
          העתק את הקישור המלא מ-YouTube (לדוגמה: https://www.youtube.com/watch?v=VIDEO_ID)
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <TextInput
          style={styles.input}
          value={form.category}
          onChangeText={text => setForm({ ...form, category: text })}
          placeholder="הכנס קטגוריה (אופציונלי)"
        />
      </View>

      <Pressable
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>הוסף שיעור קצר</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.note}>
        💡 השיעור הקצר יישמר ב-Firestore ויופיע באפליקציה במסך "קטעי לימוד קצרים".
      </Text>
    </View>
  )
}

// ========== LONG LESSONS FORM ==========
function LongLessonsForm() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    category: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.youtubeUrl.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת וקישור YouTube')
      return
    }

    // Extract YouTube ID
    const youtubeIdPattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/
    const match = form.youtubeUrl.match(youtubeIdPattern)
    if (!match || !match[1]) {
      Alert.alert('שגיאה', 'קישור YouTube לא תקין. אנא השתמש בקישור מלא מ-YouTube')
      return
    }

    setSaving(true)
    try {
      await db.addDocument('longLessons', {
        title: form.title.trim(),
        description: form.description.trim() || '',
        youtubeUrl: form.youtubeUrl.trim(),
        category: form.category.trim() || '',
        isActive: true,
        createdAt: new Date().toISOString(),
        order: 0
      })

      Alert.alert(
        'הצלחה! 🎥',
        'השיעור הארוך נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({ title: '', description: '', youtubeUrl: '', category: '' })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving long lesson:', error)
      const errorMessage = error.code === 'permission-denied' 
        ? 'אין הרשאה להוסיף שיעור. ודא שאתה מחובר כמנהל.'
        : error.message || 'לא ניתן להוסיף את השיעור. אנא נסה שנית.'
      Alert.alert('שגיאה', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>🎥 הוספת שיעור ארוך</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת השיעור הארוך *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="הכנס כותרת השיעור"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תיאור</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.description}
          onChangeText={text => setForm({ ...form, description: text })}
          placeholder="הכנס תיאור (אופציונלי)"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קישור YouTube *</Text>
        <TextInput
          style={styles.input}
          value={form.youtubeUrl}
          onChangeText={text => setForm({ ...form, youtubeUrl: text })}
          placeholder="https://www.youtube.com/watch?v=..."
          autoCapitalize="none"
          keyboardType="url"
        />
        <Text style={styles.helpText}>
          העתק את הקישור המלא מ-YouTube (לדוגמה: https://www.youtube.com/watch?v=VIDEO_ID)
        </Text>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>קטגוריה</Text>
        <TextInput
          style={styles.input}
          value={form.category}
          onChangeText={text => setForm({ ...form, category: text })}
          placeholder="הכנס קטגוריה (אופציונלי)"
        />
      </View>

      <Pressable
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>הוסף שיעור ארוך</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.note}>
        💡 השיעור הארוך יישמר ב-Firestore ויופיע באפליקציה במסך "שיעורים" (שיעורים מלאים).
      </Text>
    </View>
  )
}

// ========== HODU LAHASHEM FORM ==========
function HoduLaHashemForm() {
  const [form, setForm] = useState({
    title: '',
    content: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת ותוכן')
      return
    }

    setSaving(true)
    try {
      await db.addDocument('hoduLaHashem', {
        title: form.title.trim(),
        content: form.content.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
      })

      Alert.alert(
        'הצלחה! ✨',
        'סיפור הניסים נוסף בהצלחה ויופיע באפליקציה',
        [
          {
            text: 'אישור',
            onPress: () => {
              setForm({ title: '', content: '' })
            }
          }
        ]
      )
    } catch (error) {
      console.error('Error saving story:', error)
      const errorMessage = error.code === 'permission-denied' 
        ? 'אין הרשאה להוסיף סיפור. ודא שאתה מחובר כמנהל.'
        : error.message || 'לא ניתן להוסיף את הסיפור. אנא נסה שנית.'
      Alert.alert('שגיאה', errorMessage)
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>✨ הוספת סיפור ניסים (הודו לה')</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>כותרת הסיפור *</Text>
        <TextInput
          style={styles.input}
          value={form.title}
          onChangeText={text => setForm({ ...form, title: text })}
          placeholder="הכנס כותרת הסיפור"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>תוכן הסיפור *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={form.content}
          onChangeText={text => setForm({ ...form, content: text })}
          placeholder="כתוב את סיפור הניסים כאן..."
          multiline
          numberOfLines={10}
        />
      </View>

      <Pressable
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={saving}
      >
        <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={StyleSheet.absoluteFill} />
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>הוסף סיפור ניסים</Text>
          </>
        )}
      </Pressable>

      <Text style={styles.note}>
        💡 סיפור הניסים יישמר ב-Firestore ויופיע באפליקציה במסך "הודו לה'".
      </Text>
    </View>
  )
}

// ============================================
// Bundled Prayers Form (תפילות מובנות)
// ============================================
function BundledPrayersForm() {
  const [prayers, setPrayers] = useState({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null) // Track which prayer is uploading
  const [selectedLanguage, setSelectedLanguage] = useState('he')

  useEffect(() => {
    loadBundledPrayers()
  }, [])

  const loadBundledPrayers = async () => {
    try {
      // Load bundled prayers images from app_config
      const config = await db.getAppConfig()
      setPrayers(config?.bundled_prayers || {})
    } catch (err) {
      console.error('Error loading bundled prayers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePickImages = async (prayerId) => {
    try {
      // Allow multiple image selection without cropping
      const images = await pickImage({
        allowsMultipleSelection: true,
        allowsEditing: false,
        quality: 0.9
      })
      if (!images || images.length === 0) return

      setUploading(prayerId)

      // Upload all images to Supabase
      const uploadedUrls = []
      for (let i = 0; i < images.length; i++) {
        const img = images[i]
        const path = `bundled-prayers/${prayerId}/${Date.now()}_${i}.jpg`
        const url = await uploadFileToSupabaseStorage(img.uri, 'newsletters', path, () => {})
        uploadedUrls.push(url)
      }

      // Update app_config with new images
      const currentPrayer = prayers[prayerId] || {}
      const existingByLanguage = currentPrayer.imagesByLanguage || {}
      const existingLanguageImages = existingByLanguage[selectedLanguage] || []
      const updatedLanguageImages = [...existingLanguageImages, ...uploadedUrls]
      const updatedByLanguage = {
        ...existingByLanguage,
        [selectedLanguage]: updatedLanguageImages,
      }

      const updatedPrayers = {
        ...prayers,
        [prayerId]: {
          ...currentPrayer,
          imagesByLanguage: updatedByLanguage,
          ...(selectedLanguage === 'he' ? { images: updatedLanguageImages } : {}),
        }
      }

      await db.updateAppConfig({
        bundled_prayers: updatedPrayers
      })

      setPrayers(updatedPrayers)
      Alert.alert('הצלחה!', `${uploadedUrls.length} תמונות הועלו בהצלחה`)
    } catch (err) {
      console.error('Error uploading images:', err)
      Alert.alert('שגיאה', 'לא ניתן להעלות את התמונות')
    } finally {
      setUploading(null)
    }
  }

  const handleDeleteImage = async (prayerId, imageIndex) => {
    Alert.alert(
      'מחיקת תמונה',
      'האם אתה בטוח שברצונך למחוק תמונה זו?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentPrayer = prayers[prayerId] || {}
              const existingByLanguage = currentPrayer.imagesByLanguage || {}
              const updatedLanguageImages = [...(existingByLanguage[selectedLanguage] || [])]
              updatedLanguageImages.splice(imageIndex, 1)
              const updatedByLanguage = {
                ...existingByLanguage,
                [selectedLanguage]: updatedLanguageImages,
              }

              const updatedPrayers = {
                ...prayers,
                [prayerId]: {
                  ...currentPrayer,
                  imagesByLanguage: updatedByLanguage,
                  ...(selectedLanguage === 'he' ? { images: updatedLanguageImages } : {}),
                }
              }

              await db.updateAppConfig({
                bundled_prayers: updatedPrayers
              })

              setPrayers(updatedPrayers)
              Alert.alert('הצלחה', 'התמונה נמחקה')
            } catch (err) {
              console.error('Error deleting image:', err)
              Alert.alert('שגיאה', 'לא ניתן למחוק את התמונה')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY_BLUE} />
        <Text style={styles.loadingText}>טוען...</Text>
      </View>
    )
  }

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>📿 ניהול תפילות מובנות</Text>
      <Text style={styles.formSubtitle}>
        העלה תמונות לכל תפילה לפי שפה. ניתן להעלות מספר תמונות לכל תפילה.
      </Text>
      <View style={styles.bundledLangRow}>
        {PRAYER_LANGUAGES.map((lang) => (
          <Pressable
            key={lang.code}
            style={[
              styles.bundledLangChip,
              selectedLanguage === lang.code && styles.bundledLangChipActive
            ]}
            onPress={() => setSelectedLanguage(lang.code)}
          >
            <Text
              style={[
                styles.bundledLangChipText,
                selectedLanguage === lang.code && styles.bundledLangChipTextActive
              ]}
            >
              {lang.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {BUNDLED_PRAYERS.map((prayer) => {
        const prayerData = prayers[prayer.id] || {}
        const imagesByLanguage = prayerData.imagesByLanguage || {}
        const images =
          imagesByLanguage[selectedLanguage] ||
          (selectedLanguage === 'he' ? prayerData.images || [] : [])
        const isUploading = uploading === prayer.id

        return (
          <View key={prayer.id} style={styles.bundledPrayerCard}>
            <View style={styles.bundledPrayerHeader}>
              <Text style={styles.bundledPrayerTitle}>{prayer.title}</Text>
              {prayer.gender && prayer.gender !== 'global' && (
                <Text style={styles.bundledPrayerGender}>
                  {prayer.gender === 'man' ? '(לאיש)' : '(לאישה)'}
                </Text>
              )}
            </View>

            {/* Images grid */}
            {images.length > 0 && (
              <View style={styles.imagesGrid}>
                {images.map((imageUrl, index) => (
                  <View key={index} style={styles.imageGridItem}>
                    <Image source={{ uri: imageUrl }} style={styles.gridImage} />
                    <Pressable
                      style={styles.deleteImageBtn}
                      onPress={() => handleDeleteImage(prayer.id, index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {/* Upload button */}
            <Pressable
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={() => handlePickImages(prayer.id)}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={PRIMARY_BLUE} size="small" />
              ) : (
                <Ionicons name="images-outline" size={24} color={PRIMARY_BLUE} />
              )}
              <Text style={styles.uploadButtonText}>
                {isUploading
                  ? 'מעלה...'
                  : images.length > 0
                    ? 'הוסף תמונות נוספות'
                    : 'העלה תמונות'}
              </Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 12, android: 12, default: 12 }),
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  permissionsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  tabsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(11,27,58,0.08)',
  },
  tabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(11,27,58,0.04)',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  tabTextActive: {
    color: PRIMARY_BLUE,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
    gap: 20,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 8,
  },
  formGroup: {
    gap: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'left',
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(11,27,58,0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  radioButtonActive: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderColor: PRIMARY_BLUE,
  },
  radioText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
  },
  radioTextActive: {
    color: PRIMARY_BLUE,
  },
  scheduleToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  scheduleToggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleToggleBoxActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  scheduleInputsRow: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 12,
  },
  scheduleInputLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 4,
    fontFamily: 'Poppins_400Regular',
  },
  checkboxGroup: {
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
  },
  uploadSection: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PRIMARY_BLUE,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(212,175,55,0.05)',
  },
  uploadButtonText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  note: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 18,
    backgroundColor: 'rgba(212,175,55,0.08)',
    padding: 12,
    borderRadius: 10,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(11,27,58,0.12)',
    marginVertical: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.2)',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  uploadedText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#16a34a',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  audioPreview: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  audioPreviewText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
  },
  pdfPreview: {
    width: '100%',
    minHeight: 100,
    borderRadius: 12,
    backgroundColor: 'rgba(30,58,138,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    padding: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.2)',
  },
  pdfName: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
    textAlign: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  addShortLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    minHeight: 56,
    position: 'relative',
  },
  addShortLessonButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11,27,58,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.1)',
  },
  modalCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 16, color: DEEP_BLUE, fontFamily: 'Poppins_600SemiBold' },
  modalSaveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 16, color: '#fff', fontFamily: 'Poppins_600SemiBold' },
  adminBooksList: { marginTop: 8, gap: 8 },
  adminBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.06)',
  },
  adminBookTitle: { flex: 1, fontSize: 15, color: DEEP_BLUE, marginLeft: 12 },
  adminBookBtn: { padding: 8, borderRadius: 8, backgroundColor: 'rgba(30,58,138,0.1)' },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
    paddingVertical: 14,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  listSection: {
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
  songsList: {
    maxHeight: 400,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  songInfo: {
    flex: 1,
    marginRight: 12,
  },
  songTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 4,
    textAlign: 'right',
  },
  songDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    marginBottom: 4,
    textAlign: 'right',
  },
  songMeta: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'right',
  },
  songActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(11,27,58,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 16,
  },
  // Featured Topic Form Styles
  formSubtitle: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 20,
  },
  toggleButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: PRIMARY_BLUE,
  },
  toggleButtonText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  typeButtonActive: {
    backgroundColor: 'rgba(30,58,138,0.08)',
    borderColor: PRIMARY_BLUE,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#6b7280',
  },
  typeButtonTextActive: {
    color: PRIMARY_BLUE,
  },
  imageUploadContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pickImageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  pickImageText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: PRIMARY_BLUE,
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadBtnText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#f3f4f6',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'right',
    marginTop: 4,
    fontStyle: 'italic',
  },
  articlesList: {
    maxHeight: 500,
  },
  articleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  articleInfo: {
    flex: 1,
    marginRight: 12,
  },
  articleTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  articleDescription: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 6,
  },
  articleMeta: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'right',
  },
  articleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  bundledPrayerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  bundledPrayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bundledPrayerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  bundledPrayerGender: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
  },
  bundledLangRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  bundledLangChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(30,58,138,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.25)',
  },
  bundledLangChipActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  bundledLangChipText: {
    color: PRIMARY_BLUE,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  bundledLangChipTextActive: {
    color: '#fff',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imageGridItem: {
    width: '31%',
    minHeight: 150,
    position: 'relative',
    marginBottom: 8,
  },
  gridImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  deleteImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
})
