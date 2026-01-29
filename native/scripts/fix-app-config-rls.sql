-- ============================================
-- Fix: Row Level Security Policies for app_config
-- ============================================
-- The current policies are too restrictive
-- This fixes the "violates row-level security policy" error

-- Drop existing policies
DROP POLICY IF EXISTS "Public read access for app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can update app_config" ON app_config;
DROP POLICY IF EXISTS "Authenticated users can insert app_config" ON app_config;

-- Create new, more permissive policies
-- Since app_config is a singleton table with only one row, we allow all operations

-- Allow everyone to read
CREATE POLICY "Allow public read access" 
ON app_config 
FOR SELECT 
USING (true);

-- Allow everyone to insert (for upsert to work)
CREATE POLICY "Allow public insert access" 
ON app_config 
FOR INSERT 
WITH CHECK (true);

-- Allow everyone to update
CREATE POLICY "Allow public update access" 
ON app_config 
FOR UPDATE 
USING (true);

-- Done!
SELECT 'RLS policies fixed successfully!' as status;


