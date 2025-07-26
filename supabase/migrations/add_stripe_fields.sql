-- Add Stripe fields to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- Create payments table for tracking transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'eur',
  status TEXT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  transaction_id TEXT DEFAULT gen_random_uuid(),
  payment_method TEXT DEFAULT 'card',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);

-- Update function for payments
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();