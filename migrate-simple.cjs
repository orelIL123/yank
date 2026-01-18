/**
 * Simplified Migration Script: Firestore → Supabase
 * Stores all data as JSONB - no schema conflicts!
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZGdtZXN4Ym1uc3BmcWZhaHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI2MTYsImV4cCI6MjA4MjMxODYxNn0.CtmMmT0xrc1-H7lkQdwfs1-oAcmko4jpC3dXJkISZ5M';

const serviceAccount = require('./yank-99f79-firebase-adminsdk-fbsvc-eaa2a3f7de.json');

initializeApp({ credential: cert(serviceAccount) });

const firestoreDb = getFirestore();
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const COLLECTIONS = [
  'books', 'music', 'newsletters', 'news', 'prayers',
  'dailyLearning', 'dailyVideos', 'dailyInsights',
  'shortLessons', 'longLessons', 'tzadikim',
  'notifications', 'pidyonNefesh', 'homeCards',
  'chidushim', 'rabbiStudents', 'beitMidrashVideos',
  'prayerCommitments'
];

const toSnakeCase = (str) => str.replace(/[A-Z]/g, l => `_${l.toLowerCase()}`);

async function migrateCollection(collectionName) {
  const tableName = toSnakeCase(collectionName);
  console.log(`\n📦 ${collectionName} → ${tableName}...`);

  try {
    const snapshot = await firestoreDb.collection(collectionName).get();

    if (snapshot.empty) {
      console.log(`   ⚠️  Empty`);
      return { success: true, count: 0 };
    }

    const docs = [];
    snapshot.forEach(doc => {
      const data = doc.data();

      // Convert Timestamps
      const converted = {};
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value.toDate === 'function') {
          converted[key] = value.toDate().toISOString();
        } else {
          converted[key] = value;
        }
      }

      docs.push({
        id: doc.id,
        data: converted
      });
    });

    console.log(`   📄 ${docs.length} docs`);

    // Insert in batches
    const batchSize = 50;
    let success = 0;

    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const { error } = await supabase.from(tableName).insert(batch);

      if (error) {
        console.error(`   ❌ Batch ${Math.floor(i/batchSize) + 1}: ${error.message}`);
      } else {
        success += batch.length;
        console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} docs`);
      }
    }

    return { success: true, count: success };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, count: 0 };
  }
}

async function migrateSubcollection() {
  console.log(`\n📦 rabbiStudents/videos...`);

  try {
    const categories = await firestoreDb.collection('rabbiStudents').get();
    let total = 0;

    for (const cat of categories.docs) {
      const videos = await firestoreDb
        .collection('rabbiStudents')
        .doc(cat.id)
        .collection('videos')
        .get();

      if (videos.empty) continue;

      const docs = [];
      videos.forEach(v => {
        const data = v.data();
        const converted = {};
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value.toDate === 'function') {
            converted[key] = value.toDate().toISOString();
          } else {
            converted[key] = value;
          }
        }

        docs.push({
          id: v.id,
          category_id: cat.id,
          data: converted
        });
      });

      const { error } = await supabase.from('rabbi_student_videos').insert(docs);

      if (!error) {
        total += docs.length;
        console.log(`   ✅ ${cat.id}: ${docs.length} videos`);
      }
    }

    return { success: true, count: total };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, count: 0 };
  }
}

async function migrate() {
  console.log('🚀 Firestore → Supabase Migration\n');

  const results = {};

  for (const collection of COLLECTIONS) {
    results[collection] = await migrateCollection(collection);
  }

  results['rabbiStudents/videos'] = await migrateSubcollection();

  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));

  let total = 0;
  for (const [name, result] of Object.entries(results)) {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${name.padEnd(25)} ${result.count} docs`);
    total += result.count;
  }

  console.log('='.repeat(50));
  console.log(`✨ Total: ${total} documents migrated`);
  console.log('='.repeat(50));

  process.exit(0);
}

migrate().catch(error => {
  console.error('💥 Fatal:', error);
  process.exit(1);
});
