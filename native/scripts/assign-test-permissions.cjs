/**
 * Script to quickly assign permissions to test users
 * This uses the web SDK with admin-like queries
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC6CfvVURku2xMCgnhIGQbc4vQTKLP3SYA",
  authDomain: "yank-99f79.firebaseapp.com",
  projectId: "yank-99f79",
  storageBucket: "yank-99f79.firebasestorage.app",
  messagingSenderId: "835481530038",
  appId: "1:835481530038:web:cd4141f7f1d099a26bc017"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const assignments = [
  {
    email: 'moshe@test.com',
    name: 'משה כהן',
    permissions: ['prayers_manager'],
    description: 'אחראי תפילות'
  },
  {
    email: 'david@test.com',
    name: 'דוד לוי',
    permissions: ['videos_manager'],
    description: 'אחראי מבית רבנו'
  },
  {
    email: 'yossi@test.com',
    name: 'יוסי אברהם',
    permissions: ['music_manager'],
    description: 'אחראי ניגונים'
  },
  {
    email: 'shimon@test.com',
    name: 'שמעון ישראלי',
    permissions: ['learning_manager'],
    description: 'אחראי ספריית לימוד'
  },
  {
    email: 'avraham@test.com',
    name: 'אברהם מזרחי',
    permissions: ['books_manager'],
    description: 'אחראי ספר תולדות אדם'
  }
];

async function assignPermissions() {
  console.log('🚀 Assigning permissions to test users...\n');
  
  // First, let's get all users
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = {};
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      users[data.email] = { id: doc.id, ...data };
    });
    
    console.log(`📋 Found ${Object.keys(users).length} users in database\n`);
    
    // Now assign permissions
    for (const assignment of assignments) {
      try {
        const user = users[assignment.email];
        
        if (!user) {
          console.log(`⚠️  User ${assignment.email} not found, skipping...\n`);
          continue;
        }
        
        console.log(`📝 Updating ${assignment.name} (${assignment.email})`);
        console.log(`   Permissions: ${assignment.description}`);
        
        await updateDoc(doc(db, 'users', user.id), {
          permissions: assignment.permissions
        });
        
        console.log(`✅ Success!\n`);
        
      } catch (error) {
        console.error(`❌ Error updating ${assignment.email}:`, error.message, '\n');
      }
    }
    
    console.log('\n🎉 Done! Summary:');
    console.log('═══════════════════════════════════════════════════════');
    assignments.forEach((assignment, index) => {
      console.log(`${index + 1}. ${assignment.name}`);
      console.log(`   📧 ${assignment.email} | 🔑 123456`);
      console.log(`   🎯 ${assignment.description}`);
      console.log('');
    });
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n✅ All users are ready! You can now login with any of them.');
    console.log('   Password for all: 123456');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

assignPermissions();
