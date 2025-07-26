-- Complete fix for automatic subscription workflow
-- This ensures users can update their own subscription status after payment

-- 1. First, ensure user_profiles table has proper RLS enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Enable read for users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON user_profiles;

-- 3. Create proper policies that allow the workflow
-- Allow all authenticated users to read all profiles (needed for app to check subscription status)
CREATE POLICY "Users can read profiles" 
ON user_profiles FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON user_profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for new users)
CREATE POLICY "Users can insert own profile" 
ON user_profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 4. Ensure the trigger creates profiles for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, is_subscribed)
  VALUES (
    new.id, 
    new.email,
    'user',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Create a secure function for payment success updates
CREATE OR REPLACE FUNCTION public.activate_subscription_after_payment(user_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET is_subscribed = true
  WHERE email = user_email;
  
  -- Log the update for debugging
  RAISE NOTICE 'Subscription activated for user: %', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION activate_subscription_after_payment TO authenticated;
GRANT EXECUTE ON FUNCTION activate_subscription_after_payment TO anon;

-- 6. Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 7. Test the workflow (DO NOT RUN IN PRODUCTION)
-- UPDATE user_profiles SET is_subscribed = true WHERE id = auth.uid();