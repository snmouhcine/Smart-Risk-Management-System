-- TEMPORARY: Disable RLS on user_profiles to fix payment flow
-- WARNING: Only use this for testing, re-enable RLS in production!

-- Disable RLS on user_profiles table
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Grant full access to authenticated users
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- Test update query
-- UPDATE user_profiles SET is_subscribed = true WHERE email = 'naim@3fs.be';

-- To re-enable RLS later:
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;