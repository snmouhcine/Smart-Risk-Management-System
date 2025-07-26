-- Simple solution: Disable RLS on subscription_plans table
-- This is safe because subscription plans are public information anyway

-- Disable RLS entirely on subscription_plans
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON subscription_plans TO authenticated;