/**
 * Script to add permissions to an existing user
 * Usage: node scripts/add-user-permissions.cjs <email> <permissions>
 * Example: node scripts/add-user-permissions.cjs user@example.com prayers_manager,learning_manager
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

async function addUserPermissions(email, permissions) {
  try {
    console.log(`🔍 Searching for user: ${email}`);
    
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.error('❌ User not found with email:', email);
      process.exit(1);
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('✅ Found user:', userData.name || email);
    console.log('📋 Current role:', userData.role);
    console.log('📋 Current permissions:', userData.permissions || []);
    
    // Update user permissions
    const permissionsArray = permissions.split(',').map(p => p.trim());
    
    await updateDoc(doc(db, 'users', userDoc.id), {
      permissions: permissionsArray
    });
    
    console.log('✅ Successfully updated permissions to:', permissionsArray);
    console.log('\n🎉 Done! User permissions updated successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node scripts/add-user-permissions.cjs <email> <permissions>');
  console.log('Example: node scripts/add-user-permissions.cjs user@example.com prayers_manager,learning_manager');
  console.log('\nAvailable permissions:');
  console.log('  - prayers_manager (תפילות)');
  console.log('  - videos_manager (מבית רבנו)');
  console.log('  - music_manager (ניגונים)');
  console.log('  - books_manager (ספר תולדות אדם)');
  console.log('  - learning_manager (ספריית לימוד)');
  process.exit(1);
}

const [email, permissions] = args;

addUserPermissions(email, permissions);
