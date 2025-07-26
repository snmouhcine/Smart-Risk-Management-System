-- Add admin functionality to existing user_profiles table
-- Simplified version with single subscription plan

-- First, create an enum for user roles if it doesn't exist
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to existing user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user'::user_role NOT NULL,
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update email from auth.users
UPDATE public.user_profiles up
SET email = u.email
FROM auth.users u
WHERE up.id = u.id AND up.email IS NULL;

-- Make email unique after populating
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_email_unique UNIQUE (email);

-- Create user statistics table for admin analytics
CREATE TABLE IF NOT EXISTS public.user_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  total_trades INTEGER DEFAULT 0,
  successful_trades INTEGER DEFAULT 0,
  total_profit_loss DECIMAL(10, 2) DEFAULT 0.00,
  win_rate DECIMAL(5, 2) DEFAULT 0.00,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create a single subscription plan
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Pro',
  price DECIMAL(10, 2) NOT NULL DEFAULT 29.99,
  features JSONB DEFAULT '{"max_trades": -1, "features": ["Journal complet", "Checklist avancée", "Directeur IA", "Analytics avancés", "Toutes les fonctionnalités"]}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the single plan
INSERT INTO public.subscription_plans (name, price) 
VALUES ('Pro', 29.99)
ON CONFLICT DO NOTHING;

-- Create payments table for tracking revenue
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policies for user_profiles to include admin access
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view own profile only" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile only" ON public.user_profiles;

-- Create new policies with admin support
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()));

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- User statistics policies
CREATE POLICY "Users can view own statistics" ON public.user_statistics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all statistics" ON public.user_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

CREATE POLICY "System can manage statistics" ON public.user_statistics
  FOR ALL USING (true);

-- Subscription plans policies
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Create initial statistics records for existing users
INSERT INTO public.user_statistics (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_statistics 
  WHERE user_statistics.user_id = auth.users.id
);

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name, email, role)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name);
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.user_statistics (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user statistics (called after trade operations)
CREATE OR REPLACE FUNCTION public.update_user_statistics(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_trades INTEGER;
  v_successful_trades INTEGER;
  v_win_rate DECIMAL(5, 2);
BEGIN
  -- Calculate statistics from checklist_sessions
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN trade_result = 'win' THEN 1 END)
  INTO v_total_trades, v_successful_trades
  FROM public.checklist_sessions
  WHERE user_id = p_user_id;
  
  -- Calculate win rate
  IF v_total_trades > 0 THEN
    v_win_rate := (v_successful_trades::DECIMAL / v_total_trades) * 100;
  ELSE
    v_win_rate := 0;
  END IF;
  
  -- Update or insert user statistics
  INSERT INTO public.user_statistics (
    user_id, 
    total_trades, 
    successful_trades, 
    win_rate, 
    last_active, 
    updated_at
  ) VALUES (
    p_user_id,
    v_total_trades,
    v_successful_trades,
    v_win_rate,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    successful_trades = EXCLUDED.successful_trades,
    win_rate = EXCLUDED.win_rate,
    last_active = EXCLUDED.last_active,
    updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = p_user_id AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscribed ON public.user_profiles(is_subscribed);
CREATE INDEX IF NOT EXISTS idx_user_statistics_user_id ON public.user_statistics(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Add updated_at trigger for user_statistics
CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON public.user_statistics
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add comment for admin setup
COMMENT ON TABLE public.user_profiles IS 'User profiles with role-based access control. To make a user admin, update their role to ''admin'' in this table.';

-- Update any existing user to be admin (replace with your email)
-- UPDATE public.user_profiles SET role = 'admin'::user_role WHERE email = 'your-admin-email@example.com';