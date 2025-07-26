-- This SQL script fixes the infinite recursion issue with subscription_plans RLS policies
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to clean up
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Everyone can view active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Enable read for all users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable insert for admin users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable update for admin users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable delete for admin users" ON subscription_plans;

-- Re-enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create new, simpler policies that won't cause recursion
-- Everyone can read subscription plans
CREATE POLICY "public_read_plans" ON subscription_plans
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "admin_all_plans" ON subscription_plans
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 
      FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- Also ensure the features column is JSONB if it isn't already
ALTER TABLE subscription_plans 
ALTER COLUMN features TYPE JSONB USING features::JSONB;