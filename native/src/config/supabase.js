import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SUPABASE_URL = 'https://mtdgmesxbmnspfqfahug.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZGdtZXN4Ym1uc3BmcWZhaHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3NDI2MTYsImV4cCI6MjA4MjMxODYxNn0.CtmMmT0xrc1-H7lkQdwfs1-oAcmko4jpC3dXJkISZ5M'

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
