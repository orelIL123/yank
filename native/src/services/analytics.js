/**
 * Analytics Service - tracks user actions, screen views, and session data
 * Data is stored in Firestore for the admin dashboard
 */

import { db as firestoreDb } from '../config/firebase'
import {
  collection,
  addDoc,
  setDoc,
  doc,
  increment,
  serverTimestamp,
} from 'firebase/firestore'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Collections
const ANALYTICS_EVENTS = 'analytics_events'
const ANALYTICS_SESSIONS = 'analytics_sessions'
const ANALYTICS_STATS = 'analytics_stats'
const ANALYTICS_SCREEN_STATS = 'analytics_screen_stats'

// Session tracking
let currentSessionId = null
let sessionStartTime = null

/**
 * Generate a simple unique ID
 */
const generateId = () => `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`

/**
 * Get or create a persistent user ID (anonymous device ID)
 */
export const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem('analytics_device_id')
    if (!deviceId) {
      deviceId = generateId()
      await AsyncStorage.setItem('analytics_device_id', deviceId)
    }
    return deviceId
  } catch {
    return generateId()
  }
}

/**
 * Start a new session when the app opens
 */
export const startSession = async (userId = null) => {
  try {
    const deviceId = await getDeviceId()
    currentSessionId = generateId()
    sessionStartTime = Date.now()

    // Log session start
    await addDoc(collection(firestoreDb, ANALYTICS_SESSIONS), {
      sessionId: currentSessionId,
      deviceId,
      userId,
      startTime: serverTimestamp(),
      platform: 'mobile',
      active: true,
    })

    // Increment total installs/opens counter
    const statsRef = doc(firestoreDb, ANALYTICS_STATS, 'global')
    await setDoc(statsRef, {
      totalSessions: increment(1),
      lastUpdated: serverTimestamp(),
    }, { merge: true })

  } catch (e) {
    // Analytics should never crash the app
    console.log('[Analytics] startSession error:', e?.message)
  }
}

/**
 * End session
 */
export const endSession = async () => {
  try {
    if (!currentSessionId) return
    const duration = Math.round((Date.now() - sessionStartTime) / 1000) // seconds

    // Find and update the session doc
    const statsRef = doc(firestoreDb, ANALYTICS_STATS, 'global')
    await setDoc(statsRef, {
      totalSessionDuration: increment(duration),
      lastUpdated: serverTimestamp(),
    }, { merge: true })

    currentSessionId = null
    sessionStartTime = null
  } catch (e) {
    console.log('[Analytics] endSession error:', e?.message)
  }
}

/**
 * Track screen view
 */
export const trackScreenView = async (screenName, userId = null) => {
  try {
    const deviceId = await getDeviceId()

    // Log the event
    await addDoc(collection(firestoreDb, ANALYTICS_EVENTS), {
      type: 'screen_view',
      screen: screenName,
      sessionId: currentSessionId,
      deviceId,
      userId,
      timestamp: serverTimestamp(),
    })

    // Increment screen-specific counter
    const screenRef = doc(firestoreDb, ANALYTICS_SCREEN_STATS, screenName)
    await setDoc(screenRef, {
      screenName,
      views: increment(1),
      lastViewed: serverTimestamp(),
    }, { merge: true })

  } catch (e) {
    console.log('[Analytics] trackScreenView error:', e?.message)
  }
}

/**
 * Track button/action click
 */
export const trackAction = async (action, details = {}, userId = null) => {
  try {
    const deviceId = await getDeviceId()

    await addDoc(collection(firestoreDb, ANALYTICS_EVENTS), {
      type: 'action',
      action,
      details,
      sessionId: currentSessionId,
      deviceId,
      userId,
      timestamp: serverTimestamp(),
    })

    // Increment action counter
    const statsRef = doc(firestoreDb, ANALYTICS_STATS, 'actions')
    await setDoc(statsRef, {
      [action]: increment(1),
      lastUpdated: serverTimestamp(),
    }, { merge: true })

  } catch (e) {
    console.log('[Analytics] trackAction error:', e?.message)
  }
}

/**
 * Track user login
 */
export const trackLogin = async (userId, method = 'email') => {
  try {
    const statsRef = doc(firestoreDb, ANALYTICS_STATS, 'global')
    await setDoc(statsRef, {
      totalLogins: increment(1),
      lastUpdated: serverTimestamp(),
    }, { merge: true })

    await addDoc(collection(firestoreDb, ANALYTICS_EVENTS), {
      type: 'login',
      method,
      userId,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    console.log('[Analytics] trackLogin error:', e?.message)
  }
}

/**
 * Track user registration
 */
export const trackRegistration = async (userId) => {
  try {
    const statsRef = doc(firestoreDb, ANALYTICS_STATS, 'global')
    await setDoc(statsRef, {
      totalRegistrations: increment(1),
      lastUpdated: serverTimestamp(),
    }, { merge: true })

    await addDoc(collection(firestoreDb, ANALYTICS_EVENTS), {
      type: 'registration',
      userId,
      timestamp: serverTimestamp(),
    })
  } catch (e) {
    console.log('[Analytics] trackRegistration error:', e?.message)
  }
}

/**
 * Track app install (first launch ever)
 */
export const trackAppInstall = async () => {
  try {
    const deviceId = await getDeviceId()
    const installKey = `app_installed_${deviceId}`
    const alreadyInstalled = await AsyncStorage.getItem(installKey)

    if (!alreadyInstalled) {
      // First time install
      await AsyncStorage.setItem(installKey, 'true')

      const statsRef = doc(firestoreDb, ANALYTICS_STATS, 'global')
      await setDoc(statsRef, {
        totalInstalls: increment(1),
        lastUpdated: serverTimestamp(),
      }, { merge: true })

      await addDoc(collection(firestoreDb, ANALYTICS_EVENTS), {
        type: 'app_install',
        deviceId,
        timestamp: serverTimestamp(),
      })
    }
  } catch (e) {
    console.log('[Analytics] trackAppInstall error:', e?.message)
  }
}

/**
 * Track content view (prayer, book, article, etc.)
 */
export const trackContentView = async (contentType, contentId, contentTitle, userId = null) => {
  try {
    const deviceId = await getDeviceId()

    await addDoc(collection(firestoreDb, ANALYTICS_EVENTS), {
      type: 'content_view',
      contentType,
      contentId,
      contentTitle,
      sessionId: currentSessionId,
      deviceId,
      userId,
      timestamp: serverTimestamp(),
    })

    // Track most viewed content
    const contentRef = doc(firestoreDb, 'analytics_content_stats', `${contentType}_${contentId}`)
    await setDoc(contentRef, {
      contentType,
      contentId,
      contentTitle,
      views: increment(1),
      lastViewed: serverTimestamp(),
    }, { merge: true })

  } catch (e) {
    console.log('[Analytics] trackContentView error:', e?.message)
  }
}

/**
 * Track errors/crashes
 */
export const trackError = async (errorMessage, errorStack, screen = null, userId = null) => {
  try {
    const deviceId = await getDeviceId()

    await addDoc(collection(firestoreDb, ANALYTICS_EVENTS), {
      type: 'error',
      error: errorMessage,
      stack: errorStack?.substring(0, 500), // limit stack trace size
      screen,
      sessionId: currentSessionId,
      deviceId,
      userId,
      timestamp: serverTimestamp(),
    })

    const statsRef = doc(firestoreDb, ANALYTICS_STATS, 'global')
    await setDoc(statsRef, {
      totalErrors: increment(1),
      lastUpdated: serverTimestamp(),
    }, { merge: true })

  } catch (e) {
    console.log('[Analytics] trackError error:', e?.message)
  }
}

/**
 * Update active users count (called periodically while app is open)
 */
export const heartbeat = async (userId = null) => {
  try {
    if (!currentSessionId) return
    const deviceId = await getDeviceId()

    const activeRef = doc(firestoreDb, ANALYTICS_STATS, 'active_users')
    await setDoc(activeRef, {
      [`devices.${deviceId}`]: {
        lastSeen: serverTimestamp(),
        userId,
        sessionId: currentSessionId,
      },
      lastUpdated: serverTimestamp(),
    }, { merge: true })
  } catch (e) {
    // silent
  }
}

export default {
  startSession,
  endSession,
  trackScreenView,
  trackAction,
  trackLogin,
  trackRegistration,
  trackAppInstall,
  trackContentView,
  trackError,
  heartbeat,
  getDeviceId,
}
