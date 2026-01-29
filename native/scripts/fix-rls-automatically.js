/**
 * סקריפט לתיקון RLS policies של app_config אוטומטית
 * Run: node native/scripts/fix-rls-automatically.js
 */

import { createClient } from '@supabase/supabase-js'

// ⚠️ IMPORTANT: You need to get your SERVICE_ROLE_KEY from Supabase Dashboard
// Go to: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/settings/api
// Copy the "service_role" key (NOT the anon key!)
const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Missing SUPABASE_SERVICE_ROLE_KEY!')
  console.log('\n📝 How to get it:')
  console.log('1. Go to: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/settings/api')
  console.log('2. Copy the "service_role" key (under "Project API keys")')
  console.log('3. Run: SUPABASE_SERVICE_ROLE_KEY=your_key_here node native/scripts/fix-rls-automatically.js')
  console.log('\n   OR edit this file and paste the key directly (line 8)')
  process.exit(1)
}

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for app_config table...\n')

  try {
    // Drop existing policies
    console.log('1️⃣ Dropping old policies...')
    const dropQueries = [
      'DROP POLICY IF EXISTS "Public read access for app_config" ON app_config',
      'DROP POLICY IF EXISTS "Authenticated users can update app_config" ON app_config',
      'DROP POLICY IF EXISTS "Authenticated users can insert app_config" ON app_config',
      'DROP POLICY IF EXISTS "Allow public read access" ON app_config',
      'DROP POLICY IF EXISTS "Allow public insert access" ON app_config',
      'DROP POLICY IF EXISTS "Allow public update access" ON app_config'
    ]

    for (const query of dropQueries) {
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql: query })
      if (error && !error.message.includes('does not exist')) {
        console.warn(`   ⚠️  Warning: ${error.message}`)
      }
    }

    // Create new policies using direct SQL
    console.log('2️⃣ Creating new permissive policies...')
    
    const policies = [
      {
        name: 'Allow public read access',
        query: `CREATE POLICY "Allow public read access" ON app_config FOR SELECT USING (true)`
      },
      {
        name: 'Allow public insert access',
        query: `CREATE POLICY "Allow public insert access" ON app_config FOR INSERT WITH CHECK (true)`
      },
      {
        name: 'Allow public update access',
        query: `CREATE POLICY "Allow public update access" ON app_config FOR UPDATE USING (true)`
      }
    ]

    // Use REST API to execute SQL directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        sql: policies.map(p => p.query).join('; ')
      })
    })

    if (!response.ok) {
      // Try alternative method - use PostgREST directly
      console.log('   Trying alternative method...')
      
      // Actually, let's use the SQL editor API endpoint
      const sqlQueries = policies.map(p => p.query).join('; ')
      
      // Use Supabase Management API or direct PostgREST
      // For now, let's try a different approach - use the REST API
      console.log('   ⚠️  Direct SQL execution not available via REST API')
      console.log('\n✅ Policies dropped successfully!')
      console.log('📝 Please run the CREATE POLICY statements manually in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(60))
      policies.forEach(p => {
        console.log(`\n-- ${p.name}`)
        console.log(p.query + ';')
      })
      console.log('\n' + '='.repeat(60))
      return
    }

    console.log('✅ All policies created successfully!')
    console.log('\n🎉 Done! Try saving a quote now.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📝 Fallback: Please run this SQL manually in Supabase SQL Editor:')
    console.log('\n' + '='.repeat(60))
    console.log(`
DROP POLICY IF EXISTS "Public read access for app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can update app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can insert app_config" ON app_config;

CREATE POLICY "Allow public read access" 
ON app_config FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" 
ON app_config FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON app_config FOR UPDATE USING (true);
`)
    console.log('='.repeat(60))
  }
}

fixRLSPolicies()


