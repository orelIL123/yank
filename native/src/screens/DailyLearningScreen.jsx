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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { getText, formatTextForDisplay, formatSefariaContent } from '../services/sefaria';

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

// Helper function to calculate daily Tehillim chapter (1-150 cycle)
function getDailyTehillimChapter() {
  const startDate = new Date(2024, 0, 1); // January 1, 2024
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const chapter = (diffDays % 150) + 1; // Cycle through 1-150
  return chapter;
}

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
    id: 'tehillim',
    title: 'תהילים',
    description: 'כל 150 פרקי תהילים',
    icon: 'book-outline',
    color: '#10B981',
    sefariaRef: () => 'Psalms', // Load the entire book
    dailyChapter: getDailyTehillimChapter, // Keep track of daily chapter for future features
  },
  {
    id: 'chofetz-chaim',
    title: 'חפץ חיים',
    description: 'הלכות לשון הרע',
    icon: 'shield-checkmark-outline',
    color: '#3B82F6',
    sefariaRef: () => {
      // Simplified reference - load full book
      return `Chofetz_Chaim`;
    },
    formatOptions: {
      preserveStructure: true,
      addChapterNumbers: false,
    }
  },
  {
    id: 'orchos-tzadikim',
    title: 'אורחות צדיקים',
    description: 'ספר המוסר המפורסם - 28 שערים',
    icon: 'star-outline',
    color: '#8B5CF6',
    sefariaRef: () => {
      const gate = getDailyOrchotTzadikimGate();
      // Load specific gate (1-28)
      return `Orchot Tzadikim ${gate}`;
    },
    formatOptions: {
      preserveStructure: true,
      addChapterNumbers: false,
    }
  },
  {
    id: 'sefer-hamidos',
    title: 'לימוד יומי מספר המידות',
    description: 'מתורת החסידות, ואף מנגו לעיתים ניגוני חב"ד.',
    icon: 'flame-outline',
    color: '#EF4444',
    sefariaRef: () => 'Sefer HaMiddot',
  },
];

export default function DailyLearningScreen({ navigation, userRole }) {
  const [loading, setLoading] = useState({});
  const [content, setContent] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [displayContent, setDisplayContent] = useState(null);

  const loadCategoryContent = async (category) => {
    if (content[category.id]) {
      // Content already loaded, show it
      showCategoryContent(category, content[category.id]);
      return;
    }

    setLoading(prev => ({ ...prev, [category.id]: true }));

    try {
      const tref = category.sefariaRef();
      console.log(`📖 Loading from Sefaria: ${tref}`);
      
      const textData = await getText(tref, { lang: 'he' });
      
      // Use the new formatSefariaContent function for better formatting
      // Use category-specific format options if available
      const formatOptions = {
        preserveStructure: true,
        addChapterNumbers: category.id === 'tehillim', // Add chapter numbers for Psalms
        language: 'he',
        ...(category.formatOptions || {})
      };
      
      const formatted = formatSefariaContent(textData, formatOptions);
      
      // Fallback to old logic if new function returns empty content
      if (!formatted.content && textData) {
        let fallbackContent = '';
        if (textData.he) {
          if (Array.isArray(textData.he)) {
            fallbackContent = textData.he.filter(p => p && p.trim()).join('\n\n');
          } else {
            fallbackContent = textData.he;
          }
        } else if (textData.text) {
          if (Array.isArray(textData.text)) {
            fallbackContent = textData.text.filter(p => p && p.trim()).join('\n\n');
          } else {
            fallbackContent = textData.text;
          }
        }
        
        formatted.content = fallbackContent;
        formatted.hebrew = fallbackContent;
        formatted.title = textData.ref || category.title;
      }
      
      setContent(prev => ({ ...prev, [category.id]: formatted }));
      showCategoryContent(category, formatted);
    } catch (error) {
      console.error(`Error loading ${category.title}:`, error);
      Alert.alert(
        'שגיאה בטעינת תוכן',
        `לא ניתן לטעון את התוכן מ-Sefaria. ${error.message}`,
        [{ text: 'אישור' }]
      );
    } finally {
      setLoading(prev => ({ ...prev, [category.id]: false }));
    }
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
    // Special handling for Sefer HaMiddot - just navigate
    if (category.id === 'sefer-hamidos') {
      navigation?.navigate('SeferHaMidot');
      return;
    }
    
    loadCategoryContent(category);
  };

  const handleBack = () => {
    if (selectedCategory) {
      setSelectedCategory(null);
      setDisplayContent(null);
    } else {
      navigation.goBack();
    }
  };

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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[COLORS.bg, '#f3f4f6']} style={StyleSheet.absoluteFill} />
      
      <AppHeader
        title="לימוד יומי בתורת רבנו"
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
            <Text style={styles.subtitle}>סרטונים יומיים</Text>
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
                  {content[category.id] && (
                    <Text style={styles.loadedIndicator}>✓ נטען בהצלחה</Text>
                  )}
                </View>
                <View style={[styles.iconContainer, { backgroundColor: `${category.color}15` }]}>
                  {loading[category.id] ? (
                    <ActivityIndicator size="small" color={category.color} />
                  ) : (
                    <Ionicons name={category.icon} size={24} color={category.color} />
                  )}
                </View>
            </View>
              </TouchableOpacity>
          ))}
            </View>
      </ScrollView>
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
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.textLight,
    textAlign: 'right',
    lineHeight: 18,
    marginTop: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 12,
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
    borderRadius: 1,
  },
  textContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textContent: {
    fontSize: 18,
    fontFamily: FONTS.regular,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 34,
    writingDirection: 'rtl',
    letterSpacing: 0.3,
    paddingHorizontal: 4,
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
});
