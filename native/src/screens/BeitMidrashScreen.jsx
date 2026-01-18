import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, ActivityIndicator, Alert, Modal, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import YoutubePlayer from 'react-native-youtube-iframe'
import AppHeader from '../components/AppHeader'
import db from '../services/database'

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

export default function BeitMidrashScreen({ navigation }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [playingVideo, setPlayingVideo] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  const loadVideos = async () => {
    try {
      const rawVideosData = await db.getCollection('beitMidrashVideos', {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 50
      })

      const videosData = rawVideosData.map(data => {
        const youtubeId = extractYouTubeId(data.videoUrl || data.youtubeUrl)
        return {
          id: data.id,
          ...data,
          youtubeId,
          thumbnailUrl: youtubeId ? getYouTubeThumbnail(youtubeId) : null
        }
      }).filter(video => video.youtubeId) // Only show videos with valid YouTube ID

      setVideos(videosData)
    } catch (error) {
      console.error('Error loading videos:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את הסרטונים')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    if (date.toDate) {
      return date.toDate().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return new Date(date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title="מהנעשה בבית המדרש"
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען סרטונים...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="מהנעשה בבית המדרש"
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>סרטונים מבית המדרש</Text>

        {videos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="videocam-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין סרטונים זמינים כרגע</Text>
            <Text style={styles.emptySubtext}>סרטונים חדשים יתווספו בקרוב</Text>
          </View>
        ) : (
          videos.map((video, idx) => (
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
              >
                <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.1)']} style={StyleSheet.absoluteFill} />
                <View style={styles.videoTopRow}>
                  <View style={styles.datePill}>
                    <Ionicons name="calendar-outline" size={14} color={PRIMARY_BLUE} />
                    <Text style={styles.dateText}>{formatDate(video.date)}</Text>
                  </View>
                  <View style={styles.playButton}>
                    <Ionicons name="play" size={32} color="#ffffff" />
                  </View>
                </View>
                <View style={styles.videoBottom}>
                  <Text style={styles.videoTitle}>{video.title || 'מהנעשה בבית המדרש'}</Text>
                  {video.description && (
                    <Text style={styles.videoDescription} numberOfLines={2}>{video.description}</Text>
                  )}
                </View>
              </ImageBackground>
            </Pressable>
          ))
        )}

        <View style={styles.footerCard}>
          <Ionicons name="videocam-outline" size={28} color={PRIMARY_BLUE} />
          <View style={styles.footerTextBlock}>
            <Text style={styles.footerTitle}>סרטונים נוספים</Text>
            <Text style={styles.footerDesc}>
              סרטונים נוספים מבית המדרש יופיעו כאן בקרוב.
            </Text>
          </View>
        </View>
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
              <YoutubePlayer
                height={220}
                videoId={selectedVideo.youtubeId}
                play={playingVideo}
                onChangeState={handleStateChange}
                webViewStyle={{ opacity: 0.99 }}
              />
              <View style={styles.videoInfo}>
                <Text style={styles.modalVideoTitle}>{selectedVideo.title || 'מהנעשה בבית המדרש'}</Text>
                {selectedVideo.description && (
                  <Text style={styles.modalVideoDescription}>{selectedVideo.description}</Text>
                )}
                <Text style={styles.modalVideoDate}>{formatDate(selectedVideo.date)}</Text>
              </View>
            </View>
          )}
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
  content: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 18,
  },
  subtitle: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 15,
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
  videoCard: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  videoCardFirst: {
    marginTop: 6,
  },
  videoThumbnail: {
    height: 220,
    justifyContent: 'space-between',
  },
  videoThumbnailRadius: {
    borderRadius: 22,
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
    backgroundColor: 'rgba(30,58,138,0.2)',
  },
  dateText: {
    color: '#fef9c3',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  videoBottom: {
    padding: 18,
    alignItems: 'flex-end',
    gap: 8,
  },
  videoTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
  },
  videoDescription: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  footerCard: {
    marginTop: 12,
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
    color: '#475569',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayerContainer: {
    flex: 1,
    padding: 16,
  },
  videoInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(30,58,138,0.05)',
    borderRadius: 12,
    alignItems: 'flex-end',
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
})

