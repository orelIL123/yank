import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  RefreshControl,
  Share,
  Linking,
  Animated,
  Easing,
  TextInput,
  Modal,
  FlatList,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { Audio } from 'expo-av';
;
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';
import db from '../services/database'
import * as ImagePicker from 'expo-image-picker';
// DocumentPicker will be imported dynamically when needed
import YoutubePlayer from 'react-native-youtube-iframe';

const { width, height } = Dimensions.get('window');

// Colors
const COLORS = {
  primaryRed: '#DC2626',
  gold: '#FFD700',
  deepBlue: '#0b1b3a',
  bgGradientStart: '#F3F4F6',
  bgGradientEnd: '#E5E7EB',
  white: '#FFFFFF',
  text: '#111827',
  textLight: '#6B7280',
  success: '#10B981',
  glass: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(255, 255, 255, 0.5)',
};

// Fonts
const FONTS = {
  bold: 'Poppins_700Bold',
  semiBold: 'Poppins_600SemiBold',
  medium: 'Poppins_500Medium',
  regular: 'Poppins_400Regular',
  heeboMedium: 'Heebo_500Medium', // Assuming Heebo is available or fallback
  heeboBold: 'Heebo_700Bold',
};

// Particle Animation Component
const FloatingParticles = () => {
  const particles = Array(12).fill(0).map((_, i) => ({
    id: i,
    anim: useRef(new Animated.Value(0)).current,
    left: Math.random() * width,
    size: Math.random() * 6 + 2,
    duration: Math.random() * 3000 + 2000,
  }));

  useEffect(() => {
    particles.forEach(p => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(p.anim, {
            toValue: 1,
            duration: p.duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      ).start();
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            left: p.left,
            transform: [{
              translateY: p.anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, height],
              })
            }],
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: COLORS.gold,
            opacity: p.anim.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0, 0.6, 0.6, 0],
            }),
          }}
        />
      ))}
    </View>
  );
};

export default function DailyLearningScreen({ navigation, userRole }) {
  // State
  const [isAdminMode, setIsAdminMode] = useState(false); // Toggle for Admin Mode UI
  const isAdmin = userRole === 'admin'; // Real admin check
  const [learnings, setLearnings] = useState([]);
  const [dailyVideos, setDailyVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLearning, setSelectedLearning] = useState(null);
  const [activeTab, setActiveTab] = useState('read'); // 'read' | 'listen'

  // Audio State
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(null);

  // Video State
  const [selectedVideo, setSelectedVideo] = useState(null); // For fullscreen video

  // Admin Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [newDedicationName, setNewDedicationName] = useState('');
  const [newDedicationType, setNewDedicationType] = useState('לעילוי נשמת');

  // Animations
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadData();

    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadLearnings(), loadDailyVideos()]);
    setLoading(false);
    setRefreshing(false);
  };

  const loadLearnings = async () => {
    try {
      const data = await db.getCollection('dailyLearning', {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 10
      });
      setLearnings(data);
      if (data.length > 0 && !selectedLearning) {
        setSelectedLearning(data[0]);
        setEditTitle(data[0].title);
        setEditContent(data[0].content);
      }
    } catch (error) {
      console.error('Error loading learnings:', error);
    }
  };

  const loadDailyVideos = async () => {
    try {
      // Filter for videos from last 24 hours
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const data = await db.getCollection('dailyVideos', {
        where: [['createdAt', '>=', yesterday.toISOString()]],
        orderBy: { field: 'createdAt', direction: 'desc' }
      });
      setDailyVideos(data);
    } catch (error) {
      console.error('Error loading videos:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Audio Functions
  const handlePlayAudio = async (url) => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }

      if (isPlaying && selectedLearning?.audioUrl === url) {
        setIsPlaying(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status) => {
          setPlaybackStatus(status);
          if (status.didJustFinish) setIsPlaying(false);
        }
      );

      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      Alert.alert('שגיאה', 'לא ניתן לנגן את הקובץ');
    }
  };

  // Admin Functions
  const handleSaveContent = async () => {
    if (!selectedLearning) return;
    try {
      await db.updateDocument('dailyLearning', selectedLearning.id, {
        title: editTitle,
        content: editContent,
      });
      setIsEditing(false);
      loadLearnings(); // Refresh
      Alert.alert('הצלחה', 'התוכן עודכן בהצלחה');
    } catch (error) {
      Alert.alert('שגיאה', 'שמירת השינויים נכשלה');
    }
  };

  const handleAddDedication = async () => {
    if (!newDedicationName.trim() || !selectedLearning) return;

    const newDedication = {
      type: newDedicationType,
      name: newDedicationName,
      id: Date.now().toString()
    };

    const updatedDedications = [...(selectedLearning.dedications || []), newDedication];

    try {
      await db.updateDocument('dailyLearning', selectedLearning.id, {
        dedications: updatedDedications
      });
      setNewDedicationName('');
      // Optimistic update
      setSelectedLearning(prev => ({ ...prev, dedications: updatedDedications }));
    } catch (error) {
      Alert.alert('שגיאה', 'הוספת ההקדשה נכשלה');
    }
  };

  const handleDeleteDedication = async (dedicationId) => {
    if (!selectedLearning) return;
    const updatedDedications = selectedLearning.dedications.filter(d => d.id !== dedicationId);
    try {
      await db.updateDocument('dailyLearning', selectedLearning.id, {
        dedications: updatedDedications
      });
      setSelectedLearning(prev => ({ ...prev, dedications: updatedDedications }));
    } catch (error) {
      Alert.alert('שגיאה', 'מחיקת ההקדשה נכשלה');
    }
  };

  const uploadMedia = async (uri, folder) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleUploadVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        Alert.alert('העלאה', 'מעלה סרטון... אנא המתן');
        const videoUrl = await uploadMedia(result.assets[0].uri, 'daily_videos');

        await db.addDocument('dailyVideos', {
          createdAt: new Date().toISOString(),
          thumbnail: 'https://via.placeholder.com/150', // Ideally generate thumbnail
          videoUrl: videoUrl,
          duration: result.assets[0].duration || 0
        });

        loadDailyVideos();
        Alert.alert('הצלחה', 'הסרטון הועלה בהצלחה');
      }
    } catch (error) {
      console.error('Video upload error:', error);
      Alert.alert('שגיאה', 'העלאת הסרטון נכשלה');
    }
  };

  const handleUploadAudio = async () => {
    try {
      const DocumentPicker = await import('expo-document-picker')
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert('העלאה', `מעלה קובץ: ${file.name}... אנא המתן`);

        const audioUrl = await uploadMedia(file.uri, 'daily_audio');

        if (selectedLearning) {
          await db.updateDocument('dailyLearning', selectedLearning.id, {
            audioUrl: audioUrl,
          });
          setSelectedLearning(prev => ({ ...prev, audioUrl: audioUrl }));
          Alert.alert('הצלחה', 'ההקלטה הועלתה בהצלחה');
        }
      }
    } catch (error) {
      console.error('Audio upload error:', error);
      Alert.alert('שגיאה', 'העלאת ההקלטה נכשלה');
    }
  };

  const handleCreateNew = async () => {
    try {
      const newDocRef = await db.addDocument('dailyLearning', {
        title: 'כותרת חדשה',
        content: 'כתוב כאן את התוכן היומי...',
        date: new Date().toISOString(),
        category: 'זריקת אמונה',
        readTime: '2 דקות',
        author: 'הינוקא',
        dedications: [],
        views: 0,
        likes: 0
      });

      const newDoc = {
        id: newDocRef.id,
        title: 'כותרת חדשה',
        content: 'כתוב כאן את התוכן היומי...',
        date: new Date(),
        category: 'זריקת אמונה',
        dedications: []
      };

      setLearnings([newDoc, ...learnings]);
      setSelectedLearning(newDoc);
      setIsEditing(true);
      setEditTitle(newDoc.title);
      setEditContent(newDoc.content);

      Alert.alert('הצלחה', 'נוצר דף לימוד חדש. כעת ניתן לערוך אותו.');
    } catch (error) {
      console.error('Error creating new learning:', error);
      Alert.alert('שגיאה', 'יצירת דף חדש נכשלה');
    }
  };

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => setSelectedVideo(item)}
    >
      <View style={styles.storyRing}>
        <Image source={{ uri: item.thumbnail || 'https://via.placeholder.com/150' }} style={styles.storyThumbnail} />
      </View>
      <Text style={styles.storyTime}>לפני {Math.floor((Date.now() - item.createdAt.toMillis()) / 3600000)} ש׳</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryRed} />
      </View>
    );
  }

  // Empty State with Create Button
  if (learnings.length === 0 && !selectedLearning) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[COLORS.bgGradientStart, COLORS.bgGradientEnd]} style={StyleSheet.absoluteFill} />
        <FloatingParticles />

        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.deepBlue} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>זריקת אמונה</Text>
            <Ionicons name="flame" size={20} color={COLORS.primaryRed} />
          </View>
          <TouchableOpacity onPress={() => setIsAdmin(!isAdmin)} style={styles.adminButton}>
            <Ionicons name={isAdmin ? "settings" : "settings-outline"} size={24} color={COLORS.deepBlue} />
          </TouchableOpacity>
        </View>

        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="book-outline" size={80} color={COLORS.primaryRed} style={{ opacity: 0.8 }} />
            <View style={styles.emptyIconBadge}>
              <Ionicons name="add" size={24} color={COLORS.white} />
            </View>
          </View>

          <Text style={styles.emptyTitle}>אין תוכן יומי עדיין</Text>
          <Text style={styles.emptySubtitle}>
            {isAdmin
              ? 'כמנהל, באפשרותך ליצור את הלימוד היומי הראשון ולהפיץ אור!'
              : 'הלימוד היומי יתעדכן בקרוב. חזור מאוחר יותר.'}
          </Text>

          {isAdmin && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreateNew}>
              <LinearGradient
                colors={[COLORS.deepBlue, '#1e40af']}
                style={styles.createButtonGradient}
              >
                <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
                <Text style={styles.createButtonText}>צור לימוד יומי חדש</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#F0F4F8', '#E2E8F0', '#CBD5E1']} style={StyleSheet.absoluteFill} />
      <FloatingParticles />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[COLORS.white, 'rgba(255,255,255,0)']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.deepBlue} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>זריקת אמונה</Text>
            <Ionicons name="flame" size={22} color={COLORS.primaryRed} />
          </View>
          {isAdmin && (
            <TouchableOpacity onPress={() => setIsAdminMode(!isAdminMode)} style={styles.adminButton}>
              <Ionicons name={isAdminMode ? "settings" : "settings-outline"} size={24} color={COLORS.deepBlue} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Admin Banner */}
        {isAdmin && isAdminMode && (
          <View style={styles.adminBanner}>
            <Text style={styles.adminBannerText}>מצב עריכה פעיל</Text>
          </View>
        )}

        {/* Stories Section */}
        <View style={styles.storiesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>סרטונים יומיים</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>חי</Text>
            </View>
          </View>
          <Text style={styles.sectionSubtitle}>נמחקים אוטומטית לאחר 24 שעות</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesList}>
            {isAdmin && isAdminMode && (
              <TouchableOpacity style={styles.addStoryButton} onPress={handleUploadVideo}>
                <Ionicons name="add" size={30} color={COLORS.white} />
              </TouchableOpacity>
            )}
            {dailyVideos.map((video, index) => (
              <View key={video.id} style={{ marginRight: 15 }}>
                {renderStoryItem({ item: video })}
              </View>
            ))}
            {dailyVideos.length === 0 && (!isAdmin || !isAdminMode) && (
              <Text style={styles.emptyText}>אין סרטונים כרגע</Text>
            )}
          </ScrollView>
        </View>

        {/* Main Content Card - Glassmorphism */}
        {selectedLearning && (
          <View style={styles.mainCard}>
            <LinearGradient
              colors={[COLORS.glass, 'rgba(255,255,255,0.95)']}
              style={StyleSheet.absoluteFill}
            />

            {/* Badges */}
            <View style={styles.badgesRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>זריקת אמונה</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(selectedLearning.date?.toDate ? selectedLearning.date.toDate() : selectedLearning.date).toLocaleDateString('he-IL')}
              </Text>
            </View>

            {/* Title */}
            {isAdmin && isEditing ? (
              <TextInput
                style={styles.editTitleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="ערוך כותרת"
              />
            ) : (
              <Text style={styles.cardTitle}>{selectedLearning.title}</Text>
            )}

            {/* Read Time */}
            <View style={styles.readTimeContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '60%' }]} />
              </View>
              <Text style={styles.readTimeText}>2 דקות קריאה</Text>
            </View>

            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeButton, activeTab === 'read' && styles.typeButtonActive]}
                onPress={() => setActiveTab('read')}
              >
                <Ionicons name="book-outline" size={18} color={activeTab === 'read' ? COLORS.white : COLORS.deepBlue} />
                <Text style={[styles.typeButtonText, activeTab === 'read' && styles.typeButtonTextActive]}>קריאה</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, activeTab === 'listen' && styles.typeButtonActive]}
                onPress={() => setActiveTab('listen')}
              >
                <Ionicons name="headset-outline" size={18} color={activeTab === 'listen' ? COLORS.white : COLORS.deepBlue} />
                <Text style={[styles.typeButtonText, activeTab === 'listen' && styles.typeButtonTextActive]}>האזנה</Text>
              </TouchableOpacity>
            </View>

            {/* Dedications */}
            <View style={styles.dedicationsSection}>
              <Text style={styles.dedicationsTitle}>הקדשות היומיות</Text>
              {selectedLearning.dedications?.map((dedication, index) => (
                <View key={index} style={styles.dedicationItem}>
                  <View style={styles.dedicationInfo}>
                    <Text style={styles.dedicationType}>{dedication.type}</Text>
                    <Text style={styles.dedicationName}>{dedication.name}</Text>
                  </View>
                  {isAdmin && isAdminMode && (
                    <TouchableOpacity onPress={() => handleDeleteDedication(dedication.id)}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.primaryRed} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              {isAdmin && isAdminMode && (
                <View style={styles.addDedicationForm}>
                  <View style={styles.dedicationTypeSelector}>
                    {['לעילוי נשמת', 'לרפואת', 'להצלחת'].map(type => (
                      <TouchableOpacity
                        key={type}
                        style={[styles.typeOption, newDedicationType === type && styles.typeOptionActive]}
                        onPress={() => setNewDedicationType(type)}
                      >
                        <Text style={[styles.typeOptionText, newDedicationType === type && styles.typeOptionTextActive]}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.addDedicationRow}>
                    <TextInput
                      style={styles.dedicationInput}
                      placeholder="שם להקדשה"
                      value={newDedicationName}
                      onChangeText={setNewDedicationName}
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleAddDedication}>
                      <Ionicons name="add" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Content Body */}
            <View style={styles.contentBody}>
              {activeTab === 'read' ? (
                isAdmin && isAdminMode && isEditing ? (
                  <TextInput
                    style={styles.editContentInput}
                    value={editContent}
                    onChangeText={setEditContent}
                    multiline
                    placeholder="ערוך תוכן"
                  />
                ) : (
                  <Text style={styles.contentText}>{selectedLearning.content}</Text>
                )
              ) : (
                <View style={styles.audioPlayer}>
                  <Text style={styles.audioTitle}>הקלטה יומית</Text>
                  {selectedLearning.audioUrl ? (
                    <TouchableOpacity
                      style={styles.playButton}
                      onPress={() => handlePlayAudio(selectedLearning.audioUrl)}
                    >
                      <Ionicons name={isPlaying ? "pause" : "play"} size={32} color={COLORS.white} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noAudioText}>אין הקלטה זמינה</Text>
                  )}
                  {isAdmin && isAdminMode && (
                    <TouchableOpacity style={styles.uploadAudioBtn} onPress={handleUploadAudio}>
                      <Text style={styles.uploadAudioText}>העלה הקלטה</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Author */}
            <View style={styles.authorSection}>
              <View style={styles.authorAvatar}>
                <Text style={styles.authorInitials}>הרב</Text>
              </View>
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>הינוקא</Text>
              </View>
              <TouchableOpacity style={styles.shareButton} onPress={() => Share.share({ message: selectedLearning.title })}>
                <Ionicons name="share-social-outline" size={20} color={COLORS.deepBlue} />
              </TouchableOpacity>
            </View>

            {/* Admin Actions */}
            {isAdmin && isAdminMode && (
              <View style={styles.adminActions}>
                {isEditing ? (
                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveContent}>
                    <Text style={styles.saveButtonText}>שמור שינויים</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                    <Text style={styles.editButtonText}>ערוך תוכן</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Video Modal */}
      <Modal visible={!!selectedVideo} animationType="slide" transparent={false}>
        <View style={styles.videoModal}>
          <TouchableOpacity style={styles.closeVideo} onPress={() => setSelectedVideo(null)}>
            <Ionicons name="close" size={30} color={COLORS.white} />
          </TouchableOpacity>
          {selectedVideo && (
            <YoutubePlayer
              height={300}
              play={true}
              videoId={selectedVideo.youtubeId} // Assuming youtubeId or videoUrl handling
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgGradientStart,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.deepBlue,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(11,27,58,0.05)',
  },
  adminButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  adminBanner: {
    backgroundColor: COLORS.primaryRed,
    padding: 8,
    alignItems: 'center',
  },
  adminBannerText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
  storiesSection: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: COLORS.deepBlue,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryRed,
  },
  liveText: {
    color: COLORS.primaryRed,
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 15,
    fontFamily: FONTS.regular,
  },
  storiesList: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  addStoryButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.deepBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderStyle: 'dashed',
  },
  storyItem: {
    alignItems: 'center',
    gap: 6,
  },
  storyRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  storyThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ddd',
  },
  storyTime: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  mainCard: {
    margin: 20,
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryText: {
    color: COLORS.primaryRed,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  dateText: {
    color: COLORS.textLight,
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.deepBlue,
    textAlign: 'right',
    marginBottom: 16,
  },
  headerGradient: {
    paddingBottom: 10,
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 2,
  },
  readTimeText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: FONTS.medium,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
  },
  typeButtonTextActive: {
    color: COLORS.deepBlue,
    fontFamily: FONTS.semiBold,
  },
  dedicationsSection: {
    backgroundColor: 'rgba(11,27,58,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  dedicationsTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.deepBlue,
    marginBottom: 12,
    textAlign: 'right',
  },
  dedicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  dedicationInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dedicationType: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  dedicationName: {
    fontSize: 14,
    color: COLORS.deepBlue,
    fontFamily: FONTS.medium,
  },
  addDedicationForm: {
    marginTop: 12,
    gap: 8,
  },
  dedicationTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.deepBlue,
  },
  typeOptionActive: {
    backgroundColor: COLORS.deepBlue,
  },
  typeOptionText: {
    fontSize: 10,
    color: COLORS.deepBlue,
    fontFamily: FONTS.medium,
  },
  typeOptionTextActive: {
    color: COLORS.white,
  },
  addDedicationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dedicationInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textAlign: 'right',
    fontFamily: FONTS.regular,
    fontSize: 14,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.deepBlue,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBody: {
    marginBottom: 24,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 28,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    textAlign: 'right',
  },
  audioPlayer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  audioTitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.deepBlue,
    marginBottom: 16,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.deepBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  noAudioText: {
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.deepBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorInitials: {
    color: COLORS.white,
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  authorInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  authorName: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    color: COLORS.deepBlue,
  },
  authorRole: {
    fontSize: 12,
    color: COLORS.textLight,
    fontFamily: FONTS.regular,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  editTitleInput: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.deepBlue,
    textAlign: 'right',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primaryRed,
    marginBottom: 16,
  },
  editContentInput: {
    fontSize: 16,
    lineHeight: 28,
    color: COLORS.text,
    fontFamily: FONTS.regular,
    textAlign: 'right',
    minHeight: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
  },
  adminActions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
  },
  editButton: {
    backgroundColor: COLORS.deepBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  editButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.semiBold,
  },
  videoModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  closeVideo: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textLight,
    marginTop: 10,
    fontFamily: FONTS.regular,
  },
  uploadAudioBtn: {
    marginTop: 10,
    padding: 8,
    backgroundColor: COLORS.gold,
    borderRadius: 8,
  },
  uploadAudioText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.deepBlue,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: -60, // Adjust for header
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.1)',
  },
  emptyIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.deepBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.deepBlue,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  createButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.deepBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  createButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.white,
  },
});
