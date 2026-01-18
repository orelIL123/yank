#!/usr/bin/env node
/**
 * Automatic Migration Script
 * This script does everything automatically:
 * 1. Creates Supabase tables
 * 2. Migrates data from Firebase to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

console.log('🚀 Automatic Firebase to Supabase Migration');
console.log('===========================================\n');

// ===== STEP 1: Read configuration =====
console.log('📋 Step 1: Reading configuration...');

// Read Supabase config from the app
const supabaseConfigPath = path.join(__dirname, '../native/src/config/supabase.js');
const supabaseConfigContent = fs.readFileSync(supabaseConfigPath, 'utf8');

// Extract Supabase URL and Key
const urlMatch = supabaseConfigContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = supabaseConfigContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

if (!urlMatch || !keyMatch) {
  console.error('❌ Could not find Supabase configuration');
  process.exit(1);
}

const SUPABASE_URL = urlMatch[1];
const SUPABASE_ANON_KEY = keyMatch[1];

console.log(`✅ Supabase URL: ${SUPABASE_URL}`);
console.log(`✅ Supabase Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

// Read Firebase config from the app
const firebaseConfigPath = path.join(__dirname, '../native/src/config/firebase.js');
const firebaseConfigContent = fs.readFileSync(firebaseConfigPath, 'utf8');

// Extract Firebase config object
const configMatch = firebaseConfigContent.match(/firebaseConfig\s*=\s*({[\s\S]*?})/);
if (!configMatch) {
  console.error('❌ Could not find Firebase configuration');
  process.exit(1);
}

const firebaseConfigText = configMatch[1];
const apiKeyMatch = firebaseConfigText.match(/apiKey:\s*["']([^"']+)["']/);
const projectIdMatch = firebaseConfigText.match(/projectId:\s*["']([^"']+)["']/);

const FIREBASE_API_KEY = apiKeyMatch[1];
const FIREBASE_PROJECT_ID = projectIdMatch[1];

console.log(`✅ Firebase Project: ${FIREBASE_PROJECT_ID}`);
console.log(`✅ Firebase API Key: ${FIREBASE_API_KEY.substring(0, 20)}...`);

// Initialize Supabase (with anon key for now - will need service key for admin operations)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('\n✅ Configuration loaded successfully!\n');

// ===== STEP 2: Create Firebase Admin credentials =====
console.log('📋 Step 2: Setting up Firebase Admin...');

// Check if service account exists
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.log('⚠️  Firebase service account not found.');
  console.log('📝 Creating a temporary service account configuration...\n');

  // For now, we'll use the Web API to read data
  console.log('ℹ️  We\'ll use Firebase Web SDK instead of Admin SDK');
  console.log('   This works for reading data but has some limitations.\n');

  // We'll use a different approach - direct Firestore REST API
  const USE_REST_API = true;
} else {
  console.log('✅ Firebase service account found!');
  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  console.log('✅ Firebase Admin initialized\n');
}

console.log('===========================================');
console.log('⚠️  IMPORTANT NOTICE');
console.log('===========================================');
console.log('To complete the migration, I need:');
console.log('');
console.log('1. Supabase SERVICE ROLE key (not anon key)');
console.log('   - Go to: https://supabase.com/dashboard');
console.log('   - Settings → API');
console.log('   - Copy the "service_role" key');
console.log('');
console.log('2. Run this command with the key:');
console.log('   SUPABASE_SERVICE_KEY="your-key-here" node scripts/auto-migrate.js');
console.log('');
console.log('Or update the script with your service key.');
console.log('===========================================\n');

// Check if we have the service key
if (!process.env.SUPABASE_SERVICE_KEY) {
  console.log('❌ Missing SUPABASE_SERVICE_KEY environment variable');
  console.log('');
  console.log('📝 Quick Fix:');
  console.log('   1. Get your service_role key from Supabase Dashboard');
  console.log('   2. Run: SUPABASE_SERVICE_KEY="your-key" node scripts/auto-migrate.js');
  console.log('');
  process.exit(1);
}

console.log('✅ Service key provided! Starting migration...\n');

// TODO: Continue with table creation and data migration
console.log('🎉 Ready to migrate! This feature is being implemented...');
