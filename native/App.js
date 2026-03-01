import React, { useEffect, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, Image, Animated, Alert, Modal, Pressable, Text, StyleSheet, Linking, Platform } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Notifications from 'expo-notifications'
import * as Updates from 'expo-updates'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { arrayUnion, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { auth, db as firestoreDb } from './src/config/firebase'
import { getRememberMe } from './src/utils/preferences'
import supaDb from './src/services/database'
import HomeScreen from './src/HomeScreen'
import DailyInsightScreen from './src/screens/DailyInsightScreen'
import CoursesScreen from './src/screens/CoursesScreen'
import NewsScreen from './src/screens/NewsScreen'
import NewsArticleScreen from './src/screens/NewsArticleScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import LiveAlertsScreen from './src/screens/LiveAlertsScreen'
import AdminScreen from './src/screens/AdminScreen'
import PrayersScreen from './src/screens/PrayersScreen'
import PrayerDetailScreen from './src/screens/PrayerDetailScreen'
import AddPrayerScreen from './src/screens/AddPrayerScreen'
import PrayerCommitmentScreen from './src/screens/PrayerCommitmentScreen'
import PdfViewerScreen from './src/screens/PdfViewerScreen'
import ContactRabbiScreen from './src/screens/ContactRabbiScreen'
import LoginScreen from './src/screens/LoginScreen'
// RegisterScreen removed - registration disabled temporarily
import AboutScreen from './src/screens/AboutScreen'
import MusicScreen from './src/screens/MusicScreen'
import BooksScreen from './src/screens/BooksScreen'
import NewslettersScreen from './src/screens/NewslettersScreen'
import AddNewsletterScreen from './src/screens/AddNewsletterScreen'
import AddNewsScreen from './src/screens/AddNewsScreen'
import ChangePasswordScreen from './src/screens/ChangePasswordScreen'
import TzadikimScreen from './src/screens/TzadikimScreen'
import TzadikDetailScreen from './src/screens/TzadikDetailScreen'
import DailyLearningScreen from './src/screens/DailyLearningScreen'
import PianoScreen from './src/screens/PianoScreen'
import ShortLessonsScreen from './src/screens/ShortLessonsScreen'
import LongLessonsScreen from './src/screens/LongLessonsScreen'
import LearningLibraryScreen from './src/screens/LearningLibraryScreen'
import HoduLaHashemScreen from './src/screens/HoduLaHashemScreen'
import BaalShemTovStoriesScreen from './src/screens/BaalShemTovStoriesScreen'
import NotificationsScreen from './src/screens/NotificationsScreen'
import PidyonNefeshScreen from './src/screens/PidyonNefeshScreen'
import MiBeitRabeinuScreen from './src/screens/MiBeitRabeinuScreen'
import DailySummaryScreen from './src/screens/DailySummaryScreen'
import ParshiotHaNasiimScreen from './src/screens/ParshiotHaNasiimScreen'
import ManagePermissionsScreen from './src/screens/ManagePermissionsScreen'
import PersonalDetailsScreen from './src/screens/PersonalDetailsScreen'
import HelpSupportScreen from './src/screens/HelpSupportScreen'
import ToolsScreen from './src/screens/ToolsScreen'
import SeferHaMidotScreen from './src/screens/SeferHaMidotScreen'
import SiddurScreen from './src/screens/SiddurScreen'
import TehillimScreen from './src/screens/TehillimScreen'
import OrchotTzadikimScreen from './src/screens/OrchotTzadikimScreen'
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins'
import { CinzelDecorative_400Regular, CinzelDecorative_700Bold } from '@expo-google-fonts/cinzel-decorative'
import { Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold } from '@expo-google-fonts/heebo'
import { registerForPushNotificationsAsync } from './src/utils/notifications'
import analytics from './src/services/analytics'
import { LinearGradient } from 'expo-linear-gradient'

const Stack = createNativeStackNavigator()
const RATE_PROMPT_STATE_KEY = 'rate_prompt_state_v1'
const MIN_LAUNCHES_BEFORE_FIRST_PROMPT = 4
const REMIND_AFTER_DAYS = 14
const APPLE_APP_ID = ''
const ANDROID_PACKAGE = 'com.hayanuka.app'

export default function App() {
  const [showSplash, setShowSplash] = useState(false)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [userPermissions, setUserPermissions] = useState([])
  const [authLoading, setAuthLoading] = useState(true)
  const [showRatePrompt, setShowRatePrompt] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const fadeAnim = useRef(new Animated.Value(1)).current
  const navigationRef = useRef(null)

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    CinzelDecorative_400Regular,
    CinzelDecorative_700Bold,
    Heebo_400Regular,
    Heebo_500Medium,
    Heebo_600SemiBold,
    Heebo_700Bold,
  })

  // Auth state listener - this will fire immediately with current user if session is persisted
  useEffect(() => {
    let mounted = true
    let isInitialCheck = true

    console.log('Setting up auth state listener...')

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!mounted) return

      try {
        if (isInitialCheck) {
          console.log('Initial auth state check:', currentUser ? `User found (${currentUser.email}) - session restored` : 'No user - showing login')
          
          // Firebase Auth automatically persists the session
          // The user will stay logged in until they explicitly log out
          if (currentUser) {
            console.log('User session restored automatically - Firebase Auth persistence active')
          } else {
            console.log('No user session found - user needs to log in')
          }
          
          isInitialCheck = false
        } else {
          console.log('Auth state changed:', currentUser ? 'User logged in' : 'User logged out')
        }
        
        setUser(currentUser)

        if (currentUser) {
          // Start analytics session
          analytics.startSession(currentUser.uid)

          // Load cached role immediately (works offline)
          try {
            const cached = await AsyncStorage.getItem(`user_role_cache_${currentUser.uid}`)
            if (cached && mounted) {
              const parsed = JSON.parse(cached)
              if (parsed?.role) setUserRole(parsed.role)
              if (Array.isArray(parsed?.permissions)) setUserPermissions(parsed.permissions)
            }
          } catch {}

          // Fetch role/permissions from Supabase app_config (Firebase is auth-only now)
          try {
            // Prefer Firebase Auth custom claims if configured (works without Firestore)
            try {
              const tokenResult = await currentUser.getIdTokenResult()
              const claims = tokenResult?.claims || {}
              const claimRole = claims.role
              const claimAdmin = claims.admin === true
              if (claimAdmin || claimRole === 'admin') {
                const role = 'admin'
                if (mounted) setUserRole(role)
                if (mounted) setUserPermissions([])
                try {
                  await AsyncStorage.setItem(
                    `user_role_cache_${currentUser.uid}`,
                    JSON.stringify({ role, permissions: [] })
                  )
                } catch {}
                // Skip app_config lookup if claims already say admin
                throw new Error('__ROLE_SET_FROM_CLAIMS__')
              }
            } catch (e) {
              // Ignore claim fetch errors; fall back to app_config
              if (e?.message === '__ROLE_SET_FROM_CLAIMS__') {
                // role already set above
                // eslint-disable-next-line no-throw-literal
                throw '__STOP__'
              }
            }

            const cfg = await supaDb.getAppConfig()
            const adminUids = cfg?.admin_uids || []
            const adminEmails = cfg?.admin_emails || []

            console.log('🔍 Admin check:', {
              userEmail: currentUser.email,
              userUid: currentUser.uid,
              adminEmails,
              adminUids
            })

            const isAdmin =
              (Array.isArray(adminUids) && adminUids.includes(currentUser.uid)) ||
              (Array.isArray(adminEmails) && currentUser.email && adminEmails.includes(currentUser.email))

            const role = isAdmin ? 'admin' : 'user'
            let permissions = []

            // Load granular permissions from Supabase users table (primary source).
            // Fallback to Firestore users/{uid} for backward compatibility.
            if (!isAdmin) {
              try {
                let userData = null

                try {
                  userData = await supaDb.getDocument('users', currentUser.uid)
                } catch (_) {
                  userData = null
                }

                if (!userData && currentUser.email) {
                  const byEmail = await supaDb.getCollection('users', {
                    where: [['email', '==', currentUser.email]],
                    limit: 1,
                  })
                  userData = byEmail?.[0] || null
                }

                if (Array.isArray(userData?.permissions)) {
                  permissions = userData.permissions
                }
              } catch (permError) {
                console.log('Could not load user permissions from Supabase:', permError?.message || permError)
                try {
                  const userDoc = await getDoc(doc(firestoreDb, 'users', currentUser.uid))
                  const userData = userDoc.exists() ? userDoc.data() : null
                  if (Array.isArray(userData?.permissions)) {
                    permissions = userData.permissions
                  }
                } catch (legacyError) {
                  console.log('Could not load user permissions from Firestore:', legacyError?.message || legacyError)
                }
              }
            }

            console.log('✅ Setting userRole:', role, 'isAdmin:', isAdmin)
            if (mounted) setUserRole(role)
            if (mounted) setUserPermissions(permissions)

            try {
              await AsyncStorage.setItem(
                `user_role_cache_${currentUser.uid}`,
                JSON.stringify({ role, permissions })
              )
            } catch {}
          } catch (error) {
            if (error !== '__STOP__') {
              console.error('Error fetching app_config for role:', error)
            }
            // keep cached role if available
          }

          // Navigate to Home only if we're not already in the main app
          if (navigationRef.current && mounted) {
            try {
              const currentRoute = navigationRef.current.getCurrentRoute()
              // Only navigate if we're on Login/Register or nothing
              if (!currentRoute || currentRoute.name === 'Login' || currentRoute.name === 'Register') {
                console.log('Navigating to Home - initial login/session')
                navigationRef.current.reset({
                  index: 0,
                  routes: [{ name: 'Home' }],
                })
              }
            } catch (navError) {
              console.error('Navigation error:', navError)
            }
          }
        } else {
          if (mounted) {
            setUserRole(null)
            setUserPermissions([])
          }
          // Only navigate to Login if this is not the initial check (user explicitly logged out)
          // OR if we're not already on an auth screen
          if (navigationRef.current && mounted) {
            try {
              const currentRoute = navigationRef.current.getCurrentRoute()
              // Only navigate to Login if we're not already there and not on Register
              if (currentRoute?.name !== 'Login' && currentRoute?.name !== 'Register') {
                console.log('No active session - navigating to Login')
                navigationRef.current.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                })
              }
            } catch (navError) {
              console.error('Navigation error:', navError)
            }
          }
        }

        if (mounted) {
          setAuthLoading(false)
        }
      } catch (error) {
        console.error('Error in auth state listener:', error)
        if (mounted) {
          setAuthLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Show for 2s, then fade out over 1s
    const t = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setShowSplash(false)
      })
    }, 2000)
    return () => clearTimeout(t)
  }, [fadeAnim])

  // Check for EAS Updates on app start
  useEffect(() => {
    async function checkForUpdates() {
      // Skip update check in development
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log('Skipping update check in development mode')
        return
      }

      // Wait for app to fully initialize before checking for updates
      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        // Check if Updates is available and enabled
        if (!Updates.isEnabled) {
          console.log('Updates are not enabled')
          return
        }

        console.log('Checking for updates...')
        console.log('Update channel:', Updates.channel)
        console.log('Runtime version:', Updates.runtimeVersion)
        
        const update = await Updates.checkForUpdateAsync()
        console.log('Update check result:', update.isAvailable ? 'Update available' : 'No update available')
        
        if (update.isAvailable) {
          console.log('Fetching update...')
          await Updates.fetchUpdateAsync()
          console.log('Update fetched, reloading app...')
          // Delay reload to ensure app is fully ready
          // This prevents crashes on startup
          setTimeout(async () => {
            try {
              await Updates.reloadAsync()
            } catch (reloadError) {
              console.log('Error reloading app:', reloadError)
              // Don't crash if reload fails - app will continue normally
            }
          }, 1000)
        } else {
          console.log('No update available')
        }
      } catch (error) {
        console.log('Error checking for updates:', error)
        console.log('Error details:', error.message, error.code)
        // Don't crash if update check fails - app will continue normally
      }
    }

    checkForUpdates()
  }, [])

  // Track app install on first launch
  useEffect(() => {
    analytics.trackAppInstall()
  }, [])

  // Occasionally prompt users to rate the app
  useEffect(() => {
    let mounted = true
    let timer = null

    const maybeShowRatePrompt = async () => {
      try {
        const raw = await AsyncStorage.getItem(RATE_PROMPT_STATE_KEY)
        const current = raw ? JSON.parse(raw) : {}
        const launchCount = Number(current.launchCount || 0) + 1
        const now = Date.now()
        const remindAfterMs = REMIND_AFTER_DAYS * 24 * 60 * 60 * 1000
        const alreadyRated = Boolean(current.ratedAt)
        const recentlyPrompted = current.lastPromptAt && now - Number(current.lastPromptAt) < remindAfterMs

        const next = {
          ...current,
          launchCount,
        }
        await AsyncStorage.setItem(RATE_PROMPT_STATE_KEY, JSON.stringify(next))

        if (alreadyRated || launchCount < MIN_LAUNCHES_BEFORE_FIRST_PROMPT || recentlyPrompted) {
          return
        }

        timer = setTimeout(() => {
          if (mounted) {
            setSelectedRating(0)
            setShowRatePrompt(true)
          }
        }, 3500)
      } catch (error) {
        console.log('Rate prompt check failed:', error)
      }
    }

    if (!authLoading) {
      maybeShowRatePrompt()
    }

    return () => {
      mounted = false
      if (timer) clearTimeout(timer)
    }
  }, [authLoading])

  const markRatePromptEvent = async (patch = {}) => {
    try {
      const raw = await AsyncStorage.getItem(RATE_PROMPT_STATE_KEY)
      const current = raw ? JSON.parse(raw) : {}
      const next = {
        ...current,
        ...patch,
        lastPromptAt: Date.now(),
      }
      await AsyncStorage.setItem(RATE_PROMPT_STATE_KEY, JSON.stringify(next))
    } catch (error) {
      console.log('Failed updating rate prompt state:', error)
    }
  }

  const openStoreRating = async () => {
    try {
      if (Platform.OS === 'android') {
        const marketUrl = `market://details?id=${ANDROID_PACKAGE}`
        const webUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`
        const canOpenMarket = await Linking.canOpenURL(marketUrl)
        await Linking.openURL(canOpenMarket ? marketUrl : webUrl)
        return
      }

      if (Platform.OS === 'ios' && APPLE_APP_ID) {
        await Linking.openURL(`itms-apps://itunes.apple.com/app/viewContentsUserReviews/id${APPLE_APP_ID}?action=write-review`)
        return
      }

      await Linking.openURL('https://apps.apple.com/us/search?term=%D7%94%D7%99%D7%A0%D7%95%D7%A7%D7%90')
    } catch (error) {
      console.log('Failed opening store link:', error)
      Alert.alert('שגיאה', 'לא הצלחנו לפתוח את החנות כרגע')
    }
  }

  const handleRateDismiss = async () => {
    setShowRatePrompt(false)
    setSelectedRating(0)
    await markRatePromptEvent({ dismissedAt: Date.now() })
  }

  const handleRatePress = async (rating) => {
    setSelectedRating(rating)
    setShowRatePrompt(false)
    await markRatePromptEvent({
      ratedAt: Date.now(),
      rating,
    })
    await openStoreRating()
  }

  // Push notifications setup
  useEffect(() => {
    // Register for push notifications when user is logged in
    if (user) {
      const requestWithExplanation = async () => {
        try {
          // Check current permission status first
          const { status: existingStatus } = await Notifications.getPermissionsAsync()
          if (existingStatus !== 'granted') {
            // Show explanation dialog before asking for permission
            await new Promise((resolve) => {
              Alert.alert(
                '🔔 התראות מהרב הינוקא',
                'מומלץ לאשר את ההתראות על מנת להתעדכן באירועים ושיעורים של מו"ר הרב הינוקא שליט"א',
                [
                  { text: 'לא עכשיו', style: 'cancel', onPress: resolve },
                  { text: 'אשר התראות', onPress: resolve },
                ],
                { cancelable: false }
              )
            })
          }
          const token = await registerForPushNotificationsAsync()
          if (token) {
            console.log('📱 Push Token received:', token)
            // Save to Firestore - primary push token store
            try {
              await setDoc(
                doc(firestoreDb, 'users', user.uid),
                {
                  email: user.email || null,
                  expoPushTokens: arrayUnion(token),
                  lastPushTokenAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                },
                { merge: true }
              )
              console.log('✅ Push token saved to Firestore users collection')
            } catch (saveError) {
              console.error('❌ Failed to save push token to Firestore:', saveError)
            }
          } else {
            console.log('⚠️ No push token received (permissions denied or simulator)')
          }
        } catch (error) {
          console.error('❌ Error registering for push notifications:', error)
        }
      }
      requestWithExplanation()
    }
  }, [user])

  // Set up notification listeners
  useEffect(() => {
    // Handle notification received while app is in foreground
    const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received (foreground):', notification)
      // You can show a custom in-app notification here if needed
    })

    // Handle notification tapped/opened
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response)
      const data = response.notification.request.content.data
      
      // Navigate based on notification data
      if (data?.screen && navigationRef.current) {
        try {
          navigationRef.current.navigate(data.screen, data)
        } catch (error) {
          console.error('Error navigating from notification:', error)
        }
      }
    })

    return () => {
      foregroundSubscription.remove()
      responseSubscription.remove()
    }
  }, [])

  // Navigate based on auth state after loading completes - DISABLED TO FIX NAVIGATION LOOP
  // This was causing the app to reset navigation back to Home after every screen change
  /*
  useEffect(() => {
    if (!authLoading && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute()
      console.log('Auth transition check. Current route:', currentRoute?.name, 'User:', !!user)

      if (user) {
        // User is logged in - navigate to Home ONLY if we are still on Login/Register
        if (!currentRoute || currentRoute.name === 'Login' || currentRoute.name === 'Register') {
          console.log('*** NAVIGATION RESET TO HOME ***')
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        }
      } else {
        // User is logged out - navigate to Login if not already on auth screen
        if (currentRoute?.name !== 'Login' && currentRoute?.name !== 'Register') {
          console.log('*** NAVIGATION RESET TO LOGIN ***')
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      }
    }
  }, [user, authLoading])
  */

  if (!fontsLoaded || authLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator color="#1e3a8a" />
        <StatusBar style="dark" />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <NavigationContainer 
        ref={navigationRef}
        onStateChange={(state) => {
          const currentRoute = navigationRef.current?.getCurrentRoute()
          console.log('🔴 NAVIGATION STATE CHANGED - Current screen:', currentRoute?.name)
          if (currentRoute?.name) {
            analytics.trackScreenView(currentRoute.name, user?.uid || null)
          }
        }}
      >
        <StatusBar style="dark" />
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={user ? "Home" : "Login"}
          // Fallback to Login if user is undefined/null
          defaultNavigationOptions={{
            headerShown: false
          }}
        >
          {/* Auth screens - always available */}
          <Stack.Screen name="Login" component={LoginScreen} />
          {/* Register screen removed - registration disabled temporarily */}

          {/* Main app screens - accessible to all users (guests and authenticated) */}
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} user={user} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="DailyInsight" component={DailyInsightScreen} />
          <Stack.Screen name="DailyLearning">
            {(props) => <DailyLearningScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="Courses">
            {(props) => <CoursesScreen {...props} user={user} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="News">
            {(props) => <NewsScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="NewsArticle">
            {(props) => <NewsArticleScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="AddNews">
            {(props) => <AddNewsScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="Profile">
            {(props) => <ProfileScreen {...props} user={user} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="LiveAlerts" component={LiveAlertsScreen} />
          <Stack.Screen name="Prayers">
            {(props) => <PrayersScreen {...props} user={user} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="Siddur" component={SiddurScreen} />
          <Stack.Screen name="Tehillim">
            {(props) => <TehillimScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="OrchotTzadikim">
            {(props) => <OrchotTzadikimScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="PrayerDetail" component={PrayerDetailScreen} />
          <Stack.Screen name="PrayerCommitment" component={PrayerCommitmentScreen} />
          <Stack.Screen name="AddPrayer" component={AddPrayerScreen} />
          <Stack.Screen name="EditPrayer" component={AddPrayerScreen} />
          <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
          <Stack.Screen name="ContactRabbi" component={ContactRabbiScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Music">
            {(props) => <MusicScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="Books">
            {(props) => <BooksScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="Newsletters">
            {(props) => <NewslettersScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="AddNewsletter" component={AddNewsletterScreen} />
          <Stack.Screen name="EditNewsletter" component={AddNewsletterScreen} />
          <Stack.Screen name="Tzadikim">
            {(props) => <TzadikimScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="TzadikDetail" component={TzadikDetailScreen} />
          <Stack.Screen name="Piano" component={PianoScreen} />
          <Stack.Screen name="LearningLibrary">
            {(props) => <LearningLibraryScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="ShortLessons">
            {(props) => <ShortLessonsScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="LongLessons">
            {(props) => <LongLessonsScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="HoduLaHashem">
            {(props) => <HoduLaHashemScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="BaalShemTovStories">
            {(props) => <BaalShemTovStoriesScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="Notifications">
            {(props) => <NotificationsScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="PersonalDetails">
            {(props) => <PersonalDetailsScreen {...props} user={user} />}
          </Stack.Screen>
          <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
          <Stack.Screen name="Tools" component={ToolsScreen} />
          <Stack.Screen name="PidyonNefesh">
            {(props) => <PidyonNefeshScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="MiBeitRabeinu">
            {(props) => <MiBeitRabeinuScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="DailySummary">
            {(props) => <DailySummaryScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
          <Stack.Screen name="ParshiotHaNasiim" component={ParshiotHaNasiimScreen} />
          <Stack.Screen name="SeferHaMidot" component={SeferHaMidotScreen} />
          <Stack.Screen name="ManagePermissions" component={ManagePermissionsScreen} />

          {/* Admin screen - always registered; screen itself will guard access */}
          <Stack.Screen name="Admin">
            {(props) => <AdminScreen {...props} userRole={userRole} userPermissions={userPermissions} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
      {showSplash && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: fadeAnim,
              backgroundColor: '#000',
              zIndex: -1 // Move to background
            }
          ]}
        >
          <Image
            source={require('./assets/splash-icon.png')}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        </Animated.View>
      )}
      <Modal
        visible={showRatePrompt}
        transparent
        animationType="fade"
        onRequestClose={handleRateDismiss}
      >
        <View style={styles.rateOverlay}>
          <LinearGradient
            colors={['#15305B', '#102447', '#0B1B35']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rateCard}
          >
            <Text style={styles.rateTitle}>דרגו אותנו</Text>
            <Text style={styles.rateSubtitle}>נשמח לדעת מה חשבתם על האפליקציה</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => handleRatePress(star)}
                  style={styles.starButton}
                >
                  <Text style={[styles.starText, selectedRating >= star && styles.starTextSelected]}>★</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.rateHint}>לחיצה על כוכב תפתח את עמוד הדירוג בחנות</Text>
            <Pressable onPress={handleRateDismiss} style={styles.laterButton}>
              <Text style={styles.laterButtonText}>אולי בפעם אחרת</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  rateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.52)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  rateCard: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  rateTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontFamily: 'Heebo_700Bold',
    textAlign: 'center',
  },
  rateSubtitle: {
    marginTop: 10,
    color: '#D8E6FF',
    fontSize: 16,
    fontFamily: 'Heebo_500Medium',
    textAlign: 'center',
    lineHeight: 24,
  },
  starsRow: {
    marginTop: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  starText: {
    fontSize: 42,
    color: '#B3C8EA',
  },
  starTextSelected: {
    color: '#FFD166',
  },
  rateHint: {
    marginTop: 8,
    color: '#A9C2E8',
    fontSize: 13,
    fontFamily: 'Heebo_400Regular',
    textAlign: 'center',
  },
  laterButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  laterButtonText: {
    color: '#E6EFFF',
    fontSize: 15,
    fontFamily: 'Heebo_600SemiBold',
  },
})
