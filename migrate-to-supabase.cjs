/**
 * Migration Script: Firestore → Supabase
 *
 * This script copies all data from Firebase Firestore to Supabase PostgreSQL
 *
 * Usage:
 * 1. Make sure you've run the SQL schema in Supabase first!
 * 2. Run: node migrate-to-supabase.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZGdtZXN4Ym1uc3BmcWZhaHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI2MTYsImV4cCI6MjA4MjMxODYxNn0.CtmMmT0xrc1-H7lkQdwfs1-oAcmko4jpC3dXJkISZ5M';

// Firebase Admin configuration
const serviceAccount = require('./yank-99f79-firebase-adminsdk-fbsvc-eaa2a3f7de.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const firestoreDb = getFirestore();

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Map Firestore collection names to Supabase table names
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

// Helper to convert camelCase to snake_case
const toSnakeCase = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

// Convert object keys from camelCase to snake_case
const convertToSnakeCase = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(convertToSnakeCase);
  if (obj instanceof Date) return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = typeof value === 'object' && value !== null && !(value instanceof Date)
      ? convertToSnakeCase(value)
      : value;
  }
  return result;
};

// Migrate a single collection
async function migrateCollection(firestoreCollectionName, supabaseTableName) {
  console.log(`\n📦 Migrating ${firestoreCollectionName} → ${supabaseTableName}...`);

  try {
    // Get all documents from Firestore
    const snapshot = await firestoreDb.collection(firestoreCollectionName).get();

    if (snapshot.empty) {
      console.log(`   ⚠️  No documents found in ${firestoreCollectionName}`);
      return { success: true, count: 0 };
    }

    const documents = [];
    snapshot.forEach(doc => {
      const data = doc.data();

      // Convert Firestore Timestamp to ISO string
      const convertedData = {};
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value.toDate === 'function') {
          // Firestore Timestamp
          convertedData[key] = value.toDate().toISOString();
        } else {
          convertedData[key] = value;
        }
      }

      // Convert to snake_case for Supabase
      const snakeData = convertToSnakeCase(convertedData);

      documents.push({
        id: doc.id, // Keep the original Firestore ID
        ...snakeData
      });
    });

    console.log(`   📄 Found ${documents.length} documents`);

    // Insert into Supabase in batches of 100
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from(supabaseTableName)
        .insert(batch)
        .select();

      if (error) {
        console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`   ✅ Inserted batch ${i / batchSize + 1} (${batch.length} documents)`);
      }
    }

    console.log(`   ✨ Migration complete: ${successCount} succeeded, ${errorCount} failed`);
    return { success: errorCount === 0, count: successCount };

  } catch (error) {
    console.error(`   ❌ Error migrating ${firestoreCollectionName}:`, error.message);
    return { success: false, count: 0, error };
  }
}

// Migrate subcollection (rabbiStudents/videos)
async function migrateSubcollection() {
  console.log(`\n📦 Migrating rabbiStudents → videos (subcollection)...`);

  try {
    const categoriesSnapshot = await firestoreDb.collection('rabbiStudents').get();

    if (categoriesSnapshot.empty) {
      console.log(`   ⚠️  No categories found`);
      return { success: true, count: 0 };
    }

    let totalVideos = 0;

    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryId = categoryDoc.id;
      console.log(`   📁 Processing category: ${categoryId}`);

      const videosSnapshot = await firestoreDb
        .collection('rabbiStudents')
        .doc(categoryId)
        .collection('videos')
        .get();

      if (videosSnapshot.empty) {
        console.log(`      ⚠️  No videos found`);
        continue;
      }

      const videos = [];
      videosSnapshot.forEach(videoDoc => {
        const data = videoDoc.data();

        // Convert timestamps
        const convertedData = {};
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value.toDate === 'function') {
            convertedData[key] = value.toDate().toISOString();
          } else {
            convertedData[key] = value;
          }
        }

        const snakeData = convertToSnakeCase(convertedData);

        videos.push({
          id: videoDoc.id,
          category_id: categoryId, // Link to parent category
          ...snakeData
        });
      });

      console.log(`      📄 Found ${videos.length} videos`);

      const { data, error } = await supabase
        .from('rabbi_student_videos')
        .insert(videos)
        .select();

      if (error) {
        console.error(`      ❌ Error inserting videos:`, error.message);
      } else {
        console.log(`      ✅ Inserted ${videos.length} videos`);
        totalVideos += videos.length;
      }
    }

    console.log(`   ✨ Total videos migrated: ${totalVideos}`);
    return { success: true, count: totalVideos };

  } catch (error) {
    console.error(`   ❌ Error migrating subcollection:`, error.message);
    return { success: false, count: 0, error };
  }
}

// Main migration function
async function migrate() {
  console.log('🚀 Starting Firestore → Supabase migration...\n');
  console.log('⚠️  IMPORTANT: Make sure you ran the SQL schema in Supabase first!\n');

  const results = {};

  // Migrate all collections
  for (const [firestoreCollection, supabaseTable] of Object.entries(COLLECTION_MAP)) {
    const result = await migrateCollection(firestoreCollection, supabaseTable);
    results[firestoreCollection] = result;
  }

  // Migrate subcollection
  const subcollectionResult = await migrateSubcollection();
  results['rabbiStudents/videos'] = subcollectionResult;

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const [collection, result] of Object.entries(results)) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${collection.padEnd(30)} ${result.count} documents`);

    if (result.success) {
      totalSuccess += result.count;
    } else {
      totalFailed++;
    }
  }

  console.log('='.repeat(60));
  console.log(`✨ Total documents migrated: ${totalSuccess}`);
  console.log(`❌ Failed collections: ${totalFailed}`);
  console.log('='.repeat(60));

  if (totalFailed === 0) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test your app with the new Supabase data');
    console.log('   2. Once confirmed, you can delete the Firestore data');
    console.log('   3. Update remaining screens to use the database service');
  } else {
    console.log('\n⚠️  Migration completed with errors. Check the logs above.');
  }

  process.exit(0);
}

// Run migration
migrate().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
