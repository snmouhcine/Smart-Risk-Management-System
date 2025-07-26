-- Create app_logs table for application logging
CREATE TABLE IF NOT EXISTS public.app_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON app_logs(level);

-- Enable RLS
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own logs
CREATE POLICY "Users can read own logs" 
ON app_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert own logs" 
ON app_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Admins can read all logs
CREATE POLICY "Admins can read all logs" 
ON app_logs FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'admin'
  )
);

-- Grant permissions
GRANT ALL ON app_logs TO authenticated;

-- Create a view for admin dashboard
CREATE OR REPLACE VIEW app_logs_summary AS
SELECT 
  level,
  COUNT(*) as count,
  DATE_TRUNC('hour', created_at) as hour
FROM app_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY level, hour
ORDER BY hour DESC, level;

-- Grant access to the view
GRANT SELECT ON app_logs_summary TO authenticated;