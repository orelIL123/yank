import { createClient } from '@supabase/supabase-js'

/**
 * סקריפט להוספת קטגוריות חדשות ל"מבית רבינו" ב-Supabase
 * הרץ עם: cd native && node scripts/addRabbiCategoriesSupabase.js
 */

// Create Supabase client for Node.js (without AsyncStorage)
const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZGdtZXN4Ym1uc3BmcWZhaHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI2MTYsImV4cCI6MjA4MjMxODYxNn0.CtmMmT0xrc1-H7lkQdwfs1-oAcmko4jpC3dXJkISZ5M'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function addCategories() {
  try {
    console.log('🚀 Starting to add categories to Supabase...\n')

    // Category 1: סיפורי הבעש"ט
    console.log('📝 Creating "סיפורי הבעש"ט" category...')
    const beshtId = `besht_${Date.now()}`
    const beshtData = {
      name: 'סיפורי הבעש"ט',
      description: 'סיפורים מופלאים וניסים של הבעל שם טוב הקדוש',
      isActive: true,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: beshtCategory, error: beshtError } = await supabase
      .from('rabbi_students')
      .insert([{
        id: beshtId,
        data: beshtData
      }])
      .select()
      .single()

    if (beshtError) {
      console.error('❌ Error creating besht category:', beshtError)
      throw beshtError
    }

    console.log(`✅ Created category with ID: ${beshtId}`)
    console.log(`   Name: ${beshtData.name}`)
    console.log(`   Description: ${beshtData.description}\n`)

    // Category 2: מהנעשה בבית המדרש
    console.log('📝 Creating "מהנעשה בבית המדרש" category...')
    const yeshivaId = `yeshiva_${Date.now()}`
    const yeshivaData = {
      name: 'מהנעשה בבית המדרש',
      description: 'עדכונים וחדשות מבית המדרש',
      isActive: true,
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: yeshivaCategory, error: yeshivaError } = await supabase
      .from('rabbi_students')
      .insert([{
        id: yeshivaId,
        data: yeshivaData
      }])
      .select()
      .single()

    if (yeshivaError) {
      console.error('❌ Error creating yeshiva category:', yeshivaError)
      throw yeshivaError
    }

    console.log(`✅ Created category with ID: ${yeshivaId}`)
    console.log(`   Name: ${yeshivaData.name}`)
    console.log(`   Description: ${yeshivaData.description}\n`)

    console.log('✅ All categories created successfully!')
    console.log('\n📌 Next steps:')
    console.log('1. Go to Supabase Dashboard → Table Editor')
    console.log('2. Find the "rabbi_students" table')
    console.log('3. You should see the two new categories')
    console.log('4. To add videos, use the "rabbi_student_videos" table')
    console.log('5. Each video needs:')
    console.log('   - category_id: (use one of the category IDs above)')
    console.log('   - data: { title, description, videoUrl/youtubeUrl, createdAt }')
    console.log('\n💡 Example video data:')
    console.log('   category_id: "' + beshtId + '"')
    console.log('   data: {')
    console.log('     title: "סיפור מופלא על הבעש"ט"')
    console.log('     videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"')
    console.log('     youtubeUrl: "https://www.youtube.com/watch?v=VIDEO_ID"')
    console.log('     createdAt: "' + new Date().toISOString() + '"')
    console.log('   }')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Error details:', error.message, error.code)
    process.exit(1)
  }
}

addCategories()

