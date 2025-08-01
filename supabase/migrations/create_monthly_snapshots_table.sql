-- Create monthly_snapshots table for storing monthly performance data
CREATE TABLE IF NOT EXISTS monthly_snapshots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    snapshot_date date NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    
    -- Capital information
    month_start_capital numeric NOT NULL,
    month_end_capital numeric NOT NULL,
    
    -- Performance metrics
    total_pnl numeric NOT NULL DEFAULT 0,
    pnl_percentage numeric NOT NULL DEFAULT 0,
    
    -- Objectives
    monthly_target numeric NOT NULL,
    target_achieved boolean NOT NULL DEFAULT false,
    
    -- Trading statistics
    total_trades integer NOT NULL DEFAULT 0,
    winning_trades integer NOT NULL DEFAULT 0,
    losing_trades integer NOT NULL DEFAULT 0,
    win_rate numeric NOT NULL DEFAULT 0,
    
    -- Risk metrics
    max_drawdown numeric NOT NULL DEFAULT 0,
    avg_risk_per_trade numeric NOT NULL DEFAULT 0,
    
    -- AI recommendations snapshot
    final_ai_recommendations jsonb,
    
    -- Journal entries for the month
    journal_entries jsonb,
    
    -- Additional metrics
    best_trade numeric,
    worst_trade numeric,
    avg_win numeric,
    avg_loss numeric,
    profit_factor numeric,
    
    -- Metadata
    created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
    
    -- Ensure unique snapshot per user per month
    CONSTRAINT unique_user_month UNIQUE (user_id, year, month)
);

-- Create indexes for better performance
CREATE INDEX idx_monthly_snapshots_user_id ON monthly_snapshots(user_id);
CREATE INDEX idx_monthly_snapshots_date ON monthly_snapshots(year, month);
CREATE INDEX idx_monthly_snapshots_user_date ON monthly_snapshots(user_id, year, month);

-- Enable RLS
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own monthly snapshots"
    ON monthly_snapshots
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own monthly snapshots"
    ON monthly_snapshots
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly snapshots"
    ON monthly_snapshots
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_snapshots_updated_at
    BEFORE UPDATE ON monthly_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add month_start_capital to user_settings for tracking current month
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS month_start_capital numeric,
ADD COLUMN IF NOT EXISTS last_month_reset date;

-- Create function to check and perform monthly reset
CREATE OR REPLACE FUNCTION check_monthly_reset(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
    v_last_reset date;
    v_current_date date;
    v_current_balance numeric;
    v_should_reset boolean := false;
BEGIN
    -- Get current date and last reset date
    v_current_date := CURRENT_DATE;
    
    SELECT last_month_reset, current_balance 
    INTO v_last_reset, v_current_balance
    FROM user_settings 
    WHERE user_id = p_user_id;
    
    -- Check if we need to reset (new month or no reset date)
    IF v_last_reset IS NULL OR 
       (EXTRACT(YEAR FROM v_current_date) != EXTRACT(YEAR FROM v_last_reset) OR
        EXTRACT(MONTH FROM v_current_date) != EXTRACT(MONTH FROM v_last_reset)) THEN
        
        -- Update user_settings with new month data
        UPDATE user_settings
        SET 
            month_start_capital = COALESCE(v_current_balance, initial_capital),
            last_month_reset = v_current_date
        WHERE user_id = p_user_id;
        
        v_should_reset := true;
    END IF;
    
    RETURN v_should_reset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_monthly_reset(uuid) TO authenticated;