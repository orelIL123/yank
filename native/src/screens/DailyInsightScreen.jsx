import React, { useState, useEffect, useRef, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Share, ActivityIndicator, RefreshControl, Dimensions, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import db from '../services/database'

// Color system inspired by the other app
const PRIMARY_RED = '#DC2626'
const PRIMARY_GOLD = '#FFD700'
const DEEP_BLUE = '#0b1b3a'
const PRIMARY_BLUE = PRIMARY_RED
const BG = '#f9fafb'
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

// ============ 3D ANIMATED COMPONENTS (INSPIRED) ============

const FloatingParticle = ({ delay, x, size, duration }) => {
  const animY = useRef(new Animated.Value(SCREEN_HEIGHT + 50)).current
  const animOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animate = () => {
      animY.setValue(SCREEN_HEIGHT + 50)
      animOpacity.setValue(0)
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(animY, { toValue: -50, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(animOpacity, { toValue: 0.6, duration: duration * 0.2, useNativeDriver: true }),
            Animated.timing(animOpacity, { toValue: 0.6, duration: duration * 0.6, useNativeDriver: true }),
            Animated.timing(animOpacity, { toValue: 0, duration: duration * 0.2, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => animate())
    }
    animate()
  }, [animOpacity, animY, delay, duration])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: PRIMARY_GOLD,
        left: x,
        transform: [{ translateY: animY }],
        opacity: animOpacity,
      }}
    />
  )
}

const FloatingParticles = React.memo(() => {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        id: i,
        size: Math.random() * 6 + 3,
        x: Math.random() * SCREEN_WIDTH,
        delay: Math.random() * 3000,
        duration: 4000 + Math.random() * 2000,
      })),
    []
  )

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map(p => (
        <FloatingParticle key={p.id} {...p} />
      ))}
    </View>
  )
})

const GlowingRing = ({ size = 100, color = PRIMARY_RED }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current
  const opacityAnim = useRef(new Animated.Value(0.5)).current

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, { toValue: 0.15, duration: 1500, useNativeDriver: true }),
          Animated.timing(opacityAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start()
  }, [opacityAnim, pulseAnim])

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale: pulseAnim }],
        opacity: opacityAnim,
      }}
    />
  )
}

const Card3D = ({ children, style, delay = 0, index = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current
  const scaleValue = useRef(new Animated.Value(0.9)).current
  const floatValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(animatedValue, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(scaleValue, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      ]),
    ]).start()

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatValue, { toValue: 1, duration: 2600 + index * 200, useNativeDriver: true }),
        Animated.timing(floatValue, { toValue: 0, duration: 2600 + index * 200, useNativeDriver: true }),
      ])
    ).start()
  }, [animatedValue, delay, floatValue, index, scaleValue])

  const translateY = floatValue.interpolate({ inputRange: [0, 1], outputRange: [0, -6] })
  const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0, 1] })

  return (
    <Animated.View
      style={[
        style,
        {
          opacity,
          transform: [{ perspective: 1000 }, { scale: scaleValue }, { translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

export default function DailyInsightScreen({ navigation }) {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedInsight, setSelectedInsight] = useState(null)

  const headerAnim = useRef(new Animated.Value(0)).current
  const heroAnim = useRef(new Animated.Value(0)).current
  const cardAnim = useRef(new Animated.Value(0)).current

  const loadInsights = async () => {
    try {
      const insightsData = await db.getCollection('dailyInsights', {
        orderBy: { field: 'date', direction: 'desc' },
        limit: 10
      })
      setInsights(insightsData)
      if (insightsData.length > 0 && !selectedInsight) {
        setSelectedInsight(insightsData[0])
      }
    } catch (error) {
      console.error('Error loading insights:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadInsights()
    Animated.stagger(150, [
      Animated.spring(headerAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.spring(heroAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
      Animated.spring(cardAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
    ]).start()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadInsights()
  }

  const handleShare = useCallback(() => {
    if (selectedInsight) {
      Share.share({
        message: `${selectedInsight.title}\n\n${selectedInsight.content}\n\nמאת: ${selectedInsight.author}`
      }).catch(() => {})
    }
  }, [selectedInsight])

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[BG, '#f5f5f5']} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_BLUE} />
          <Text style={styles.loadingText}>טוען תובנות...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const todayInsight = selectedInsight || {
    title: 'אין תובנות זמינות',
    content: 'התובנות יתווספו בקרוב',
    author: 'הרב שלמה יהודה בארי',
    category: 'כללי',
    date: new Date().toISOString()
  }

  const formattedDate = new Date(todayInsight.date).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <SafeAreaView style={styles.container}>
      {/* Soft gradient background */}
      <LinearGradient
        colors={['#f8fafc', '#e5e7eb', '#e2e8f0']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating particles + glowing orbs (inspiration) */}
      <FloatingParticles />
      <View style={styles.orbContainer}>
        <View style={[styles.orb, { top: -40, right: -60 }]}>
          <GlowingRing size={140} color={PRIMARY_RED} />
        </View>
        <View style={[styles.orb, { bottom: 80, left: -40 }]}>
          <GlowingRing size={110} color={PRIMARY_GOLD} />
        </View>
      </View>

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Pressable
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="חזרה"
        >
          <LinearGradient
            colors={[PRIMARY_RED, '#ef4444']}
            style={styles.backBtnGradient}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </LinearGradient>
        </Pressable>
        <Text style={styles.headerTitle}>חידושים יומיים</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Small strip of past days (kept from original) */}
        {insights.length > 1 && (
          <View style={styles.insightsNav}>
            <View style={styles.insightsNavInner}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.insightsNavScrollContent}
              >
                {insights.map(insight => (
                  <Pressable
                    key={insight.id}
                    style={[
                      styles.insightTab,
                      selectedInsight?.id === insight.id && styles.insightTabActive,
                    ]}
                    onPress={() => setSelectedInsight(insight)}
                  >
                    <Text
                      style={[
                        styles.insightTabText,
                        selectedInsight?.id === insight.id &&
                          styles.insightTabTextActive,
                      ]}
                    >
                      {new Date(insight.date).toLocaleDateString('he-IL', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* HERO CARD – inspired by other app */}
        <Card3D style={styles.heroCard} delay={150} index={0}>
          <LinearGradient
            colors={[DEEP_BLUE, '#1e3a5f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroPattern}>
              {[...Array(6)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.patternDot,
                    {
                      left: `${18 + i * 12}%`,
                      top: `${10 + (i % 2) * 18}%`,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.heroHeaderRow}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.categoryChip}>
                  <Ionicons name="flame" size={14} color={PRIMARY_RED} />
                  <Text style={styles.categoryText}>{todayInsight.category}</Text>
                </View>
                <View style={styles.dateBadge}>
                  <Ionicons name="calendar-outline" size={14} color="#e5e7eb" />
                  <Text style={styles.dateText}>{formattedDate}</Text>
                </View>
              </View>
              {todayInsight.likes ? (
                <View style={styles.likesPill}>
                  <Ionicons name="heart" size={16} color="#fecaca" />
                  <Text style={styles.likesText}>{todayInsight.likes} אהבו</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.heroTitle} numberOfLines={2}>
              {todayInsight.title}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={3}>
              {todayInsight.content}
            </Text>

            <View style={styles.readTimeRow}>
              <View style={styles.readTimeIndicator}>
                <View style={styles.readTimeFill} />
              </View>
              <Text style={styles.readTimeText}>כ-2 דקות קריאה</Text>
            </View>
          </LinearGradient>
        </Card3D>

        {/* MAIN CONTENT CARD – detailed text + author */}
        <Card3D style={styles.card} delay={300} index={1}>
          <View style={styles.body}>
            {todayInsight.content.split('\n\n').map((para, idx) => (
              <Text key={idx} style={styles.paragraph}>
                {para}
              </Text>
            ))}
          </View>

          <View style={styles.separator} />

          <View style={styles.authorRow}>
            <View style={styles.avatar}>
              <LinearGradient
                colors={[PRIMARY_RED, '#ef4444']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>י״ב</Text>
              </LinearGradient>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{todayInsight.author}</Text>
              <Text style={styles.authorTitle}>תובנות יומיות מאת הרב</Text>
            </View>
            <Pressable
              style={styles.shareBtn}
              onPress={handleShare}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={[PRIMARY_RED, '#ef4444']}
                style={styles.shareBtnGradient}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color="#fff"
                />
                <Text style={styles.shareText}>שיתוף</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Card3D>

        <Card3D style={styles.nextReminder} delay={450} index={2}>
          <Text style={styles.reminderText}>
            💫 התובנה הבאה תעלה בעזרת ה׳ מחר בשעה 08:00
          </Text>
          <Text style={styles.reminderSub}>
            מומלץ להפעיל התראות באפליקציה כדי לקבל עדכון בזמן אמת
          </Text>
        </Card3D>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  orb: {
    position: 'absolute',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
  },
  backBtnGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: PRIMARY_RED,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 4,
    gap: 18,
  },
  // hero
  heroCard: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: DEEP_BLUE,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroGradient: {
    padding: 20,
    gap: 12,
    overflow: 'hidden',
  },
  heroPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  categoryText: {
    color: '#fee2e2',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#e5e7eb',
  },
  likesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(248,250,252,0.18)',
  },
  likesText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#fee2e2',
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#fef2f2',
    textAlign: 'right',
    lineHeight: 30,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(226,232,240,0.9)',
    textAlign: 'right',
    lineHeight: 22,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  readTimeIndicator: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(248,250,252,0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  readTimeFill: {
    width: '60%',
    height: '100%',
    backgroundColor: PRIMARY_GOLD,
    borderRadius: 2,
  },
  readTimeText: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#e5e7eb',
  },
  // main card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  body: {
    gap: 14,
  },
  paragraph: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'right',
    fontFamily: 'Poppins_400Regular',
  },
  separator: {
    marginTop: 22,
    marginBottom: 14,
    height: 1,
    backgroundColor: 'rgba(15,23,42,0.06)',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  avatarGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  authorInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  authorName: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  authorTitle: {
    marginTop: 2,
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  shareBtn: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shareText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  nextReminder: {
    marginTop: 6,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(248,250,252,0.85)',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  reminderText: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
  },
  reminderSub: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: PRIMARY_RED,
    fontFamily: 'Poppins_500Medium',
  },
  insightsNav: {
    marginBottom: 6,
    marginTop: 4,
  },
  insightsNavInner: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(15,23,42,0.04)',
  },
  insightsNavScrollContent: {
    paddingHorizontal: 2,
  },
  insightTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(220,38,38,0.08)',
  },
  insightTabActive: {
    backgroundColor: PRIMARY_RED,
  },
  insightTabText: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: PRIMARY_RED,
  },
  insightTabTextActive: {
    color: '#fff',
  },
})
