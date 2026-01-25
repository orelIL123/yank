import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Image, Pressable, Share, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

import AppHeader from '../components/AppHeader'
import db from '../services/database'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'

export default function NewsArticleScreen({ navigation, route, userRole }) {
  const articleId = route?.params?.articleId

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)

  const canManage = userRole === 'admin'

  const formatDate = (date) => {
    if (!date) return ''
    if (date.toDate) {
      return date.toDate().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    return new Date(date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const headerSubtitle = useMemo(() => {
    if (!article?.date) return undefined
    const d = formatDate(article.date)
    return d || undefined
  }, [article?.date])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        if (!articleId) {
          setArticle(null)
          return
        }
        const doc = await db.getDocument('news', articleId)
        if (mounted) setArticle(doc)
      } catch (e) {
        console.error('Error loading article:', e)
        Alert.alert('שגיאה', 'לא ניתן לטעון את הכתבה')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [articleId])

  const handleShare = async () => {
    if (!article) return
    const messageParts = [article.title]
    if (article.summary) messageParts.push(article.summary)
    if (!article.summary && article.content) messageParts.push(article.content)
    await Share.share({ message: messageParts.filter(Boolean).join('\n\n') }).catch(() => {})
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader
          title="כתבה"
          subtitle={undefined}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען כתבה...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
        <AppHeader title="כתבה" showBackButton={true} onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={64} color={PRIMARY_BLUE} style={{ opacity: 0.25 }} />
          <Text style={styles.emptyTitle}>הכתבה לא נמצאה</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[BG, '#f4f6f9']} style={StyleSheet.absoluteFill} />
      <AppHeader
        title="מהנעשה בבית המדרש"
        subtitle={headerSubtitle}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        rightIcon={canManage ? 'create-outline' : 'share-social-outline'}
        onRightIconPress={
          canManage ? () => navigation.navigate('AddNews', { article }) : handleShare
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {article.imageUrl ? (
          <Image source={{ uri: article.imageUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.title}>{article.title}</Text>
          {!!article.summary && <Text style={styles.summary}>{article.summary}</Text>}
          {!!article.content && <Text style={styles.body}>{article.content}</Text>}

          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBtn} onPress={handleShare} accessibilityRole="button">
              <Ionicons name="share-social-outline" size={18} color={PRIMARY_BLUE} />
              <Text style={styles.actionText}>שתף</Text>
            </Pressable>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    color: DEEP_BLUE,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    backgroundColor: '#e5e7eb',
  },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    color: DEEP_BLUE,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'right',
  },
  summary: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
    fontFamily: 'Poppins_500Medium',
    textAlign: 'right',
  },
  body: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 24,
    color: '#0f172a',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'right',
  },
  actionsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(30,58,138,0.12)',
  },
  actionText: {
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
})


