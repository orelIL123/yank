/**
 * סקריפט ליצירת 5 משתמשים לקהילה
 * הרץ עם: node native/scripts/create-community-users.cjs
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC6CfvVURku2xMCgnhIGQbc4vQTKLP3SYA",
  authDomain: "yank-99f79.firebaseapp.com",
  projectId: "yank-99f79",
  storageBucket: "yank-99f79.firebasestorage.app",
  messagingSenderId: "835481530038",
  appId: "1:835481530038:web:cd4141f7f1d099a26bc017"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 5 משתמשים ליצירה
const users = [
  {
    email: 'user1@hayanuka.com',
    password: 'Hayanuka2024!',
    displayName: 'משתמש 1',
    phone: null
  },
  {
    email: 'user2@hayanuka.com',
    password: 'Hayanuka2024!',
    displayName: 'משתמש 2',
    phone: null
  },
  {
    email: 'user3@hayanuka.com',
    password: 'Hayanuka2024!',
    displayName: 'משתמש 3',
    phone: null
  },
  {
    email: 'user4@hayanuka.com',
    password: 'Hayanuka2024!',
    displayName: 'משתמש 4',
    phone: null
  },
  {
    email: 'user5@hayanuka.com',
    password: 'Hayanuka2024!',
    displayName: 'משתמש 5',
    phone: null
  }
];

async function createUsers() {
  console.log('🚀 Creating 5 community users...\n');
  
  const results = [];
  
  for (let i = 0; i < users.length; i++) {
    const userData = users[i];
    try {
      console.log(`Creating user ${i + 1}/5: ${userData.email}`);
      
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      console.log(`✅ Auth user created: ${userCredential.user.uid}`);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userData.email,
        phone: userData.phone,
        displayName: userData.displayName,
        photoURL: null,
        tier: 'free',
        role: 'user',
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        notificationsEnabled: true,
        fcmTokens: [],
        streakDays: 0,
        completedCourses: [],
        metadata: {
          onboardingCompleted: false,
          preferredLanguage: 'he'
        }
      });
      
      console.log(`✅ User document created in Firestore\n`);
      
      results.push({
        success: true,
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
        uid: userCredential.user.uid
      });
      
      // Wait a bit between users to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
      results.push({
        success: false,
        email: userData.email,
        error: error.message
      });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ Successfully created: ${successful.length} users`);
  console.log(`❌ Failed: ${failed.length} users\n`);
  
  if (successful.length > 0) {
    console.log('📌 Created users:');
    successful.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.displayName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   UID: ${user.uid}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed users:');
    failed.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}: ${user.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('⚠️  IMPORTANT: Users should change their passwords after first login!');
  console.log('='.repeat(60) + '\n');
}

// Run the script
createUsers()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });


