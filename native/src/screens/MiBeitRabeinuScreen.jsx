import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, ActivityIndicator, Alert, Modal, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import YoutubePlayer from 'react-native-youtube-iframe'
import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'
import db from '../services/database'
import { canManageVideos } from '../utils/permissions'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const { width } = Dimensions.get('window')

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

// Helper function to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

export default function MiBeitRabeinuScreen({ navigation, userRole, userPermissions }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [playingVideo, setPlayingVideo] = useState(false)
  const canManage = canManageVideos(userRole, userPermissions)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('')

  useEffect(() => {
    console.log('MiBeitRabeinuScreen - userRole:', userRole, 'canManage:', canManage)
    loadCategories()
  }, [userRole, userPermissions])

  const loadCategories = async () => {
    try {
      console.log('🔍 Loading categories from rabbiStudents collection...')
      const categoriesRaw = await db.getCollection('rabbiStudents', {
        where: [['isActive', '==', true]],
        orderBy: { field: 'order', direction: 'asc' }
      })

      console.log(`📊 Found ${categoriesRaw.length} categories`)

      const categoriesData = []

      for (const categoryData of categoriesRaw) {
        console.log(`📁 Loading category: ${categoryData.name || categoryData.id}`)

        // Load videos for each category
        try {
          const videos = await db.getSubcollection('rabbiStudents', categoryData.id, 'videos', {
            orderBy: { field: 'createdAt', direction: 'desc' }
          })

          console.log(`  📹 Found ${videos.length} videos`)

          const videosWithThumbnails = videos.map(vData => {
            const youtubeId = extractYouTubeId(vData.videoUrl || vData.youtubeUrl)
            return {
              ...vData,
              youtubeId,
              thumbnailUrl: youtubeId ? getYouTubeThumbnail(youtubeId) : null
            }
          }).filter(video => video.youtubeId)

          categoriesData.push({
            ...categoryData,
            videos: videosWithThumbnails
          })
        } catch (videoError) {
          console.error(`  ⚠️ Error loading videos for category ${categoryData.id}:`, videoError)
          // Add category even if videos failed to load
          categoriesData.push({
            ...categoryData,
            videos: []
          })
        }
      }

      console.log(`✅ Loaded ${categoriesData.length} categories successfully`)
      setCategories(categoriesData)
    } catch (error) {
      console.error('❌ Error loading categories:', error)
      console.error('Error details:', error.message, error.code)
      Alert.alert('שגיאה', `לא ניתן לטעון את הקטגוריות: ${error.message}`)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryPress = (category) => {
    setSelectedCategory(category)
  }

  const handleVideoPress = (video) => {
    setSelectedVideo(video)
    setPlayingVideo(true)
  }

  const handleStateChange = (state) => {
    if (state === 'playing') {
      setPlayingVideo(true)
    } else if (state === 'paused' || state === 'ended') {
      setPlayingVideo(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    if (date.toDate) {
      return date.toDate().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return new Date(date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const handleAddVideo = () => {
    setShowAddModal(true)
  }

  const handleSaveVideo = async () => {
    if (!formTitle.trim() || !formYoutubeUrl.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת וקישור YouTube')
      return
    }

    if (!selectedCategory) {
      Alert.alert('שגיאה', 'לא נבחרה קטגוריה')
      return
    }

    const youtubeId = extractYouTubeId(formYoutubeUrl)
    if (!youtubeId) {
      Alert.alert('שגיאה', 'קישור YouTube לא תקין')
      return
    }

    setSaving(true)
    try {
      // Add video to the category's subcollection
      await db.addToSubcollection('rabbiStudents', selectedCategory.id, 'videos', {
        title: formTitle.trim(),
        description: formDescription.trim() || '',
        videoUrl: formYoutubeUrl.trim(),
        youtubeUrl: formYoutubeUrl.trim(),
        createdAt: new Date().toISOString(),
      })

      Alert.alert('הצלחה', 'הסרטון נוסף בהצלחה')
      setShowAddModal(false)
      setFormTitle('')
      setFormDescription('')
      setFormYoutubeUrl('')

      // Reload the specific category's videos
      try {
        const videos = await db.getSubcollection('rabbiStudents', selectedCategory.id, 'videos', {
          orderBy: { field: 'createdAt', direction: 'desc' }
        })

        const videosWithThumbnails = videos.map(vData => {
          const youtubeId = extractYouTubeId(vData.videoUrl || vData.youtubeUrl)
          return {
            ...vData,
            youtubeId,
            thumbnailUrl: youtubeId ? getYouTubeThumbnail(youtubeId) : null
          }
        }).filter(video => video.youtubeId)

        // Update the selected category with new videos
        setSelectedCategory({
          ...selectedCategory,
          videos: videosWithThumbnails
        })
      } catch (error) {
        console.error('Error reloading videos:', error)
        // Fallback: reload all categories
        await loadCategories()
        const updatedCategory = categories.find(cat => cat.id === selectedCategory.id)
        if (updatedCategory) {
          setSelectedCategory(updatedCategory)
        }
      }
    } catch (error) {
      console.error('Error saving video:', error)
      Alert.alert('שגיאה', 'לא ניתן להוסיף את הסרטון')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title={t('מבית רבינו')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען...</Text>
        </View>
      </SafeAreaView>
    )
  }

  // If a category is selected, show its videos
  if (selectedCategory) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title={t(selectedCategory.name) || selectedCategory.name}
          showBackButton={true}
          onBackPress={() => setSelectedCategory(null)}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {selectedCategory.description && (
            <Text style={styles.studentDescription}>{selectedCategory.description}</Text>
          )}

          {canManage && (
            <Pressable
              style={styles.addButton}
              onPress={handleAddVideo}
            >
              <LinearGradient
                colors={[PRIMARY_BLUE, '#1e40af']}
                style={styles.addButtonGradient}
              >
                <Ionicons name="add" size={24} color="#fff" />
                <Text style={styles.addButtonText}>הוסף סרטון</Text>
              </LinearGradient>
            </Pressable>
          )}

          {selectedCategory.videos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
              <Text style={styles.emptyText}>אין סרטונים זמינים כרגע</Text>
            </View>
          ) : (
            selectedCategory.videos.map((video, idx) => (
              <Pressable
                key={video.id}
                style={[styles.videoCard, idx === 0 && styles.videoCardFirst]}
                onPress={() => handleVideoPress(video)}
                accessibilityRole="button"
                accessibilityLabel={`סרטון ${video.title}`}
              >
                <ImageBackground
                  source={video.thumbnailUrl ? { uri: video.thumbnailUrl } : require('../../assets/photos/cards/yeshiva.png')}
                  style={styles.videoThumbnail}
                  imageStyle={styles.videoThumbnailRadius}
                  pointerEvents="box-none"
                >
                  <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.1)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
                  <View style={styles.videoTopRow} pointerEvents="none">
                    {video.createdAt && (
                      <View style={styles.datePill}>
                        <Ionicons name="calendar-outline" size={14} color="#fff" />
                        <Text style={styles.dateText}>{formatDate(video.createdAt)}</Text>
                      </View>
                    )}
                    <View style={styles.playButton}>
                      <Ionicons name="play" size={36} color="#ffffff" style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                  <View style={styles.videoBottom} pointerEvents="none">
                    <Text style={styles.videoTitle}>{video.title || 'סרטון'}</Text>
                    {video.description && (
                      <Text style={styles.videoDescription} numberOfLines={2}>{video.description}</Text>
                    )}
                  </View>
                </ImageBackground>
              </Pressable>
            ))
          )}
        </ScrollView>

        {/* Video Modal */}
        <Modal visible={!!selectedVideo} animationType="slide" transparent={false}>
          <View style={styles.modalContainer}>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setSelectedVideo(null)
                setPlayingVideo(false)
              }}
            >
              <Ionicons name="close" size={28} color={PRIMARY_BLUE} />
            </Pressable>
            {selectedVideo && (
              <View style={styles.videoPlayerContainer}>
                <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
                  <YoutubePlayer
                    height={240}
                    videoId={selectedVideo.youtubeId}
                    play={playingVideo}
                    onChangeState={handleStateChange}
                    webViewStyle={{ opacity: 0.99 }}
                  />
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.modalVideoTitle}>{selectedVideo.title || 'סרטון'}</Text>
                  {selectedVideo.description && (
                    <Text style={styles.modalVideoDescription}>{selectedVideo.description}</Text>
                  )}
                  {selectedVideo.createdAt && (
                    <Text style={styles.modalVideoDate}>{formatDate(selectedVideo.createdAt)}</Text>
                  )}
                </View>
              </View>
            )}
          </View>
        </Modal>

        {/* Add Video Modal */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAddModal(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.select({ ios: 80, android: 40 })}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>הוסף סרטון חדש</Text>
                  <Pressable
                    onPress={() => {
                      setShowAddModal(false)
                      setFormTitle('')
                      setFormDescription('')
                      setFormYoutubeUrl('')
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Ionicons name="close" size={28} color={DEEP_BLUE} />
                  </Pressable>
                </View>

                <ScrollView
                  style={styles.modalBody}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>כותרת *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formTitle}
                      onChangeText={setFormTitle}
                      placeholder="הכנס כותרת"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>תיאור</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea]}
                      value={formDescription}
                      onChangeText={setFormDescription}
                      placeholder="הכנס תיאור (אופציונלי)"
                      placeholderTextColor="#9ca3af"
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>קישור YouTube *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formYoutubeUrl}
                      onChangeText={setFormYoutubeUrl}
                      placeholder="https://www.youtube.com/watch?v=..."
                      placeholderTextColor="#9ca3af"
                      autoCapitalize="none"
                      keyboardType="url"
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <Pressable
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowAddModal(false)
                      setFormTitle('')
                      setFormDescription('')
                      setFormYoutubeUrl('')
                    }}
                  >
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </Pressable>
                  <Pressable
                    style={styles.saveButton}
                    onPress={handleSaveVideo}
                    disabled={saving}
                  >
                    <LinearGradient
                      colors={[PRIMARY_BLUE, '#1e40af']}
                      style={styles.saveButtonGradient}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.saveButtonText}>שמור</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    )
  }

  // Show students list
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="מבית רבינו"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>{t('קטגוריות')}</Text>

        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין קטגוריות זמינות כרגע</Text>
          </View>
        ) : (
          categories.map((category, idx) => (
            <Pressable
              key={category.id}
              style={[styles.studentCard, idx === 0 && styles.studentCardFirst]}
              onPress={() => handleCategoryPress(category)}
              accessibilityRole="button"
              accessibilityLabel={category.name}
            >
              <View style={styles.studentContent}>
                <View style={styles.studentIcon}>
                  <Ionicons name="folder" size={32} color={PRIMARY_BLUE} />
                </View>
                <View style={styles.studentTextBlock}>
                  <Text style={styles.studentName}>{category.name}</Text>
                  {category.description && (
                    <Text style={styles.studentDesc} numberOfLines={2}>{category.description}</Text>
                  )}
                  <View style={styles.videoCountBadge}>
                    <Ionicons name="videocam-outline" size={16} color={PRIMARY_BLUE} />
                    <Text style={styles.videoCountText}>{category.videos.length} סרטונים</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={PRIMARY_BLUE} />
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
    gap: 20,
  },
  subtitle: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
    marginTop: 8,
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
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.1)',
    marginBottom: 16,
  },
  studentCardFirst: {
    marginTop: 8,
  },
  studentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  studentIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(30,58,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(30,58,138,0.2)',
  },
  studentTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  studentName: {
    color: DEEP_BLUE,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
    lineHeight: 28,
  },
  studentDesc: {
    color: '#64748b',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 22,
  },
  studentDescription: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#475569',
    textAlign: 'right',
    lineHeight: 26,
    padding: 20,
    backgroundColor: 'rgba(30,58,138,0.06)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.1)',
  },
  videoCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30,58,138,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.2)',
  },
  videoCountText: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: PRIMARY_BLUE,
  },
  videoCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  videoCardFirst: {
    marginTop: 8,
  },
  videoThumbnail: {
    height: 240,
    justifyContent: 'space-between',
  },
  videoThumbnailRadius: {
    borderRadius: 24,
  },
  videoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dateText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(30,58,138,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  videoBottom: {
    padding: 18,
    alignItems: 'flex-end',
    gap: 8,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  videoDescription: {
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: BG,
    paddingTop: 60,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30,58,138,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(30,58,138,0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  videoPlayerContainer: {
    flex: 1,
    padding: 20,
  },
  videoInfo: {
    marginTop: 24,
    padding: 20,
    backgroundColor: 'rgba(30,58,138,0.06)',
    borderRadius: 16,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(30,58,138,0.1)',
  },
  modalVideoTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  modalVideoDescription: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#475569',
    marginBottom: 12,
    textAlign: 'right',
    lineHeight: 24,
  },
  modalVideoDate: {
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_BLUE,
    textAlign: 'right',
  },
  addButton: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
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
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    textAlign: 'right',
  },
  formTextArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.1)',
  },
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
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
})
