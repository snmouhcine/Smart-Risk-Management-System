-- Add unique constraints to prevent duplicate usage of sessions

-- Ensure a session can only be used as entry_session_id once
ALTER TABLE active_trades 
DROP CONSTRAINT IF EXISTS unique_entry_session;

ALTER TABLE active_trades 
ADD CONSTRAINT unique_entry_session 
UNIQUE (entry_session_id);

-- Ensure a session can only be used as exit_session_id once
ALTER TABLE active_trades 
DROP CONSTRAINT IF EXISTS unique_exit_session;

ALTER TABLE active_trades 
ADD CONSTRAINT unique_exit_session 
UNIQUE (exit_session_id);

-- Add check constraint to ensure entry and exit sessions are different
ALTER TABLE active_trades
DROP CONSTRAINT IF EXISTS different_entry_exit_sessions;

ALTER TABLE active_trades
ADD CONSTRAINT different_entry_exit_sessions
CHECK (entry_session_id != exit_session_id);