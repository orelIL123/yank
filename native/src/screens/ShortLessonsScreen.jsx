import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import YoutubePlayer from 'react-native-youtube-iframe';
import AppHeader from '../components/AppHeader';

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const { width, height } = Dimensions.get('window');

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#/]+)/, // support YouTube Shorts / Reels-style links
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
  // quality options: default, mqdefault, hqdefault, sddefault, maxresdefault
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

export default function ShortLessonsScreen({ navigation, userRole }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledLessons, setShuffledLessons] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const flatListRef = useRef(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const adminStatus = userRole === 'admin';
    setIsAdmin(adminStatus);
    console.log('ShortLessonsScreen - userRole:', userRole, 'isAdmin:', adminStatus);
    loadLessons();
  }, [userRole]);


  useEffect(() => {
    // When lessons load, update shuffled list
    if (lessons.length > 0) {
      if (isShuffled) {
        shuffleLessons();
      } else {
        setShuffledLessons([...lessons]);
      }
    }
  }, [lessons]);

  const loadLessons = async () => {
    try {
      const q = query(
        collection(db, 'shortLessons'),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const lessonsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const youtubeId = extractYouTubeId(data.youtubeUrl);
        return {
          id: doc.id,
          ...data,
          youtubeId
        };
      }).filter(lesson => lesson.youtubeId); // Only include lessons with valid YouTube IDs

      setLessons(lessonsData);
      if (lessonsData.length > 0) {
        setShuffledLessons([...lessonsData]);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      // If it's a permissions error or index building, try without the where clause
      if (error.code === 'permission-denied' || error.code === 'failed-precondition') {
        try {
          console.log('Trying to load without where clause...');
          const q = query(
            collection(db, 'shortLessons'),
            orderBy('createdAt', 'desc')
          );
          const querySnapshot = await getDocs(q);
          const lessonsData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const youtubeId = extractYouTubeId(data.youtubeUrl);
            return {
              id: doc.id,
              ...data,
              youtubeId
            };
          }).filter(lesson => lesson.youtubeId && lesson.isActive !== false);

          setLessons(lessonsData);
          if (lessonsData.length > 0) {
            setShuffledLessons([...lessonsData]);
          }
          console.log('Loaded lessons without where clause:', lessonsData.length);
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
          // Last resort - try without orderBy
          try {
            const q = query(collection(db, 'shortLessons'));
            const querySnapshot = await getDocs(q);
            const lessonsData = querySnapshot.docs.map(doc => {
              const data = doc.data();
              const youtubeId = extractYouTubeId(data.youtubeUrl);
              return {
                id: doc.id,
                ...data,
                youtubeId
              };
            }).filter(lesson => lesson.youtubeId && lesson.isActive !== false)
              .sort((a, b) => {
                const aTime = a.createdAt?.toMillis() || 0;
                const bTime = b.createdAt?.toMillis() || 0;
                return bTime - aTime;
              });

            setLessons(lessonsData);
            if (lessonsData.length > 0) {
              setShuffledLessons([...lessonsData]);
            }
            console.log('Loaded lessons without orderBy:', lessonsData.length);
          } catch (finalError) {
            console.error('Final fallback error:', finalError);
            Alert.alert('שגיאה', 'לא ניתן לטעון את השיעורים. האינדקסים עדיין נבנים - נסה שוב בעוד כמה דקות.');
          }
        }
      } else {
        Alert.alert('שגיאה', 'לא ניתן לטעון את השיעורים');
      }
    } finally {
      setLoading(false);
    }
  };

  const shuffleLessons = () => {
    const shuffled = [...lessons].sort(() => Math.random() - 0.5);
    setShuffledLessons(shuffled);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  };

  const toggleShuffle = () => {
    if (isShuffled) {
      // Reset to original order
      setShuffledLessons([...lessons]);
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
    } else {
      shuffleLessons();
    }
    setIsShuffled(!isShuffled);
  };

  const handleRandomLesson = () => {
    const currentLessons = isShuffled ? shuffledLessons : lessons;
    if (!currentLessons.length) return;
    const randomIndex = Math.floor(Math.random() * currentLessons.length);
    const randomLesson = currentLessons[randomIndex];
    setSelectedLesson(randomLesson);
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({
        index: randomIndex,
        animated: true,
      });
    }
  };

  const handleAddLesson = () => {
    setShowAddModal(true);
  };

  const handleSaveLesson = async () => {
    if (!formTitle.trim() || !formYoutubeUrl.trim()) {
      Alert.alert('שגיאה', 'יש למלא כותרת וקישור YouTube');
      return;
    }

    const youtubeId = extractYouTubeId(formYoutubeUrl);
    if (!youtubeId) {
      Alert.alert('שגיאה', 'קישור YouTube לא תקין');
      return;
    }

    setSaving(true);
    try {
      if (editingLesson) {
        // Update existing lesson
        await updateDoc(doc(db, 'shortLessons', editingLesson.id), {
          title: formTitle.trim(),
          description: formDescription.trim() || '',
          youtubeUrl: formYoutubeUrl.trim(),
          category: formCategory.trim() || '',
        });
        Alert.alert('הצלחה', 'השיעור עודכן בהצלחה');
      } else {
        // Add new lesson
        await addDoc(collection(db, 'shortLessons'), {
          title: formTitle.trim(),
          description: formDescription.trim() || '',
          youtubeUrl: formYoutubeUrl.trim(),
          category: formCategory.trim() || '',
          isActive: true,
          createdAt: Timestamp.now(),
          order: 0
        });
        Alert.alert('הצלחה', 'השיעור נוסף בהצלחה');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setEditingLesson(null);
      setFormTitle('');
      setFormDescription('');
      setFormYoutubeUrl('');
      setFormCategory('');
      loadLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      const errorMessage = error.code === 'permission-denied' 
        ? 'אין הרשאה להוסיף שיעור. ודא שאתה מחובר כמנהל.'
        : error.message || (editingLesson ? 'לא ניתן לעדכן את השיעור' : 'לא ניתן להוסיף את השיעור');
      Alert.alert('שגיאה', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setFormTitle(lesson.title || '');
    setFormDescription(lesson.description || '');
    setFormYoutubeUrl(lesson.youtubeUrl || '');
    setFormCategory(lesson.category || '');
    setShowEditModal(true);
  };

  const handleDeleteLesson = (lesson) => {
    Alert.alert(
      'מחיקת שיעור',
      'האם אתה בטוח שברצונך למחוק את השיעור?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'shortLessons', lesson.id));
              Alert.alert('הצלחה', 'השיעור נמחק בהצלחה');
              loadLessons();
            } catch (error) {
              console.error('Error deleting lesson:', error);
              Alert.alert('שגיאה', 'לא ניתן למחוק את השיעור');
            }
          }
        }
      ]
    );
  };

  const renderLesson = ({ item }) => {
    const thumbnailUrl = getYouTubeThumbnail(item.youtubeId, 'hqdefault');

    return (
      <TouchableOpacity
        style={styles.lessonCard}
        onPress={() => setSelectedLesson(item)}
        activeOpacity={0.8}
      >
        <View style={styles.lessonContent}>
          <View style={styles.lessonThumbnailContainer}>
            {thumbnailUrl ? (
              <Image
                source={{ uri: thumbnailUrl }}
                style={styles.lessonThumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.lessonIconContainer}>
                <Ionicons name="play-circle" size={32} color={PRIMARY_BLUE} />
              </View>
            )}
            <View style={styles.playButtonOverlay}>
              <Ionicons name="play-circle" size={40} color="#fff" />
            </View>
          </View>
          <View style={styles.lessonInfo}>
            <Text style={styles.lessonTitle} numberOfLines={2}>
              {item.title || 'שיעור קצר'}
            </Text>
            {item.description && (
              <Text style={styles.lessonDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
          <View style={styles.lessonActions}>
            {isAdmin && (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditLesson(item);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={PRIMARY_BLUE} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteLesson(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              </>
            )}
            <Ionicons name="chevron-back" size={24} color={PRIMARY_BLUE} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="שיעורים קצרים"
          subtitle="רילסים מהרב"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען שיעורים...</Text>
        </View>
      </View>
    );
  }

  const currentLessons = isShuffled ? shuffledLessons : lessons;

  return (
    <>
      <View style={styles.container}>
        <AppHeader
          title="שיעורים קצרים"
          subtitle="רילסים מהרב"
          onBackPress={() => navigation.goBack()}
        />

        <View style={styles.controlsBar}>
          <TouchableOpacity
            style={[styles.controlPill, isShuffled && styles.controlPillActive]}
            onPress={toggleShuffle}
          >
            <Ionicons
              name="shuffle"
              size={20}
              color={isShuffled ? '#fff' : PRIMARY_BLUE}
            />
            <Text style={[styles.controlPillText, isShuffled && styles.controlPillTextActive]}>
              ערבוב
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlPill}
            onPress={handleRandomLesson}
          >
            <Ionicons
              name="sparkles-outline"
              size={20}
              color={PRIMARY_BLUE}
            />
            <Text style={styles.controlPillText}>אקראי</Text>
          </TouchableOpacity>
        </View>

        {currentLessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="play-circle-outline" size={80} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין שיעורים זמינים כרגע</Text>
            <Text style={styles.emptySubtext}>השיעורים יתווספו בקרוב</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={currentLessons}
            keyExtractor={(item) => item.id}
            renderItem={renderLesson}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Add Button */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.floatingAddButton}
            onPress={handleAddLesson}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[PRIMARY_BLUE, '#1e40af']}
              style={styles.floatingAddButtonGradient}
            >
              <Ionicons name="add" size={32} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Lesson Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddModal(false);
          setFormTitle('');
          setFormDescription('');
          setFormYoutubeUrl('');
          setFormCategory('');
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: 80, android: 40 })}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>הוסף שיעור קצר חדש</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setFormTitle('');
                  setFormDescription('');
                  setFormYoutubeUrl('');
                  setFormCategory('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={DEEP_BLUE} />
              </TouchableOpacity>
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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>קטגוריה</Text>
                <TextInput
                  style={styles.formInput}
                  value={formCategory}
                  onChangeText={setFormCategory}
                  placeholder="הכנס קטגוריה (אופציונלי)"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddModal(false);
                  setFormTitle('');
                  setFormDescription('');
                  setFormYoutubeUrl('');
                  setFormCategory('');
                }}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveLesson}
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
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Lesson Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingLesson(null);
          setFormTitle('');
          setFormDescription('');
          setFormYoutubeUrl('');
          setFormCategory('');
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.select({ ios: 80, android: 40 })}
        >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ערוך שיעור קצר</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowEditModal(false);
                  setEditingLesson(null);
                  setFormTitle('');
                  setFormDescription('');
                  setFormYoutubeUrl('');
                  setFormCategory('');
                }}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={28} color={DEEP_BLUE} />
              </TouchableOpacity>
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

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>קטגוריה</Text>
                <TextInput
                  style={styles.formInput}
                  value={formCategory}
                  onChangeText={setFormCategory}
                  placeholder="הכנס קטגוריה (אופציונלי)"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingLesson(null);
                  setFormTitle('');
                  setFormDescription('');
                  setFormYoutubeUrl('');
                  setFormCategory('');
                }}
              >
                <Text style={styles.cancelButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveLesson}
                disabled={saving}
              >
                <LinearGradient
                  colors={[PRIMARY_BLUE, '#1e40af']}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>עדכן</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Player Modal */}
      {selectedLesson && (
        <Modal
          visible={!!selectedLesson}
          animationType="slide"
          onRequestClose={() => setSelectedLesson(null)}
        >
          <View style={styles.playerContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedLesson(null)}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            <View style={styles.playerWrapper}>
              <YoutubePlayer
                height={300}
                play={true}
                videoId={selectedLesson.youtubeId}
                webViewStyle={{ opacity: 0.99 }}
                initialPlayerParams={{
                  controls: 1,
                  modestbranding: 1,
                  rel: 0,
                }}
              />
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerTitle}>{selectedLesson.title || 'שיעור קצר'}</Text>
              {selectedLesson.description && (
                <Text style={styles.playerDescription}>
                  {selectedLesson.description}
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Heebo_500Medium',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Heebo_400Regular',
    textAlign: 'center',
  },
  lessonContainer: {
    width,
    height,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundThumbnail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.select({ ios: 40, android: 20 }),
  },
  lessonInfo: {
    alignItems: 'flex-end',
  },
  lessonTitle: {
    fontSize: 22,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  lessonDescription: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    textAlign: 'right',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  categoryBadge: {
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-end',
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Heebo_600SemiBold',
    color: '#fff',
  },
  controlsOverlay: {
    position: 'absolute',
    top: Platform.select({ ios: 100, android: 80 }),
    right: 20,
    zIndex: 10,
  },
  controlsRow: {
    gap: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  controlText: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: '#fff',
  },
  controlTextActive: {
    color: PRIMARY_BLUE,
  },
  counterContainer: {
    position: 'absolute',
    top: Platform.select({ ios: 100, android: 80 }),
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  counterText: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: '#fff',
  },
  floatingAddButton: {
    position: 'absolute',
    bottom: Platform.select({ ios: 120, android: 100 }),
    left: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 999,
  },
  floatingAddButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontFamily: 'Heebo_700Bold',
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
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  formInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
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
    fontFamily: 'Heebo_600SemiBold',
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
    fontFamily: 'Heebo_600SemiBold',
    color: '#fff',
  },
  adminButtonsContainer: {
    position: 'absolute',
    bottom: Platform.select({ ios: 200, android: 180 }),
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    gap: 8,
  },
  adminButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(220,38,38,0.8)',
  },
});

