/**
 * Script to create 5 test users with simple passwords
 * Usage: node scripts/create-test-users.cjs
 */

const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, updateProfile } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

// 5 test users
const testUsers = [
  {
    name: 'משה כהן',
    email: 'moshe@test.com',
    password: '123456'
  },
  {
    name: 'דוד לוי',
    email: 'david@test.com',
    password: '123456'
  },
  {
    name: 'יוסי אברהם',
    email: 'yossi@test.com',
    password: '123456'
  },
  {
    name: 'שמעון ישראלי',
    email: 'shimon@test.com',
    password: '123456'
  },
  {
    name: 'אברהם מזרחי',
    email: 'avraham@test.com',
    password: '123456'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating 5 test users...\n');

  for (const user of testUsers) {
    try {
      console.log(`📝 Creating user: ${user.name} (${user.email})`);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );
      
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, {
        displayName: user.name
      });
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: user.name,
        email: user.email,
        role: 'user',
        permissions: [],
        createdAt: new Date().toISOString(),
        unlockedCards: []
      });
      
      console.log(`✅ Success! User created with UID: ${firebaseUser.uid}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: ${user.password}\n`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️  User ${user.email} already exists, skipping...\n`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error.message, '\n');
      }
    }
  }
  
  console.log('\n🎉 Done! Summary of test users:');
  console.log('═══════════════════════════════════════════════════════');
  testUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   📧 ${user.email}`);
    console.log(`   🔑 ${user.password}`);
    console.log('');
  });
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n💡 You can now assign permissions to these users using:');
  console.log('   node scripts/add-user-permissions.cjs <email> <permissions>');
  console.log('\n   Example:');
  console.log('   node scripts/add-user-permissions.cjs moshe@test.com prayers_manager');
  
  process.exit(0);
}

createTestUsers();
