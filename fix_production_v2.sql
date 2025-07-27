-- Fix production issues v2 - Handles existing policies better

-- 1. Drop existing function if it exists
DROP FUNCTION IF EXISTS update_site_setting(text, jsonb);

-- 2. Fix RLS policies - Drop ALL existing policies first
DO $$ 
DECLARE
  policy_name TEXT;
BEGIN
  -- Drop all policies on user_profiles
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_profiles', policy_name);
  END LOOP;
  
  -- Now create clean policies
  CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
  
  CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);
  
  CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
    
  -- Add admin policy for viewing all profiles
  CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
      auth.uid() = id OR 
      EXISTS (
        SELECT 1 FROM user_profiles admin_check
        WHERE admin_check.id = auth.uid() 
        AND (admin_check.is_admin = true OR admin_check.role = 'admin')
      )
    );
END $$;

-- 3. Add missing columns to user_profiles if they don't exist
DO $$ 
BEGIN
  -- Add is_admin column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;

  -- Add role column if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;

  -- Add is_subscribed column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'is_subscribed'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_subscribed BOOLEAN DEFAULT false;
  END IF;

  -- Add stripe_customer_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  -- Add stripe_subscription_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- Add subscription_status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  END IF;

  -- Add subscription_plan_id column if it doesn't exist (without foreign key for now)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'subscription_plan_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_plan_id UUID;
  END IF;
END $$;

-- 4. Create your admin profile
-- IMPORTANT: Replace with your actual email address!
INSERT INTO user_profiles (id, full_name, is_admin, role)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email),
  true,
  'admin'
FROM auth.users 
WHERE email = 'your-email@example.com' -- CHANGE THIS TO YOUR EMAIL
ON CONFLICT (id) DO UPDATE 
SET 
  is_admin = true,
  role = 'admin';

-- 5. Create the payments table if it doesn't exist
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

-- Enable RLS on payments if not already enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Drop existing payment policies
DO $$ 
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON payments', policy_name);
  END LOOP;
END $$;

-- Create payment policies
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- 6. Create site_settings table
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
  ('auto_backup', 'true', 'database'),
  ('backup_frequency', '"daily"', 'database'),
  ('email_notifications', 'true', 'notifications'),
  ('payment_notifications', 'true', 'notifications'),
  ('error_notifications', 'true', 'notifications'),
  ('primary_color', '"#3B82F6"', 'appearance'),
  ('secondary_color', '"#8B5CF6"', 'appearance'),
  ('dark_mode', 'true', 'appearance')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on site_settings
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing site_settings policies
DO $$ 
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_settings'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON site_settings', policy_name);
  END LOOP;
END $$;

-- Create site_settings policies
CREATE POLICY "Anyone can read settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- 7. Grant permissions
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON payments TO authenticated;
GRANT ALL ON user_profiles TO authenticated;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Done! Check the results
SELECT 'Setup complete!' as message;