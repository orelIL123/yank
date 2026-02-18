import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Share, ActivityIndicator, Alert, Linking, Modal, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Video } from 'expo-av'
import YoutubePlayer from 'react-native-youtube-iframe'

import AppHeader from '../components/AppHeader'
import db from '../services/database'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const VIDEO_ASPECT = 16 / 9
const VIDEO_HEIGHT = Math.min(SCREEN_WIDTH - 32, 320)
const VIDEO_HEIGHT_MODAL = Math.min(SCREEN_WIDTH - 24, 340)

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

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function NewsArticleScreen({ navigation, route, userRole }) {
  const articleId = route?.params?.articleId

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [youtubeModalVisible, setYoutubeModalVisible] = useState(false)
  const [youtubeModalId, setYoutubeModalId] = useState(null)

  const canManage = userRole === 'admin'

  const formatDate = (date) => {
    if (!date) return ''
    if (date.toDate) {
      return date.toDate().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return new Date(date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const headerSubtitle = useMemo(() => {
    if (!article?.date) return undefined
    const d = formatDate(article.date)
    return d || undefined
  }, [article?.date])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (!articleId) {
          setArticle(null)
          return
        }
        const doc = await db.getDocument('news', articleId)
        if (mounted) setArticle(doc)
      } catch (e) {
        console.error('Error loading article:', e)
        Alert.alert('שגיאה', 'לא ניתן לטעון את הכתבה')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [articleId])

  const handleShare = async () => {
    if (!article) return
    const messageParts = [article.title]
    if (article.summary) messageParts.push(article.summary)
    if (!article.summary && article.content) messageParts.push(article.content)
    if (article.youtubeUrl) messageParts.push(article.youtubeUrl)
    await Share.share({ message: messageParts.filter(Boolean).join('\n\n') }).catch(() => {})
  }

  const handleDeleteArticle = () => {
    Alert.alert(
      'מחיקת כתבה',
      `האם למחוק את הכתבה "${article?.title}"? פעולה זו אינה ניתנת לביטול.`,
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteDocument('news', articleId)
              navigation.goBack()
            } catch (e) {
              Alert.alert('שגיאה', 'לא ניתן למחוק את הכתבה')
            }
          }
        }
      ]
    )
  }

  const youtubeId = article?.youtubeId || (article?.youtubeUrl && extractYouTubeId(article.youtubeUrl))
  const hasYoutube = !!youtubeId
  const hasUploadedVideo = !!article?.videoUrl

  const openYouTube = (videoId) => {
    if (!videoId) return
    const url = `https://www.youtube.com/watch?v=${videoId}`
    Linking.openURL(url).catch(() => Alert.alert('שגיאה', 'לא ניתן לפתוח את הסרטון'))
  }

  const openYoutubeInModal = (videoId) => {
    setYoutubeModalId(videoId)
    setYoutubeModalVisible(true)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title="כתבה"
          subtitle={undefined}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען כתבה...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader title="כתבה" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.25 }} />
          <Text style={styles.emptyTitle}>הכתבה לא נמצאה</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="מהנעשה בבית המדרש"
        subtitle={headerSubtitle}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon={canManage ? 'create-outline' : 'share-social-outline'}
        onRightIconPress={
          canManage ? () => navigation.navigate('AddNews', { article }) : handleShare
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.title}>{article.title}</Text>
          {!!article.summary && <Text style={styles.summary}>{article.summary}</Text>}
          {!!article.content && <Text style={styles.body}>{article.content}</Text>}

          {/* YouTube video */}
          {hasYoutube && (
            <View style={styles.videoSection}>
              <View style={styles.videoSectionHeader}>
                <View style={styles.videoSectionBadge}>
                  <Ionicons name="play-circle" size={16} color={PRIMARY_BLUE} />
                  <Text style={styles.videoSectionLabel}>סרטון</Text>
                </View>
              </View>
              <Pressable
                style={styles.youtubeCard}
                onPress={() => openYoutubeInModal(youtubeId)}
                accessibilityRole="button"
                accessibilityLabel="צפה בסרטון ביוטיוב"
              >
                <Image
                  source={{ uri: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` }}
                  style={styles.youtubeThumbnail}
                  resizeMode="cover"
                />
                <View style={styles.youtubeOverlay}>
                  <View style={styles.youtubePlayBtn}>
                    <Ionicons name="play" size={40} color="#fff" style={{ marginLeft: 4 }} />
                  </View>
                  <Text style={styles.youtubePlayText}>לחץ לצפייה</Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.youtubeLinkBtn}
                onPress={() => openYouTube(youtubeId)}
              >
                <Ionicons name="logo-youtube" size={22} color="#fff" />
                <Text style={styles.youtubeLinkText}>פתח ביוטיוב</Text>
              </Pressable>
            </View>
          )}

          {/* Uploaded video (from device) */}
          {hasUploadedVideo && !hasYoutube && (
            <View style={styles.videoSection}>
              <Text style={styles.videoSectionLabel}>סרטון</Text>
              <Video
                source={{ uri: article.videoUrl }}
                style={styles.uploadedVideo}
                useNativeControls
                resizeMode="contain"
                shouldPlay={false}
                isLooping={false}
              />
            </View>
          )}

          <View style={styles.actionsRow}>
            {canManage && (
              <Pressable style={styles.actionBtnDelete} onPress={handleDeleteArticle} accessibilityRole="button">
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                <Text style={styles.actionTextDelete}>מחק כתבה</Text>
              </Pressable>
            )}
            <Pressable style={styles.actionBtn} onPress={handleShare} accessibilityRole="button">
              <Ionicons name="share-social-outline" size={18} color={PRIMARY_BLUE} />
              <Text style={styles.actionText}>שתף</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Modal: YouTube in-app player */}
      <Modal
        visible={youtubeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setYoutubeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setYoutubeModalVisible(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="סגור"
            >
              <Ionicons name="close-circle" size={36} color={DEEP_BLUE} />
            </Pressable>
            {youtubeModalId ? (
              <YoutubePlayer
                height={VIDEO_HEIGHT_MODAL}
                play={false}
                videoId={youtubeModalId}
                webViewStyle={styles.youtubeWebView}
              />
            ) : null}
          </View>
        </View>
      </Modal>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    color: DEEP_BLUE,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    color: DEEP_BLUE,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
  },
  summary: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    fontFamily: 'Poppins_500Medium',
    textAlign: 'right',
  },
  body: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 24,
    color: '#0f172a',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  actionText: {
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  actionTextDelete: {
    color: '#dc2626',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  videoSection: {
    marginTop: 20,
    marginBottom: 8,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30,58,138,0.08)',
  },
  videoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  videoSectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.08)',
  },
  videoSectionLabel: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  youtubeCard: {
    width: '100%',
    height: VIDEO_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0f172a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  youtubeThumbnail: {
    width: '100%',
    height: '100%',
  },
  youtubeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  youtubePlayBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(220,38,38,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  youtubePlayText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  youtubeLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#FF0000',
  },
  youtubeLinkText: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  uploadedVideo: {
    width: '100%',
    height: VIDEO_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    paddingTop: 48,
    paddingHorizontal: 14,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  youtubeWebView: {
    borderRadius: 14,
    alignSelf: 'stretch',
  },
})



