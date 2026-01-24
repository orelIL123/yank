import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, ImageBackground, Linking, Alert, ActivityIndicator, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Video } from 'expo-av'

const PRIMARY_BLUE = '#1e3a8a'
const DEEP_BLUE = '#0b1b3a'

export default function FeaturedTopic({ config, isAdmin, onEdit }) {
  const [videoLoading, setVideoLoading] = useState(true)

  if (!config?.featured_topic_enabled) {
    return null
  }

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
      const url = `https://www.youtube.com/watch?v=${featured_topic_youtube_id}`
      Linking.openURL(url).catch(() => {
        Alert.alert('שגיאה', 'לא ניתן לפתוח את הסרטון')
      })
    }
  }

  const renderContent = () => {
    switch (featured_topic_type) {
      case 'youtube':
        return (
          <Pressable
            style={styles.featuredCard}
            onPress={handleYouTubePress}
            accessibilityRole="button"
          >
            {featured_topic_youtube_id && (
              <ImageBackground
                source={{ uri: `https://img.youtube.com/vi/${featured_topic_youtube_id}/maxresdefault.jpg` }}
                style={styles.featuredImageBackground}
                imageStyle={styles.featuredImage}
                resizeMode="cover"
              >
                <LinearGradient
                  colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
                  style={styles.featuredOverlay}
                >
                  <View style={styles.playButtonWrapper}>
                    <Ionicons name="play-circle" size={64} color="#fff" />
                  </View>
                  <View style={styles.featuredContent}>
                    {featured_topic_title && (
                      <Text style={styles.featuredTitle}>{featured_topic_title}</Text>
                    )}
                    {featured_topic_description && (
                      <Text style={styles.featuredDescription}>{featured_topic_description}</Text>
                    )}
                  </View>
                </LinearGradient>
              </ImageBackground>
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

      case 'live_video':
        return (
          <View style={styles.featuredCard}>
            {featured_topic_video_url ? (
              <View style={styles.videoContainer}>
                {videoLoading && (
                  <View style={styles.videoLoadingOverlay}>
                    <ActivityIndicator size="large" color={PRIMARY_BLUE} />
                  </View>
                )}
                <Video
                  source={{ uri: featured_topic_video_url }}
                  style={styles.video}
                  useNativeControls
                  resizeMode="contain"
                  shouldPlay={false}
                  onLoadStart={() => setVideoLoading(true)}
                  onLoad={() => setVideoLoading(false)}
                  onError={(error) => {
                    console.error('Video error:', error)
                    setVideoLoading(false)
                  }}
                />
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>
            ) : null}
            <View style={styles.featuredTextContent}>
              {featured_topic_title && (
                <Text style={styles.featuredTitleDark}>{featured_topic_title}</Text>
              )}
              {featured_topic_description && (
                <Text style={styles.featuredDescriptionDark}>{featured_topic_description}</Text>
              )}
            </View>
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
    minHeight: 240,
    position: 'relative',
  },
  featuredImageBackground: {
    width: '100%',
    minHeight: 240,
  },
  featuredImage: {
    borderRadius: 18,
  },
  featuredOverlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  playButtonWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -32,
    marginLeft: -32,
    opacity: 0.9,
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
    fontSize: 24,
    fontFamily: 'Heebo_700Bold',
    textAlign: 'right',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  featuredTitleDark: {
    color: DEEP_BLUE,
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    textAlign: 'right',
    marginBottom: 8,
  },
  featuredDescription: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 22,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
  videoContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#000',
    position: 'relative',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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

