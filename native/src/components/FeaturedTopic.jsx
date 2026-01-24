import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ImageBackground, Linking, Alert, ActivityIndicator, Platform, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Video } from 'expo-av'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const PRIMARY_BLUE = '#1e3a8a'
const DEEP_BLUE = '#0b1b3a'

export default function FeaturedTopic({ config, isAdmin, onEdit }) {
  const [videoLoading, setVideoLoading] = useState(true)

  console.log('🟣 FeaturedTopic: Received config:', config)
  console.log('🟣 FeaturedTopic: Enabled?', config?.featured_topic_enabled)

  if (!config) {
    console.log('🔴 FeaturedTopic: No config received!')
    return null
  }

  if (!config.featured_topic_enabled) {
    console.log('🟡 FeaturedTopic: Feature is disabled')
    return null
  }

  console.log('🟢 FeaturedTopic: Rendering with type:', config.featured_topic_type)

  const {
    featured_topic_title,
    featured_topic_description,
    featured_topic_type,
    featured_topic_image_url,
    featured_topic_youtube_id,
    featured_topic_video_url,
    featured_topic_link_url,
    featured_topic_button_text,
  } = config

  const handlePress = () => {
    if (featured_topic_link_url) {
      Linking.openURL(featured_topic_link_url).catch(() => {
        Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור')
      })
    }
  }

  const handleYouTubePress = () => {
    if (featured_topic_youtube_id) {
      // YouTube blocks embed in WebView (Error 153), so always open in YouTube app
      handleOpenInYouTubeApp()
    }
  }

  const handleOpenInYouTubeApp = () => {
    if (featured_topic_youtube_id) {
      // Try YouTube app first, then fallback to browser
      const youtubeAppUrl = `vnd.youtube:${featured_topic_youtube_id}`
      const youtubeWebUrl = `https://www.youtube.com/watch?v=${featured_topic_youtube_id}`
      
      // Try to open YouTube app first
      Linking.canOpenURL(youtubeAppUrl).then((supported) => {
        if (supported) {
          return Linking.openURL(youtubeAppUrl)
        } else {
          // Fallback to web browser
          return Linking.openURL(youtubeWebUrl)
        }
      }).catch(() => {
        // If both fail, try web URL
        Linking.openURL(youtubeWebUrl).catch(() => {
          Alert.alert('שגיאה', 'לא ניתן לפתוח את הסרטון. אנא פתח את יוטיוב ידנית.')
        })
      })
    }
  }

  const renderContent = () => {
    switch (featured_topic_type) {
      case 'youtube':
        return (
          <>
            <Pressable
              style={styles.featuredCard}
              onPress={handleYouTubePress}
              accessibilityRole="button"
            >
              {featured_topic_youtube_id && (
                <View style={styles.youtubePreviewContainer}>
                  <ImageBackground
                    source={{ uri: `https://img.youtube.com/vi/${featured_topic_youtube_id}/maxresdefault.jpg` }}
                    style={styles.featuredImageBackground}
                    imageStyle={{ borderRadius: 18 }}
                    resizeMode="contain"
                    onError={() => console.log('Image load error')}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
                      style={styles.featuredOverlay}
                    >
                      {/* Subtle Play Overlay */}
                      <View style={styles.playOverlay}>
                        <View style={styles.playButtonSubtle}>
                          <Ionicons name="play" size={24} color="#fff" style={{ marginLeft: 2 }} />
                        </View>
                      </View>

                      <View style={styles.featuredContentBottom}>
                        {featured_topic_title && (
                          <Text style={styles.featuredTitle}>{featured_topic_title}</Text>
                        )}
                        {featured_topic_description && (
                          <Text style={styles.featuredDescription}>{featured_topic_description}</Text>
                        )}
                      </View>
                    </LinearGradient>
                  </ImageBackground>
                </View>
              )}
              {isAdmin && (
                <Pressable
                  style={styles.editButton}
                  onPress={onEdit}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                </Pressable>
              )}
            </Pressable>

          </>
        )

      case 'live_video':
        return (
          <View style={styles.featuredCard}>
            {featured_topic_video_url ? (
              <View style={styles.liveVideoContainer}>
                {videoLoading && (
                  <View style={styles.videoLoadingOverlay}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.loadingText}>טוען שידור חי...</Text>
                  </View>
                )}
                <Video
                  source={{ uri: featured_topic_video_url }}
                  style={styles.video}
                  useNativeControls
                  resizeMode="contain"
                  shouldPlay={false}
                  isLooping={false}
                  onLoadStart={() => setVideoLoading(true)}
                  onLoad={() => setVideoLoading(false)}
                  onError={(error) => {
                    console.error('Video error:', error)
                    setVideoLoading(false)
                    Alert.alert('שגיאה', 'לא ניתן לטעון את השידור החי')
                  }}
                />
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
                <View style={styles.liveOverlayContent}>
                  {featured_topic_title && (
                    <Text style={styles.liveTitle}>{featured_topic_title}</Text>
                  )}
                  {featured_topic_description && (
                    <Text style={styles.liveDescription}>{featured_topic_description}</Text>
                  )}
                </View>
              </View>
            ) : null}
            {isAdmin && (
              <Pressable
                style={styles.editButton}
                onPress={onEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
              </Pressable>
            )}
          </View>
        )

      case 'image':
      default:
        return (
          <Pressable
            style={styles.featuredCard}
            onPress={featured_topic_link_url ? handlePress : undefined}
            accessibilityRole="button"
            disabled={!featured_topic_link_url}
          >
            {featured_topic_image_url ? (
              <ImageBackground
                source={{ uri: featured_topic_image_url }}
                style={styles.featuredImageBackground}
                imageStyle={styles.featuredImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                  style={styles.featuredOverlay}
                >
                  <View style={styles.featuredContent}>
                    {featured_topic_title && (
                      <Text style={styles.featuredTitle}>{featured_topic_title}</Text>
                    )}
                    {featured_topic_description && (
                      <Text style={styles.featuredDescription}>{featured_topic_description}</Text>
                    )}
                    {featured_topic_link_url && (
                      <View style={styles.featuredButtonWrapper}>
                        <Pressable style={styles.featuredButton}>
                          <Text style={styles.featuredButtonText}>
                            {featured_topic_button_text || 'למידע נוסף'}
                          </Text>
                          <Ionicons name="arrow-back" size={18} color="#fff" />
                        </Pressable>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </ImageBackground>
            ) : (
              <LinearGradient
                colors={[PRIMARY_BLUE, '#1e40af']}
                style={styles.featuredImageBackground}
              >
                <View style={styles.featuredContent}>
                  {featured_topic_title && (
                    <Text style={styles.featuredTitle}>{featured_topic_title}</Text>
                  )}
                  {featured_topic_description && (
                    <Text style={styles.featuredDescription}>{featured_topic_description}</Text>
                  )}
                  {featured_topic_link_url && (
                    <View style={styles.featuredButtonWrapper}>
                      <Pressable style={styles.featuredButton}>
                        <Text style={styles.featuredButtonText}>
                          {featured_topic_button_text || 'למידע נוסף'}
                        </Text>
                        <Ionicons name="arrow-back" size={18} color="#fff" />
                      </Pressable>
                    </View>
                  )}
                </View>
              </LinearGradient>
            )}
            {isAdmin && (
              <Pressable
                style={styles.editButton}
                onPress={onEdit}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="create-outline" size={20} color="#fff" />
              </Pressable>
            )}
          </Pressable>
        )
    }
  }

  return <View style={styles.container}>{renderContent()}</View>
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  featuredCard: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    position: 'relative',
  },
  featuredImageBackground: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  featuredImage: {
    borderRadius: 18,
    resizeMode: 'cover',
  },
  youtubePreviewContainer: {
    width: '100%',
    aspectRatio: 16 / 9, // YouTube standard aspect ratio - exactly like YouTube!
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  featuredOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonSubtle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 0, 0, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  featuredContentBottom: {
    alignItems: 'flex-end',
    width: '100%',
  },
  featuredContent: {
    alignItems: 'flex-end',
    width: '100%',
  },
  featuredTextContent: {
    padding: 20,
    alignItems: 'flex-end',
  },
  featuredTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    textAlign: 'right',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 26,
  },
  featuredTitleDark: {
    color: DEEP_BLUE,
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  featuredDescription: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  featuredDescriptionDark: {
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 20,
  },
  featuredButtonWrapper: {
    marginTop: 8,
  },
  featuredButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    gap: 8,
  },
  featuredButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
  },
  editButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  liveVideoContainer: {
    width: '100%',
    aspectRatio: 16 / 9, // YouTube standard aspect ratio
    backgroundColor: '#000',
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    marginTop: 12,
  },
  liveOverlayContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  liveTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    textAlign: 'right',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  liveDescription: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
})

