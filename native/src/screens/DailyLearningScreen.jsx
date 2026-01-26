import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Linking,
  Pressable,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';
import AppHeader from '../components/AppHeader';
import { getText, formatTextForDisplay, formatSefariaContent } from '../services/sefaria';
import { db } from '../services/database';
import { auth } from '../config/firebase';

const { width } = Dimensions.get('window');

// Colors
const COLORS = {
  primaryRed: '#DC2626',
  deepBlue: '#0b1b3a',
  bg: '#f9fafb',
  white: '#FFFFFF',
  text: '#111827',
  textLight: '#6B7280',
  cardBg: '#FFFFFF',
};

// Fonts
const FONTS = {
  bold: 'Poppins_700Bold',
  semiBold: 'Poppins_600SemiBold',
  medium: 'Poppins_500Medium',
  regular: 'Poppins_400Regular',
};

// Helper function removed - now handled in TehillimScreen

// Helper function to calculate daily Orchot Tzadikim gate (1-28 cycle)
function getDailyOrchotTzadikimGate() {
  const startDate = new Date(2024, 0, 1); // January 1, 2024
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const gate = (diffDays % 28) + 1; // Cycle through 1-28 (28 gates)
  return gate;
}

// Learning categories data with API references
const LEARNING_CATEGORIES = [
  {
    id: 'daily-moreinu',
    title: 'לימוד יומי בתורת מו״ר',
    description: 'תוכן יומי מתורת הרב',
    icon: 'sparkles-outline',
    color: '#F59E0B',
    isEditable: true,
    type: 'firebase', // Load from Firebase
  },
  {
    id: 'weekly-newsletter',
    title: 'לימוד יומי בגליון השבועי',
    description: 'תוכן שבועי מהעלון',
    icon: 'newspaper-outline',
    color: '#06B6D4',
    isEditable: true,
    type: 'firebase',
  },
  {
    id: 'two-halachot',
    title: 'שתי הלכות',
    description: 'הלכות יומיות',
    icon: 'book-outline',
    color: '#EC4899',
    isEditable: true,
    type: 'firebase',
  },
  {
    id: 'tehillim',
    title: 'תהילים',
    description: 'תהילים יומי - כל הפרקים',
    icon: 'book-outline',
    color: '#10B981',
    navigateTo: 'Tehillim',
  },
  {
    id: 'chofetz-chaim',
    title: 'חפץ חיים',
    description: 'הלכות לשון הרע',
    icon: 'shield-checkmark-outline',
    color: '#3B82F6',
    openInBrowser: true,
    webUrl: 'https://www.sefaria.org/Chofetz_Chaim',
  },
  {
    id: 'orchos-tzadikim',
    title: 'אורחות צדיקים',
    description: 'ספר המוסר המפורסם - 28 שערים',
    icon: 'star-outline',
    color: '#8B5CF6',
    openInBrowser: true,
    webUrl: () => {
      const gate = getDailyOrchotTzadikimGate();
      return `https://www.sefaria.org/Orchot_Tzadikim.${gate}`;
    },
  },
  {
    id: 'sefer-hamidos',
    title: 'ספר המידות',
    description: 'לרבנו רבי נחמן מברסלב',
    icon: 'flame-outline',
    color: '#EF4444',
    navigateTo: 'SeferHaMidot',
  },
  {
    id: 'tools',
    title: 'כלי עזר',
    description: 'סידור, זמני היום ומצפן לירושלים',
    icon: 'construct-outline',
    color: '#8B5CF6',
    navigateTo: 'Tools',
  },
];

export default function DailyLearningScreen({ navigation, userRole }) {
  const [loading, setLoading] = useState({});
  const [content, setContent] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [displayContent, setDisplayContent] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (user && userRole) {
        setIsAdmin(userRole === 'admin' || userRole === 'superadmin');
      }
    };
    checkAdmin();
  }, [userRole]);

  // Load content from Supabase for editable categories
  useEffect(() => {
    const loadContent = async () => {
      for (const category of LEARNING_CATEGORIES) {
        if (category.type === 'firebase') {
          try {
            const doc = await db.getDocument('dailyLearning', category.id);
            if (doc) {
              setContent(prev => ({
                ...prev,
                [category.id]: {
                  title: doc.title || '',
                  text: doc.text || '',
                  imageUrl: doc.imageUrl || '',
                  updatedAt: doc.updatedAt,
                }
              }));
            }
          } catch (error) {
            // Document doesn't exist yet - that's OK, it will be created when admin edits
            if (error.code === 'PGRST116') {
              console.log(`No content yet for ${category.id} - will be created on first edit`);
            } else {
              console.error(`Error loading ${category.id}:`, error);
            }
            // Initialize with empty content
            setContent(prev => ({
              ...prev,
              [category.id]: { title: '', text: '', imageUrl: '' }
            }));
          }
        }
      }
    };
    loadContent();
  }, []);

  // Handle edit button press
  const handleEditPress = (category) => {
    // Open modal immediately without waiting for database
    const existingContent = content[category.id] || {};
    setEditingCategory(category);
    setEditTitle(existingContent.title || '');
    setEditText(existingContent.text || '');
    setEditImageUrl(existingContent.imageUrl || '');
    setEditModalVisible(true);
  };

  // Save content
  const handleSaveEdit = async () => {
    if (!editingCategory) return;

    try {
      setLoading(prev => ({ ...prev, [editingCategory.id]: true }));

      await db.updateDocument('dailyLearning', editingCategory.id, {
        title: editTitle,
        text: editText,
        imageUrl: editImageUrl,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid,
      });

      setContent(prev => ({
        ...prev,
        [editingCategory.id]: {
          title: editTitle,
          text: editText,
          imageUrl: editImageUrl,
          updatedAt: new Date().toISOString(),
        }
      }));

      setEditModalVisible(false);
      Alert.alert('הצלחה', 'התוכן עודכן בהצלחה');
    } catch (error) {
      console.error('Error saving:', error);
      Alert.alert('שגיאה', 'לא ניתן לשמור את התוכן');
    } finally {
      setLoading(prev => ({ ...prev, [editingCategory.id]: false }));
    }
  };

  // Delete content
  const handleDeleteContent = async () => {
    if (!editingCategory) return;

    Alert.alert(
      'מחיקת תוכן',
      'האם אתה בטוח?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.updateDocument('dailyLearning', editingCategory.id, {
                title: '',
                text: '',
                imageUrl: '',
                updatedAt: new Date().toISOString(),
              });

              setContent(prev => ({
                ...prev,
                [editingCategory.id]: { title: '', text: '', imageUrl: '' }
              }));

              setEditModalVisible(false);
              Alert.alert('הצלחה', 'התוכן נמחק');
            } catch (error) {
              Alert.alert('שגיאה', 'לא ניתן למחוק');
            }
          }
        }
      ]
    );
  };

  // Build Sefaria URL (similar to SiddurScreen)
  const buildSefariaUrl = (category) => {
    let baseUrl = category.webUrl;

    if (typeof baseUrl === 'function') {
      baseUrl = baseUrl();
    }

    if (!baseUrl) {
      return null;
    }

    // Add language parameter
    return `${baseUrl}?lang=he`;
  };

  const showCategoryContent = (category, contentData) => {
    // Navigate to SeferHaMidot screen if it's Sefer HaMiddot, otherwise show content
    if (category.id === 'sefer-hamidos') {
      navigation?.navigate('SeferHaMidot');
      return;
    }
    
    // Show content in full screen modal
    setSelectedCategory(category);
    setDisplayContent(contentData);
  };

  const handleCategoryPress = (category) => {
    // Special handling for Tools - navigate to Tools screen
    if (category.navigateTo) {
      navigation?.navigate(category.navigateTo);
      return;
    }

    // Special handling for Sefer HaMiddot - just navigate
    if (category.id === 'sefer-hamidos') {
      navigation?.navigate('SeferHaMidot');
      return;
    }

    // Special handling for Tehillim - navigate to Tehillim screen
    if (category.id === 'tehillim') {
      navigation?.navigate('Tehillim');
      return;
    }

    // For Firebase categories - show content directly
    if (category.type === 'firebase') {
      setSelectedCategory(category);
      const firebaseContent = content[category.id];
      if (firebaseContent) {
        setDisplayContent(firebaseContent);
      } else {
        setDisplayContent({ title: '', text: '', imageUrl: '' });
      }
      return;
    }

    // If category should open in browser (like Siddur does)
    if (category.openInBrowser) {
      setSelectedCategory(category);
      setLoading(prev => ({ ...prev, [category.id]: true }));
      return;
    }

    // For other Sefaria categories - load from API
    loadCategoryContent(category);
  };

  const loadCategoryContent = async (category) => {
    if (content[category.id]) {
      showCategoryContent(category, content[category.id]);
      return;
    }

    setLoading(prev => ({ ...prev, [category.id]: true }));

    try {
      const tref = category.sefariaRef();
      console.log(`📖 Loading from Sefaria: ${tref}`);

      const textData = await getText(tref, { lang: 'he' });

      if (!textData) {
        throw new Error('לא התקבל תוכן מ-Sefaria API');
      }

      const formatOptions = {
        preserveStructure: true,
        addChapterNumbers: category.id === 'tehillim',
        language: 'he',
        ...(category.formatOptions || {})
      };

      const formatted = formatSefariaContent(textData, formatOptions);

      if (!formatted.content && textData) {
        let fallbackContent = '';

        if (textData.he) {
          if (Array.isArray(textData.he)) {
            const flattenArray = (arr) => {
              return arr.map(item => {
                if (Array.isArray(item)) {
                  return flattenArray(item).join(' ');
                }
                return typeof item === 'string' ? item : '';
              }).filter(p => p && p.trim()).join('\n\n');
            };
            fallbackContent = flattenArray(textData.he);
          } else if (typeof textData.he === 'string') {
            fallbackContent = textData.he;
          }
        } else if (textData.text) {
          if (Array.isArray(textData.text)) {
            const flattenArray = (arr) => {
              return arr.map(item => {
                if (Array.isArray(item)) {
                  return flattenArray(item).join(' ');
                }
                return typeof item === 'string' ? item : '';
              }).filter(p => p && p.trim()).join('\n\n');
            };
            fallbackContent = flattenArray(textData.text);
          } else if (typeof textData.text === 'string') {
            fallbackContent = textData.text;
          }
        }

        if (!fallbackContent) {
          throw new Error('לא נמצא תוכן טקסט בתגובת ה-API');
        }

        formatted.content = fallbackContent;
        formatted.hebrew = fallbackContent;
        formatted.title = textData.heRef || textData.ref || category.title;
      }

      // Tehillim is now handled in TehillimScreen, no need to format here

      setContent(prev => ({ ...prev, [category.id]: formatted }));
      showCategoryContent(category, formatted);
    } catch (error) {
      console.error(`Error loading ${category.title}:`, error);
      Alert.alert(
        'שגיאה בטעינת תוכן',
        `לא ניתן לטעון את התוכן מ-Sefaria.\n\n${error.message || 'שגיאה לא ידועה'}`,
        [{ text: 'אישור', onPress: () => {
          setLoading(prev => ({ ...prev, [category.id]: false }));
        }}]
      );
    } finally {
      setLoading(prev => ({ ...prev, [category.id]: false }));
    }
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setDisplayContent(null);
    } else {
      navigation.goBack();
    }
  };

  // Show WebView for browser-opened categories (like Siddur)
  if (selectedCategory && selectedCategory.openInBrowser) {
    const url = buildSefariaUrl(selectedCategory);

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[COLORS.bg, '#f3f4f6']} style={StyleSheet.absoluteFill} />

        <AppHeader
          title={selectedCategory.title}
          showBackButton={true}
          onBackPress={handleBack}
          rightIcon="open-outline"
          onRightIconPress={() => {
            if (url) {
              Linking.openURL(url);
            }
          }}
        />

        {url && (
          <WebView
            source={{ uri: url }}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.deepBlue} />
                <Text style={styles.loadingText}>טוען תוכן...</Text>
              </View>
            )}
            onLoadEnd={() => setLoading(prev => ({ ...prev, [selectedCategory.id]: false }))}
          />
        )}

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.deepBlue} />
                </Pressable>
                <Text style={styles.modalTitle}>עריכת תוכן - {editingCategory?.title}</Text>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>כותרת</Text>
                  <TextInput
                    style={styles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="הזן כותרת..."
                    textAlign="right"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>תוכן</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editText}
                    onChangeText={setEditText}
                    placeholder="הזן תוכן..."
                    multiline
                    numberOfLines={8}
                    textAlign="right"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>קישור לתמונה</Text>
                  <TextInput
                    style={styles.input}
                    value={editImageUrl}
                    onChangeText={setEditImageUrl}
                    placeholder="https://example.com/image.jpg"
                    textAlign="right"
                    autoCapitalize="none"
                  />
                </View>

                {editImageUrl ? (
                  <View style={styles.imagePreview}>
                    <Text style={styles.label}>תצוגה מקדימה:</Text>
                    <Image
                      source={{ uri: editImageUrl }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteContent}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.modalButtonText}>מחק</Text>
                </Pressable>

                <View style={styles.modalButtonGroup}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.modalButtonText}>שמור</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Show Firebase content view
  if (selectedCategory && selectedCategory.type === 'firebase' && displayContent !== null) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[COLORS.bg, '#f3f4f6']} style={StyleSheet.absoluteFill} />

        <AppHeader
          title={selectedCategory.title}
          showBackButton={true}
          onBackPress={handleBack}
          rightIcon={isAdmin ? "create-outline" : null}
          onRightIconPress={isAdmin ? () => handleEditPress(selectedCategory) : null}
        />

        <ScrollView
          style={styles.contentView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {displayContent.title || displayContent.text || displayContent.imageUrl ? (
            <>
              {displayContent.title ? (
                <View style={styles.contentHeader}>
                  <Text style={styles.contentTitle}>{displayContent.title}</Text>
                  <View style={styles.divider} />
                </View>
              ) : null}

              {displayContent.imageUrl ? (
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: displayContent.imageUrl }}
                    style={styles.contentImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}

              {displayContent.text ? (
                <View style={styles.textContainer}>
                  <Text style={styles.textContent}>{displayContent.text}</Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>אין תוכן זמין</Text>
              {isAdmin && (
                <Pressable
                  style={styles.addContentButton}
                  onPress={() => handleEditPress(selectedCategory)}
                >
                  <Text style={styles.addContentButtonText}>הוסף תוכן</Text>
                </Pressable>
              )}
            </View>
          )}
        </ScrollView>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.deepBlue} />
                </Pressable>
                <Text style={styles.modalTitle}>עריכת תוכן - {editingCategory?.title}</Text>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>כותרת</Text>
                  <TextInput
                    style={styles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="הזן כותרת..."
                    textAlign="right"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>תוכן</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editText}
                    onChangeText={setEditText}
                    placeholder="הזן תוכן..."
                    multiline
                    numberOfLines={8}
                    textAlign="right"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>קישור לתמונה</Text>
                  <TextInput
                    style={styles.input}
                    value={editImageUrl}
                    onChangeText={setEditImageUrl}
                    placeholder="https://example.com/image.jpg"
                    textAlign="right"
                    autoCapitalize="none"
                  />
                </View>

                {editImageUrl ? (
                  <View style={styles.imagePreview}>
                    <Text style={styles.label}>תצוגה מקדימה:</Text>
                    <Image
                      source={{ uri: editImageUrl }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteContent}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.modalButtonText}>מחק</Text>
                </Pressable>

                <View style={styles.modalButtonGroup}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.modalButtonText}>שמור</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // Show loading while content is being fetched
  if (selectedCategory && loading[selectedCategory.id]) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[COLORS.bg, '#f3f4f6']} style={StyleSheet.absoluteFill} />

        <AppHeader
          title={selectedCategory.title}
          showBackButton={true}
          onBackPress={handleBack}
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.text} />
          <Text style={styles.loadingText}>טוען תוכן...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show content view if category is selected and content is loaded
  if (selectedCategory && displayContent && displayContent.content) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[COLORS.bg, '#f3f4f6']} style={StyleSheet.absoluteFill} />
        
        <AppHeader
          title={selectedCategory.title}
          showBackButton={true}
          onBackPress={handleBack}
        />
        
        <ScrollView 
          style={styles.contentView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>{displayContent.title || selectedCategory.title}</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.textContent}>{displayContent.hebrew || displayContent.content}</Text>
          </View>
        </ScrollView>

        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color={COLORS.deepBlue} />
                </Pressable>
                <Text style={styles.modalTitle}>עריכת תוכן - {editingCategory?.title}</Text>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>כותרת</Text>
                  <TextInput
                    style={styles.input}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="הזן כותרת..."
                    textAlign="right"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>תוכן</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editText}
                    onChangeText={setEditText}
                    placeholder="הזן תוכן..."
                    multiline
                    numberOfLines={8}
                    textAlign="right"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>קישור לתמונה</Text>
                  <TextInput
                    style={styles.input}
                    value={editImageUrl}
                    onChangeText={setEditImageUrl}
                    placeholder="https://example.com/image.jpg"
                    textAlign="right"
                    autoCapitalize="none"
                  />
                </View>

                {editImageUrl ? (
                  <View style={styles.imagePreview}>
                    <Text style={styles.label}>תצוגה מקדימה:</Text>
                    <Image
                      source={{ uri: editImageUrl }}
                      style={styles.previewImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Pressable
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={handleDeleteContent}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.modalButtonText}>מחק</Text>
                </Pressable>

                <View style={styles.modalButtonGroup}>
                  <Pressable
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={handleSaveEdit}
                  >
                    <Text style={styles.modalButtonText}>שמור</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[COLORS.bg, '#f3f4f6']} style={StyleSheet.absoluteFill} />
      
      <AppHeader
        title="לימוד יומי "
        showBackButton={true}
        onBackPress={handleBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>לימוד יומי בתורת רבינו ועוד...</Text>
          <View style={styles.subtitleRow}>
            <Text style={styles.subtitle}>תוכנית לימודים יומיים</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>חי</Text>
            </View>
          </View>
          <Text style={styles.note}>נמחקים אוטומטית לאחר 24 שעות</Text>
        </View>

        {/* Learning Categories List */}
        <View style={styles.categoriesContainer}>
          {LEARNING_CATEGORIES.map((category, index) => (
              <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.7}
              disabled={loading[category.id]}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardTextContainer}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  {category.description ? (
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  ) : null}
                </View>
                <View style={styles.arrowContainer}>
                  {loading[category.id] ? (
                    <ActivityIndicator size="small" color={COLORS.textLight} />
                  ) : (
                    <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
                  )}
                </View>
            </View>
              </TouchableOpacity>
          ))}
            </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.deepBlue} />
              </Pressable>
              <Text style={styles.modalTitle}>עריכת תוכן - {editingCategory?.title}</Text>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>כותרת</Text>
                <TextInput
                  style={styles.input}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="הזן כותרת..."
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>תוכן</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editText}
                  onChangeText={setEditText}
                  placeholder="הזן תוכן..."
                  multiline
                  numberOfLines={8}
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>קישור לתמונה</Text>
                <TextInput
                  style={styles.input}
                  value={editImageUrl}
                  onChangeText={setEditImageUrl}
                  placeholder="https://example.com/image.jpg"
                  textAlign="right"
                  autoCapitalize="none"
                />
              </View>

              {editImageUrl ? (
                <View style={styles.imagePreview}>
                  <Text style={styles.label}>תצוגה מקדימה:</Text>
                  <Image
                    source={{ uri: editImageUrl }}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeleteContent}
              >
                <Ionicons name="trash-outline" size={18} color="#fff" />
                <Text style={styles.modalButtonText}>מחק</Text>
              </Pressable>

              <View style={styles.modalButtonGroup}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ביטול</Text>
                </Pressable>

                <Pressable
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalButtonText}>שמור</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: FONTS.bold,
    color: COLORS.deepBlue,
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 32,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    textAlign: 'right',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryRed,
  },
  liveText: {
    color: COLORS.primaryRed,
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  note: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  cardContent: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Heebo_600SemiBold',
    color: COLORS.deepBlue,
    textAlign: 'right',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  categoryDescription: {
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: COLORS.textLight,
    textAlign: 'right',
    lineHeight: 22,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  loadedIndicator: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'right',
  },
  contentView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  contentHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  contentTitle: {
    fontSize: 26,
    fontFamily: 'Heebo_700Bold',
    color: COLORS.deepBlue,
    textAlign: 'right',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  divider: {
    height: 3,
    backgroundColor: COLORS.deepBlue,
    opacity: 0.2,
    borderRadius: 2,
    marginBottom: 8,
  },
  textContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textContent: {
    fontSize: 19,
    fontFamily: 'Heebo_400Regular',
    color: COLORS.deepBlue,
    textAlign: 'right',
    lineHeight: 38,
    writingDirection: 'rtl',
    letterSpacing: 0.2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  imageContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  contentImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addContentButton: {
    backgroundColor: COLORS.deepBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addContentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    color: COLORS.deepBlue,
    textAlign: 'right',
    flex: 1,
    marginRight: 16,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Heebo_600SemiBold',
    color: COLORS.deepBlue,
    textAlign: 'right',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: COLORS.text,
    backgroundColor: '#f9fafb',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreview: {
    marginTop: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    backgroundColor: COLORS.deepBlue,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontFamily: 'Heebo_600SemiBold',
  },
});
