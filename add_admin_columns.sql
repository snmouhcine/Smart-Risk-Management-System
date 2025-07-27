-- Add missing admin columns to user_profiles table
-- This script adds both is_admin and role columns for compatibility

-- First check if columns exist and add them if they don't
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

  -- Add subscription_plan_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'subscription_plan_id'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id);
  END IF;
END $$;

-- Update existing admin users
-- Set your admin user email here
UPDATE user_profiles 
SET 
  is_admin = true,
  role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email = 'your-admin-email@example.com' -- CHANGE THIS TO YOUR EMAIL
);

-- Create a trigger to sync is_admin and role columns
CREATE OR REPLACE FUNCTION sync_admin_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_admin = true THEN
    NEW.role = 'admin';
  ELSIF NEW.role = 'admin' THEN
    NEW.is_admin = true;
  ELSIF NEW.is_admin = false AND NEW.role = 'admin' THEN
    NEW.role = 'user';
  ELSIF NEW.role != 'admin' AND NEW.is_admin = true THEN
    NEW.is_admin = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS sync_admin_columns_trigger ON user_profiles;

-- Create trigger
CREATE TRIGGER sync_admin_columns_trigger
BEFORE INSERT OR UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_admin_columns();

-- Update RLS policies to work with both columns
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
CREATE POLICY "Admins can view all profiles" ON user_profiles
FOR SELECT USING (
  auth.uid() = id OR 
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND (is_admin = true OR role = 'admin')
  )
);

-- Grant necessary permissions
GRANT ALL ON user_profiles TO authenticated;