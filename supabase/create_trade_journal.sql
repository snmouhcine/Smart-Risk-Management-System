-- Create a new table for completed trades (trade journal)
CREATE TABLE IF NOT EXISTS completed_trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    
    -- Entry information
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_session_id UUID REFERENCES checklist_sessions(id),
    entry_score INTEGER NOT NULL,
    entry_checklist_items JSONB,
    
    -- Exit information
    exit_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_session_id UUID REFERENCES checklist_sessions(id),
    exit_score INTEGER NOT NULL,
    exit_checklist_items JSONB,
    
    -- Trade results
    duration_seconds INTEGER NOT NULL,
    trade_result VARCHAR(10) NOT NULL CHECK (trade_result IN ('profit', 'loss')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_completed_trades_user_id ON completed_trades(user_id);
CREATE INDEX idx_completed_trades_created_at ON completed_trades(created_at DESC);
CREATE INDEX idx_completed_trades_symbol ON completed_trades(symbol);
CREATE INDEX idx_completed_trades_result ON completed_trades(trade_result);

-- Enable RLS
ALTER TABLE completed_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own completed trades" ON completed_trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completed trades" ON completed_trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own completed trades" ON completed_trades
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own completed trades" ON completed_trades
    FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON completed_trades TO authenticated;

-- Add entry_score and exit_score to active_trades for tracking
ALTER TABLE active_trades 
ADD COLUMN IF NOT EXISTS entry_score INTEGER,
ADD COLUMN IF NOT EXISTS exit_score INTEGER;