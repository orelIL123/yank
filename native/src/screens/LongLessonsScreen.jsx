import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
;
;
import YoutubePlayer from 'react-native-youtube-iframe';
import AppHeader from '../components/AppHeader';
import { t } from '../utils/i18n';
import db from '../services/database'
import { canManageLearning } from '../utils/permissions'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return null;
  
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

export default function LongLessonsScreen({ navigation, route, userRole, userPermissions }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const canManage = canManageLearning(userRole, userPermissions);
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const isWeeklyNewsletterMode = route?.params?.context === 'weeklyNewsletter';
  const scopedCategory = 'weekly-newsletter';
  const screenTitle = isWeeklyNewsletterMode ? 'לימוד יומי בגליון השבועי' : t('שיעורים');
  const screenSubtitle = isWeeklyNewsletterMode ? 'סרטונים ארוכים מהיוטיוב' : t('שיעורים מלאים מהרב');

  const filteredLessons = lessons.filter(lesson => 
    lesson.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    lesson.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    console.log('LongLessonsScreen - userRole:', userRole, 'canManage:', canManage);
    setLoading(true);
    loadLessons();
  }, [userRole, userPermissions, isWeeklyNewsletterMode]);

  const loadLessons = async () => {
    try {
      const where = [['isActive', '==', true]];
      if (isWeeklyNewsletterMode) {
        where.push(['category', '==', scopedCategory]);
      }

      const lessonsData = await db.getCollection('longLessons', {
        where,
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      const processedLessons = lessonsData.map(lesson => {
        const youtubeId = extractYouTubeId(lesson.youtubeUrl);
        return {
          ...lesson,
          youtubeId
        };
      }).filter(lesson => lesson.youtubeId);

      setLessons(processedLessons);
    } catch (error) {
      console.error('Error loading lessons:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את השיעורים');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonPress = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleClosePlayer = () => {
    setSelectedLesson(null);
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
        await db.updateDocument('longLessons', editingLesson.id, {
          title: formTitle.trim(),
          description: formDescription.trim() || '',
          youtubeUrl: formYoutubeUrl.trim(),
          category: isWeeklyNewsletterMode ? scopedCategory : (formCategory.trim() || ''),
        });
        Alert.alert('הצלחה', isWeeklyNewsletterMode ? 'הסרטון עודכן בהצלחה' : 'השיעור עודכן בהצלחה');
      } else {
        // Add new lesson
        await db.addDocument('longLessons', {
          title: formTitle.trim(),
          description: formDescription.trim() || '',
          youtubeUrl: formYoutubeUrl.trim(),
          category: isWeeklyNewsletterMode ? scopedCategory : (formCategory.trim() || ''),
          isActive: true,
          createdAt: new Date().toISOString(),
          order: 0
        });
        Alert.alert('הצלחה', isWeeklyNewsletterMode ? 'הסרטון נוסף בהצלחה' : 'השיעור נוסף בהצלחה');
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
      Alert.alert(
        'שגיאה',
        editingLesson
          ? (isWeeklyNewsletterMode ? 'לא ניתן לעדכן את הסרטון' : 'לא ניתן לעדכן את השיעור')
          : (isWeeklyNewsletterMode ? 'לא ניתן להוסיף את הסרטון' : 'לא ניתן להוסיף את השיעור')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setFormTitle(lesson.title || '');
    setFormDescription(lesson.description || '');
    setFormYoutubeUrl(lesson.youtubeUrl || '');
    setFormCategory(isWeeklyNewsletterMode ? scopedCategory : (lesson.category || ''));
    setShowEditModal(true);
  };

  const handleDeleteLesson = (lesson) => {
    Alert.alert(
      isWeeklyNewsletterMode ? 'מחיקת סרטון' : 'מחיקת שיעור',
      isWeeklyNewsletterMode ? 'האם אתה בטוח שברצונך למחוק את הסרטון?' : 'האם אתה בטוח שברצונך למחוק את השיעור?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteDocument('longLessons', lesson.id);
              Alert.alert('הצלחה', isWeeklyNewsletterMode ? 'הסרטון נמחק בהצלחה' : 'השיעור נמחק בהצלחה');
              loadLessons();
            } catch (error) {
              console.error('Error deleting lesson:', error);
              Alert.alert('שגיאה', isWeeklyNewsletterMode ? 'לא ניתן למחוק את הסרטון' : 'לא ניתן למחוק את השיעור');
            }
          }
        }
      ]
    );
  };

  const handleRandomLesson = () => {
    if (filteredLessons.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredLessons.length);
    setSelectedLesson(filteredLessons[randomIndex]);
  };

  const renderLesson = ({ item, index }) => {
    const thumbnailUrl = getYouTubeThumbnail(item.youtubeId, 'hqdefault');
    const isNew = item.createdAt && (new Date() - new Date(item.createdAt)) < 72 * 60 * 60 * 1000;
    const isLatest = index === 0;
    const statusLabel = isLatest ? 'אחרון' : (isNew ? 'חדש' : null);
    
    return (
      <TouchableOpacity
        style={styles.lessonCard}
        onPress={() => handleLessonPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.lessonContent}>
          <View style={styles.lessonThumbnailContainer}>
            {statusLabel && (
              <View style={[styles.newBadge, isLatest && styles.latestNewBadge]}>
                <Text style={styles.newBadgeText}>{statusLabel}</Text>
              </View>
            )}
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
            <View style={styles.lessonTitleRow}>
              {statusLabel && (
                <View style={[styles.inlineStatusBadge, isLatest ? styles.inlineLatestBadge : styles.inlineNewBadge]}>
                  <Text style={styles.inlineStatusBadgeText}>{statusLabel}</Text>
                </View>
              )}
              <Text style={styles.lessonTitle} numberOfLines={2}>
                {item.title || 'שיעור'}
              </Text>
            </View>
            {item.description && (
              <Text style={styles.lessonDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            {item.category && !isWeeklyNewsletterMode && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
          <View style={styles.lessonActions}>
            {canManage && (
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
          title={screenTitle}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>{isWeeklyNewsletterMode ? 'טוען סרטונים...' : 'טוען שיעורים...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title={screenTitle}
        subtitle={screenSubtitle}
        onBackPress={() => navigation.goBack()}
      />

      {canManage && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddLesson}
        >
          <LinearGradient
            colors={[PRIMARY_BLUE, '#1e40af']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>{isWeeklyNewsletterMode ? 'הוסף סרטון' : 'הוסף שיעור'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={PRIMARY_BLUE} />
          <TextInput
            style={styles.searchInput}
            placeholder={isWeeklyNewsletterMode ? 'חפש סרטון...' : 'חפש שיעור...'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Random Button */}
      {filteredLessons.length > 0 && (
        <TouchableOpacity
          style={styles.randomButton}
          onPress={handleRandomLesson}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8b5cf6', '#6366f1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.randomButtonGradient}
          >
            <Ionicons name="sparkles-outline" size={20} color="#fff" />
            <Text style={styles.randomButtonText}>{isWeeklyNewsletterMode ? 'סרטון אקראי' : 'שיעור אקראי'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {filteredLessons.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="film-outline" size={80} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyText}>{isWeeklyNewsletterMode ? 'אין סרטונים זמינים כרגע' : 'אין שיעורים זמינים כרגע'}</Text>
          <Text style={styles.emptySubtext}>{isWeeklyNewsletterMode ? 'הסרטונים יתווספו בקרוב' : 'השיעורים יתווספו בקרוב'}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLessons}
          keyExtractor={(item) => item.id}
          renderItem={renderLesson}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* YouTube Player Modal */}
      {selectedLesson && (
        <Modal
          visible={!!selectedLesson}
          animationType="slide"
          onRequestClose={handleClosePlayer}
        >
          <View style={styles.playerContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClosePlayer}
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
              <Text style={styles.playerTitle}>{selectedLesson.title}</Text>
              {selectedLesson.description && (
                <Text style={styles.playerDescription}>
                  {selectedLesson.description}
                </Text>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* Add Lesson Modal */}
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
              <Text style={styles.modalTitle}>{isWeeklyNewsletterMode ? 'הוסף סרטון חדש' : 'הוסף שיעור חדש'}</Text>
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

              {!isWeeklyNewsletterMode && (
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
              )}
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
              <Text style={styles.modalTitle}>{isWeeklyNewsletterMode ? 'ערוך סרטון' : 'ערוך שיעור'}</Text>
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

              {!isWeeklyNewsletterMode && (
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
              )}
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
    </View>
  );
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
    marginTop: 15,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Heebo_500Medium',
  },
  addButton: {
    margin: 16,
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
    fontFamily: 'Heebo_600SemiBold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 8,
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    height: '100%',
  },
  randomButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  randomButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
  },
  randomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  lessonCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  lessonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
  },
  lessonThumbnailContainer: {
    width: 100,
    height: 75,
    borderRadius: 10,
    overflow: 'hidden',
    marginLeft: 12,
    position: 'relative',
    backgroundColor: 'rgba(30,58,138,0.1)',
  },
  lessonThumbnail: {
    width: '100%',
    height: '100%',
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  lessonActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,58,138,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(220,38,38,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 0,
    textAlign: 'right',
    lineHeight: 22,
    flexShrink: 1,
  },
  lessonTitleRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    marginBottom: 6,
  },
  lessonDescription: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  categoryBadge: {
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Heebo_600SemiBold',
    color: '#fff',
  },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  latestNewBadge: {
    backgroundColor: '#f59e0b',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Heebo_700Bold',
  },
  inlineStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  inlineLatestBadge: {
    backgroundColor: '#f59e0b',
  },
  inlineNewBadge: {
    backgroundColor: '#dc2626',
  },
  inlineStatusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Heebo_700Bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.select({ ios: 50, android: 20 }),
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerWrapper: {
    marginTop: Platform.select({ ios: 100, android: 80 }),
    paddingHorizontal: 16,
  },
  playerInfo: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  playerTitle: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
  },
  playerDescription: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'right',
    lineHeight: 24,
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
});
