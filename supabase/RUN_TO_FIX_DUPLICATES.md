# Fix Duplicate Sessions Issue

Run these SQL scripts in order in your Supabase SQL Editor to fix the duplicate sessions issue:

## 1. First, add missing RLS policies

```sql
-- Add missing DELETE policies for checklist_sessions and active_trades
DROP POLICY IF EXISTS "Users can delete their own checklist sessions" ON checklist_sessions;
CREATE POLICY "Users can delete their own checklist sessions" ON checklist_sessions
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own active trades" ON active_trades;
CREATE POLICY "Users can delete their own active trades" ON active_trades
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own checklist sessions" ON checklist_sessions;
CREATE POLICY "Users can update their own checklist sessions" ON checklist_sessions
    FOR UPDATE USING (auth.uid() = user_id);
```

## 2. Add unique constraints to prevent duplicate session usage

```sql
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
```

## 3. Debug and check for existing duplicates (Optional)

Run this to see if you have any data issues:

```sql
-- Check how many sessions each user has
SELECT 
    user_id,
    COUNT(*) as session_count,
    COUNT(DISTINCT id) as unique_sessions
FROM checklist_sessions
GROUP BY user_id
ORDER BY session_count DESC;

-- Check for orphaned trades
SELECT * FROM active_trades
WHERE entry_session_id NOT IN (SELECT id FROM checklist_sessions)
   OR (exit_session_id IS NOT NULL AND exit_session_id NOT IN (SELECT id FROM checklist_sessions));
```

## 4. Clean up any orphaned data (if needed)

If you found orphaned trades in step 3, clean them up:

```sql
-- Delete orphaned trades
DELETE FROM active_trades
WHERE entry_session_id NOT IN (SELECT id FROM checklist_sessions)
   OR (exit_session_id IS NOT NULL AND exit_session_id NOT IN (SELECT id FROM checklist_sessions));
```

After running these migrations, the duplicate issue should be resolved.