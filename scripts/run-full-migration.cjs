#!/usr/bin/env node
/**
 * Full Automatic Migration - Firebase to Supabase
 * This does EVERYTHING automatically!
 */

const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');

const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZGdtZXN4Ym1uc3BmcWZhaHVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc0MjYxNiwiZXhwIjoyMDgyMzE4NjE2fQ.Dsb0cfeKXXPt_MP3sIiHpKNoBIO6QaaRvff0e3XOxlw';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC6CfvVURku2xMCgnhIGQbc4vQTKLP3SYA",
  authDomain: "yank-99f79.firebaseapp.com",
  projectId: "yank-99f79",
  storageBucket: "yank-99f79.firebasestorage.app",
  messagingSenderId: "835481530038",
  appId: "1:835481530038:web:cd4141f7f1d099a26bc017"
};

console.log('🚀 FULL AUTOMATIC MIGRATION');
console.log('='.repeat(60));
console.log('📊 Firebase Project:', FIREBASE_CONFIG.projectId);
console.log('📊 Supabase URL:', SUPABASE_URL);
console.log('='.repeat(60) + '\n');

// Initialize Supabase with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initialize Firebase Admin (we'll use REST API instead)
// Since we don't have service account, we'll use Firestore REST API

const COLLECTION_MAP = {
  books: 'books',
  music: 'music',
  newsletters: 'newsletters',
  news: 'news',
  prayers: 'prayers',
  prayerCommitments: 'prayer_commitments',
  dailyLearning: 'daily_learning',
  dailyVideos: 'daily_videos',
  dailyInsights: 'daily_insights',
  shortLessons: 'short_lessons',
  longLessons: 'long_lessons',
  tzadikim: 'tzadikim',
  notifications: 'notifications',
  pidyonNefesh: 'pidyon_nefesh',
  homeCards: 'home_cards',
  chidushim: 'chidushim',
  rabbiStudents: 'rabbi_students',
  beitMidrashVideos: 'beit_midrash_videos',
};

// ===== STEP 1: CREATE TABLES =====
async function createTables() {
  console.log('\n📦 STEP 1: Creating Supabase Tables');
  console.log('─'.repeat(60));

  const tables = Object.values(COLLECTION_MAP);

  for (const tableName of tables) {
    try {
      // Check if table exists
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        // Table doesn't exist - but we can't create it via API
        console.log(`⚠️  Table '${tableName}' needs to be created manually`);
      } else if (error) {
        console.log(`❌ Error checking table '${tableName}':`, error.message);
      } else {
        console.log(`✅ Table '${tableName}' exists`);
      }
    } catch (err) {
      console.log(`❌ Exception for table '${tableName}':`, err.message);
    }
  }

  console.log('\n⚠️  IMPORTANT: Tables must be created via SQL Editor first!');
  console.log('   Run the SQL from: scripts/create-supabase-tables.sql');
  console.log('   Then run this script again.\n');
}

// ===== STEP 2: MIGRATE DATA =====
async function migrateData() {
  console.log('\n📦 STEP 2: Migrating Data from Firebase to Supabase');
  console.log('─'.repeat(60));

  // We'll use Firestore REST API to read data
  const projectId = FIREBASE_CONFIG.projectId;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  let totalSuccess = 0;
  let totalErrors = 0;

  for (const [firestoreCollection, supabaseTable] of Object.entries(COLLECTION_MAP)) {
    console.log(`\n📋 Migrating: ${firestoreCollection} → ${supabaseTable}`);

    try {
      // Read from Firestore REST API
      const response = await fetch(`${baseUrl}/${firestoreCollection}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.log(`  ⚠️  Could not read from ${firestoreCollection}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const documents = data.documents || [];

      if (documents.length === 0) {
        console.log(`  ⏭️  No documents in ${firestoreCollection}`);
        continue;
      }

      console.log(`  📊 Found ${documents.length} documents`);

      // Process and insert documents
      let batchSuccess = 0;
      let batchErrors = 0;

      for (const doc of documents) {
        try {
          // Extract document ID and data
          const docId = doc.name.split('/').pop();
          const docData = convertFirestoreDocument(doc.fields);

          // Insert into Supabase
          const { error } = await supabase
            .from(supabaseTable)
            .upsert({
              id: docId,
              data: docData,
              created_at: docData.createdAt || new Date().toISOString(),
              updated_at: docData.updatedAt || new Date().toISOString()
            }, { onConflict: 'id' });

          if (error) {
            console.log(`    ❌ Error migrating ${docId}:`, error.message);
            batchErrors++;
          } else {
            batchSuccess++;
          }
        } catch (err) {
          console.log(`    ❌ Exception:`, err.message);
          batchErrors++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      console.log(`  ✅ Success: ${batchSuccess} | ❌ Errors: ${batchErrors}`);
      totalSuccess += batchSuccess;
      totalErrors += batchErrors;

    } catch (err) {
      console.log(`  ❌ Failed to migrate ${firestoreCollection}:`, err.message);
      totalErrors++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Total Success: ${totalSuccess} documents`);
  console.log(`❌ Total Errors: ${totalErrors} documents`);
  console.log('='.repeat(60));

  if (totalErrors === 0 && totalSuccess > 0) {
    console.log('\n🎉 Migration completed successfully!\n');
  } else if (totalSuccess === 0 && totalErrors === 0) {
    console.log('\n⚠️  No data was migrated. Check if tables exist in Supabase.\n');
  } else {
    console.log('\n⚠️  Migration completed with some errors.\n');
  }
}

// Helper: Convert Firestore document format to plain object
function convertFirestoreDocument(fields) {
  const result = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      result[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      result[key] = parseInt(value.integerValue);
    } else if (value.doubleValue !== undefined) {
      result[key] = parseFloat(value.doubleValue);
    } else if (value.booleanValue !== undefined) {
      result[key] = value.booleanValue;
    } else if (value.timestampValue !== undefined) {
      result[key] = value.timestampValue;
    } else if (value.arrayValue !== undefined) {
      result[key] = value.arrayValue.values?.map(v => convertFirestoreValue(v)) || [];
    } else if (value.mapValue !== undefined) {
      result[key] = convertFirestoreDocument(value.mapValue.fields || {});
    } else if (value.nullValue !== undefined) {
      result[key] = null;
    }
  }

  return result;
}

function convertFirestoreValue(value) {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue !== undefined) return value.arrayValue.values?.map(v => convertFirestoreValue(v)) || [];
  if (value.mapValue !== undefined) return convertFirestoreDocument(value.mapValue.fields || {});
  if (value.nullValue !== undefined) return null;
  return null;
}

// ===== MAIN =====
async function main() {
  try {
    // Step 1: Check/Create tables
    await createTables();

    // Ask user if they want to continue
    console.log('\n⚠️  Before migrating data, make sure you ran the SQL script!');
    console.log('   File: scripts/create-supabase-tables.sql');
    console.log('   Location: Supabase Dashboard → SQL Editor\n');
    console.log('Continuing in 5 seconds...');
    console.log('Press Ctrl+C to cancel\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 2: Migrate data
    await migrateData();

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('✅ Script completed!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Fatal:', err);
      process.exit(1);
    });
}
