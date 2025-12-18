import { db, auth } from '../src/config/firebase.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'

/**
 * סקריפט ליצירת Admin User עבור yanuka.admin@gmail.com
 */

const ADMIN_EMAIL = 'yanuka.admin@gmail.com'
const ADMIN_PASSWORD = 'YOUR_PASSWORD_HERE' // שים כאן את הסיסמה

async function createAdminDocument() {
  try {
    console.log('🚀 Logging in as yanuka admin...\n')

    // Login with the existing user
    const userCredential = await signInWithEmailAndPassword(
      auth,
      ADMIN_EMAIL,
      ADMIN_PASSWORD
    )

    console.log(`✅ Logged in successfully: ${userCredential.user.uid}`)

    // Create user document in Firestore
    console.log('\n📝 Creating admin document in Firestore...')

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email: ADMIN_EMAIL,
      phone: null,
      displayName: 'Yanuka Admin',
      photoURL: null,
      tier: 'vip',
      role: 'admin', // ← This is the important part!
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      notificationsEnabled: true,
      fcmTokens: [],
      streakDays: 0,
      completedCourses: [],
      metadata: {
        onboardingCompleted: true,
        preferredLanguage: 'he'
      }
    })

    console.log('✅ Admin document created in Firestore!')
    console.log('\n🎉 Success!')
    console.log('\n📌 Admin credentials:')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   UID: ${userCredential.user.uid}`)
    console.log(`   Role: admin`)

  } catch (error) {
    console.error('❌ Error:', error.message)

    if (error.code === 'auth/user-not-found') {
      console.log('\n💡 User not found. Create the user in Firebase Console first.')
    } else if (error.code === 'auth/wrong-password') {
      console.log('\n💡 Wrong password. Check your credentials.')
    } else if (error.code === 'permission-denied') {
      console.log('\n💡 Make sure Firestore Rules allow authenticated writes!')
      console.log('   Go to Firebase Console → Firestore → Rules')
      console.log('   And temporarily set: allow read, write: if request.auth != null;')
    }
  }
}

createAdminDocument()
