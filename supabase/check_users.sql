-- Diagnostic query to check user data

-- 1. Check all users in auth.users
SELECT 
  'Auth Users' as table_name,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check all user profiles
SELECT 
  'User Profiles' as table_name,
  id,
  email,
  role,
  is_subscribed,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- 3. Check for users without profiles
SELECT 
  'Users without profiles' as issue,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 4. Check user statistics
SELECT 
  'User Statistics' as table_name,
  us.*,
  up.email
FROM public.user_statistics us
LEFT JOIN public.user_profiles up ON us.user_id = up.id
ORDER BY us.created_at DESC;

-- 5. Create missing profiles for existing users
INSERT INTO public.user_profiles (id, email, role, is_subscribed)
SELECT 
  u.id,
  u.email,
  'user'::user_role,
  false
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 6. Create missing statistics for existing users
INSERT INTO public.user_statistics (user_id)
SELECT 
  u.id
FROM auth.users u
LEFT JOIN public.user_statistics us ON u.id = us.user_id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 7. Final count check
SELECT 
  'Final counts after fixes' as status,
  (SELECT COUNT(*) FROM auth.users) as auth_users,
  (SELECT COUNT(*) FROM public.user_profiles) as user_profiles,
  (SELECT COUNT(*) FROM public.user_statistics) as user_statistics;