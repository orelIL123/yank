/**
 * 🚀 סקריפט פשוט לתיקון RLS - RUN THIS!
 * 
 * הרץ: node native/scripts/fix-rls-simple.js
 * 
 * לפני זה:
 * 1. לך ל: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/settings/api
 * 2. העתק את ה-"service_role" key (לא ה-anon key!)
 * 3. הדבק אותו בשורה 15 למטה
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co'

// ⚠️ הדבק כאן את ה-SERVICE_ROLE_KEY שלך:
const SERVICE_ROLE_KEY = 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE'

if (SERVICE_ROLE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
  console.log('❌ ERROR: You need to paste your SERVICE_ROLE_KEY!')
  console.log('\n📝 How to get it:')
  console.log('1. Go to: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/settings/api')
  console.log('2. Scroll down to "Project API keys"')
  console.log('3. Copy the "service_role" key (the long one, NOT anon)')
  console.log('4. Paste it in line 15 of this file')
  console.log('5. Run: node native/scripts/fix-rls-simple.js')
  process.exit(1)
}

const SQL_QUERY = `
-- Drop old policies
DROP POLICY IF EXISTS "Public read access for app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can update app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can insert app_config" ON app_config;
DROP POLICY IF EXISTS "Allow public read access" ON app_config;
DROP POLICY IF EXISTS "Allow public insert access" ON app_config;
DROP POLICY IF EXISTS "Allow public update access" ON app_config;

-- Create new policies
CREATE POLICY "Allow public read access" ON app_config FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON app_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON app_config FOR UPDATE USING (true);
`

async function fixRLS() {
  console.log('🔧 Fixing RLS policies...\n')

  try {
    // Create admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Try to execute SQL via REST API
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: SQL_QUERY })
    })

    if (response.ok) {
      console.log('✅ Success! RLS policies fixed!')
      console.log('\n🎉 Now try saving a quote in the app!')
    } else {
      const error = await response.text()
      console.error('❌ API Error:', error)
      console.log('\n📝 Fallback: Please run this SQL manually in Supabase SQL Editor:')
      console.log('\n' + '='.repeat(60))
      console.log(SQL_QUERY)
      console.log('='.repeat(60))
      console.log('\n🔗 Go to: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new')
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:')
    console.log('\n' + '='.repeat(60))
    console.log(SQL_QUERY)
    console.log('='.repeat(60))
    console.log('\n🔗 Go to: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new')
  }
}

fixRLS()

