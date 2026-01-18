#!/usr/bin/env node
/**
 * Fix remaining Firestore query patterns
 */

const fs = require('fs');
const path = require('path');

const SCREENS_DIR = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(SCREENS_DIR).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

function fixFile(filePath) {
  console.log(`\n🔧 Fixing: ${path.basename(filePath)}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  const originalContent = content;

  // Fix patterns like:
  // const q = query(collection(db, 'news'), orderBy('date', 'desc'), limit(20))
  // const querySnapshot = await getDocs(q)
  // const data = querySnapshot

  // Pattern 1: Multi-line query with getDocs
  const multiLinePattern = /const\s+(\w+)\s+=\s+query\(\s*collection\(db,\s*['"](\w+)['"]\)([\s\S]*?)\)\s*const\s+\w+\s+=\s+await\s+getDocs\(\1\)\s*const\s+(\w+)\s+=\s+\w+/g;

  content = content.replace(multiLinePattern, (match, queryVar, collectionName, params, resultVar) => {
    console.log(`  🔍 Found multi-line query pattern for: ${collectionName}`);
    changes++;

    // Parse parameters
    let orderByMatch = params.match(/orderBy\(['"](\w+)['"],?\s*['"]?(\w+)?['"]?\)/);
    let limitMatch = params.match(/limit\((\d+)\)/);
    let whereMatches = [...params.matchAll(/where\(['"](\w+)['"],\s*['"]([^'"]+)['"],\s*([^)]+)\)/g)];

    let options = [];

    if (whereMatches.length > 0) {
      const whereClauses = whereMatches.map(m => {
        let value = m[3].trim();
        return `['${m[1]}', '${m[2]}', ${value}]`;
      }).join(', ');
      options.push(`where: [${whereClauses}]`);
    }

    if (orderByMatch) {
      const direction = orderByMatch[2] || 'desc';
      options.push(`orderBy: { field: '${orderByMatch[1]}', direction: '${direction}' }`);
    }

    if (limitMatch) {
      options.push(`limit: ${limitMatch[1]}`);
    }

    const optionsStr = options.length > 0 ? `, {\n        ${options.join(',\n        ')}\n      }` : '';

    return `const ${resultVar} = await db.getCollection('${collectionName}'${optionsStr})`;
  });

  // Pattern 2: Simple inline query
  const inlinePattern = /const\s+\w+\s+=\s+await\s+getDocs\(query\(collection\(db,\s*['"](\w+)['"]\)(.*?)\)\)/gs;

  content = content.replace(inlinePattern, (match, collectionName, params) => {
    // Skip if already converted
    if (match.includes('db.getCollection')) return match;

    console.log(`  🔍 Found inline query pattern for: ${collectionName}`);
    changes++;

    // Parse parameters
    let orderByMatch = params.match(/orderBy\(['"](\w+)['"],?\s*['"]?(\w+)?['"]?\)/);
    let limitMatch = params.match(/limit\((\d+)\)/);
    let whereMatches = [...params.matchAll(/where\(['"](\w+)['"],\s*['"]([^'"]+)['"],\s*([^)]+)\)/g)];

    let options = [];

    if (whereMatches.length > 0) {
      const whereClauses = whereMatches.map(m => {
        let value = m[3].trim();
        return `['${m[1]}', '${m[2]}', ${value}]`;
      }).join(', ');
      options.push(`where: [${whereClauses}]`);
    }

    if (orderByMatch) {
      const direction = orderByMatch[2] || 'desc';
      options.push(`orderBy: { field: '${orderByMatch[1]}', direction: '${direction}' }`);
    }

    if (limitMatch) {
      options.push(`limit: ${limitMatch[1]}`);
    }

    const optionsStr = options.length > 0 ? `, {\n        ${options.join(',\n        ')}\n      }` : '';

    const varMatch = match.match(/const\s+(\w+)\s+=/);
    const varName = varMatch ? varMatch[1] : 'data';

    return `const ${varName} = await db.getCollection('${collectionName}'${optionsStr})`;
  });

  // Remove leftover query() and collection() imports/calls
  content = content.replace(/const\s+\w+\s+=\s+query\([^)]+\)\s*\n/g, '');
  content = content.replace(/const\s+\w+\s+=\s+await\s+getDocs\(\w+\)\s*\n/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${path.basename(filePath)} - ${changes} patterns replaced`);
    return true;
  } else {
    console.log(`⏭️  No changes needed for ${path.basename(filePath)}`);
    return false;
  }
}

// Run fixes
console.log('🚀 Fixing remaining query patterns...\n');

let fixed = 0;
let skipped = 0;

files.forEach(file => {
  const filePath = path.join(SCREENS_DIR, file);
  try {
    if (fixFile(filePath)) {
      fixed++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Fixed: ${fixed} files`);
console.log(`⏭️  Skipped: ${skipped} files`);
console.log('='.repeat(60));
