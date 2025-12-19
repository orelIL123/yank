import { db, auth } from '../src/config/firebase.js'
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { signInWithEmailAndPassword } from 'firebase/auth'

/**
 * סקריפט להוספת קטגוריות חדשות ל"מבית רבינו"
 * הרץ עם: cd native && node scripts/addRabbiCategories.js
 */

const ADMIN_EMAIL = 'orel895@gmail.com'
const ADMIN_PASSWORD = '123456'

async function addCategories() {
  try {
    console.log('🚀 Starting to add categories...\n')

    // Login as admin first
    console.log('🔐 Logging in as admin...')
    await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD)
    console.log('✅ Logged in successfully!\n')

    // Category 1: סיפורי הבעש"ט
    console.log('📝 Creating "סיפורי הבעש"ט" category...')
    const beshtCategoryRef = doc(collection(db, 'rabbiStudents'))
    await setDoc(beshtCategoryRef, {
      name: 'סיפורי הבעש"ט',
      description: 'סיפורים מופלאים וניסים של הבעל שם טוב הקדוש',
      isActive: true,
      order: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    console.log(`✅ Created category with ID: ${beshtCategoryRef.id}\n`)

    // Category 2: מהנעשה בבית המדרש
    console.log('📝 Creating "מהנעשה בבית המדרש" category...')
    const yeshivaCategoryRef = doc(collection(db, 'rabbiStudents'))
    await setDoc(yeshivaCategoryRef, {
      name: 'מהנעשה בבית המדרש',
      description: 'עדכונים וחדשות מבית המדרש',
      isActive: true,
      order: 2,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    console.log(`✅ Created category with ID: ${yeshivaCategoryRef.id}\n`)

    console.log('✅ All categories created successfully!')
    console.log('\n📌 Next steps:')
    console.log('1. Go to Firebase Console → Firestore')
    console.log('2. Find the "rabbiStudents" collection')
    console.log('3. For each category, add a "videos" subcollection')
    console.log('4. Add video documents with:')
    console.log('   - title: string')
    console.log('   - description: string (optional)')
    console.log('   - videoUrl or youtubeUrl: string (YouTube URL)')
    console.log('   - createdAt: timestamp')
    console.log('\n💡 Example video document:')
    console.log('   title: "סיפור מופלא על הבעש"ט"')
    console.log('   videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"')
    console.log('   createdAt: [current timestamp]')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Error details:', error.message, error.code)
    process.exit(1)
  }
}

addCategories()
