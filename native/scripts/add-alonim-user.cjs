/**
 * Add another newsletters manager user - alonim123@test.com
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

const alonimUser = {
  name: 'מנהל עלונים',
  email: 'alonim123@test.com',
  password: '123456',
  permission: 'newsletters_manager'
};

async function addAlonimManager() {
  console.log('🚀 Adding alonim123 user...\n');

  try {
    console.log(`📝 Creating user: ${alonimUser.name} (${alonimUser.email})`);
    
    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: alonimUser.email,
      password: alonimUser.password,
      displayName: alonimUser.name,
      emailVerified: true
    });

    console.log(`✅ Auth user created with UID: ${userRecord.uid}`);

    // Create user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name: alonimUser.name,
      email: alonimUser.email,
      role: 'user',
      permissions: [alonimUser.permission],
      createdAt: new Date().toISOString(),
      unlockedCards: []
    });

    console.log(`✅ Firestore document created with permission: ${alonimUser.permission}`);
    console.log('\n🎉 Done! Created user:\n');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  שם: מנהל עלונים                                     ║');
    console.log('║  אימייל: alonim123@test.com                          ║');
    console.log('║  סיסמה: 123456                                        ║');
    console.log('║  הרשאה: אחראי עלונים (newsletters_manager)          ║');
    console.log('╚════════════════════════════════════════════════════════╝');

  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`⚠️  User ${alonimUser.email} already exists`);
      
      // Get existing user and update permissions
      console.log('📝 Updating permissions for existing user...');
      const userRecord = await admin.auth().getUserByEmail(alonimUser.email);
      
      await db.collection('users').doc(userRecord.uid).update({
        permissions: [alonimUser.permission]
      });
      
      console.log('✅ Permissions updated successfully!');
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║  המשתמש alonim123@test.com כבר קיים                  ║');
      console.log('║  עדכנו את ההרשאות ל: newsletters_manager            ║');
      console.log('║  סיסמה: 123456                                        ║');
      console.log('╚════════════════════════════════════════════════════════╝');
    } else {
      console.error(`❌ Error:`, error.message);
    }
  }

  process.exit(0);
}

addAlonimManager().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
