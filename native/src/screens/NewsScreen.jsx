import React from 'react'
import { SafeAreaView, View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Share } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

const GOLD = '#E63946'
const BG = '#FFFFFF'
const DEEP_BLUE = '#2D6A4F'

const ARTICLES = [
  {
    id: 'news-1',
    title: 'הזדמנויות בשוק הדיגיטלי לקראת 2026',
    date: '31 באוקטובר 2025',
    summary: 'איך להתכונן לשינויים הצפויים בשוק ולהפוך מידע להזדמנויות השקעה.',
    image: require('../../assets/photos/photo2.jpeg'),
  },
  {
    id: 'news-2',
    title: 'Mindset של טריידר – שיעורים מהקהילה',
    date: '29 באוקטובר 2025',
    summary: 'תובנות מרכזיות מהקהילה שלנו על ניהול רגשות ועמידה ביעדים.',
    image: require('../../assets/photos/photo3.png'),
  },
  {
    id: 'news-3',
    title: 'טל ממליץ: 3 מניות למעקב מקרוב',
    date: '27 באוקטובר 2025',
    summary: 'הסקירה השבועית עם נקודות מפתח לפני שבוע המסחר הבא.',
    image: require('../../assets/photos/photo4.png'),
  },
]

export default function NewsScreen({ navigation }) {
  const handleShare = React.useCallback((article) => {
    Share.share({
      message: `${article.title}\n${article.summary}\n\nפורסם ב-Boiler Room App`
    }).catch(() => {})
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <Ionicons name="arrow-back" size={24} color={GOLD} />
        </Pressable>
        <Text style={styles.headerTitle}>חדשות</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>עדכוני מסחר, ידע וכלים מעולם המיינדסט</Text>

        {ARTICLES.map((article, idx) => (
          <Pressable
            key={article.id}
            style={[styles.articleCard, idx === 0 && styles.articleCardFirst]}
            onPress={() => navigation.navigate('DailyInsight')}
            accessibilityRole="button"
            accessibilityLabel={`כתבה ${article.title}`}
          >
            <ImageBackground source={article.image} style={styles.articleCover} imageStyle={styles.articleCoverRadius}>
              <LinearGradient colors={[ 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.1)' ]} style={StyleSheet.absoluteFill} />
              <View style={styles.articleTopRow}>
                <View style={styles.datePill}>
                  <Ionicons name="calendar-outline" size={14} color={GOLD} />
                  <Text style={styles.dateText}>{article.date}</Text>
                </View>
                <Pressable
                  onPress={() => handleShare(article)}
                  style={styles.shareIconBtn}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel={`שיתוף ${article.title}`}
                >
                  <Ionicons name="share-social-outline" size={18} color={GOLD} />
                </Pressable>
              </View>
              <View style={styles.articleBottom}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
              </View>
            </ImageBackground>
          </Pressable>
        ))}

        <View style={styles.footerCard}>
          <Ionicons name="create-outline" size={28} color={GOLD} />
          <View style={styles.footerTextBlock}>
            <Text style={styles.footerTitle}>העלאת תוכן ע"י אדמין</Text>
            <Text style={styles.footerDesc}>
              בקרוב נאפשר להוסיף כתבות חדשות עם תמונה, כותרת ומלל ישירות מהמערכת האדמיניסטרטיבית.
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
    paddingBottom: 36,
    gap: 18,
  },
  subtitle: {
    alignSelf: 'flex-end',
    color: DEEP_BLUE,
    fontSize: 15,
    fontFamily: 'Poppins_500Medium',
  },
  articleCard: {
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  },
  articleCardFirst: {
    marginTop: 6,
  },
  articleCover: {
    height: 220,
    justifyContent: 'space-between',
  },
  articleCoverRadius: {
    borderRadius: 22,
  },
  articleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212,175,55,0.2)',
  },
  dateText: {
    color: '#fef9c3',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  shareIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  articleBottom: {
    padding: 18,
    alignItems: 'flex-end',
    gap: 8,
  },
  articleTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
  },
  articleSummary: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  footerCard: {
    marginTop: 12,
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
    color: '#475569',
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
    lineHeight: 18,
  },
})
