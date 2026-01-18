import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, getReactNativePersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

const firebaseConfig = {
  apiKey: "AIzaSyC6CfvVURku2xMCgnhIGQbc4vQTKLP3SYA",
  authDomain: "yank-99f79.firebaseapp.com",
  projectId: "yank-99f79",
  storageBucket: "yank-99f79.firebasestorage.app",
  messagingSenderId: "835481530038",
  appId: "1:835481530038:web:cd4141f7f1d099a26bc017"
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
  storage = getStorage(app)
} catch (error) {
  console.error('Firebase services initialization error:', error)
  // Re-throw to prevent app from continuing with broken services
  throw error
}

export { auth, db, storage }
export default app