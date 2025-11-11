import React, { useMemo } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, Animated, Platform, Dimensions, Image, ImageBackground, ScrollView, Share, Alert, Easing, Linking } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Grayscale } from 'react-native-color-matrix-image-filters'

const GOLD = '#E63946'
const BG = '#FFFFFF'
const DEEP_BLUE = '#2D6A4F'

const CARDS = [
  { key: 'daily-insight', title: 'ערך יומי', desc: 'תובנה מעוררת השראה ליום שלך', icon: 'bulb-outline', image: require('../assets/photos/photo4.png') },
  { key: 'community', title: 'קהילה', desc: 'עדכוני קבוצה ושיתופים מהקהילה', icon: 'chatbubbles-outline', image: require('../assets/photos/photo3.png') },
  { key: 'stock-picks', title: 'המלצות על מניות', desc: 'סיגנלים יומיים/שבועיים למסחר', icon: 'trending-up-outline', image: require('../assets/photos/photo2.jpeg'), locked: true, imageScale: 0.92 },
  { key: 'academy', title: 'לימודי מסחר', desc: 'קורסי וידאו ומסלולי למידה', icon: 'school-outline', image: require('../assets/photos/photo4.png') },
  { key: 'live-alerts', title: 'התראות חמות', desc: 'מרכז התראות ופוש בזמן אמת', icon: 'notifications-outline', image: require('../assets/photos/photo3.png'), imageScale: 0.97 },
]

// Carousel image order (image 3 promoted to first)
const IMAGES = [
  require('../assets/photos/photo3.png'), // 1st
  require('../assets/photos/photo1.jpg'),
  require('../assets/photos/photo2.jpeg'),
  require('../assets/photos/photo4.png'),
  require('../assets/photos/photo3.png'),
  require('../assets/photos/photo1.jpg'),
]

function useFadeIn(delay = 0) {
  const anim = useMemo(() => new Animated.Value(0), [])
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, delay, useNativeDriver: true }).start()
  }, [anim, delay])
  return anim
}

// Mocked market snapshot that updates periodically to feel "live"
const INITIAL_MARKET = [
  { key: 'TA35', label: 'ת\'א 35', value: 1890.25, change: 0.45 },
  { key: 'NASDAQ', label: 'Nasdaq', value: 14780.12, change: -0.32 },
  { key: 'BTC', label: 'Bitcoin', value: 68250, change: 1.25 },
]

function useMarketMock(initialItems = INITIAL_MARKET) {
  const [items, setItems] = React.useState(initialItems)
  React.useEffect(() => {
    const id = setInterval(() => {
      setItems(prev => prev.map(it => {
        const delta = (Math.random() - 0.5) * 0.8 // -0.4% to +0.4%
        const nextValue = it.key === 'BTC'
          ? Math.max(0, Math.round(it.value * (1 + delta / 100)))
          : Math.max(0, parseFloat((it.value * (1 + delta / 100)).toFixed(2)))
        const nextChange = parseFloat(delta.toFixed(2))
        return { ...it, value: nextValue, change: nextChange }
      }))
    }, 3500)
    return () => clearInterval(id)
  }, [])
  return items
}

function Card({ item, index, scrollX, SNAP, CARD_WIDTH, CARD_HEIGHT, OVERLAP, onPress }) {
  const fade = useFadeIn(index * 80)
  const pressAnim = React.useRef(new Animated.Value(0)).current

  const onPressIn = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 10 }).start()

  const inputRange = [ (index - 1) * SNAP, index * SNAP, (index + 1) * SNAP ]
  const animatedStyle = {
    opacity: fade,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    transform: [
      { translateY: scrollX.interpolate({ inputRange, outputRange: [12, -8, 12], extrapolate: 'clamp' }) },
      { scale: scrollX.interpolate({ inputRange, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp' }) },
      { perspective: 900 },
      { rotateY: scrollX.interpolate({ inputRange, outputRange: ['12deg', '0deg', '-12deg'], extrapolate: 'clamp' }) },
      { rotateZ: scrollX.interpolate({ inputRange, outputRange: ['2deg', '0deg', '-2deg'], extrapolate: 'clamp' }) },
      { scale: pressAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }) },
    ],
  }

  const imageStyle = [StyleSheet.absoluteFill, item?.imageScale ? { transform: [{ scale: item.imageScale }] } : null]

  return (
    <View style={[styles.cardItemContainer, { width: CARD_WIDTH, marginRight: -OVERLAP }]}>
      <View style={styles.cardLabelContainer}>
        <Text style={[styles.cardLabelTitle, { textAlign: 'right' }]}>{item.title}</Text>
        <Text style={[styles.cardLabelDesc, { textAlign: 'right' }]} numberOfLines={2}>{item.desc}</Text>
      </View>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => {
          if (item.locked) {
            Alert.alert('תוכן נעול', 'התוכן מיועד למשתמשים רשומים בלבד')
            return
          }
          onPress?.(item)
        }}
        style={styles.cardPressable}
        accessibilityRole="button"
        accessibilityLabel={`${item.title} - ${item.desc}`}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          <ImageBackground
            source={item.image || IMAGES[index % IMAGES.length]}
            resizeMode="cover"
            style={StyleSheet.absoluteFill}
            imageStyle={imageStyle}
          />
          <LinearGradient
            colors={[ 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.0)' ]}
            locations={[0, 0.45]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Pressable>
    </View>
  )
}

export default function HomeScreen({ navigation }) {
  const { width } = Dimensions.get('window')
  const SPACING = 12
  const CARD_WIDTH = Math.min(width * 0.76, 360)
  const CARD_HEIGHT = Math.round(CARD_WIDTH * (16/9))
  const OVERLAP = 56
  const SNAP = CARD_WIDTH - OVERLAP
  const sideInset = (width - CARD_WIDTH) / 2

  const scrollX = React.useRef(new Animated.Value(0)).current
  const market = useMarketMock()
  const [activeTab, setActiveTab] = React.useState('home')
  const pulse = React.useRef(new Animated.Value(0)).current

  const triggerPulse = React.useCallback(() => {
    pulse.setValue(0)
    Animated.timing(pulse, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [pulse])

  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
    transform: [
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.0] }) },
    ],
  }
  const [completedDays, setCompletedDays] = React.useState(8)
  const progress = Math.max(0, Math.min(1, completedDays / 14))
  const quote = 'הצלחות משמעותיות נבנות מצעדים קטנים ועקביים. התמדה היא הכוח.'
  const [unreadCount, setUnreadCount] = React.useState(3) // TODO: Get from backend

  const onShareQuote = React.useCallback(() => {
    Share.share({ message: `"${quote}" — טל פרטוק` }).catch(() => {})
  }, [quote])

  const handleCardPress = React.useCallback((key) => {
    if (key === 'daily-insight') {
      navigation?.navigate('DailyInsight')
      return
    }
    if (key === 'academy') {
      navigation?.navigate('Courses')
      return
    }
    if (key === 'live-alerts') {
      navigation?.navigate('LiveAlerts')
      return
    }
    Alert.alert('בקרוב', 'המסך הזה עדיין בפיתוח')
  }, [navigation])

  const handleNotificationPress = React.useCallback(() => {
    Alert.alert('בקרוב', 'מערכת התראות תתווסף בקרוב')
  }, [])

  const openSocialLink = React.useCallback((url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור')
    })
  }, [])

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          style={styles.headerMenu}
          hitSlop={12}
          onPress={() => navigation?.navigate('Admin')}
        >
          <Ionicons name="construct-outline" size={28} color={GOLD} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.headerBell}
          hitSlop={12}
          onPress={handleNotificationPress}
        >
          <Ionicons name="notifications-outline" size={31} color={GOLD} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
        <View style={styles.headerContent}>
          <Text style={styles.title}>NAOR BARUCH</Text>
          <Text style={styles.subtitle}>Trading • Mindset • Faith</Text>
        </View>
      </View>

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.FlatList
            data={CARDS}
            keyExtractor={(it) => it.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={SNAP}
            decelerationRate="fast"
            bounces={false}
            contentContainerStyle={{ paddingHorizontal: sideInset, paddingVertical: 4 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <Card
                item={item}
                index={index}
                scrollX={scrollX}
                SNAP={SNAP}
                CARD_WIDTH={CARD_WIDTH}
                CARD_HEIGHT={CARD_HEIGHT}
                OVERLAP={OVERLAP}
                onPress={() => handleCardPress(item.key)}
              />
            )}
          />

          {/* Market Snapshot */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>תצוגת שוק חיה</Text>
            </View>
            <View style={styles.snapshotBar}>
              {market.map(m => {
                const up = m.change >= 0
                return (
                  <View key={m.key} style={styles.snapshotItem}>
                    <Text style={styles.snapshotLabel}>{m.label}</Text>
                    <Text style={styles.snapshotValue}>{m.value}</Text>
                    <View style={styles.snapshotChangeRow}>
                      <Ionicons name={up ? 'caret-up' : 'caret-down'} size={14} color={up ? '#16a34a' : '#dc2626'} />
                      <Text style={[styles.snapshotChange, { color: up ? '#16a34a' : '#dc2626' }]}>{m.change}%</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Quote of the Week */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ציטוט השבוע</Text>
            </View>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>“{quote}”</Text>
              <View style={styles.quoteFooter}>
                <Text style={styles.quoteAuthor}>— טל פרטוק</Text>
                <Pressable onPress={onShareQuote} style={styles.shareBtn} accessibilityRole="button">
                  <Ionicons name="share-social-outline" size={16} color="#ffffff" />
                  <Text style={styles.shareBtnText}>שיתוף</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Podcasts / Meditations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>פינת פודקאסטים / מדיטציות</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.podcastRow}>
              {[1,2,3].map(i => (
                <Pressable
                  key={`pod-${i}`}
                  style={styles.podcastCard}
                  onPress={() => Alert.alert('בקרוב', 'נגן אודיו יתווסף כאן')}
                  accessibilityRole="button"
                >
                  <Ionicons name="play-circle" size={34} color={GOLD} />
                  <Text style={styles.podcastTitle}>פרק {i}</Text>
                  <Text style={styles.podcastDesc} numberOfLines={1}>Placeholder audio</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Digital Medal */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>מדליה דיגיטלית</Text>
            </View>
            <View style={styles.medalCard}>
              <View style={styles.medalIcon}> 
                <Ionicons name="medal-outline" size={28} color={GOLD} />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={styles.medalTitle}>14 יום של למידה רצופה</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{completedDays}/14 ימים</Text>
              </View>
            </View>
          </View>

          {/* Naor Recommends */}
          <View style={styles.section}>
            <Pressable style={styles.recoBanner} accessibilityRole="button">
              <LinearGradient colors={[ '#2D6A4F', '#40916C' ]} style={StyleSheet.absoluteFill} />
              <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
                <Text style={styles.recoTitle}>טל ממליץ לראות</Text>
                <Text style={styles.recoDesc} numberOfLines={2}>וידאו, מאמר או תובנה מומלצים במיוחד עבורך</Text>
                <View style={styles.recoCta}>
                  <Text style={styles.recoCtaText}>צפה עכשיו</Text>
                  <Ionicons name="arrow-forward-circle" size={18} color={GOLD} />
                </View>
              </View>
            </Pressable>
          </View>

          {/* Social Links */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>קישורים חברתיים</Text>
            </View>
            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.instagram.com/naor_baruch')}
                accessibilityRole="button"
                accessibilityLabel="Instagram"
              >
                <Ionicons name="logo-instagram" size={24} color={GOLD} />
                <Text style={styles.socialLabel}>Instagram</Text>
              </Pressable>
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink('https://t.me/naor_baruch')}
                accessibilityRole="button"
                accessibilityLabel="Telegram"
              >
                <Ionicons name="paper-plane-outline" size={24} color={GOLD} />
                <Text style={styles.socialLabel}>Telegram</Text>
              </Pressable>
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink('https://wa.me/972XXXXXXXXX')}
                accessibilityRole="button"
                accessibilityLabel="WhatsApp"
              >
                <Ionicons name="logo-whatsapp" size={24} color={GOLD} />
                <Text style={styles.socialLabel}>WhatsApp</Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </View>

      <View style={styles.bottomNav}>
        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('home'); triggerPulse(); navigation?.navigate('Home') }}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
            <Ionicons name="home-outline" size={22} color={activeTab === 'home' ? GOLD : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'home' ? GOLD : '#B3B3B3' }]}>בית</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('בקרוב', 'מסך הקהילה יישום לאחר חיבור לבקאנד')}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Ionicons name="chatbubbles-outline" size={22} color={activeTab === 'community' ? GOLD : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'community' ? GOLD : '#B3B3B3' }]}>קהילה</Text>
        </Pressable>

        {/* CENTER - Courses (Featured Button) */}
        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('courses'); navigation?.navigate('Courses') }}
          style={styles.centerNavButton}
        >
          <View style={styles.centerNavGlowOuter} />
          <LinearGradient
            colors={[GOLD, '#c49b2e', GOLD]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerNavGradient}
          >
            <View style={styles.centerNavGlow} />
            <Ionicons name="school" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.centerNavLabel}>קורסים</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('news'); navigation?.navigate('News') }}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Ionicons name="newspaper-outline" size={22} color={activeTab === 'news' ? GOLD : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'news' ? GOLD : '#B3B3B3' }]}>חדשות</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('profile'); navigation?.navigate('Profile') }}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Ionicons name="person-circle-outline" size={22} color={activeTab === 'profile' ? GOLD : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'profile' ? GOLD : '#B3B3B3' }]}>פרופיל</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingTop: Platform.select({ ios: 48, android: 34, default: 42 }),
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 6,
  },
  headerMenu: {
    position: 'absolute',
    left: 16,
    top: Platform.select({ ios: 54, android: 52, default: 48 }),
    zIndex: 10,
  },
  headerBell: {
    position: 'absolute',
    right: 16,
    top: Platform.select({ ios: 54, android: 52, default: 48 }),
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: BG,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
  },
  title: {
    color: GOLD,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'CinzelDecorative_700Bold',
    letterSpacing: 3,
  },
  subtitle: {
    marginTop: 6,
    color: '#B3B3B3',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  main: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 72,
    marginTop: -4,
  },
  scrollContent: {
    paddingBottom: 92,
    gap: 18,
  },
  grid: {
  },
  gridRow: {
  },
  section: {
    paddingHorizontal: 8,
  },
  sectionHeader: {
    alignItems: 'flex-end',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: DEEP_BLUE,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  snapshotBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(11,27,58,0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  snapshotItem: {
    alignItems: 'flex-end',
    minWidth: 96,
  },
  snapshotLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  snapshotValue: {
    color: DEEP_BLUE,
    fontSize: 15,
    marginTop: 2,
    fontFamily: 'Poppins_600SemiBold',
  },
  snapshotChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  snapshotChange: {
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },
  quoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  quoteText: {
    color: DEEP_BLUE,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
    fontFamily: 'Poppins_500Medium',
  },
  quoteFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteAuthor: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  shareBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  podcastRow: {
    gap: 10,
    paddingHorizontal: 2,
  },
  podcastCard: {
    width: 160,
    height: 110,
    borderRadius: 12,
    backgroundColor: 'rgba(11,27,58,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
    padding: 12,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  podcastTitle: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  podcastDesc: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  medalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  medalIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalTitle: {
    color: DEEP_BLUE,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(11,27,58,0.06)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GOLD,
  },
  progressText: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'right',
    fontFamily: 'Poppins_500Medium',
  },
  recoBanner: {
    height: 120,
    borderRadius: 14,
    overflow: 'hidden',
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
  },
  recoTitle: {
    color: GOLD,
    fontSize: 14,
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
  },
  recoDesc: {
    color: '#e5e7eb',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'right',
    fontFamily: 'Poppins_400Regular',
  },
  recoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  recoCtaText: {
    color: GOLD,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cardItemContainer: {
    alignItems: 'flex-end',
  },
  cardLabelContainer: {
    alignItems: 'flex-end',
    paddingRight: 28,
    marginBottom: 10,
  },
  cardLabelTitle: {
    color: GOLD,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 2,
  },
  cardLabelDesc: {
    color: '#2D6A4F',
    opacity: 0.9,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  cardPressable: {
    justifyContent: 'center',
  },
  card: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  lockIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
  },
  cardContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    padding: 16,
    paddingRight: 28,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#B3B3B3',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  navItemPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
  },
  navItemActive: {
    alignItems: 'center',
    gap: 4,
  },
  iconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD,
  },
  navLabel: {
    fontSize: 12,
    color: '#B3B3B3',
    fontFamily: 'Poppins_400Regular',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  socialButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,27,58,0.04)',
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.08)',
    gap: 8,
  },
  socialLabel: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
  },
  centerNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  centerNavGlowOuter: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GOLD,
    opacity: 0.15,
    top: -16,
    left: -16,
  },
  centerNavGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
    borderWidth: 4,
    borderColor: BG,
  },
  centerNavGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GOLD,
    opacity: 0.25,
  },
  centerNavLabel: {
    marginTop: 6,
    fontSize: 12,
    color: GOLD,
    fontFamily: 'Poppins_600SemiBold',
  },
})


