-- Comprehensive fix for RLS policies to prevent infinite recursion
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Disable RLS on both tables temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profiles" ON user_profiles;

-- Step 3: Drop ALL existing policies on subscription_plans
DROP POLICY IF EXISTS "Everyone can view active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Enable read for all users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable insert for admin users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable update for admin users" ON subscription_plans;
DROP POLICY IF EXISTS "Enable delete for admin users" ON subscription_plans;
DROP POLICY IF EXISTS "public_read_plans" ON subscription_plans;
DROP POLICY IF EXISTS "admin_all_plans" ON subscription_plans;

-- Step 4: Create simple, non-recursive policies for user_profiles
CREATE POLICY "allow_user_read_own" ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "allow_user_update_own" ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "allow_user_insert_own" ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin policy that checks role without recursion
CREATE POLICY "allow_admin_all" ON user_profiles
  FOR ALL
  USING (
    auth.uid() = id AND role = 'admin'
  );

-- Step 5: Create simple policies for subscription_plans
CREATE POLICY "allow_public_read" ON subscription_plans
  FOR SELECT
  USING (true);

-- Admin policy for subscription_plans using a direct check
CREATE POLICY "allow_admin_write" ON subscription_plans
  FOR ALL
  USING (
    auth.uid() = 'b1f7dc9f-a792-4306-a585-7051c766a1e5'  -- Your admin user ID
    OR auth.uid() IN (
      SELECT id FROM auth.users 
      WHERE email = 'ryan@3fs.be'
    )
  );

-- Step 6: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Step 7: Grant necessary permissions
GRANT ALL ON subscription_plans TO authenticated;
GRANT ALL ON user_profiles TO authenticated;