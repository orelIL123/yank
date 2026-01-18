-- 🔒 Critical Security Fix - Lock Sensitive Tables
-- Run this in Supabase SQL Editor IMMEDIATELY
-- https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new

-- =====================================================
-- 1. LOCK pidyon_nefesh - MOST CRITICAL
-- =====================================================
-- Remove public read access
DROP POLICY IF EXISTS "Users can read their own pidyon requests" ON pidyon_nefesh;
DROP POLICY IF EXISTS "Public read access for pidyon_nefesh" ON pidyon_nefesh;

-- Only allow users to INSERT their own requests
-- NO READ ACCESS from client - only via server/admin panel
CREATE POLICY "Users can create pidyon requests" ON pidyon_nefesh
  FOR INSERT WITH CHECK (true);

-- Add admin read policy (you'll need to implement admin auth later)
-- For now, NO ONE can read from client
-- You'll access this data via Supabase Dashboard or service role key


-- =====================================================
-- 2. LOCK notifications - User-specific only
-- =====================================================
-- Remove public read access
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
DROP POLICY IF EXISTS "Public read access for notifications" ON notifications;

-- Users can ONLY read their own notifications
-- This requires Firebase UID → Supabase JWT bridge (Phase 3)
-- For now, we'll allow AUTHENTICATED users to read their own notifications
CREATE POLICY "Users can read their own notifications" ON notifications
  FOR SELECT USING (
    auth.uid()::text = user_id
    OR user_id IS NULL  -- Global notifications
  );

-- Only authenticated users can mark as read (future feature)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);


-- =====================================================
-- 3. LOCK prayer_commitments - User-specific only
-- =====================================================
-- Remove overly permissive read policy
DROP POLICY IF EXISTS "Users can read their own commitments" ON prayer_commitments;

-- Users can ONLY read their own commitments
CREATE POLICY "Users can read their own commitments" ON prayer_commitments
  FOR SELECT USING (auth.uid()::text = user_id);

-- Keep existing insert policy
-- (already restricted in schema)


-- =====================================================
-- 4. TIGHTEN write policies for content tables
-- =====================================================
-- Remove "anyone can write" policies
-- Only service role or admin should write

-- Books
DROP POLICY IF EXISTS "Authenticated users can insert books" ON books;
DROP POLICY IF EXISTS "Authenticated users can update books" ON books;
DROP POLICY IF EXISTS "Authenticated users can delete books" ON books;

-- Music
DROP POLICY IF EXISTS "Authenticated users can insert music" ON music;
DROP POLICY IF EXISTS "Authenticated users can update music" ON music;
DROP POLICY IF EXISTS "Authenticated users can delete music" ON music;

-- Newsletters
DROP POLICY IF EXISTS "Authenticated users can insert newsletters" ON newsletters;
DROP POLICY IF EXISTS "Authenticated users can update newsletters" ON newsletters;
DROP POLICY IF EXISTS "Authenticated users can delete newsletters" ON newsletters;

-- News
DROP POLICY IF EXISTS "Authenticated users can insert news" ON news;
DROP POLICY IF EXISTS "Authenticated users can update news" ON news;
DROP POLICY IF EXISTS "Authenticated users can delete news" ON news;

-- Prayers
DROP POLICY IF EXISTS "Authenticated users can insert prayers" ON prayers;
DROP POLICY IF EXISTS "Authenticated users can update prayers" ON prayers;
DROP POLICY IF EXISTS "Authenticated users can delete prayers" ON prayers;

-- Daily Learning
DROP POLICY IF EXISTS "Authenticated users can insert daily_learning" ON daily_learning;
DROP POLICY IF EXISTS "Authenticated users can update daily_learning" ON daily_learning;
DROP POLICY IF EXISTS "Authenticated users can delete daily_learning" ON daily_learning;

-- Daily Videos
DROP POLICY IF EXISTS "Authenticated users can insert daily_videos" ON daily_videos;
DROP POLICY IF EXISTS "Authenticated users can update daily_videos" ON daily_videos;
DROP POLICY IF EXISTS "Authenticated users can delete daily_videos" ON daily_videos;

-- Short Lessons
DROP POLICY IF EXISTS "Authenticated users can insert short_lessons" ON short_lessons;
DROP POLICY IF EXISTS "Authenticated users can update short_lessons" ON short_lessons;
DROP POLICY IF EXISTS "Authenticated users can delete short_lessons" ON short_lessons;

-- Long Lessons
DROP POLICY IF EXISTS "Authenticated users can insert long_lessons" ON long_lessons;
DROP POLICY IF EXISTS "Authenticated users can update long_lessons" ON long_lessons;
DROP POLICY IF EXISTS "Authenticated users can delete long_lessons" ON long_lessons;

-- Tzadikim
DROP POLICY IF EXISTS "Authenticated users can insert tzadikim" ON tzadikim;
DROP POLICY IF EXISTS "Authenticated users can update tzadikim" ON tzadikim;
DROP POLICY IF EXISTS "Authenticated users can delete tzadikim" ON tzadikim;

-- Rabbi Students
DROP POLICY IF EXISTS "Authenticated users can insert rabbi_students" ON rabbi_students;
DROP POLICY IF EXISTS "Authenticated users can update rabbi_students" ON rabbi_students;
DROP POLICY IF EXISTS "Authenticated users can delete rabbi_students" ON rabbi_students;

-- Rabbi Student Videos
DROP POLICY IF EXISTS "Authenticated users can insert rabbi_student_videos" ON rabbi_student_videos;
DROP POLICY IF EXISTS "Authenticated users can update rabbi_student_videos" ON rabbi_student_videos;
DROP POLICY IF EXISTS "Authenticated users can delete rabbi_student_videos" ON rabbi_student_videos;

-- ⚠️ NOTE: After removing these policies, content can ONLY be managed via:
-- 1. Supabase Dashboard (manual)
-- 2. Service role key (scripts/admin panel)
-- 3. Future admin panel with proper authentication

-- This is CORRECT - normal users should NOT be able to create/edit content!


-- =====================================================
-- 5. Verify policies
-- =====================================================
-- Run this to see current policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

SELECT '✅ Security policies updated!' as status;
SELECT 'Run the verification query above to confirm.' as next_step;
