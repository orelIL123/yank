import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import db from '../services/database';

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const { width } = Dimensions.get('window');

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#/]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Helper function to get YouTube thumbnail URL
function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export default function LearningLibraryScreen({ navigation, userRole }) {
  const [latestLesson, setLatestLesson] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(true);

  useEffect(() => {
    loadLatestLesson();
  }, []);

  const loadLatestLesson = async () => {
    try {
      // Get the most recent lesson from longLessons (full lessons)
      const lessons = await db.getCollection('longLessons', {
        where: [['isActive', '==', true]],
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 1
      });

      if (lessons && lessons.length > 0) {
        const lesson = lessons[0];
        const youtubeId = extractYouTubeId(lesson.youtubeUrl);
        setLatestLesson({
          ...lesson,
          youtubeId
        });
      }
    } catch (error) {
      console.error('Error loading latest lesson:', error);
    } finally {
      setLoadingLatest(false);
    }
  };

  const handleLatestLessonPress = () => {
    if (latestLesson) {
      navigation?.navigate('LongLessons');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="ספריית לימוד"
        subtitle="כל השיעורים והסרטונים במקום אחד"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* שיעורים - בגדול */}
        <TouchableOpacity
          style={styles.largeCategoryCard}
          onPress={() => navigation?.navigate('LongLessons')}
          activeOpacity={0.9}
        >
          <ImageBackground
            source={require('../../assets/photos/cards/hinuka1.jpg')}
            style={styles.largeCategoryImage}
            imageStyle={styles.largeCategoryImageStyle}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe', 'rgba(0,0,0,0.7)']}
              style={styles.largeCategoryGradient}
            >
              <View style={styles.largeCategoryContent}>
                <View style={styles.largeCategoryIconContainer}>
                  <Ionicons name="film" size={48} color="#fff" style={{ textAlign: 'center' }} />
                </View>
                <Text style={styles.largeCategoryTitle}>שיעורים</Text>
                <Text style={styles.largeCategoryDescription}>
                  שיעורים מלאים מהיוטיוב
                </Text>
                <View style={styles.largeCategoryArrow}>
                  <Ionicons name="chevron-forward" size={28} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>

        {/* קצרים + הודו לה' - ליד זה */}
        <View style={styles.halfRow}>
          {/* קצרים */}
          <TouchableOpacity
            style={styles.halfCategoryCard}
            onPress={() => navigation?.navigate('ShortLessons')}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={require('../../assets/photos/cards/hinuka.png')}
              style={styles.halfCategoryImage}
              imageStyle={styles.halfCategoryImageStyle}
            >
              <LinearGradient
                colors={['#ff6b6b', '#ee5a6f', 'rgba(0,0,0,0.7)']}
                style={styles.halfCategoryGradient}
              >
                <View style={styles.halfCategoryContent}>
                  <View style={styles.halfCategoryIconContainer}>
                    <Ionicons name="videocam" size={32} color="#fff" style={{ textAlign: 'center' }} />
                  </View>
                  <Text style={styles.halfCategoryTitle}>קצרים</Text>
                  <Text style={styles.halfCategoryDescription}>
                    שיעורים קצרים מהיוטיוב/האלעה
                  </Text>
                  <View style={styles.halfCategoryArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>

          {/* הודו לה' */}
          <TouchableOpacity
            style={styles.halfCategoryCard}
            onPress={() => navigation?.navigate('HoduLaHashem')}
            activeOpacity={0.9}
          >
            <ImageBackground
              source={require('../../assets/photos/cards/hinuka.png')}
              style={styles.halfCategoryImage}
              imageStyle={styles.halfCategoryImageStyle}
            >
              <LinearGradient
                colors={['#f59e0b', '#ef4444', 'rgba(0,0,0,0.7)']}
                style={styles.halfCategoryGradient}
              >
                <View style={styles.halfCategoryContent}>
                  <View style={styles.halfCategoryIconContainer}>
                    <Ionicons name="sparkles" size={32} color="#fff" style={{ textAlign: 'center' }} />
                  </View>
                  <Text style={styles.halfCategoryTitle}>הודו לה'</Text>
                  <Text style={styles.halfCategoryDescription}>
                    סיפורי ניסים וכו'
                  </Text>
                  <View style={styles.halfCategoryArrow}>
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        {/* השיעור העדכני ביותר */}
        <View style={styles.latestSection}>
          <Text style={styles.latestSectionTitle}>השיעור העדכני ביותר</Text>
          {loadingLatest ? (
            <View style={styles.latestLoadingContainer}>
              <ActivityIndicator size="small" color={PRIMARY_BLUE} />
            </View>
          ) : latestLesson ? (
            <TouchableOpacity
              style={styles.latestLessonCard}
              onPress={handleLatestLessonPress}
              activeOpacity={0.9}
            >
              <View style={styles.latestLessonContent}>
                <View style={styles.latestLessonThumbnailContainer}>
                  {latestLesson.youtubeId ? (
                    <Image
                      source={{ uri: getYouTubeThumbnail(latestLesson.youtubeId, 'hqdefault') }}
                      style={styles.latestLessonThumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.latestLessonIconContainer}>
                      <Ionicons name="play-circle" size={40} color={PRIMARY_BLUE} />
                    </View>
                  )}
                  <View style={styles.latestPlayButtonOverlay}>
                    <Ionicons name="play-circle" size={50} color="#fff" />
                  </View>
                </View>
                <View style={styles.latestLessonInfo}>
                  <Text style={styles.latestLessonTitle} numberOfLines={2}>
                    {latestLesson.title || 'שיעור'}
                  </Text>
                  {latestLesson.description && (
                    <Text style={styles.latestLessonDescription} numberOfLines={2}>
                      {latestLesson.description}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-back" size={28} color={PRIMARY_BLUE} />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.latestEmptyContainer}>
              <Ionicons name="film-outline" size={48} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
              <Text style={styles.latestEmptyText}>אין שיעורים זמינים כרגע</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  // Large category card (שיעורים)
  largeCategoryCard: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  largeCategoryImage: {
    width: '100%',
    height: '100%',
  },
  largeCategoryImageStyle: {
    resizeMode: 'cover',
    opacity: 0.3,
  },
  largeCategoryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  largeCategoryContent: {
    width: '100%',
    alignItems: 'flex-end',
  },
  largeCategoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  largeCategoryTitle: {
    fontSize: 32,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  largeCategoryDescription: {
    fontSize: 18,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 24,
  },
  largeCategoryArrow: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    padding: 10,
  },
  // Half row container
  halfRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  // Half category cards (קצרים + הודו לה')
  halfCategoryCard: {
    flex: 1,
    height: 180,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  halfCategoryImage: {
    width: '100%',
    height: '100%',
  },
  halfCategoryImageStyle: {
    resizeMode: 'cover',
    opacity: 0.3,
  },
  halfCategoryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  halfCategoryContent: {
    width: '100%',
    alignItems: 'flex-end',
  },
  halfCategoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  halfCategoryTitle: {
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  halfCategoryDescription: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 20,
  },
  halfCategoryArrow: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 18,
    padding: 6,
  },
  // Latest lesson section
  latestSection: {
    marginTop: 8,
  },
  latestSectionTitle: {
    fontSize: 24,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    marginBottom: 16,
    textAlign: 'right',
  },
  latestLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestLessonCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  latestLessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  latestLessonThumbnailContainer: {
    width: 140,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 12,
    position: 'relative',
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  latestLessonThumbnail: {
    width: '100%',
    height: '100%',
  },
  latestPlayButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  latestLessonIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  latestLessonInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  latestLessonTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
    lineHeight: 24,
  },
  latestLessonDescription: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 20,
  },
  latestEmptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
  },
  latestEmptyText: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'center',
  },
});

