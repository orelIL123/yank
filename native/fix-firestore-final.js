#!/usr/bin/env node
/**
 * Final cleanup - replace all remaining Firestore patterns
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, 'src', 'screens');

function fixComplexQueries(content) {
  let changes = 0;

  // Pattern: const q = query(collection(db, 'xxx'), ...)
  // Followed by: const querySnapshot = await getDocs(q)
  const complexQueryPattern = /const\s+(\w+)\s+=\s+query\(\s*collection\(db,\s*['"](\w+)['"]\)(.*?)\)\s+const\s+\w+\s+=\s+await\s+getDocs\(\1\)/gs;

  content = content.replace(complexQueryPattern, (match, queryVar, collectionName, params) => {
    console.log(`  🔧 Fixing complex query for: ${collectionName}`);
    changes++;

    // Parse parameters
    let orderByMatch = params.match(/orderBy\(['"](\w+)['"],?\s*['"]?(\w+)?['"]?\)/);
    let limitMatch = params.match(/limit\((\d+)\)/);
    let whereMatches = [...params.matchAll(/where\(['"](\w+)['"],\s*['"]([^'"]+)['"],\s*([^)]+)\)/g)];

    let options = [];

    if (whereMatches.length > 0) {
      const whereClauses = whereMatches.map(m => {
        let value = m[3].trim();
        // Handle special cases
        if (value === 'auth.currentUser.uid' || value === 'auth.currentUser?.uid') {
          value = 'auth.currentUser.uid';
        }
        return `['${m[1]}', '${m[2]}', ${value}]`;
      }).join(',\n          ');
      options.push(`where: [\n          ${whereClauses}\n        ]`);
    }

    if (orderByMatch) {
      const direction = orderByMatch[2] || 'desc';
      options.push(`orderBy: { field: '${orderByMatch[1]}', direction: '${direction}' }`);
    }

    if (limitMatch) {
      options.push(`limit: ${limitMatch[1]}`);
    }

    const optionsStr = options.length > 0 ? `, {\n        ${options.join(',\n        ')}\n      }` : '';

    return `const ${queryVar}Data = await db.getCollection('${collectionName}'${optionsStr})`;
  });

  // Clean up remaining getDocs and querySnapshot references
  content = content.replace(/const\s+querySnapshot\s+=\s+await\s+getDocs\(\w+\)\s*/g, '');
  content = content.replace(/querySnapshot\.docs\.forEach\(/g, 'querySnapshotData.forEach(');
  content = content.replace(/querySnapshot\.forEach\(/g, 'querySnapshotData.forEach(');
  content = content.replace(/querySnapshot\.empty/g, '(!querySnapshotData || querySnapshotData.length === 0)');
  content = content.replace(/!querySnapshot\.empty/g, '(querySnapshotData && querySnapshotData.length > 0)');
  content = content.replace(/querySnapshot\.docs\.length/g, 'querySnapshotData.length');
  content = content.replace(/querySnapshot\.docs\.map/g, 'querySnapshotData.map');
  content = content.replace(/querySnapshot\.docs\.filter/g, 'querySnapshotData.filter');
  content = content.replace(/querySnapshot\.size/g, 'querySnapshotData.length');

  // Remove doc.data() calls - data is already in the object
  content = content.replace(/\.\.\.doc\.data\(\)/g, '...doc');
  content = content.replace(/doc\.data\(\)/g, 'doc');

  // Replace getDocs(query(...))
  content = content.replace(/\(await\s+getDocs\((\w+)\)\)\.size/g, '(await db.getCollection(...)).length');

  return { content, changes };
}

// Get all screen files
const files = fs.readdirSync(SCREENS_DIR).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

console.log('🔧 Final Firestore cleanup...\n');

let totalChanges = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(SCREENS_DIR, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if file has collection(db
  if (!content.includes('collection(db')) {
    return;
  }

  console.log(`📝 Processing: ${file}`);

  const { content: newContent, changes } = fixComplexQueries(content);

  if (changes > 0) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✅ Made ${changes} changes`);
    totalChanges += changes;
    filesModified++;
  } else {
    console.log(`  ⏭️  No changes needed`);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 Summary: ${totalChanges} changes in ${filesModified} files`);
console.log('='.repeat(60));
