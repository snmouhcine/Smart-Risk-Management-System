-- Fix production issues

-- 1. Drop existing function if it exists
DROP FUNCTION IF EXISTS update_site_setting(text, jsonb);

-- 2. Fix the infinite recursion in user_profiles RLS
-- First, let's see what policies exist
DO $$ 
BEGIN
  -- Drop all existing policies on user_profiles to fix recursion
  DROP POLICY IF EXISTS "Users can view own profile only" ON user_profiles;
  DROP POLICY IF EXISTS "Users can update own profile only" ON user_profiles;
  DROP POLICY IF EXISTS "Users can insert own profile only" ON user_profiles;
  DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
  
  -- Create simple, non-recursive policies
  CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
  
  CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);
  
  CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
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

  -- Add other missing columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
  END IF;
END $$;

-- 4. Make sure your user has a profile and is admin
-- IMPORTANT: Replace 'your-email@example.com' with your actual email
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

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create simple policies for payments
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

-- 6. Now create site_settings table safely
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default settings only if they don't exist
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

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON site_settings;

-- Create policies for site_settings
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

-- Grant permissions
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON payments TO authenticated;