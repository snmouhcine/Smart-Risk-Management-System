-- Add entry_score and exit_score columns to active_trades table

ALTER TABLE active_trades 
ADD COLUMN IF NOT EXISTS entry_score INTEGER,
ADD COLUMN IF NOT EXISTS exit_score INTEGER,
ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);

-- Add check constraints for scores
ALTER TABLE active_trades
DROP CONSTRAINT IF EXISTS valid_entry_score;

ALTER TABLE active_trades
ADD CONSTRAINT valid_entry_score
CHECK (entry_score IS NULL OR (entry_score >= 0 AND entry_score <= 100));

ALTER TABLE active_trades
DROP CONSTRAINT IF EXISTS valid_exit_score;

ALTER TABLE active_trades
ADD CONSTRAINT valid_exit_score
CHECK (exit_score IS NULL OR (exit_score >= 0 AND exit_score <= 100));