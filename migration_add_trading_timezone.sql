-- ===============================================
-- MIGRATION: Add trading_timezone column to user_settings
-- ===============================================

-- Add the trading_timezone column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS trading_timezone TEXT DEFAULT 'UTC';

-- Add a comment for documentation
COMMENT ON COLUMN public.user_settings.trading_timezone IS 'User preferred timezone for trading hours (13:30-15:30)';

-- Optional: Update existing records to have the default timezone
UPDATE public.user_settings 
SET trading_timezone = 'UTC' 
WHERE trading_timezone IS NULL;

-- Verify the column was added successfully
-- (This is just for manual verification - comment out in actual migration)
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'user_settings' AND column_name = 'trading_timezone';