import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, ImageBackground, Share, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import AppHeader from '../components/AppHeader'
import { t } from '../utils/i18n'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function NewsScreen({ navigation, userRole }) {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNews()
  }, [])

  const loadNews = async () => {
    try {
      const q = query(
        collection(db, 'news'),
        orderBy('date', 'desc'),
        limit(20)
      )
      const querySnapshot = await getDocs(q)
      const articlesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setArticles(articlesData)
    } catch (error) {
      console.error('Error loading news:', error)
      Alert.alert('שגיאה', 'לא ניתן לטעון את החדשות')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = React.useCallback((article) => {
    Share.share({
      message: `${article.title}\n${article.summary || article.content}`
    }).catch(() => {})
  }, [])

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    if (date.toDate) {
      return date.toDate().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return new Date(date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title={t('מהנעשה בבית המדרש')}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען חדשות...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title={t('מהנעשה בבית המדרש')}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>עדכונים וחדשות מבית המדרש</Text>

        {articles.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="newspaper-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
            <Text style={styles.emptyText}>אין חדשות זמינות כרגע</Text>
            <Text style={styles.emptySubtext}>החדשות יתווספו בקרוב</Text>
          </View>
        ) : (
          articles.map((article, idx) => (
            <Pressable
              key={article.id}
              style={[styles.articleCard, idx === 0 && styles.articleCardFirst]}
              onPress={() => navigation.navigate('DailyInsight')}
              accessibilityRole="button"
              accessibilityLabel={`כתבה ${article.title}`}
            >
              <ImageBackground
                source={article.imageUrl ? { uri: article.imageUrl } : require('../../assets/photos/cards/yeshiva.png')}
                style={styles.articleCover}
                imageStyle={styles.articleCoverRadius}
              >
                <LinearGradient colors={[ 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.1)' ]} style={StyleSheet.absoluteFill} />
                <View style={styles.articleTopRow}>
                  <View style={styles.datePill}>
                    <Ionicons name="calendar-outline" size={14} color={PRIMARY_BLUE} />
                    <Text style={styles.dateText}>{formatDate(article.date)}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleShare(article)}
                    style={styles.shareIconBtn}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={`שיתוף ${article.title}`}
                  >
                    <Ionicons name="share-social-outline" size={18} color={PRIMARY_BLUE} />
                  </Pressable>
                </View>
                <View style={styles.articleBottom}>
                  <Text style={styles.articleTitle}>{article.title}</Text>
                  <Text style={styles.articleSummary} numberOfLines={2}>{article.summary || article.content}</Text>
                </View>
              </ImageBackground>
            </Pressable>
          ))
        )}

        <View style={styles.footerCard}>
          <Ionicons name="create-outline" size={28} color={PRIMARY_BLUE} />
          <View style={styles.footerTextBlock}>
            <Text style={styles.footerTitle}>עדכונים נוספים</Text>
            <Text style={styles.footerDesc}>
              עדכונים נוספים מבית המדרש יופיעו כאן בקרוב.
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
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: PRIMARY_BLUE,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_500Medium',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Poppins_400Regular',
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
    backgroundColor: 'rgba(30,58,138,0.2)',
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
    backgroundColor: 'rgba(30,58,138,0.1)',
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
