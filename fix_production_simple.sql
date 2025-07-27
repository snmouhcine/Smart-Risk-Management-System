-- Simple fix for production - no recursion

-- STEP 1: Temporarily disable RLS to fix everything
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Add missing columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- STEP 3: Make sure you have a profile and set as admin
-- IMPORTANT: Change this to YOUR email address!
INSERT INTO user_profiles (id, full_name, is_admin, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email),
  true,
  'admin'
FROM auth.users 
WHERE email = 'your-email@example.com' -- CHANGE THIS TO YOUR EMAIL!
ON CONFLICT (id) DO UPDATE 
SET 
  is_admin = true,
  role = 'admin';

-- STEP 4: Drop ALL existing policies
DO $$ 
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON user_profiles', policy_record.policyname);
  END LOOP;
END $$;

-- STEP 5: Create simple, non-recursive policies
CREATE POLICY "Enable read access for users" ON user_profiles
  FOR SELECT USING (true); -- Everyone can read profiles for now

CREATE POLICY "Enable update for users" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable insert for users" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 6: Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create missing tables
-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT NOT NULL,
  payment_method TEXT,
  stripe_payment_intent_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for payment owners" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings
INSERT INTO site_settings (key, value, category) VALUES
  ('site_name', '"Smart Risk Management"', 'general'),
  ('site_title', '"Smart Risk Management - Gestion intelligente des risques"', 'general'),
  ('site_url', '"https://smartrisk.com"', 'general'),
  ('site_favicon', '"/favicon.ico"', 'general'),
  ('contact_email', '"contact@smartrisk.com"', 'email'),
  ('support_email', '"support@smartrisk.com"', 'email'),
  ('maintenance_mode', 'false', 'general'),
  ('allow_registrations', 'true', 'security'),
  ('require_email_verification', 'true', 'security'),
  ('primary_color', '"#3B82F6"', 'appearance'),
  ('secondary_color', '"#8B5CF6"', 'appearance'),
  ('dark_mode', 'true', 'appearance')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON site_settings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE is_admin = true
    )
  );

-- STEP 8: Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON site_settings TO authenticated;

-- STEP 9: Verify your setup
SELECT 
  'Your email' as info,
  u.email,
  'Has profile?' as status,
  CASE WHEN p.id IS NOT NULL THEN 'YES' ELSE 'NO' END as has_profile,
  'Is admin?' as admin_status,
  COALESCE(p.is_admin::text, 'false') as is_admin
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE u.email = 'your-email@example.com'; -- CHANGE THIS TO YOUR EMAIL!