import React, { useEffect, useRef, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, Image, Animated } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Notifications from 'expo-notifications'
import * as Updates from 'expo-updates'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './src/config/firebase'
import { getRememberMe } from './src/utils/preferences'
import HomeScreen from './src/HomeScreen'
import DailyInsightScreen from './src/screens/DailyInsightScreen'
import CoursesScreen from './src/screens/CoursesScreen'
import NewsScreen from './src/screens/NewsScreen'
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
import RegisterScreen from './src/screens/RegisterScreen'
import AboutScreen from './src/screens/AboutScreen'
import MusicScreen from './src/screens/MusicScreen'
import BooksScreen from './src/screens/BooksScreen'
import NewslettersScreen from './src/screens/NewslettersScreen'
import ChangePasswordScreen from './src/screens/ChangePasswordScreen'
import TzadikimScreen from './src/screens/TzadikimScreen'
import TzadikDetailScreen from './src/screens/TzadikDetailScreen'
import DailyLearningScreen from './src/screens/DailyLearningScreen'
import PianoScreen from './src/screens/PianoScreen'
import ShortLessonsScreen from './src/screens/ShortLessonsScreen'
import LongLessonsScreen from './src/screens/LongLessonsScreen'
import LearningLibraryScreen from './src/screens/LearningLibraryScreen'
import NotificationsScreen from './src/screens/NotificationsScreen'
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins'
import { CinzelDecorative_400Regular, CinzelDecorative_700Bold } from '@expo-google-fonts/cinzel-decorative'
import { Heebo_400Regular, Heebo_500Medium, Heebo_600SemiBold, Heebo_700Bold } from '@expo-google-fonts/heebo'
// import { registerForPushNotificationsAsync } from './src/utils/notifications'

const Stack = createNativeStackNavigator()

export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
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
          
          // Check "Remember Me" preference on initial load
          if (currentUser) {
            const rememberMe = await getRememberMe()
            console.log('Remember Me preference:', rememberMe)
            
            if (!rememberMe) {
              // User doesn't want to be remembered, sign them out
              console.log('Remember Me is false - signing out user')
              try {
                await signOut(auth)
                // The signOut will trigger onAuthStateChanged again with null user
                // We'll handle that in the next callback, so we can return here
                if (mounted) {
                  setAuthLoading(false)
                }
                return
              } catch (signOutError) {
                console.error('Error signing out:', signOutError)
                // If sign out fails, continue normally
              }
            } else {
              // Remember Me is true - user should stay logged in
              // Firebase Auth already persisted the session, so we just continue
              console.log('Remember Me is true - user will stay logged in automatically')
            }
          } else {
            // No user found - check if Remember Me was previously enabled
            // If it was, we should try to restore the session (but Firebase handles this automatically)
            const rememberMe = await getRememberMe()
            console.log('No user found, Remember Me preference:', rememberMe)
            // Firebase Auth will automatically restore the session if it exists
            // If no session exists, user needs to log in again
          }
          
          isInitialCheck = false
        } else {
          console.log('Auth state changed:', currentUser ? 'User logged in' : 'User logged out')
        }
        
        setUser(currentUser)

        if (currentUser) {
          // Fetch user role from Firestore
          try {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid))
            if (userDoc.exists() && mounted) {
              const role = userDoc.data().role
              console.log('User role:', role)
              setUserRole(role)
            } else {
              console.log('User document not found in Firestore')
            }
          } catch (error) {
            console.error('Error fetching user role:', error)
            // Don't crash if role fetch fails
          }

          // Navigate to Home after successful login or session restoration
          if (navigationRef.current && mounted) {
            try {
              const currentRoute = navigationRef.current.getCurrentRoute()
              // Only navigate if we're not already on Home
              if (currentRoute?.name !== 'Home') {
                console.log('Navigating to Home - user session active')
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

  // Push notifications disabled - will be added later
  // useEffect(() => {
  //   registerForPushNotificationsAsync().then(token => {
  //     if (token) {
  //       console.log('Push Token:', token)
  //     }
  //   })
  //   ...
  // }, [])

  // Navigate based on auth state after loading completes
  useEffect(() => {
    if (!authLoading && navigationRef.current) {
      const currentRoute = navigationRef.current.getCurrentRoute()

      if (user) {
        // User is logged in - navigate to Home if not already there
        if (currentRoute?.name !== 'Home') {
          console.log('User logged in, navigating to Home')
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        }
      } else {
        // User is logged out - navigate to Login if not already on auth screen
        if (currentRoute?.name !== 'Login' && currentRoute?.name !== 'Register') {
          console.log('User logged out, navigating to Login')
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        }
      }
    }
  }, [user, authLoading])

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
      <NavigationContainer ref={navigationRef}>
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
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* Main app screens - accessible to all users (guests and authenticated) */}
          <Stack.Screen name="Home">
            {(props) => <HomeScreen {...props} user={user} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="DailyInsight" component={DailyInsightScreen} />
          <Stack.Screen name="DailyLearning">
            {(props) => <DailyLearningScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="Courses">
            {(props) => <CoursesScreen {...props} user={user} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="News">
            {(props) => <NewsScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="Profile">
            {(props) => <ProfileScreen {...props} user={user} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="LiveAlerts" component={LiveAlertsScreen} />
          <Stack.Screen name="Prayers">
            {(props) => <PrayersScreen {...props} user={user} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="PrayerDetail" component={PrayerDetailScreen} />
          <Stack.Screen name="PrayerCommitment" component={PrayerCommitmentScreen} />
          <Stack.Screen name="AddPrayer" component={AddPrayerScreen} />
          <Stack.Screen name="EditPrayer" component={AddPrayerScreen} />
          <Stack.Screen name="PdfViewer" component={PdfViewerScreen} />
          <Stack.Screen name="ContactRabbi" component={ContactRabbiScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Music" component={MusicScreen} />
          <Stack.Screen name="Books" component={BooksScreen} />
          <Stack.Screen name="Newsletters" component={NewslettersScreen} />
          <Stack.Screen name="Tzadikim">
            {(props) => <TzadikimScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="TzadikDetail" component={TzadikDetailScreen} />
          <Stack.Screen name="Piano" component={PianoScreen} />
          <Stack.Screen name="LearningLibrary">
            {(props) => <LearningLibraryScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="ShortLessons">
            {(props) => <ShortLessonsScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="LongLessons">
            {(props) => <LongLessonsScreen {...props} userRole={userRole} />}
          </Stack.Screen>
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />

          {/* Admin screen - only for admins */}
          {userRole === 'admin' && (
            <Stack.Screen name="Admin" component={AdminScreen} />
          )}
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
              backgroundColor: '#000'
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
    </View>
  )
}
