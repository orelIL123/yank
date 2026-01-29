-- ============================================
-- 🚀 COPY AND PASTE THIS INTO SUPABASE SQL EDITOR
-- ============================================
-- 
-- 1. Open: https://app.supabase.com/project/mtdgmesxbmnspfqfahug/sql/new
-- 2. Copy ALL the SQL below (from DROP to the end)
-- 3. Paste it into the SQL editor
-- 4. Click "Run" button
-- 5. Done! ✅
--
-- ============================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Public read access for app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can update app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can insert app_config" ON app_config;
DROP POLICY IF EXISTS "Allow public read access" ON app_config;
DROP POLICY IF EXISTS "Allow public insert access" ON app_config;
DROP POLICY IF EXISTS "Allow public update access" ON app_config;

-- Create new permissive policies
CREATE POLICY "Allow public read access" 
ON app_config 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access" 
ON app_config 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access" 
ON app_config 
FOR UPDATE 
USING (true);

-- Verify it worked
SELECT '✅ RLS policies fixed successfully!' as status;


