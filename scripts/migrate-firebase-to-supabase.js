#!/usr/bin/env node
/**
 * Firebase to Supabase Data Migration Script
 *
 * This script migrates all data from Firebase Firestore to Supabase PostgreSQL
 *
 * Usage:
 *   node scripts/migrate-firebase-to-supabase.js
 *
 * Options:
 *   --collection=<name>  Migrate only specific collection
 *   --dry-run           Show what would be migrated without actually migrating
 *   --batch-size=<num>  Number of documents to migrate at once (default: 100)
 */

const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// ===== CONFIGURATION =====

const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY_HERE'; // ⚠️ REPLACE WITH YOUR SERVICE KEY!

// Firebase Admin SDK - needs service account JSON
const FIREBASE_SERVICE_ACCOUNT = require('../firebase-service-account.json'); // ⚠️ You need to download this from Firebase Console

// Collection mappings: Firebase collection name -> Supabase table name
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
  rabbiStudentVideos: 'rabbi_student_videos',
  beitMidrashVideos: 'beit_midrash_videos',
};

// ===== INITIALIZATION =====

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 100,
  collection: args.find(arg => arg.startsWith('--collection='))?.split('=')[1] || null,
};

console.log('🚀 Firebase to Supabase Data Migration');
console.log('=======================================\n');
console.log('Options:', options);
console.log('');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT)
  });
}
const firestore = admin.firestore();

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ===== HELPER FUNCTIONS =====

function toSnakeCase(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function convertTimestamp(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }
  if (value && value._seconds) {
    return new Date(value._seconds * 1000).toISOString();
  }
  return value;
}

function processDocument(doc) {
  const data = doc.data();
  const processed = {};

  // Convert all Timestamps to ISO strings
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Check if it's a Timestamp
      if (typeof value.toDate === 'function' || value._seconds) {
        processed[key] = convertTimestamp(value);
      } else {
        // Recursively process nested objects
        processed[key] = processNestedObject(value);
      }
    } else if (Array.isArray(value)) {
      // Process arrays
      processed[key] = value.map(item => {
        if (item && typeof item === 'object') {
          return processNestedObject(item);
        }
        return item;
      });
    } else {
      processed[key] = value;
    }
  }

  return {
    id: doc.id,
    ...processed
  };
}

function processNestedObject(obj) {
  const processed = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value.toDate === 'function') {
      processed[key] = convertTimestamp(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      processed[key] = processNestedObject(value);
    } else {
      processed[key] = value;
    }
  }
  return processed;
}

// ===== MIGRATION FUNCTIONS =====

async function migrateCollection(collectionName) {
  const tableName = COLLECTION_MAP[collectionName] || toSnakeCase(collectionName);

  console.log(`\n📦 Migrating: ${collectionName} -> ${tableName}`);
  console.log('─'.repeat(60));

  try {
    // Get all documents from Firebase
    console.log('  📖 Reading from Firebase...');
    const snapshot = await firestore.collection(collectionName).get();

    if (snapshot.empty) {
      console.log('  ⏭️  No documents found - skipping');
      return { success: 0, errors: 0, skipped: snapshot.size };
    }

    console.log(`  📊 Found ${snapshot.size} documents`);

    // Process documents in batches
    const documents = snapshot.docs.map(processDocument);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < documents.length; i += options.batchSize) {
      const batch = documents.slice(i, i + options.batchSize);

      console.log(`  📤 Processing batch ${Math.floor(i / options.batchSize) + 1}/${Math.ceil(documents.length / options.batchSize)} (${batch.length} docs)...`);

      if (options.dryRun) {
        console.log(`  🔍 [DRY RUN] Would migrate ${batch.length} documents`);
        console.log('  Sample document:', JSON.stringify(batch[0], null, 2).substring(0, 200) + '...');
        successCount += batch.length;
        continue;
      }

      // Prepare data for Supabase
      const supabaseData = batch.map(doc => {
        const { id, ...data } = doc;
        return {
          id,
          data,
          created_at: data.createdAt || new Date().toISOString(),
          updated_at: data.updatedAt || new Date().toISOString()
        };
      });

      try {
        const { data, error } = await supabase
          .from(tableName)
          .upsert(supabaseData, { onConflict: 'id' });

        if (error) {
          console.error(`  ❌ Error in batch: ${error.message}`);
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`  ✅ Batch migrated successfully`);
        }
      } catch (error) {
        console.error(`  ❌ Exception in batch:`, error.message);
        errorCount += batch.length;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n  ✨ Migration complete for ${collectionName}`);
    console.log(`     ✅ Success: ${successCount}`);
    console.log(`     ❌ Errors: ${errorCount}`);

    return { success: successCount, errors: errorCount, skipped: 0 };

  } catch (error) {
    console.error(`  ❌ Failed to migrate ${collectionName}:`, error);
    return { success: 0, errors: 1, skipped: 0 };
  }
}

async function migrateSubcollection(parentCollection, parentId, subcollection) {
  console.log(`\n📦 Migrating subcollection: ${parentCollection}/${parentId}/${subcollection}`);

  try {
    const snapshot = await firestore
      .collection(parentCollection)
      .doc(parentId)
      .collection(subcollection)
      .get();

    if (snapshot.empty) {
      console.log('  ⏭️  No documents found - skipping');
      return { success: 0, errors: 0, skipped: 0 };
    }

    console.log(`  📊 Found ${snapshot.size} documents`);

    const documents = snapshot.docs.map(processDocument);
    let successCount = 0;
    let errorCount = 0;

    for (const doc of documents) {
      if (options.dryRun) {
        console.log(`  🔍 [DRY RUN] Would migrate document ${doc.id}`);
        successCount++;
        continue;
      }

      try {
        const { data: docData, ...rest } = doc;
        const supabaseData = {
          id: doc.id,
          category_id: parentId,
          data: docData || doc,
          created_at: doc.createdAt || new Date().toISOString(),
          updated_at: doc.updatedAt || new Date().toISOString()
        };

        const { error } = await supabase
          .from('rabbi_student_videos')
          .upsert(supabaseData, { onConflict: 'id' });

        if (error) {
          console.error(`  ❌ Error migrating ${doc.id}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`  ❌ Exception migrating ${doc.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`  ✅ Success: ${successCount} | ❌ Errors: ${errorCount}`);
    return { success: successCount, errors: errorCount, skipped: 0 };

  } catch (error) {
    console.error(`  ❌ Failed to migrate subcollection:`, error);
    return { success: 0, errors: 1, skipped: 0 };
  }
}

async function migrateRabbiStudentsWithVideos() {
  console.log(`\n🎥 Migrating rabbiStudents with videos subcollection`);
  console.log('─'.repeat(60));

  try {
    const categoriesSnapshot = await firestore.collection('rabbiStudents').get();

    if (categoriesSnapshot.empty) {
      console.log('  ⏭️  No categories found');
      return { success: 0, errors: 0, skipped: 0 };
    }

    console.log(`  📊 Found ${categoriesSnapshot.size} categories`);

    let totalSuccess = 0;
    let totalErrors = 0;

    // First migrate the categories themselves
    const categoriesResult = await migrateCollection('rabbiStudents');
    totalSuccess += categoriesResult.success;
    totalErrors += categoriesResult.errors;

    // Then migrate videos for each category
    for (const categoryDoc of categoriesSnapshot.docs) {
      const result = await migrateSubcollection('rabbiStudents', categoryDoc.id, 'videos');
      totalSuccess += result.success;
      totalErrors += result.errors;
    }

    return { success: totalSuccess, errors: totalErrors, skipped: 0 };

  } catch (error) {
    console.error('  ❌ Failed to migrate rabbiStudents:', error);
    return { success: 0, errors: 1, skipped: 0 };
  }
}

// ===== MAIN MIGRATION =====

async function runMigration() {
  const startTime = Date.now();
  const results = {
    collections: {},
    totals: { success: 0, errors: 0, skipped: 0 }
  };

  console.log(options.dryRun ? '🔍 DRY RUN MODE - No data will be modified\n' : '');

  try {
    const collections = options.collection
      ? [options.collection]
      : Object.keys(COLLECTION_MAP);

    for (const collection of collections) {
      // Skip rabbiStudents if we're migrating all (we'll handle it specially)
      if (collection === 'rabbiStudents' && !options.collection) {
        const result = await migrateRabbiStudentsWithVideos();
        results.collections[collection] = result;
        results.totals.success += result.success;
        results.totals.errors += result.errors;
        results.totals.skipped += result.skipped;
      } else if (collection === 'rabbiStudentVideos') {
        // Skip - handled with rabbiStudents
        continue;
      } else {
        const result = await migrateCollection(collection);
        results.collections[collection] = result;
        results.totals.success += result.success;
        results.totals.errors += result.errors;
        results.totals.skipped += result.skipped;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${duration}s`);
    console.log(`✅ Success: ${results.totals.success} documents`);
    console.log(`❌ Errors: ${results.totals.errors} documents`);
    console.log(`⏭️  Skipped: ${results.totals.skipped} documents`);
    console.log('');
    console.log('Per Collection:');
    for (const [collection, result] of Object.entries(results.collections)) {
      console.log(`  ${collection}:`);
      console.log(`    ✅ ${result.success} | ❌ ${result.errors} | ⏭️  ${result.skipped}`);
    }
    console.log('='.repeat(60));

    if (options.dryRun) {
      console.log('\n🔍 This was a DRY RUN - no data was actually migrated');
      console.log('   Run without --dry-run to perform the actual migration\n');
    } else if (results.totals.errors === 0) {
      console.log('\n🎉 Migration completed successfully!\n');
    } else {
      console.log('\n⚠️  Migration completed with errors - please review the logs\n');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { migrateCollection, runMigration };
