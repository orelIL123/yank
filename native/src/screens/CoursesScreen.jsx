import React from 'react'
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const GOLD = '#E63946'
const BG = '#FFFFFF'
const DEEP_BLUE = '#2D6A4F'

const COURSES = [
  {
    id: 'course-1',
    title: 'Foundations of Trading',
    level: 'Beginner',
    duration: '6 פרקים • 3.5 שעות',
    description: 'מבוא למסחר ממושמע — הגדרת מטרות, ניהול סיכונים ובניית שגרה יומית.',
    cover: require('../../assets/photos/photo1.jpg'),
  },
  {
    id: 'course-2',
    title: 'Advanced Technical Analysis',
    level: 'Intermediate',
    duration: '8 פרקים • 5 שעות',
    description: 'העמקה בתבניות מתקדמות, ניתוח ווליום, וכלים לזיהוי מומנטום.',
    cover: require('../../assets/photos/photo2.jpeg'),
  },
  {
    id: 'course-3',
    title: 'Mindset & Faith Alignment',
    level: 'Mindset',
    duration: '5 פרקים • 2 שעות',
    description: 'איך לחבר בין אמונה, תודעה ומסחר בצורה מאוזנת ויציבה.',
    cover: require('../../assets/photos/photo3.png'),
  },
]

export default function CoursesScreen({ navigation }) {
  const onCoursePress = (course) => {
    Alert.alert('בקרוב', `${course.title} ייפתח עם תוכן מלא לאחר חיבור לבקאנד.`)
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f7f7f7']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.headerTitle}>לימודי מסחר</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>המסלול שלך לצמיחה מקצועית</Text>

        {COURSES.map((course, idx) => (
          <Pressable
            key={course.id}
            style={[styles.courseCard, idx === 0 && styles.courseCardFirst]}
            onPress={() => onCoursePress(course)}
            accessibilityRole="button"
            accessibilityLabel={`קורס ${course.title}`}
          >
            <ImageBackground source={course.cover} style={styles.coverImage} imageStyle={styles.coverImageRadius}>
              <LinearGradient colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)']} style={StyleSheet.absoluteFill} />
              <View style={styles.courseLabelRow}>
                <View style={styles.levelPill}>
                  <Text style={styles.levelText}>{course.level}</Text>
                </View>
                <Ionicons name="play-circle" size={28} color={GOLD} />
              </View>
              <View style={styles.courseTextBlock}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <View style={styles.courseMetaRow}>
                  <Ionicons name="time-outline" size={14} color="#f3f4f6" />
                  <Text style={styles.courseMeta}>{course.duration}</Text>
                </View>
                <Text style={styles.courseDesc}>{course.description}</Text>
              </View>
            </ImageBackground>
          </Pressable>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="sparkles-outline" size={32} color={GOLD} />
          <View style={styles.footerTextBlock}>
            <Text style={styles.footerTitle}>מסלול VIP</Text>
            <Text style={styles.footerDesc}>
              משתמשי VIP יקבלו גישה לקורסים מיוחדים, שיעורים לייב וקהילת מאסטרמיינד סגורה.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: GOLD,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 18,
  },
  subtitle: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  courseCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  courseCardFirst: {
    marginTop: 6,
  },
  coverImage: {
    height: 220,
    justifyContent: 'space-between',
  },
  coverImageRadius: {
    borderRadius: 20,
  },
  courseLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.18)',
  },
  levelText: {
    color: '#fdf3c2',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  courseTextBlock: {
    padding: 18,
    alignItems: 'flex-end',
    gap: 8,
  },
  courseTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  courseMeta: {
    color: '#f3f4f6',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  courseDesc: {
    color: '#f3f4f6',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
  footerCard: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.1)',
  },
  footerTextBlock: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 4,
  },
  footerTitle: {
    color: DEEP_BLUE,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  footerDesc: {
    color: '#4b5563',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
})
