/**
 * Create 5 test users with simple passwords using Firebase Admin SDK
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../yank-99f79-firebase-adminsdk-fbsvc-eaa2a3f7de.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yank-99f79.firebaseio.com"
});

const db = admin.firestore();

const testUsers = [
  { name: 'משה כהן', email: 'moshe@test.com', password: '123456', permission: 'prayers_manager' },
  { name: 'דוד לוי', email: 'david@test.com', password: '123456', permission: 'videos_manager' },
  { name: 'יוסף מזרחי', email: 'yossef@test.com', password: '123456', permission: 'music_manager' },
  { name: 'אברהם אביטן', email: 'avraham@test.com', password: '123456', permission: 'books_manager' },
  { name: 'שמעון פרץ', email: 'shimon@test.com', password: '123456', permission: 'learning_manager' },
];

async function createUsers() {
  console.log('🚀 Starting to create 5 test users...\n');

  for (const userData of testUsers) {
    try {
      console.log(`📝 Creating user: ${userData.name} (${userData.email})`);
      
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true
      });

      console.log(`✅ Auth user created with UID: ${userRecord.uid}`);

      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        name: userData.name,
        email: userData.email,
        role: 'user',
        permissions: [userData.permission],
        createdAt: new Date().toISOString(),
        unlockedCards: []
      });

      console.log(`✅ Firestore document created with permission: ${userData.permission}`);
      console.log('');

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User ${userData.email} already exists, skipping...`);
        console.log('');
      } else {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
        console.log('');
      }
    }
  }

  console.log('🎉 Done! Created test users with the following credentials:\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  משתמש          │  אימייל              │  סיסמה  │  הרשאה  ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  testUsers.forEach(user => {
    const permissionLabel = {
      'prayers_manager': 'תפילות',
      'videos_manager': 'סרטונים',
      'music_manager': 'ניגונים',
      'books_manager': 'ספרים',
      'learning_manager': 'לימוד'
    }[user.permission];
    console.log(`║  ${user.name.padEnd(14)} │  ${user.email.padEnd(19)} │  ${user.password}  │  ${permissionLabel.padEnd(7)} ║`);
  });
  console.log('╚════════════════════════════════════════════════════════════╝');

  process.exit(0);
}

createUsers().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
