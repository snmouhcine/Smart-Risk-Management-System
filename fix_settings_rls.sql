-- Fix RLS policies for site_settings table
-- This script should be run after the initial table creation

-- First, temporarily disable RLS to insert default values
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- Make sure default settings exist
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
  ('dark_mode', 'true', 'appearance'),
  ('stripe_webhook_secret', '""', 'payment'),
  ('smtp_host', '""', 'email'),
  ('smtp_port', '587', 'email'),
  ('smtp_user', '""', 'email'),
  ('smtp_password', '""', 'email'),
  ('email_from_name', '"Smart Risk Management"', 'email'),
  ('email_from_address', '"noreply@smartrisk.com"', 'email')
ON CONFLICT (key) DO NOTHING;

-- Re-enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can update settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON site_settings;

-- Create new policies
-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON site_settings
  FOR SELECT USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Alternative: If you want to allow service role to bypass RLS
-- This is useful for Edge Functions
CREATE POLICY "Service role can manage settings" ON site_settings
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Grant necessary permissions
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON site_settings TO service_role;