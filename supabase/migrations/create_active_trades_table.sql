-- Create active_trades table
CREATE TABLE IF NOT EXISTS active_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('long', 'short')),
  entry_price DECIMAL(10, 2) NOT NULL,
  stop_loss DECIMAL(10, 2) NOT NULL,
  take_profit DECIMAL(10, 2),
  contracts INTEGER NOT NULL,
  risk_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create completed_trades table
CREATE TABLE IF NOT EXISTS completed_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  trades JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE active_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_trades ENABLE ROW LEVEL SECURITY;

-- Policies for active_trades
CREATE POLICY "Users can view own active trades" ON active_trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own active trades" ON active_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own active trades" ON active_trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own active trades" ON active_trades
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for completed_trades
CREATE POLICY "Users can view own completed trades" ON completed_trades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completed trades" ON completed_trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completed trades" ON completed_trades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completed trades" ON completed_trades
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_active_trades_user_id ON active_trades(user_id);
CREATE INDEX idx_active_trades_status ON active_trades(status);
CREATE INDEX idx_completed_trades_user_id ON completed_trades(user_id);
CREATE INDEX idx_completed_trades_date ON completed_trades(date DESC);