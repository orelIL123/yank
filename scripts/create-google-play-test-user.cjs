#!/usr/bin/env node
/**
 * Create Google Play test user in Firebase Authentication
 * Email: 0512345678@hayanuka.com
 * Password: 123456
 *
 * Run from project root:
 *   node scripts/create-google-play-test-user.cjs
 *
 * Requires: firebase-admin and service account JSON at project root.
 */

const path = require('path');
const admin = require('firebase-admin');

const TEST_EMAIL = '0512345678@hayanuka.com';
const TEST_PASSWORD = '123456';

const serviceAccountPath = path.join(__dirname, '..', 'yank-99f79-firebase-adminsdk-fbsvc-eaa2a3f7de.json');

async function main() {
  let serviceAccount;
  try {
    serviceAccount = require(serviceAccountPath);
  } catch (e) {
    console.error('Service account file not found:', serviceAccountPath);
    console.error('Download it from Firebase Console → Project settings → Service accounts.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }

  const auth = admin.auth();

  try {
    const user = await auth.getUserByEmail(TEST_EMAIL);
    console.log('User already exists:', user.uid);
    console.log('To reset password, delete the user in Firebase Console and run this script again.');
    process.exit(0);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') {
      console.error('Error checking user:', e.message);
      process.exit(1);
    }
  }

  try {
    const userRecord = await auth.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      emailVerified: true,
      displayName: 'Google Play Reviewer',
    });
    console.log('Created Google Play test user:');
    console.log('  UID:', userRecord.uid);
    console.log('  Email:', userRecord.email);
    console.log('  Password:', TEST_PASSWORD);
    console.log('\nIn the app, login with:');
    console.log('  Email: 0512345678  (or 0512345678@hayanuka.com)');
    console.log('  Password: 123456');
  } catch (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  }
}

main();
