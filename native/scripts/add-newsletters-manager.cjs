/**
 * Add a newsletters manager user
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../yank-99f79-firebase-adminsdk-fbsvc-eaa2a3f7de.json');

// Initialize Firebase Admin (check if already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://yank-99f79.firebaseio.com"
  });
}

const db = admin.firestore();

const newslettersUser = {
  name: 'רחל אוחנה',
  email: 'rachel@test.com',
  password: '123456',
  permission: 'newsletters_manager'
};

async function addNewslettersManager() {
  console.log('🚀 Adding newsletters manager...\n');

  try {
    console.log(`📝 Creating user: ${newslettersUser.name} (${newslettersUser.email})`);
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: newslettersUser.email,
      password: newslettersUser.password,
      displayName: newslettersUser.name,
      emailVerified: true
    });

    console.log(`✅ Auth user created with UID: ${userRecord.uid}`);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name: newslettersUser.name,
      email: newslettersUser.email,
      role: 'user',
      permissions: [newslettersUser.permission],
      createdAt: new Date().toISOString(),
      unlockedCards: []
    });

    console.log(`✅ Firestore document created with permission: ${newslettersUser.permission}`);
    console.log('\n🎉 Done! Created newsletters manager:\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  שם: רחל אוחנה                                       ║');
    console.log('║  אימייל: rachel@test.com                            ║');
    console.log('║  סיסמה: 123456                                       ║');
    console.log('║  הרשאה: אחראית עלונים (newsletters_manager)        ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  User ${newslettersUser.email} already exists`);
      
      // Get existing user and update permissions
      console.log('📝 Updating permissions for existing user...');
      const userRecord = await admin.auth().getUserByEmail(newslettersUser.email);
      
      await db.collection('users').doc(userRecord.uid).update({
        permissions: [newslettersUser.permission]
      });
      
      console.log('✅ Permissions updated successfully!');
    } else {
      console.error(`❌ Error:`, error.message);
    }
  }

  process.exit(0);
}

addNewslettersManager().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
