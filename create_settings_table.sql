-- Create site_settings table
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
  ('dark_mode', 'true', 'appearance'),
  ('stripe_webhook_secret', '""', 'payment'),
  ('smtp_host', '""', 'email'),
  ('smtp_port', '587', 'email'),
  ('smtp_user', '""', 'email'),
  ('smtp_password', '""', 'email'),
  ('email_from_name', '"Smart Risk Management"', 'email'),
  ('email_from_address', '"noreply@smartrisk.com"', 'email')
ON CONFLICT (key) DO NOTHING;

-- RLS policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON site_settings
  FOR SELECT USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings" ON site_settings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE is_admin = true
    )
  );

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings" ON site_settings
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT id FROM user_profiles WHERE is_admin = true
    )
  );

-- Create function to get all settings as a single object
CREATE OR REPLACE FUNCTION get_site_settings()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(key, value)
  INTO result
  FROM site_settings;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create function to update a setting
CREATE OR REPLACE FUNCTION update_site_setting(p_key TEXT, p_value JSONB)
RETURNS VOID AS $$
BEGIN
  UPDATE site_settings 
  SET value = p_value, 
      updated_at = NOW(),
      updated_by = auth.uid()
  WHERE key = p_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
EOF < /dev/null