-- Fix RLS policies for user_profiles to ensure users can read their own profile

-- First, let's check what's blocking the profile fetch
-- Drop all existing SELECT policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;

-- Create a single, simple policy that allows users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Create a separate policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.user_profiles 
      WHERE role = 'admin'::user_role
    )
  );

-- Ensure the email column is populated for all users
UPDATE public.user_profiles up
SET email = u.email
FROM auth.users u
WHERE up.id = u.id AND up.email IS NULL;

-- Check if there are any users without profiles and create them
INSERT INTO public.user_profiles (id, email, role)
SELECT 
  u.id,
  u.email,
  'user'::user_role
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verify the fix
SELECT 
  'Total auth users:' as metric,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Total user profiles:' as metric,
  COUNT(*) as count
FROM public.user_profiles
UNION ALL
SELECT 
  'Profiles with email:' as metric,
  COUNT(*) as count
FROM public.user_profiles
WHERE email IS NOT NULL;