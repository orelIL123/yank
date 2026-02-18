import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import { getFirestore, setLogLevel } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Use environment variables; never commit real keys to repo (see native/.env.example)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase config missing: set EXPO_PUBLIC_FIREBASE_* in native/.env (copy from .env.example).'
  )
}

// Initialize Firebase with error handling
let app
try {
  // Check if Firebase is already initialized to prevent duplicate initialization
  const existingApps = getApps()
  if (existingApps.length > 0) {
    app = existingApps[0]
  } else {
    app = initializeApp(firebaseConfig)
  }
} catch (error) {
  console.error('Firebase initialization error:', error)
  // Re-throw to prevent app from continuing with broken Firebase
  throw error
}

// Initialize services with error handling
let auth, db, storage
try {
  // Check if Auth is already initialized
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    })
    console.log('Firebase Auth initialized with AsyncStorage - user sessions will persist')
  } catch (authError) {
    // If already initialized, just get the existing instance
    if (authError.code === 'auth/already-initialized') {
      const { getAuth } = require('firebase/auth')
      auth = getAuth(app)
      console.log('Firebase Auth already initialized - using existing instance')
    } else {
      throw authError
    }
  }

  db = getFirestore(app)
  // הנמכת לוגים של Firestore – מונע התראות "WebChannel transport errored" (חיבור נפל לרגע, Firestore מתחבר מחדש אוטומטית)
  try {
    setLogLevel('error')
  } catch (_) {}
  storage = getStorage(app)
} catch (error) {
  console.error('Firebase services initialization error:', error)
  // Re-throw to prevent app from continuing with broken services
  throw error
}

export { auth, db, storage }
export default app