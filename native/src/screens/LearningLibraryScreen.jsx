import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const { width } = Dimensions.get('window');

const CATEGORIES = [
  {
    id: 'shortLessons',
    title: 'שיעורים קצרים',
    description: 'רילסים מהרב - שיעורים קצרים ומרוכזים',
    icon: 'videocam',
    gradient: ['#ff6b6b', '#ee5a6f'],
    screen: 'ShortLessons',
    image: require('../../assets/photos/cards/הינוקא.png')
  },
  {
    id: 'longLessons',
    title: 'סרטונים ארוכים',
    description: 'שיעורים מלאים ומפורטים מהרב',
    icon: 'film',
    gradient: ['#4facfe', '#00f2fe'],
    screen: 'LongLessons',
    image: require('../../assets/photos/cards/הינוקא1.jpg')
  },
];

export default function LearningLibraryScreen({ navigation, userRole }) {
  const handleCategoryPress = (category) => {
    navigation?.navigate(category.screen);
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
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>בחר קטגוריה</Text>
          <Text style={styles.headerSubtitle}>
            גש לכל השיעורים והסרטונים של הגאון הינוקא שליט״א
          </Text>
        </View>

        <View style={styles.categoriesContainer}>
          {CATEGORIES.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.9}
            >
              <ImageBackground
                source={category.image}
                style={styles.categoryImage}
                imageStyle={styles.categoryImageStyle}
              >
                <LinearGradient
                  colors={[...category.gradient, 'rgba(0,0,0,0.7)']}
                  style={styles.categoryGradient}
                >
                  <View style={styles.categoryContent}>
                    <View style={styles.categoryIconContainer}>
                      <Ionicons name={category.icon} size={40} color="#fff" />
                    </View>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>
                      {category.description}
                    </Text>
                    <View style={styles.categoryArrow}>
                      <Ionicons name="chevron-forward" size={24} color="#fff" />
                    </View>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={PRIMARY_BLUE} />
            <Text style={styles.infoText}>
              כל השיעורים והסרטונים נגישים בחינם לכל המשתמשים
            </Text>
          </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 30,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Heebo_700Bold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: '#6b7280',
    textAlign: 'right',
    lineHeight: 24,
  },
  categoriesContainer: {
    gap: 20,
    marginBottom: 30,
  },
  categoryCard: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImageStyle: {
    resizeMode: 'cover',
    opacity: 0.3,
  },
  categoryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  categoryContent: {
    width: '100%',
    alignItems: 'flex-end',
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-end',
  },
  categoryTitle: {
    fontSize: 24,
    fontFamily: 'Heebo_700Bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  categoryDescription: {
    fontSize: 16,
    fontFamily: 'Heebo_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'right',
    marginBottom: 16,
    lineHeight: 22,
  },
  categoryArrow: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  infoSection: {
    marginTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30,58,138,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Heebo_400Regular',
    color: DEEP_BLUE,
    textAlign: 'right',
    lineHeight: 20,
  },
});

