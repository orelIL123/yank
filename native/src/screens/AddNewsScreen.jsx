import React, { useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import db from '../services/database'
import { pickImage, uploadFileToSupabaseStorage, pickVideo } from '../utils/storage'
import { supabase } from '../config/supabase'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|m\.youtube\.com\/watch\?v=)([^&\n?#/]+)/,
    /youtube\.com\/watch\?.*[?&]v=([^&\n?#]+)/,
    /youtu\.be\/([^?\n&#]+)/,
  ]
  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}

function normalizeFilenameFromUri(uri, type = 'image') {
  const raw = (uri || '').split('/').pop() || (type === 'video' ? 'video.mp4' : 'image.jpg')
  if (raw.includes('.')) return raw
  return type === 'video' ? `${raw}.mp4` : `${raw}.jpg`
}

export default function AddNewsScreen({ navigation, route, userRole }) {
  const article = route?.params?.article
  const isEditing = !!article?.id

  const canManage = userRole === 'admin'

  const [title, setTitle] = useState(article?.title || '')
  const [summary, setSummary] = useState(article?.summary || '')
  const [content, setContent] = useState(article?.content || '')
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [youtubeUrl, setYouTubeUrl] = useState(article?.youtubeUrl || '')
  const [videoName, setVideoName] = useState('')
  const [videoType, setVideoType] = useState(article?.youtubeId ? 'youtube' : (article?.videoUrl ? 'upload' : 'none'))
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const headerTitle = useMemo(() => (isEditing ? 'עריכת תיעוד' : 'הוספת תיעוד'), [isEditing])

  const handlePickImage = async () => {
    const image = await pickImage({ aspect: [16, 9], quality: 0.85 })
    if (!image?.uri) return
    setSelectedImage(image)
  }

  const handlePickVideo = async () => {
    const video = await pickVideo()
    if (!video?.uri) return
    setSelectedVideo(video)
  }

  const handleSubmit = async () => {
    if (!canManage) {
      Alert.alert('אין הרשאה', 'רק אדמין יכול להוסיף/לערוך כתבות')
      return
    }

    if (!title.trim()) {
      Alert.alert('שגיאה', 'נא להזין כותרת')
      return
    }
    const hasYoutube = videoType === 'youtube' && youtubeUrl.trim()
    const hasMedia = selectedImage?.uri || (videoType === 'upload' && selectedVideo?.uri) || article?.imageUrl || article?.videoUrl
    const hasText = summary.trim() || content.trim()
    if (!hasText && !hasYoutube && !hasMedia) {
      Alert.alert('שגיאה', 'נא להזין תקציר, תוכן, קישור ליוטיוב, או להעלות תמונה/סרטון')
      return
    }
    if (videoType === 'youtube' && youtubeUrl.trim()) {
      const id = extractYouTubeId(youtubeUrl.trim())
      if (!id) {
        Alert.alert('שגיאה', 'קישור היוטיוב לא תקין. נא להזין קישור מלא (למשל youtube.com/watch?v=... או youtu.be/...)')
        return
      }
    }

    try {
      setSaving(true)
      setUploadProgress(0)

      const nowIso = new Date().toISOString()
      const youtubeId = videoType === 'youtube' ? extractYouTubeId(youtubeUrl) : null
      
      const baseData = {
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        date: article?.date || nowIso,
        updatedAt: nowIso,
        youtubeUrl: videoType === 'youtube' ? youtubeUrl.trim() : '',
        youtubeId: youtubeId,
        videoUrl: videoType === 'upload' ? (article?.videoUrl || '') : '',
      }

      let saved = null
      if (isEditing) {
        await db.updateDocument('news', article.id, baseData)
        saved = { ...article, ...baseData }
      } else {
        saved = await db.addDocument('news', {
          ...baseData,
          createdAt: nowIso,
          imageUrl: '',
        })
      }

      // Upload video if selected
      if (videoType === 'upload' && selectedVideo?.uri) {
        const filename = normalizeFilenameFromUri(selectedVideo.uri, 'video')
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const path = `${saved.id}/video_${Date.now()}_${safeName}`

        const videoUrl = await uploadFileToSupabaseStorage(selectedVideo.uri, 'news', path, (p) => {
          setUploadProgress(p)
        })

        await db.updateDocument('news', saved.id, { videoUrl, updatedAt: new Date().toISOString() })
      }

      // Upload image (optional)
      if (selectedImage?.uri) {
        const filename = normalizeFilenameFromUri(selectedImage.uri)
        const safeName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
        const path = `${saved.id}/${Date.now()}_${safeName}`

        const imageUrl = await uploadFileToSupabaseStorage(selectedImage.uri, 'news', path, (p) => {
          console.log(`News image upload progress: ${p}%`)
        })

        await db.updateDocument('news', saved.id, { imageUrl, updatedAt: new Date().toISOString() })
      }

      // Save video name if provided (will be deleted after 24 hours)
      if (videoName.trim() && (videoType === 'youtube' || videoType === 'upload')) {
        try {
          await supabase
            .from('video_names')
            .insert([{
              news_id: saved.id,
              video_name: videoName.trim(),
              created_at: new Date().toISOString()
            }])
        } catch (error) {
          console.error('Error saving video name:', error)
          // Don't fail the whole operation if video name save fails
        }
      }

      Alert.alert('הצלחה', isEditing ? 'הכתבה עודכנה בהצלחה' : 'הכתבה נוספה בהצלחה', [
        { text: 'אישור', onPress: () => navigation.goBack() },
      ])
    } catch (e) {
      console.error('Error saving news:', e)
      const msg = e?.message?.includes('Bucket')
        ? 'Bucket לא קיים ב-Supabase Storage. אנא צור bucket בשם "news" ב-Supabase Dashboard.'
        : 'לא ניתן לשמור את הכתבה'
      Alert.alert('שגיאה', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityRole="button">
          <Ionicons name="arrow-back" size={24} color={PRIMARY_BLUE} />
        </Pressable>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        <View style={styles.formCard}>
          <Text style={styles.label}>כותרת *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="כותרת הכתבה"
            placeholderTextColor="#9ca3af"
            textAlign="right"
          />

          <Text style={styles.label}>תקציר</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={summary}
            onChangeText={setSummary}
            placeholder="תקציר קצר (אופציונלי)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlign="right"
          />

          <Text style={styles.label}>תוכן</Text>
          <TextInput
            style={[styles.input, styles.textAreaLg]}
            value={content}
            onChangeText={setContent}
            placeholder="תוכן הכתבה"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={8}
            textAlign="right"
          />

          <Text style={styles.label}>תמונה (אופציונלי)</Text>
          <Pressable style={styles.imageBtn} onPress={handlePickImage} accessibilityRole="button">
            <Ionicons name="image-outline" size={22} color={PRIMARY_BLUE} />
            <Text style={styles.imageBtnText}>{selectedImage ? 'החלף תמונה' : 'בחר תמונה'}</Text>
          </Pressable>

          {(selectedImage?.uri || article?.imageUrl) && (
            <Image
              source={{ uri: selectedImage?.uri || article?.imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          )}

          <Text style={styles.label}>וידאו (אופציונלי)</Text>
          <View style={styles.videoTypeRow}>
            <Pressable 
              style={[styles.videoTypeBtn, videoType === 'none' && styles.videoTypeBtnActive]} 
              onPress={() => setVideoType('none')}
            >
              <Text style={[styles.videoTypeBtnText, videoType === 'none' && styles.videoTypeBtnTextActive]}>ללא</Text>
            </Pressable>
            <Pressable 
              style={[styles.videoTypeBtn, videoType === 'youtube' && styles.videoTypeBtnActive]} 
              onPress={() => setVideoType('youtube')}
            >
              <Text style={[styles.videoTypeBtnText, videoType === 'youtube' && styles.videoTypeBtnTextActive]}>YouTube</Text>
            </Pressable>
            <Pressable 
              style={[styles.videoTypeBtn, videoType === 'upload' && styles.videoTypeBtnActive]} 
              onPress={() => setVideoType('upload')}
            >
              <Text style={[styles.videoTypeBtnText, videoType === 'upload' && styles.videoTypeBtnTextActive]}>העלאה</Text>
            </Pressable>
          </View>

          {videoType === 'youtube' && (
            <>
              <TextInput
                style={styles.input}
                value={youtubeUrl}
                onChangeText={setYouTubeUrl}
                placeholder="קישור ליוטיוב"
                placeholderTextColor="#9ca3af"
                textAlign="right"
                autoCapitalize="none"
              />
              <Text style={styles.label}>שם הסרטון (אופציונלי)</Text>
              <TextInput
                style={styles.input}
                value={videoName}
                onChangeText={setVideoName}
                placeholder="הזן שם לסרטון"
                placeholderTextColor="#9ca3af"
                textAlign="right"
              />
            </>
          )}

          {videoType === 'upload' && (
            <View>
              <Pressable style={styles.imageBtn} onPress={handlePickVideo} accessibilityRole="button">
                <Ionicons name="videocam-outline" size={22} color={PRIMARY_BLUE} />
                <Text style={styles.imageBtnText}>{selectedVideo ? 'החלף סרטון' : 'בחר סרטון'}</Text>
              </Pressable>
              {selectedVideo && (
                <Text style={styles.videoSelectedText}>סרטון נבחר: {selectedVideo.uri.split('/').pop()}</Text>
              )}
              <Text style={styles.label}>שם הסרטון (אופציונלי)</Text>
              <TextInput
                style={styles.input}
                value={videoName}
                onChangeText={setVideoName}
                placeholder="הזן שם לסרטון"
                placeholderTextColor="#9ca3af"
                textAlign="right"
              />
              {saving && videoType === 'upload' && selectedVideo && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>מעלה וידאו: {Math.round(uploadProgress)}%</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        <Pressable
          style={[styles.submitButton, (saving || !canManage) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving || !canManage}
          accessibilityRole="button"
        >
          <LinearGradient colors={[PRIMARY_BLUE, '#2563eb']} style={styles.submitGradient}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>{isEditing ? 'שמור שינויים' : 'פרסם כתבה'}</Text>
              </>
            )}
          </LinearGradient>
        </Pressable>

        {!canManage && (
          <Text style={styles.noPermText}>רק אדמין יכול להוסיף/לערוך כתבות.</Text>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingTop: 12,
    paddingBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    gap: 16,
  },
  formCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    gap: 10,
  },
  label: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    fontFamily: 'Poppins_500Medium',
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  textAreaLg: {
    minHeight: 180,
    textAlignVertical: 'top',
  },
  imageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  imageBtnText: {
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_600SemiBold',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    marginTop: 6,
  },
  videoTypeRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginTop: 4,
  },
  videoTypeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  videoTypeBtnActive: {
    backgroundColor: PRIMARY_BLUE,
    borderColor: PRIMARY_BLUE,
  },
  videoTypeBtnText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#64748b',
  },
  videoTypeBtnTextActive: {
    color: '#fff',
  },
  videoSelectedText: {
    fontSize: 12,
    color: PRIMARY_BLUE,
    textAlign: 'right',
    marginTop: 4,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressText: {
    fontSize: 12,
    color: PRIMARY_BLUE,
    textAlign: 'right',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY_BLUE,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  noPermText: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6b7280',
    fontFamily: 'Poppins_500Medium',
  },
})



