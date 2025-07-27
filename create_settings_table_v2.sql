-- Complete SQL script to create and setup site_settings table
-- Run this entire script in your Supabase SQL editor

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS site_settings CASCADE;

-- Create site_settings table
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create an index for faster key lookups
CREATE INDEX idx_site_settings_key ON site_settings(key);

-- Insert default settings (RLS is not enabled yet, so this will work)
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
  ('email_from_address', '"noreply@smartrisk.com"', 'email');

-- Enable RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Service role bypass (for Edge Functions)
CREATE POLICY "Service role bypass" ON site_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON site_settings TO authenticated;
GRANT ALL ON site_settings TO service_role;

-- Create helper functions
-- Function to get all settings as JSON object
CREATE OR REPLACE FUNCTION get_site_settings()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(key, value)
  INTO result
  FROM site_settings;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update a setting (with admin check)
CREATE OR REPLACE FUNCTION update_site_setting(p_key TEXT, p_value JSONB)
RETURNS JSONB AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can update settings';
  END IF;
  
  -- Update the setting
  INSERT INTO site_settings (key, value, category, updated_by)
  VALUES (
    p_key, 
    p_value, 
    CASE 
      WHEN p_key IN ('site_name', 'site_title', 'site_url', 'site_favicon', 'maintenance_mode') THEN 'general'
      WHEN p_key IN ('contact_email', 'support_email', 'smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'email_from_name', 'email_from_address') THEN 'email'
      WHEN p_key IN ('allow_registrations', 'require_email_verification') THEN 'security'
      WHEN p_key IN ('auto_backup', 'backup_frequency') THEN 'database'
      WHEN p_key IN ('email_notifications', 'payment_notifications', 'error_notifications') THEN 'notifications'
      WHEN p_key IN ('primary_color', 'secondary_color', 'dark_mode') THEN 'appearance'
      WHEN p_key IN ('stripe_webhook_secret') THEN 'payment'
      ELSE 'general'
    END,
    auth.uid()
  )
  ON CONFLICT (key) DO UPDATE 
  SET 
    value = EXCLUDED.value,
    updated_at = NOW(),
    updated_by = EXCLUDED.updated_by;
    
  RETURN jsonb_build_object('success', true, 'key', p_key, 'value', p_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_site_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION update_site_setting(TEXT, JSONB) TO authenticated;