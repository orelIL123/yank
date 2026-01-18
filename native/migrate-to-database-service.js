#!/usr/bin/env node
/**
 * Migration Script: Firestore → Database Service
 * Replaces all Firestore imports and calls with the new database service
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, 'src', 'screens');
const files = [
  'BooksScreen.jsx',
  'NewslettersScreen.jsx',
  'DailyLearningScreen.jsx',
  'PidyonNefeshScreen.jsx',
  'NewsScreen.jsx',
  'PrayersScreen.jsx',
  'MiBeitRabeinuScreen.jsx',
  'BeitMidrashScreen.jsx',
  'TzadikimScreen.jsx',
  'NotificationsScreen.jsx',
  'ShortLessonsScreen.jsx',
  'LongLessonsScreen.jsx',
  'PrayerCommitmentScreen.jsx',
  'DailyInsightScreen.jsx',
  'AdminScreen.jsx',
];

function migrateFile(filePath) {
  console.log(`\n🔄 Migrating: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;

  // 1. Replace Firestore imports with database service
  const firestoreImportRegex = /import\s+{[^}]*}\s+from\s+['"]firebase\/firestore['"]/g;
  if (content.match(firestoreImportRegex)) {
    // Remove the firestore import line entirely
    content = content.replace(firestoreImportRegex, '');
    changes++;
    console.log('  ✓ Removed Firestore import');
  }

  // 2. Check if db import from firebase exists
  const dbImportRegex = /import\s+{([^}]*)}\s+from\s+['"]\.\.?\/config\/firebase['"]/;
  const dbMatch = content.match(dbImportRegex);

  if (dbMatch) {
    // Remove 'db' from the firebase import
    let imports = dbMatch[1].split(',').map(s => s.trim()).filter(s => s !== 'db');

    if (imports.length > 0) {
      content = content.replace(dbImportRegex, `import { ${imports.join(', ')} } from '../config/firebase'`);
    } else {
      // If only db was imported, remove the line
      content = content.replace(dbImportRegex, '');
    }

    // Add database service import after firebase imports
    if (!content.includes("import db from '../services/database'")) {
      const firebaseConfigImport = content.indexOf("from '../config/firebase'");
      if (firebaseConfigImport !== -1) {
        const lineEnd = content.indexOf('\n', firebaseConfigImport);
        content = content.slice(0, lineEnd + 1) + "import db from '../services/database'\n" + content.slice(lineEnd + 1);
      } else {
        // Add at the beginning after other imports
        const lastImport = content.lastIndexOf('import ');
        const lineEnd = content.indexOf('\n', lastImport);
        content = content.slice(0, lineEnd + 1) + "import db from '../services/database'\n" + content.slice(lineEnd + 1);
      }
    }
    changes++;
    console.log('  ✓ Added database service import');
  } else if (!content.includes("import db from '../services/database'")) {
    // No firebase import, just add db service import
    const lastImport = content.lastIndexOf('import ');
    const lineEnd = content.indexOf('\n', lastImport);
    content = content.slice(0, lineEnd + 1) + "import db from '../services/database'\n" + content.slice(lineEnd + 1);
    changes++;
    console.log('  ✓ Added database service import');
  }

  // 3. Replace Timestamp.fromDate() with toISOString()
  const timestampFromDateRegex = /Timestamp\.fromDate\(([^)]+)\)/g;
  if (content.match(timestampFromDateRegex)) {
    content = content.replace(timestampFromDateRegex, '$1.toISOString()');
    changes++;
    console.log('  ✓ Replaced Timestamp.fromDate() with toISOString()');
  }

  // 4. Replace Timestamp.now() with new Date().toISOString()
  const timestampNowRegex = /Timestamp\.now\(\)/g;
  if (content.match(timestampNowRegex)) {
    content = content.replace(timestampNowRegex, 'new Date().toISOString()');
    changes++;
    console.log('  ✓ Replaced Timestamp.now() with new Date().toISOString()');
  }

  // 5. Replace serverTimestamp() with new Date().toISOString()
  const serverTimestampRegex = /serverTimestamp\(\)/g;
  if (content.match(serverTimestampRegex)) {
    content = content.replace(serverTimestampRegex, 'new Date().toISOString()');
    changes++;
    console.log('  ✓ Replaced serverTimestamp() with new Date().toISOString()');
  }

  // 6. Replace simple getDocs queries
  // Pattern: const querySnapshot = await getDocs(query(...))
  const getDocsPattern = /const\s+(\w+)\s+=\s+await\s+getDocs\(query\(\s*collection\(db,\s*['"](\w+)['"]\)(.*?)\)\)/gs;
  content = content.replace(getDocsPattern, (match, varName, collectionName, queryParams) => {
    changes++;
    console.log(`  ✓ Replaced getDocs query for collection: ${collectionName}`);

    // Parse query parameters
    let options = {};

    // Extract orderBy
    const orderByMatch = queryParams.match(/orderBy\(['"](\w+)['"],\s*['"](\w+)['"]\)/);
    if (orderByMatch) {
      options.orderBy = `{ field: '${orderByMatch[1]}', direction: '${orderByMatch[2]}' }`;
    } else if (queryParams.includes('orderBy')) {
      const simpleOrderBy = queryParams.match(/orderBy\(['"](\w+)['"]\)/);
      if (simpleOrderBy) {
        options.orderBy = `{ field: '${simpleOrderBy[1]}', direction: 'desc' }`;
      }
    }

    // Extract limit
    const limitMatch = queryParams.match(/limit\((\d+)\)/);
    if (limitMatch) {
      options.limit = limitMatch[1];
    }

    // Extract where clauses
    const whereMatches = [...queryParams.matchAll(/where\(['"](\w+)['"],\s*['"]([^'"]+)['"],\s*([^)]+)\)/g)];
    if (whereMatches.length > 0) {
      const whereClauses = whereMatches.map(m => `['${m[1]}', '${m[2]}', ${m[3]}]`).join(', ');
      options.where = `[${whereClauses}]`;
    }

    // Build options object
    let optionsStr = '';
    if (Object.keys(options).length > 0) {
      const parts = [];
      if (options.where) parts.push(`where: ${options.where}`);
      if (options.orderBy) parts.push(`orderBy: ${options.orderBy}`);
      if (options.limit) parts.push(`limit: ${options.limit}`);
      optionsStr = `, {\n          ${parts.join(',\n          ')}\n        }`;
    }

    return `const ${varName} = await db.getCollection('${collectionName}'${optionsStr})`;
  });

  // 7. Replace .docs.map(doc => ({ id: doc.id, ...doc.data() }))
  // Since db.getCollection already returns the right format
  const docsMapPattern = /(\w+)\.docs\.map\(doc\s*=>\s*\(?\{\s*id:\s*doc\.id,\s*\.\.\.doc\.data\(\)\s*\}\)?\)/g;
  if (content.match(docsMapPattern)) {
    content = content.replace(docsMapPattern, '$1');
    changes++;
    console.log('  ✓ Removed .docs.map() transformation (no longer needed)');
  }

  // 8. Replace addDoc calls
  const addDocPattern = /await\s+addDoc\(collection\(db,\s*['"](\w+)['"]\),\s*(\{[^}]+\})\)/gs;
  content = content.replace(addDocPattern, (match, collectionName, data) => {
    changes++;
    console.log(`  ✓ Replaced addDoc for collection: ${collectionName}`);
    return `await db.addDocument('${collectionName}', ${data})`;
  });

  // 9. Replace updateDoc calls
  const updateDocPattern = /await\s+updateDoc\(doc\(db,\s*['"](\w+)['"],\s*(\w+)\),\s*(\{[^}]+\})\)/gs;
  content = content.replace(updateDocPattern, (match, collectionName, docId, updates) => {
    changes++;
    console.log(`  ✓ Replaced updateDoc for collection: ${collectionName}`);
    return `await db.updateDocument('${collectionName}', ${docId}, ${updates})`;
  });

  // 10. Replace deleteDoc calls
  const deleteDocPattern = /await\s+deleteDoc\(doc\(db,\s*['"](\w+)['"],\s*(\w+)\)\)/gs;
  content = content.replace(deleteDocPattern, (match, collectionName, docId) => {
    changes++;
    console.log(`  ✓ Replaced deleteDoc for collection: ${collectionName}`);
    return `await db.deleteDocument('${collectionName}', ${docId})`;
  });

  // 11. Clean up empty lines (remove multiple consecutive empty lines)
  content = content.replace(/\n\n\n+/g, '\n\n');

  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated ${path.basename(filePath)} - ${changes} changes made`);
    return true;
  } else {
    console.log(`⏭️  Skipped ${path.basename(filePath)} - no changes needed`);
    return false;
  }
}

// Run migration
console.log('🚀 Starting Firestore → Database Service migration...\n');
console.log(`📂 Screens directory: ${SCREENS_DIR}\n`);

let migrated = 0;
let skipped = 0;
let errors = 0;

files.forEach(file => {
  const filePath = path.join(SCREENS_DIR, file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    errors++;
    return;
  }

  try {
    if (migrateFile(filePath)) {
      migrated++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${file}:`, error.message);
    errors++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Migration Summary:');
console.log('='.repeat(60));
console.log(`✅ Migrated: ${migrated} files`);
console.log(`⏭️  Skipped: ${skipped} files`);
console.log(`❌ Errors: ${errors} files`);
console.log('='.repeat(60));

if (errors === 0) {
  console.log('\n🎉 Migration completed successfully!\n');
  console.log('Next steps:');
  console.log('1. Review the changes in each file');
  console.log('2. Test the application');
  console.log('3. Fix any remaining manual conversions needed');
} else {
  console.log('\n⚠️  Migration completed with errors. Please review the output above.\n');
}
