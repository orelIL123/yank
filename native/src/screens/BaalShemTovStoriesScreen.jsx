import React, { useState, useEffect, useRef } from 'react';
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
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import YoutubePlayer from 'react-native-youtube-iframe';
import AppHeader from '../components/AppHeader';
import db from '../services/database'
import { canManageLearning } from '../utils/permissions'
import { pickVideo, uploadFileToSupabaseStorage } from '../utils/storage'

const { width } = Dimensions.get('window')

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const SHABBAT_GOLD = '#F59E0B'

// Helper function to extract YouTube video ID from URL
function extractYouTubeId(url) {
  if (!url) return null

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

function getYouTubeThumbnail(videoId, quality = 'hqdefault') {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

export default function BaalShemTovStoriesScreen({ navigation, userRole, userPermissions }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const canManage = canManageLearning(userRole, userPermissions);

  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVideoUri, setFormVideoUri] = useState(null);
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [videoType, setVideoType] = useState('youtube');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(false);
  const videoRefs = useRef({});

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const storiesData = await db.getCollection('baalShemTovStories', {
        where: [['isActive', '==', true]],
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      setStories(storiesData || []);
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('שגיאה', 'לא ניתן לטעון את הסיפורים');
    } finally {
      setLoading(false);
    }
  };

  const handlePickVideo = async () => {
    try {
      const video = await pickVideo();
      if (video) {
        setFormVideoUri(video.uri);
        setFormVideoUrl('');
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('שגיאה', 'לא ניתן לבחור סרטון');
    }
  };

  const handleUploadVideo = async () => {
    if (!formVideoUri) {
      Alert.alert('שגיאה', 'אנא בחר סרטון תחילה');
      return;
    }

    setUploadingVideo(true);
    try {
      const fileName = `bst_${Date.now()}.mp4`;
      const path = `baal-shem-tov-stories/${fileName}`;
      let url;
      try {
        url = await uploadFileToSupabaseStorage(formVideoUri, 'baal-shem-tov-stories', path, (progress) => {
          console.log(`Video upload progress: ${progress}%`);
        });
      } catch (bucketError) {
        url = await uploadFileToSupabaseStorage(formVideoUri, 'videos', path, (progress) => {
          console.log(`Video upload progress: ${progress}%`);
        });
      }
      setFormVideoUrl(url);
      Alert.alert('הצלחה', 'הסרטון הועלה בהצלחה');
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('שגיאה', `לא ניתן להעלות את הסרטון: ${error.message || 'שגיאה לא ידועה'}`);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveStory = async () => {
    if (!formTitle.trim() || (!formContent.trim() && !formVideoUrl && !formYoutubeUrl.trim())) {
      Alert.alert('שגיאה', 'יש למלא כותרת ותוכן או סרטון');
      return;
    }

    if (videoType === 'upload' && formVideoUri && !formVideoUrl) {
      Alert.alert('שים לב', 'אנא העלה את הסרטון לפני השמירה');
      return;
    }

    if (videoType === 'youtube' && formYoutubeUrl.trim()) {
      const youtubeId = extractYouTubeId(formYoutubeUrl.trim());
      if (!youtubeId) {
        Alert.alert('שגיאה', 'קישור YouTube לא תקין');
        return;
      }
    }

    setSaving(true);
    try {
      const storyData = {
        title: formTitle.trim(),
        content: formContent.trim(),
      };

      if (videoType === 'upload' && formVideoUrl) {
        storyData.videoUrl = formVideoUrl;
        storyData.videoType = 'upload';
      } else if (videoType === 'youtube' && formYoutubeUrl.trim()) {
        const youtubeId = extractYouTubeId(formYoutubeUrl.trim());
        storyData.youtubeUrl = formYoutubeUrl.trim();
        storyData.youtubeId = youtubeId;
        storyData.videoType = 'youtube';
        storyData.thumbnailUrl = getYouTubeThumbnail(youtubeId);
      }

      if (editingStory) {
        await db.updateDocument('baalShemTovStories', editingStory.id, storyData);
        Alert.alert('הצלחה', 'הסיפור עודכן בהצלחה');
      } else {
        await db.addDocument('baalShemTovStories', {
          ...storyData,
          isActive: true,
          createdAt: new Date().toISOString(),
        });
        Alert.alert('הצלחה', 'הסיפור נוסף בהצלחה');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setEditingStory(null);
      setFormTitle('');
      setFormContent('');
      setFormVideoUri(null);
      setFormVideoUrl('');
      setFormYoutubeUrl('');
      setVideoType('youtube');
      loadStories();
    } catch (error) {
      console.error('Error saving story:', error);
      Alert.alert('שגיאה', editingStory ? 'לא ניתן לעדכן את הסיפור' : 'לא ניתן להוסיף את הסיפור');
    } finally {
      setSaving(false);
    }
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setFormTitle(story.title || '');
    setFormContent(story.content || '');
    if (story.videoType === 'youtube' || story.youtubeUrl) {
      setVideoType('youtube');
      setFormYoutubeUrl(story.youtubeUrl || '');
      setFormVideoUrl('');
    } else {
      setVideoType('upload');
      setFormVideoUrl(story.videoUrl || '');
      setFormYoutubeUrl('');
    }
    setFormVideoUri(null);
    setShowEditModal(true);
  };

  const handleDeleteStory = (story) => {
    Alert.alert(
      'מחיקת סיפור',
      'האם אתה בטוח שברצונך למחוק את הסיפור?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteDocument('baalShemTovStories', story.id);
              Alert.alert('הצלחה', 'הסיפור נמחק בהצלחה');
              loadStories();
            } catch (error) {
              console.error('Error deleting story:', error);
              Alert.alert('שגיאה', 'לא ניתן למחוק את הסיפור');
            }
          }
        }
      ]
    );
  };

  const handleVideoPress = (story) => {
    setSelectedVideo(story);
    setPlayingVideo(true);
  };

  const handleStateChange = (state) => {
    if (state === 'playing') {
      setPlayingVideo(true);
    } else if (state === 'paused' || state === 'ended') {
      setPlayingVideo(false);
    }
  };

  const renderStory = ({ item }) => {
    const hasVideo = item.videoUrl || item.youtubeUrl;
    const youtubeId = item.youtubeId || (item.youtubeUrl ? extractYouTubeId(item.youtubeUrl) : null);

    return (
      <TouchableOpacity
        style={styles.storyCard}
        activeOpacity={0.8}
        onPress={() => {
          if (hasVideo) {
            handleVideoPress(item);
          }
        }}
      >
        {youtubeId && item.thumbnailUrl && (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.youtubeThumbnail}
            resizeMode="cover"
          />
        )}
        <View style={styles.storyContent}>
          <View style={styles.storyInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.storyTitle} numberOfLines={2}>
                {item.title || 'סיפור מהבעל שם טוב'}
              </Text>
              <View style={styles.motzeiBadge}>
                <Ionicons name="moon-outline" size={14} color={SHABBAT_GOLD} />
                <Text style={styles.motzeiBadgeText}>כל מוצש</Text>
              </View>
            </View>
            {hasVideo && (
              <View style={styles.videoBadge}>
                <Ionicons name={youtubeId ? "logo-youtube" : "videocam"} size={16} color={PRIMARY_BLUE} />
                <Text style={styles.videoBadgeText}>{youtubeId ? 'YouTube' : 'סרטון'}</Text>
              </View>
            )}
            <Text style={styles.storyText} numberOfLines={3}>
              {item.content || ''}
            </Text>
          </View>
          <View style={styles.storyActions}>
            {canManage && (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleEditStory(item);
                  }}
                >
                  <Ionicons name="create-outline" size={20} color={PRIMARY_BLUE} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteStory(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="סיפורי הבעל שם טוב"
          subtitle="סיפורים מופלאים - כל מוצש"
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען סיפורים...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="סיפורי הבעל שם טוב"
        subtitle="סיפורים מופלאים - כל מוצש"
        onBackPress={() => navigation.goBack()}
      />

      {/* כל מוצש badge in header */}
      <View style={styles.headerBadge}>
        <Ionicons name="moon-outline" size={18} color={SHABBAT_GOLD} />
        <Text style={styles.headerBadgeText}>סרטון חדש כל מוצש</Text>
      </View>

      {canManage && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <LinearGradient
            colors={[PRIMARY_BLUE, '#1e40af']}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>הוסף סיפור (קישור YouTube)</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {stories.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="book-outline" size={80} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
          <Text style={styles.emptyText}>אין סיפורים זמינים כרגע</Text>
          <Text style={styles.emptySubtext}>סרטון חדש עולה כל מוצש</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={(item) => item.id}
          renderItem={renderStory}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Story Modal */}
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
                <Text style={styles.modalTitle}>הוסף סיפור - קישור YouTube</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setFormTitle('');
                    setFormContent('');
                    setFormVideoUri(null);
                    setFormVideoUrl('');
                    setFormYoutubeUrl('');
                    setVideoType('youtube');
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
                  <Text style={styles.formLabel}>תוכן (אופציונלי)</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={formContent}
                    onChangeText={setFormContent}
                    placeholder="הכנס תוכן הסיפור (אופציונלי אם יש סרטון)"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>סרטון מ-YouTube *</Text>

                  <View style={styles.videoTypeButtons}>
                    <TouchableOpacity
                      style={[styles.videoTypeButton, videoType === 'youtube' && styles.videoTypeButtonActive]}
                      onPress={() => {
                        setVideoType('youtube');
                        setFormVideoUri(null);
                        setFormVideoUrl('');
                      }}
                    >
                      <Ionicons name="logo-youtube" size={20} color={videoType === 'youtube' ? PRIMARY_BLUE : '#6b7280'} />
                      <Text style={[styles.videoTypeButtonText, videoType === 'youtube' && styles.videoTypeButtonTextActive]}>
                        קישור YouTube
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.videoTypeButton, videoType === 'upload' && styles.videoTypeButtonActive]}
                      onPress={() => {
                        setVideoType('upload');
                        setFormYoutubeUrl('');
                      }}
                    >
                      <Ionicons name="videocam-outline" size={20} color={videoType === 'upload' ? PRIMARY_BLUE : '#6b7280'} />
                      <Text style={[styles.videoTypeButtonText, videoType === 'upload' && styles.videoTypeButtonTextActive]}>
                        העלה מהגלריה
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {videoType === 'upload' && (
                    <>
                      {formVideoUrl ? (
                        <View style={styles.videoPreview}>
                          <Ionicons name="videocam" size={24} color={PRIMARY_BLUE} />
                          <Text style={styles.videoPreviewText}>סרטון הועלה בהצלחה</Text>
                          <TouchableOpacity
                            style={styles.removeVideoButton}
                            onPress={() => {
                              setFormVideoUrl('');
                              setFormVideoUri(null);
                            }}
                          >
                            <Ionicons name="close-circle" size={24} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.videoUploadContainer}>
                          <TouchableOpacity
                            style={styles.pickVideoButton}
                            onPress={handlePickVideo}
                            disabled={uploadingVideo}
                          >
                            <Ionicons name="videocam-outline" size={24} color={PRIMARY_BLUE} />
                            <Text style={styles.pickVideoButtonText}>
                              {formVideoUri ? 'סרטון נבחר' : 'בחר סרטון'}
                            </Text>
                          </TouchableOpacity>
                          {formVideoUri && (
                            <TouchableOpacity
                              style={styles.uploadVideoButton}
                              onPress={handleUploadVideo}
                              disabled={uploadingVideo}
                            >
                              {uploadingVideo ? (
                                <ActivityIndicator size="small" color="#fff" />
                              ) : (
                                <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                              )}
                              <Text style={styles.uploadVideoButtonText}>
                                {uploadingVideo ? 'מעלה...' : 'העלה סרטון'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </>
                  )}

                  {videoType === 'youtube' && (
                    <View style={styles.youtubeInputContainer}>
                      <TextInput
                        style={styles.formInput}
                        value={formYoutubeUrl}
                        onChangeText={setFormYoutubeUrl}
                        placeholder="https://www.youtube.com/watch?v=... או youtube.com/shorts/..."
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                      {formYoutubeUrl.trim() && extractYouTubeId(formYoutubeUrl.trim()) && (
                        <View style={styles.youtubePreview}>
                          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          <Text style={styles.youtubePreviewText}>קישור YouTube תקין</Text>
                        </View>
                      )}
                      {formYoutubeUrl.trim() && !extractYouTubeId(formYoutubeUrl.trim()) && (
                        <View style={styles.youtubeError}>
                          <Ionicons name="alert-circle" size={20} color="#ef4444" />
                          <Text style={styles.youtubeErrorText}>קישור YouTube לא תקין</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowAddModal(false);
                    setFormTitle('');
                    setFormContent('');
                    setFormVideoUri(null);
                    setFormVideoUrl('');
                    setFormYoutubeUrl('');
                    setVideoType('youtube');
                  }}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveStory}
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

      {/* Edit Story Modal - same structure as Add */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingStory(null);
          setFormTitle('');
          setFormContent('');
          setFormVideoUri(null);
          setFormVideoUrl('');
          setFormYoutubeUrl('');
          setVideoType('youtube');
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
                <Text style={styles.modalTitle}>ערוך סיפור</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingStory(null);
                    setFormTitle('');
                    setFormContent('');
                    setFormVideoUri(null);
                    setFormVideoUrl('');
                    setFormYoutubeUrl('');
                    setVideoType('youtube');
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
                  <Text style={styles.formLabel}>תוכן</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={formContent}
                    onChangeText={setFormContent}
                    placeholder="הכנס תוכן הסיפור"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>סרטון</Text>
                  <View style={styles.videoTypeButtons}>
                    <TouchableOpacity
                      style={[styles.videoTypeButton, videoType === 'youtube' && styles.videoTypeButtonActive]}
                      onPress={() => {
                        setVideoType('youtube');
                        setFormVideoUri(null);
                        setFormVideoUrl('');
                      }}
                    >
                      <Ionicons name="logo-youtube" size={20} color={videoType === 'youtube' ? PRIMARY_BLUE : '#6b7280'} />
                      <Text style={[styles.videoTypeButtonText, videoType === 'youtube' && styles.videoTypeButtonTextActive]}>YouTube</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.videoTypeButton, videoType === 'upload' && styles.videoTypeButtonActive]}
                      onPress={() => {
                        setVideoType('upload');
                        setFormYoutubeUrl('');
                      }}
                    >
                      <Ionicons name="videocam-outline" size={20} color={videoType === 'upload' ? PRIMARY_BLUE : '#6b7280'} />
                      <Text style={[styles.videoTypeButtonText, videoType === 'upload' && styles.videoTypeButtonTextActive]}>העלה</Text>
                    </TouchableOpacity>
                  </View>

                  {videoType === 'upload' && (
                    <>
                      {formVideoUrl ? (
                        <View style={styles.videoPreview}>
                          <Ionicons name="videocam" size={24} color={PRIMARY_BLUE} />
                          <Text style={styles.videoPreviewText}>סרטון הועלה</Text>
                          <TouchableOpacity
                            style={styles.removeVideoButton}
                            onPress={() => { setFormVideoUrl(''); setFormVideoUri(null); }}
                          >
                            <Ionicons name="close-circle" size={24} color="#dc2626" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.videoUploadContainer}>
                          <TouchableOpacity style={styles.pickVideoButton} onPress={handlePickVideo} disabled={uploadingVideo}>
                            <Ionicons name="videocam-outline" size={24} color={PRIMARY_BLUE} />
                            <Text style={styles.pickVideoButtonText}>{formVideoUri ? 'סרטון נבחר' : 'בחר סרטון'}</Text>
                          </TouchableOpacity>
                          {formVideoUri && (
                            <TouchableOpacity style={styles.uploadVideoButton} onPress={handleUploadVideo} disabled={uploadingVideo}>
                              {uploadingVideo ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="cloud-upload-outline" size={20} color="#fff" />}
                              <Text style={styles.uploadVideoButtonText}>{uploadingVideo ? 'מעלה...' : 'העלה'}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </>
                  )}

                  {videoType === 'youtube' && (
                    <View style={styles.youtubeInputContainer}>
                      <TextInput
                        style={styles.formInput}
                        value={formYoutubeUrl}
                        onChangeText={setFormYoutubeUrl}
                        placeholder="https://www.youtube.com/watch?v=..."
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="none"
                        keyboardType="url"
                      />
                      {formYoutubeUrl.trim() && extractYouTubeId(formYoutubeUrl.trim()) && (
                        <View style={styles.youtubePreview}>
                          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          <Text style={styles.youtubePreviewText}>קישור תקין</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => { setShowEditModal(false); setEditingStory(null); setFormTitle(''); setFormContent(''); setFormVideoUri(null); setFormVideoUrl(''); setFormYoutubeUrl(''); setVideoType('youtube'); }}>
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveStory} disabled={saving}>
                  <LinearGradient colors={[PRIMARY_BLUE, '#1e40af']} style={styles.saveButtonGradient}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveButtonText}>עדכן</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Video Player Modal */}
      {selectedVideo && (
        <Modal
          visible={!!selectedVideo}
          animationType="slide"
          onRequestClose={() => {
            setSelectedVideo(null);
            setPlayingVideo(false);
          }}
        >
          <View style={styles.videoModalContainer}>
            <Pressable
              style={styles.closeButton}
              onPress={() => {
                setSelectedVideo(null);
                setPlayingVideo(false);
              }}
            >
              <Ionicons name="close" size={32} color="#fff" />
            </Pressable>
            {selectedVideo.videoUrl && !selectedVideo.youtubeId ? (
              <Video
                ref={(ref) => { if (ref) videoRefs.current[selectedVideo.id] = ref; }}
                source={{ uri: selectedVideo.videoUrl }}
                style={styles.videoPlayer}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={playingVideo}
                onPlaybackStatusUpdate={(status) => { if (status.didJustFinish) setPlayingVideo(false); }}
              />
            ) : selectedVideo.youtubeId ? (
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
              </View>
            ) : null}
            <View style={styles.videoInfo}>
              <View style={styles.motzeiBadge}>
                <Ionicons name="moon-outline" size={14} color={SHABBAT_GOLD} />
                <Text style={styles.motzeiBadgeText}>כל מוצש</Text>
              </View>
              <Text style={styles.modalVideoTitle}>{selectedVideo.title || 'סרטון'}</Text>
              {selectedVideo.content && (
                <Text style={styles.modalVideoDescription}>{selectedVideo.content}</Text>
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, color: PRIMARY_BLUE, fontFamily: 'Heebo_500Medium' },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: SHABBAT_GOLD,
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
  addButtonText: { color: '#fff', fontSize: 16, fontFamily: 'Heebo_600SemiBold' },
  listContent: { padding: 16, paddingBottom: 40 },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  storyContent: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  storyInfo: { flex: 1, alignItems: 'flex-end' },
  titleRow: { flexDirection: 'column', alignItems: 'flex-end', gap: 4, marginBottom: 6 },
  motzeiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  motzeiBadgeText: {
    fontSize: 12,
    fontFamily: 'Heebo_600SemiBold',
    color: SHABBAT_GOLD,
  },
  storyActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(30,58,138,0.1)', justifyContent: 'center', alignItems: 'center' },
  deleteButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(220,38,38,0.1)', justifyContent: 'center', alignItems: 'center' },
  storyTitle: { fontSize: 16, fontFamily: 'Heebo_700Bold', color: DEEP_BLUE, textAlign: 'right', lineHeight: 22 },
  storyText: { fontSize: 14, fontFamily: 'Heebo_400Regular', color: '#6b7280', textAlign: 'right', lineHeight: 20 },
  videoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30,58,138,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  videoBadgeText: { fontSize: 12, fontFamily: 'Heebo_600SemiBold', color: PRIMARY_BLUE },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 20, fontFamily: 'Heebo_700Bold', color: DEEP_BLUE, marginTop: 20, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 16, color: '#6b7280', fontFamily: 'Heebo_400Regular', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: BG, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(11,27,58,0.1)' },
  modalTitle: { fontSize: 22, fontFamily: 'Heebo_700Bold', color: DEEP_BLUE },
  modalCloseButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(11,27,58,0.1)', justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: 20 },
  formGroup: { marginBottom: 20 },
  formLabel: { fontSize: 16, fontFamily: 'Heebo_600SemiBold', color: DEEP_BLUE, marginBottom: 8, textAlign: 'right' },
  formInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Heebo_400Regular', color: DEEP_BLUE, borderWidth: 1, borderColor: 'rgba(11,27,58,0.1)', textAlign: 'right' },
  formTextArea: { height: 120, textAlignVertical: 'top' },
  modalFooter: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(11,27,58,0.1)' },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontSize: 16, fontFamily: 'Heebo_600SemiBold', color: DEEP_BLUE },
  saveButton: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  saveButtonGradient: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { fontSize: 16, fontFamily: 'Heebo_600SemiBold', color: '#fff' },
  videoUploadContainer: { gap: 12 },
  pickVideoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: 'rgba(30,58,138,0.1)', borderWidth: 1, borderColor: 'rgba(30,58,138,0.2)', borderStyle: 'dashed' },
  pickVideoButtonText: { fontSize: 16, fontFamily: 'Heebo_600SemiBold', color: PRIMARY_BLUE },
  uploadVideoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: PRIMARY_BLUE },
  uploadVideoButtonText: { fontSize: 16, fontFamily: 'Heebo_600SemiBold', color: '#fff' },
  videoPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, backgroundColor: 'rgba(30,58,138,0.1)', borderWidth: 1, borderColor: 'rgba(30,58,138,0.2)' },
  videoPreviewText: { flex: 1, fontSize: 16, fontFamily: 'Heebo_600SemiBold', color: PRIMARY_BLUE },
  removeVideoButton: { padding: 4 },
  videoTypeButtons: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  videoTypeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: 'rgba(11,27,58,0.1)' },
  videoTypeButtonActive: { backgroundColor: 'rgba(30,58,138,0.1)', borderColor: PRIMARY_BLUE },
  videoTypeButtonText: { fontSize: 14, fontFamily: 'Heebo_600SemiBold', color: '#6b7280' },
  videoTypeButtonTextActive: { color: PRIMARY_BLUE },
  youtubeInputContainer: { gap: 8 },
  youtubePreview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  youtubePreviewText: { fontSize: 14, fontFamily: 'Heebo_600SemiBold', color: '#10b981' },
  youtubeError: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  youtubeErrorText: { fontSize: 14, fontFamily: 'Heebo_600SemiBold', color: '#ef4444' },
  youtubeThumbnail: { width: '100%', height: 140, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  videoModalContainer: { flex: 1, backgroundColor: '#000' },
  videoPlayer: { width: width, height: width * (16 / 9), marginTop: 60 },
  videoPlayerContainer: { flex: 1, padding: 20, paddingTop: 60 },
  videoInfo: { marginTop: 24, padding: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, alignItems: 'flex-end' },
  modalVideoTitle: { fontSize: 22, fontFamily: 'Heebo_700Bold', color: '#fff', marginBottom: 8, textAlign: 'right' },
  modalVideoDescription: { fontSize: 16, fontFamily: 'Heebo_400Regular', color: 'rgba(255,255,255,0.9)', textAlign: 'right', lineHeight: 24 },
  closeButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
});
