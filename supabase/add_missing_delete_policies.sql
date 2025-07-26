-- Add missing DELETE policies for checklist_sessions and active_trades

-- Delete policy for checklist_sessions
DROP POLICY IF EXISTS "Users can delete their own checklist sessions" ON checklist_sessions;
CREATE POLICY "Users can delete their own checklist sessions" ON checklist_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Delete policy for active_trades
DROP POLICY IF EXISTS "Users can delete their own active trades" ON active_trades;
CREATE POLICY "Users can delete their own active trades" ON active_trades
    FOR DELETE USING (auth.uid() = user_id);

-- Also add UPDATE policy for checklist_sessions in case it's needed
DROP POLICY IF EXISTS "Users can update their own checklist sessions" ON checklist_sessions;
CREATE POLICY "Users can update their own checklist sessions" ON checklist_sessions
    FOR UPDATE USING (auth.uid() = user_id);