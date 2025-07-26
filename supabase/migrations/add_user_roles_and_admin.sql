-- Add user roles and admin functionality
-- This migration adds role-based access control to the application

-- First, create an enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- Add role column to auth.users metadata
-- We'll use the raw_user_meta_data field that Supabase provides
-- This requires updating user metadata during registration

-- Create a profiles table to store additional user information including role
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'user'::user_role NOT NULL,
  subscription_status TEXT DEFAULT 'free',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table for tracking revenue
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL, -- 'pending', 'completed', 'failed', 'refunded'
  payment_method TEXT,
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price, features) VALUES
  ('Gratuit', 0.00, '{"max_trades": 10, "features": ["Journal de base", "Checklist simple"]}'::jsonb),
  ('Basique', 9.99, '{"max_trades": 100, "features": ["Journal complet", "Checklist avancée", "Statistiques de base"]}'::jsonb),
  ('Pro', 29.99, '{"max_trades": -1, "features": ["Toutes les fonctionnalités", "Directeur IA", "Analytics avancés", "Support prioritaire"]}'::jsonb);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- User statistics policies
-- Users can view their own statistics
CREATE POLICY "Users can view own statistics" ON public.user_statistics
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all statistics
CREATE POLICY "Admins can view all statistics" ON public.user_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- System can insert/update statistics (through functions)
CREATE POLICY "System can manage statistics" ON public.user_statistics
  FOR ALL USING (true);

-- Subscription plans policies
-- Everyone can view active plans
CREATE POLICY "Everyone can view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true);

-- Only admins can manage plans
CREATE POLICY "Admins can manage plans" ON public.subscription_plans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Payments policies
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'user'::user_role)
  );
  
  -- Create initial statistics record
  INSERT INTO public.user_statistics (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
  
  -- Update user statistics
  UPDATE public.user_statistics
  SET 
    total_trades = v_total_trades,
    successful_trades = v_successful_trades,
    win_rate = v_win_rate,
    last_active = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_user_id AND role = 'admin'::user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_user_statistics_user_id ON public.user_statistics(user_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- Add updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_statistics_updated_at BEFORE UPDATE ON public.user_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a specific admin user (you'll need to update this with your actual admin email)
-- This will be executed after the user signs up
-- UPDATE public.profiles SET role = 'admin'::user_role WHERE email = 'your-admin-email@example.com';

-- Add comment for admin setup
COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control. To make a user admin, update their role to ''admin'' in this table.';