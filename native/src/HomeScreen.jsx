import React, { useMemo, useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, FlatList, Pressable, Animated, Platform, Dimensions, Image, ImageBackground, ScrollView, Share, Alert, Easing, Linking, ActivityIndicator, Modal, TextInput } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Grayscale } from 'react-native-color-matrix-image-filters'
import { Audio } from 'expo-av'
import MenuDrawer from './components/MenuDrawer'
import AppHeader from './components/AppHeader'
import { auth } from './config/firebase'
import db from './services/database'
import cache from './utils/cache'

const PRIMARY_BLUE = '#1e3a8a'
const BG = '#FFFFFF'
const DEEP_BLUE = '#0b1b3a'
const BLACK = '#000000'

// Default cards fallback
const DEFAULT_CARDS = [
  { key: 'books', title: 'ספרים', desc: 'ספרי תורה וחידושים', icon: 'book-outline', image: require('../assets/photos/cards/books.jpg'), gradient: ['#667eea', '#764ba2'], size: 'large' },
  { key: 'prayers', title: 'תפילות הינוקא', desc: 'תפילות מיוחדות וסגולות', icon: 'heart-outline', image: require('../assets/photos/cards/prayer.png'), gradient: ['#f093fb', '#f5576c'], size: 'large' },
  { key: 'newsletters', title: 'עלונים', desc: 'עלונים להורדה וצפייה', icon: 'document-text-outline', image: require('../assets/photos/cards/hinuka.png'), gradient: ['#4facfe', '#00f2fe'], size: 'small' },
  { key: 'dailyLearning', title: 'לימוד יומי', desc: 'תורה וחיזוק יומיים', icon: 'book-outline', image: require('../assets/photos/cards/hinuka1.jpg'), gradient: ['#43e97b', '#38f9d7'], size: 'small' },
  { key: 'yeshiva', title: 'מהנעשה בבית המדרש', desc: 'עדכונים וחדשות', icon: 'school-outline', image: require('../assets/photos/cards/yeshiva.png'), gradient: ['#30cfd0', '#330867'], size: 'small' },
  { key: 'tzadikim', title: 'ספר תולדות אדם', desc: 'אלפי תמונות ומידע', icon: 'people-outline', image: require('../assets/photos/cards/hinuka1.jpg'), gradient: ['#a8edea', '#fed6e3'], size: 'large' },
  { key: 'learningLibrary', title: 'ספריית לימוד', desc: 'כל השיעורים והסרטונים', icon: 'library-outline', image: require('../assets/photos/cards/hinuka.png'), gradient: ['#667eea', '#764ba2'], size: 'large' },
]

// Carousel image order
const IMAGES = [
  require('../assets/photos/cards/books.jpg'),
  require('../assets/photos/cards/hinuka.png'),
  require('../assets/photos/cards/hinuka1.jpg'),
  require('../assets/photos/cards/yeshiva.png'),
]

function useFadeIn(delay = 0) {
  const anim = useMemo(() => new Animated.Value(0), [])
  React.useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 600, delay, useNativeDriver: true }).start()
  }, [anim, delay])
  return anim
}


function Card({ item, index, scrollX, SNAP, CARD_WIDTH, CARD_HEIGHT, OVERLAP, onPress }) {
  const fade = useFadeIn(index * 80)
  const pressAnim = React.useRef(new Animated.Value(0)).current

  const onPressIn = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 10 }).start()
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 10 }).start()

  const inputRange = [(index - 1) * SNAP, index * SNAP, (index + 1) * SNAP]
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
        <Animated.View style={[styles.card, animatedStyle]} pointerEvents="box-none">
          {(() => {
            // Determine image source: priority: imageUrl > image (require/built-in) > fallback
            let imageSource = null;
            if (item.imageUrl) {
              // Use Firestore imageUrl if available
              imageSource = { uri: item.imageUrl };
            } else if (item.image) {
              // Use built-in require() image
              imageSource = item.image;
            } else if (item.builtInImage) {
              // Fallback to built-in image from defaultCard
              imageSource = item.builtInImage;
            } else {
              // Last resort: use IMAGES array
              imageSource = IMAGES[index % IMAGES.length];
            }
            
            return imageSource ? (
              <ImageBackground
                source={imageSource}
                resizeMode="cover"
                style={StyleSheet.absoluteFill}
                imageStyle={imageStyle}
                pointerEvents="none"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: item.gradient?.[0] || PRIMARY_BLUE }]} pointerEvents="none" />
            );
          })()}
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.0)']}
            locations={[0, 0.45]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Animated.View>
      </Pressable>
    </View>
  )
}

export default function HomeScreen({ navigation, userRole }) {
  const isAdmin = userRole === 'admin'
  const { width } = Dimensions.get('window')
  const SPACING = 12
  const CARD_WIDTH = Math.min(width * 0.68, 340)
  const CARD_HEIGHT = Math.round(CARD_WIDTH * (16 / 9))
  const OVERLAP = 64
  const SNAP = CARD_WIDTH - OVERLAP
  const sideInset = (width - CARD_WIDTH) / 2

  const scrollX = React.useRef(new Animated.Value(0)).current
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
  const [quote, setQuote] = useState('ציטוט יומי - הרב הינוקא')
  const [quoteAuthor, setQuoteAuthor] = useState('הרב הינוקא')
  const [quoteLoading, setQuoteLoading] = useState(true)
  const [showQuoteEditModal, setShowQuoteEditModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState('')
  const [editingAuthor, setEditingAuthor] = useState('')
  const [savingQuote, setSavingQuote] = useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [menuVisible, setMenuVisible] = React.useState(false)
  const [songs, setSongs] = useState([])
  const [songsLoading, setSongsLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [cardsLoading, setCardsLoading] = useState(true)
  const [sound, setSound] = useState(null)
  const [playingSongId, setPlayingSongId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [pidyonList, setPidyonList] = useState([])
  const [pidyonLoading, setPidyonLoading] = useState(true)
  const pidyonScrollRef = React.useRef(null)
  const pidyonScrollInterval = React.useRef(null)
  const pidyonScrollPosition = React.useRef(0)

  const onShareQuote = React.useCallback(() => {
    Share.share({ message: `"${quote}" - ${quoteAuthor}` }).catch(() => { })
  }, [quote, quoteAuthor])

  // Load daily quote
  useEffect(() => {
    const loadQuote = async () => {
      try {
        const config = await db.getAppConfig()
        if (config) {
          setQuote(config.daily_quote || 'ציטוט יומי - הרב הינוקא')
          setQuoteAuthor(config.quote_author || 'הרב הינוקא')
        }
      } catch (error) {
        console.error('Error loading quote:', error)
        // Keep default quote on error
      } finally {
        setQuoteLoading(false)
      }
    }
    loadQuote()
  }, [])

  const handleEditQuote = () => {
    setEditingQuote(quote)
    setEditingAuthor(quoteAuthor)
    setShowQuoteEditModal(true)
  }

  const handleSaveQuote = async () => {
    if (!editingQuote.trim()) {
      Alert.alert('שגיאה', 'יש להזין ציטוט')
      return
    }

    try {
      setSavingQuote(true)
      await db.updateAppConfig({
        daily_quote: editingQuote.trim(),
        quote_author: editingAuthor.trim() || 'הרב הינוקא'
      })
      setQuote(editingQuote.trim())
      setQuoteAuthor(editingAuthor.trim() || 'הרב הינוקא')
      setShowQuoteEditModal(false)
      Alert.alert('הצלחה', 'הציטוט עודכן בהצלחה')
      // Clear cache to force reload
      cache.delete('homeCards')
      cache.delete('homeSongs')
    } catch (error) {
      console.error('Error saving quote:', error)
      Alert.alert('שגיאה', 'לא ניתן לשמור את הציטוט')
    } finally {
      setSavingQuote(false)
    }
  }

  // PERFORMANCE FIX: Load all home screen data in parallel with caching
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        // Check cache first (30 min TTL)
        const cachedCards = cache.get('homeCards')
        const cachedSongs = cache.get('homeSongs')

        if (cachedCards && cachedSongs) {
          console.log('Using cached home data')
          setCards(cachedCards)
          setSongs(cachedSongs)
          setCardsLoading(false)
          setSongsLoading(false)
          return
        }

        // Run all queries in parallel with Promise.all
        const [cardsData, songsData] = await Promise.all([
          db.getCollection('homeCards', {
            where: [['isActive', '==', true]],
            orderBy: { field: 'order', direction: 'asc' }
          }),
          db.getCollection('music', {
            orderBy: { field: 'createdAt', direction: 'desc' },
            limit: 3
          })
        ])

        // Process cards
        let processedCards
        if (!cardsData || cardsData.length === 0) {
          console.log('No cards found in database, using defaults')
          processedCards = DEFAULT_CARDS
        } else {
          processedCards = cardsData.map(data => {
            const defaultCard = DEFAULT_CARDS.find(c => c.key === data.key)
            return {
              ...data,
              gradient: defaultCard?.gradient || ['#667eea', '#764ba2'],
              size: defaultCard?.size || 'small',
              image: data.imageUrl ? { uri: data.imageUrl } : (defaultCard?.image || null),
              builtInImage: defaultCard?.image || null
            }
          })
          console.log('Loaded cards from database:', processedCards.length)
        }

        // Update state
        setCards(processedCards)
        setSongs(songsData)

        // Cache the data (30 minutes TTL)
        cache.set('homeCards', processedCards, 30 * 60 * 1000)
        cache.set('homeSongs', songsData, 30 * 60 * 1000)

      } catch (error) {
        console.error('Error loading home data:', error)
        setCards(DEFAULT_CARDS)
      } finally {
        setCardsLoading(false)
        setSongsLoading(false)
      }
    }

    // Set audio mode for playback
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        })
      } catch (error) {
        console.error('Error setting audio mode:', error)
      }
    }

    // Load data and setup audio in parallel
    Promise.all([loadHomeData(), setupAudio()])
  }, [])

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(console.error)
      }
    }
  }, [sound])

  // Update playback status
  useEffect(() => {
    if (sound) {
      sound.setOnPlaybackStatusUpdate((status) => {
        setIsPlaying(status.isLoaded && status.isPlaying)
        if (status.didJustFinish) {
          setPlayingSongId(null)
          setIsPlaying(false)
        }
      })
    }
  }, [sound])

  const handlePlaySong = async (song) => {
    try {
      // If it's a YouTube video, navigate to Music screen
      if (song.youtubeId) {
        navigation?.navigate('Music')
        return
      }

      // Stop current audio if playing
      if (sound) {
        await sound.unloadAsync()
        setSound(null)
      }

      // If same song is playing, pause/resume it
      if (playingSongId === song.id && sound) {
        if (isPlaying) {
          await sound.pauseAsync()
        } else {
          await sound.playAsync()
        }
        return
      }

      // Check if song has audioUrl
      if (!song.audioUrl || !song.audioUrl.trim()) {
        Alert.alert(
          'קובץ השמע אינו זמין', 
          'ניגון זה זמין רק במסך הניגונים המלא',
          [
            { text: 'ביטול', style: 'cancel' },
            { text: 'פתח מסך ניגונים', onPress: () => navigation?.navigate('Music') }
          ]
        )
        return
      }

      // Validate URL
      if (!song.audioUrl.startsWith('http://') && !song.audioUrl.startsWith('https://')) {
        Alert.alert('שגיאה', 'קישור לא תקין לניגון זה')
        return
      }

      // Load and play new song
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { 
          shouldPlay: true,
          isLooping: false,
          volume: 1.0,
        }
      )

      // Set up playback status listener
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setIsPlaying(status.isPlaying)
          if (status.didJustFinish) {
            setPlayingSongId(null)
            setIsPlaying(false)
          }
        }
      })

      setSound(newSound)
      setPlayingSongId(song.id)
      setIsPlaying(true)
    } catch (error) {
      console.error('Error playing song:', error)
      Alert.alert(
        'שגיאה', 
        'לא ניתן לנגן את הניגון. נסה לפתוח את מסך הניגונים המלא',
        [
          { text: 'ביטול', style: 'cancel' },
          { text: 'פתח מסך ניגונים', onPress: () => navigation?.navigate('Music') }
        ]
      )
    }
  }

  // Load Pidyon Nefesh list for scrolling display
  useEffect(() => {
    const loadPidyonList = async () => {
      try {
        const pidyonData = await db.getCollection('pidyonNefesh', {
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit: 50 // Limit for performance
        })
        setPidyonList(pidyonData || [])
      } catch (error) {
        console.error('Error loading pidyon list:', error)
      } finally {
        setPidyonLoading(false)
      }
    }
    loadPidyonList()
  }, [])

  // Auto-scroll pidyon names in infinite loop
  useEffect(() => {
    if (pidyonList.length === 0 || pidyonLoading || !pidyonScrollRef.current) return

    // Clear any existing interval
    if (pidyonScrollInterval.current) {
      clearInterval(pidyonScrollInterval.current)
    }

    // Calculate card width (card + gap)
    const cardWidth = 140 + 12 // minWidth + gap

    const startAutoScroll = () => {
      pidyonScrollInterval.current = setInterval(() => {
        if (pidyonScrollRef.current) {
          pidyonScrollPosition.current += 1
          const maxScroll = pidyonList.length * cardWidth
          
          // Reset to 0 when reaching the end (seamless loop)
          if (pidyonScrollPosition.current >= maxScroll) {
            pidyonScrollPosition.current = 0
          }
          
          pidyonScrollRef.current.scrollTo({
            x: pidyonScrollPosition.current,
            animated: true,
          })
        }
      }, 50) // Update every 50ms for smooth scrolling
    }

    // Wait a bit before starting scroll
    const timeout = setTimeout(startAutoScroll, 1000)
    
    return () => {
      clearTimeout(timeout)
      if (pidyonScrollInterval.current) {
        clearInterval(pidyonScrollInterval.current)
      }
    }
  }, [pidyonList, pidyonLoading])

  // Load notifications and count unread
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // PERFORMANCE FIX: Limit to 30 most recent notifications only
        const notificationsData = await db.getCollection('notifications', {
          where: [['isActive', '==', true]],
          orderBy: { field: 'createdAt', direction: 'desc' },
          limit: 30
        })

        const userId = auth.currentUser?.uid

        if (!userId) {
          setUnreadCount(0)
          return
        }

        const unreadNotifications = notificationsData.filter(notification => {
          return !notification.readBy || !notification.readBy.includes(userId)
        })

        setUnreadCount(unreadNotifications.length)
      } catch (error) {
        console.error('Error loading notifications:', error)
      }
    }

    loadNotifications()
    // PERFORMANCE FIX: Removed 30-second polling - use manual refresh instead
    // Polling every 30 seconds is expensive and unnecessary
    // Notifications will refresh when user returns to home screen
  }, [])

  const handleCardPress = React.useCallback((key) => {
    if (key === 'dailyLearning') {
      navigation?.navigate('DailyLearning')
      return
    }
    if (key === 'books') {
      navigation?.navigate('Books')
      return
    }
    if (key === 'prayers') {
      navigation?.navigate('Prayers')
      return
    }
    if (key === 'newsletters') {
      navigation?.navigate('Newsletters')
      return
    }
    if (key === 'yeshiva') {
      navigation?.navigate('MiBeitRabeinu')
      return
    }
    if (key === 'tzadikim') {
      navigation?.navigate('Tzadikim')
      return
    }
    if (key === 'shortLessons') {
      navigation?.navigate('LearningLibrary')
      return
    }
    if (key === 'learningLibrary') {
      navigation?.navigate('LearningLibrary')
      return
    }
    Alert.alert('בקרוב', 'המסך הזה עדיין בפיתוח')
  }, [navigation])

  const handleNotificationPress = React.useCallback(() => {
    navigation?.navigate('Notifications')
  }, [navigation])

  const openSocialLink = React.useCallback((url) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('שגיאה', 'לא ניתן לפתוח את הקישור')
    })
  }, [])

  return (
    <View style={styles.screen}>
      <AppHeader
        title="הינוקא"
        subtitle="הודו לה׳ כי טוב"
        showBackButton={false}
        rightIcon="menu"
        onRightIconPress={() => setMenuVisible(true)}
        leftIcon="notifications-outline"
        onLeftIconPress={handleNotificationPress}
        badge={unreadCount}
      />

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={navigation}
      />

      <View style={styles.main}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.FlatList
            data={cardsLoading ? DEFAULT_CARDS : cards}
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

          {/* Quote */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              {isAdmin && (
                <Pressable onPress={handleEditQuote} style={styles.editBtn} accessibilityRole="button">
                  <Ionicons name="create-outline" size={18} color={PRIMARY_BLUE} />
                </Pressable>
              )}
              <Text style={styles.sectionTitle}>בלייר עליון</Text>
            </View>
            {quoteLoading ? (
              <View style={styles.quoteCard}>
                <ActivityIndicator size="small" color={PRIMARY_BLUE} />
              </View>
            ) : (
              <View style={styles.quoteCard}>
                <Text style={styles.quoteText}>"{quote}"</Text>
                {quoteAuthor && quoteAuthor !== 'הרב הינוקא' && (
                  <Text style={styles.quoteAuthor}>— {quoteAuthor}</Text>
                )}
                <View style={styles.quoteFooter}>
                  <Pressable onPress={onShareQuote} style={styles.shareBtn} accessibilityRole="button">
                    <Ionicons name="share-social-outline" size={16} color="#ffffff" />
                    <Text style={styles.shareBtnText}>שיתוף</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Niggunim / Music */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Pressable
                onPress={() => navigation?.navigate('Music')}
                accessibilityRole="button"
              >
                <Text style={styles.sectionLinkText}>עוד →</Text>
              </Pressable>
              <Text style={styles.sectionTitle}>ניגונים</Text>
            </View>
            {songsLoading ? (
              <View style={styles.songsLoadingContainer}>
                <ActivityIndicator size="small" color={PRIMARY_BLUE} />
              </View>
            ) : songs.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.podcastRow}>
                {songs.map((song) => (
                  <View
                    key={song.id}
                    style={[
                      styles.podcastCard,
                      playingSongId === song.id && styles.podcastCardPlaying
                    ]}
                  >
                    <Pressable
                      style={styles.podcastCardContent}
                      onPress={() => navigation?.navigate('Music')}
                      accessibilityRole="button"
                    >
                      {song.imageUrl ? (
                        <View style={styles.songImageWrapper}>
                          <Image
                            source={{ uri: song.imageUrl }}
                            style={styles.songPreviewImage}
                            resizeMode="cover"
                          />
                          {playingSongId === song.id && isPlaying && (
                            <View style={styles.playingOverlay}>
                              <Ionicons name="musical-notes" size={16} color="#fff" />
                            </View>
                          )}
                        </View>
                      ) : (
                        <View style={styles.songIconWrapper}>
                          <Ionicons 
                            name={playingSongId === song.id && isPlaying ? "musical-notes" : "musical-notes-outline"} 
                            size={34} 
                            color={playingSongId === song.id ? PRIMARY_BLUE : PRIMARY_BLUE} 
                          />
                        </View>
                      )}
                      <Text style={[
                        styles.podcastTitle,
                        playingSongId === song.id && styles.podcastTitlePlaying
                      ]} numberOfLines={1}>{song.title}</Text>
                      <Text style={styles.podcastDesc} numberOfLines={1}>{song.description || 'ניגון'}</Text>
                    </Pressable>
                    {song.audioUrl && song.audioUrl.trim() ? (
                      <Pressable
                        style={[
                          styles.playButton,
                          playingSongId === song.id && isPlaying && styles.playButtonActive
                        ]}
                        onPress={() => handlePlaySong(song)}
                        accessibilityRole="button"
                        accessibilityLabel={playingSongId === song.id && isPlaying ? "עצור" : "נגן"}
                      >
                        <Ionicons 
                          name={playingSongId === song.id && isPlaying ? "pause" : "play"} 
                          size={20} 
                          color="#fff" 
                        />
                      </Pressable>
                    ) : song.youtubeId ? (
                      <Pressable
                        style={[styles.playButton, styles.playButtonYoutube]}
                        onPress={() => navigation?.navigate('Music')}
                        accessibilityRole="button"
                        accessibilityLabel="פתח במסך ניגונים"
                      >
                        <Ionicons name="logo-youtube" size={20} color="#fff" />
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[styles.playButton, styles.playButtonDisabled]}
                        onPress={() => navigation?.navigate('Music')}
                        accessibilityRole="button"
                        accessibilityLabel="פתח במסך ניגונים"
                      >
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                      </Pressable>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.songsEmptyContainer}>
                <Ionicons name="musical-notes-outline" size={32} color={PRIMARY_BLUE} style={{ opacity: 0.3 }} />
                <Text style={styles.songsEmptyText}>אין ניגונים זמינים כרגע</Text>
              </View>
            )}
          </View>


          {/* Pidyon Nefesh Section with Auto-scrolling */}
          {pidyonList.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Pressable
                  onPress={() => navigation?.navigate('PidyonNefesh')}
                  accessibilityRole="button"
                >
                  <Text style={styles.sectionLinkText}>עוד →</Text>
                </Pressable>
                <Text style={styles.sectionTitle}>פדיון נפש</Text>
              </View>
              {pidyonLoading ? (
                <View style={styles.pidyonLoadingContainer}>
                  <ActivityIndicator size="small" color={PRIMARY_BLUE} />
                </View>
              ) : (
                <View style={styles.pidyonContainer}>
                  <ScrollView
                    ref={pidyonScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEventThrottle={16}
                    style={styles.pidyonScrollView}
                    contentContainerStyle={styles.pidyonScrollContent}
                    onScroll={(e) => {
                      // Update position for seamless loop
                      pidyonScrollPosition.current = e.nativeEvent.contentOffset.x
                    }}
                    scrollEnabled={false} // Disable manual scrolling, only auto-scroll
                  >
                    {/* Render list multiple times for seamless infinite loop */}
                    {[...pidyonList, ...pidyonList, ...pidyonList].map((pidyon, idx) => (
                      <View key={`${pidyon.id}-${idx}`} style={styles.pidyonCardInline}>
                        <View style={styles.pidyonIconWrapper}>
                          <Ionicons name="heart" size={20} color={PRIMARY_BLUE} />
                        </View>
                        <View style={styles.pidyonTextInline}>
                          <Text style={styles.pidyonNameInline} numberOfLines={1}>
                            {pidyon.user_name || pidyon.name}
                          </Text>
                          {pidyon.motherName && (
                            <Text style={styles.pidyonMotherNameInline} numberOfLines={1}>
                              בן/בת {pidyon.motherName}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {/* Social Media Links */}
          <View style={styles.socialSection}>
            <Text style={styles.socialSectionTitle}>עקבו אחרינו</Text>
            <View style={styles.socialRow}>
              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.instagram.com/yanuka_rav_shlomoyehuda/')}
                accessibilityRole="button"
                accessibilityLabel="Instagram"
              >
                <Ionicons name="logo-instagram" size={28} color="#E4405F" />
                <Text style={styles.socialLabel}>Instagram</Text>
              </Pressable>

              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.tiktok.com/@the_yanuka_official')}
                accessibilityRole="button"
                accessibilityLabel="TikTok"
              >
                <Ionicons name="logo-tiktok" size={28} color="#000000" />
                <Text style={styles.socialLabel}>TikTok</Text>
              </Pressable>

              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.youtube.com/channel/UC2G7zKbsBNpoVYbwb-NS56w')}
                accessibilityRole="button"
                accessibilityLabel="YouTube"
              >
                <Ionicons name="logo-youtube" size={28} color="#FF0000" />
                <Text style={styles.socialLabel}>YouTube</Text>
              </Pressable>

              <Pressable
                style={styles.socialButton}
                onPress={() => openSocialLink('https://www.facebook.com/theYanuka/')}
                accessibilityRole="button"
                accessibilityLabel="Facebook"
              >
                <Ionicons name="logo-facebook" size={28} color="#1877F2" />
                <Text style={styles.socialLabel}>Facebook</Text>
              </Pressable>
            </View>
          </View>

          {/* קח חלק Button */}
          <View style={styles.takePartContainer}>
            <Pressable
              style={styles.takePartButton}
              onPress={() => Linking.openURL('https://hayanuka.com/contact/')}
              accessibilityRole="button"
              accessibilityLabel="קח חלק"
            >
              <LinearGradient
                colors={[PRIMARY_BLUE, '#1e40af']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.takePartGradient}
              >
                <Ionicons name="heart" size={20} color="#fff" />
                <Text style={styles.takePartText}>קח חלק</Text>
              </LinearGradient>
            </Pressable>
          </View>

        </ScrollView>
      </View>

      {/* Quote Edit Modal */}
      <Modal
        visible={showQuoteEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQuoteEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>עריכת ציטוט יומי</Text>
              <Pressable onPress={() => setShowQuoteEditModal(false)}>
                <Ionicons name="close" size={24} color={DEEP_BLUE} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>ציטוט *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingQuote}
                  onChangeText={setEditingQuote}
                  placeholder="הזן ציטוט..."
                  multiline
                  numberOfLines={4}
                  textAlign="right"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>מחבר (אופציונלי)</Text>
                <TextInput
                  style={styles.input}
                  value={editingAuthor}
                  onChangeText={setEditingAuthor}
                  placeholder="הרב הינוקא"
                  textAlign="right"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowQuoteEditModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>ביטול</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSave, savingQuote && styles.modalButtonDisabled]}
                onPress={handleSaveQuote}
                disabled={savingQuote}
              >
                {savingQuote ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonTextSave}>שמור</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('home'); triggerPulse(); navigation?.navigate('Home') }}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Animated.View style={[styles.pulseRing, pulseStyle]} />
            <Ionicons name="home-outline" size={22} color={activeTab === 'home' ? PRIMARY_BLUE : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'home' ? PRIMARY_BLUE : '#B3B3B3' }]}>בית</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('piano'); navigation?.navigate('Piano') }}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Ionicons name="musical-notes" size={22} color={activeTab === 'piano' ? PRIMARY_BLUE : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'piano' ? PRIMARY_BLUE : '#B3B3B3' }]}>פסנתר</Text>
        </Pressable>

        {/* CENTER - Music (Featured Button) */}
        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('music'); navigation?.navigate('Music') }}
          style={styles.centerNavButton}
        >
          <View style={styles.centerNavGlowOuter} />
          <LinearGradient
            colors={[PRIMARY_BLUE, '#1e40af', PRIMARY_BLUE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerNavGradient}
          >
            <View style={styles.centerNavGlow} />
            <Ionicons name="musical-notes" size={28} color="#fff" />
          </LinearGradient>
          <Text style={styles.centerNavLabel}>ניגונים</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('news'); navigation?.navigate('News') }}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Ionicons name="newspaper-outline" size={22} color={activeTab === 'news' ? PRIMARY_BLUE : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'news' ? PRIMARY_BLUE : '#B3B3B3' }]}>חדשות</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => { setActiveTab('profile'); navigation?.navigate('Profile') }}
          style={styles.navItemPressable}
        >
          <View style={styles.iconBox}>
            <Ionicons name="person-outline" size={22} color={activeTab === 'profile' ? PRIMARY_BLUE : '#B3B3B3'} />
          </View>
          <Text style={[styles.navLabel, { color: activeTab === 'profile' ? PRIMARY_BLUE : '#B3B3B3' }]}>פרופיל</Text>
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
    color: PRIMARY_BLUE,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'CinzelDecorative_700Bold',
    letterSpacing: 3,
    textShadowColor: 'rgba(30,58,138,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 14,
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.5,
  },
  main: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 72,
    marginTop: -4,
  },
  scrollContent: {
    paddingBottom: 92,
    gap: 20,
  },
  grid: {
  },
  gridRow: {
  },
  section: {
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: DEEP_BLUE,
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
  sectionLinkText: {
    color: PRIMARY_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 8,
  },
  snapshotBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    borderRadius: 16,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quoteText: {
    color: DEEP_BLUE,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    fontFamily: 'Poppins_500Medium',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  quoteFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quoteAuthor: {
    color: '#6b7280',
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'right',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: PRIMARY_BLUE,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
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
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    padding: 14,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  podcastCardPlaying: {
    borderColor: PRIMARY_BLUE,
    borderWidth: 2,
    backgroundColor: '#f0f9ff',
  },
  podcastCardContent: {
    alignItems: 'flex-end',
    flex: 1,
    width: '100%',
  },
  songImageWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(30,58,138,0.1)',
    position: 'relative',
  },
  songPreviewImage: {
    width: '100%',
    height: '100%',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(30,58,138,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  songIconWrapper: {
    marginBottom: 8,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  playButtonActive: {
    backgroundColor: '#dc2626',
  },
  playButtonYoutube: {
    backgroundColor: '#FF0000',
  },
  playButtonDisabled: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  podcastTitle: {
    color: DEEP_BLUE,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 6,
  },
  podcastTitlePlaying: {
    color: PRIMARY_BLUE,
  },
  podcastDesc: {
    color: '#6b7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  songsLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songsEmptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  songsEmptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
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
    backgroundColor: 'rgba(30,58,138,0.12)',
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
    backgroundColor: PRIMARY_BLUE,
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
    color: PRIMARY_BLUE,
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
    backgroundColor: 'rgba(30,58,138,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  recoCtaText: {
    color: PRIMARY_BLUE,
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  cardItemContainer: {
    alignItems: 'flex-end',
  },
  cardLabelContainer: {
    alignItems: 'flex-end',
    paddingRight: 32,
    paddingLeft: 8,
    marginBottom: 10,
  },
  cardLabelTitle: {
    color: PRIMARY_BLUE,
    fontSize: 20,
    fontFamily: 'Heebo_700Bold',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  cardLabelDesc: {
    color: '#4b5563',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
    marginTop: 2,
  },
  cardPressable: {
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
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
    backgroundColor: 'rgba(30,58,138,0.12)',
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
  takePartContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    marginTop: 8,
  },
  takePartButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  takePartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  takePartText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.5,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.select({ ios: 20, android: 12, default: 12 }),
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  pulseRing: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PRIMARY_BLUE,
  },
  navLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  socialSection: {
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 4,
  },
  socialSectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 16,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
    paddingHorizontal: 4,
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
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    textAlign: 'center',
    marginTop: 4,
  },
  centerNavButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  centerNavGlowOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: PRIMARY_BLUE,
    opacity: 0.2,
    top: -28,
    left: -28,
  },
  centerNavGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY_BLUE,
    shadowOpacity: 0.7,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 15,
    borderWidth: 4,
    borderColor: BG,
  },
  centerNavGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: PRIMARY_BLUE,
    opacity: 0.3,
  },
  centerNavLabel: {
    marginTop: 6,
    fontSize: 12,
    color: PRIMARY_BLUE,
    fontFamily: 'Poppins_600SemiBold',
  },
  pidyonRow: {
    gap: 10,
    paddingHorizontal: 2,
  },
  pidyonCard: {
    width: 150,
    minHeight: 120,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    padding: 14,
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pidyonCardHeader: {
    width: '100%',
    marginBottom: 10,
  },
  pidyonIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pidyonName: {
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
    marginBottom: 2,
  },
  pidyonMotherName: {
    fontSize: 13,
    fontFamily: 'Poppins_500Medium',
    color: '#6b7280',
    textAlign: 'right',
    marginBottom: 6,
  },
  pidyonDescription: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#9ca3af',
    textAlign: 'right',
    lineHeight: 16,
  },
  pidyonLoadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pidyonContainer: {
    overflow: 'hidden',
    borderRadius: 14,
    height: 60,
  },
  pidyonScrollView: {
    flexGrow: 0,
  },
  pidyonScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 16,
    paddingLeft: 16,
  },
  pidyonCardInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(11,27,58,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 10,
  },
  pidyonIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(30,58,138,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pidyonTextInline: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 2,
  },
  pidyonNameInline: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    textAlign: 'right',
  },
  pidyonMotherNameInline: {
    fontSize: 11,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
    textAlign: 'right',
  },
  pidyonEmptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pidyonEmptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#6b7280',
  },
  // Edit button
  editBtn: {
    padding: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: BG,
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(11,27,58,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  modalBody: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(11,27,58,0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: DEEP_BLUE,
    backgroundColor: '#f9fafb',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(11,27,58,0.1)',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonSave: {
    backgroundColor: PRIMARY_BLUE,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: DEEP_BLUE,
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
})


