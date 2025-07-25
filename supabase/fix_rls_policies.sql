-- Fix RLS policies for checklist tables

-- First, check if RLS is enabled on all tables
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_trades ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view their own checklist items" ON user_checklist_items;
DROP POLICY IF EXISTS "Users can create their own checklist items" ON user_checklist_items;
DROP POLICY IF EXISTS "Users can update their own checklist items" ON user_checklist_items;
DROP POLICY IF EXISTS "Users can delete their own checklist items" ON user_checklist_items;

DROP POLICY IF EXISTS "Users can view their own checklist sessions" ON checklist_sessions;
DROP POLICY IF EXISTS "Users can create their own checklist sessions" ON checklist_sessions;

DROP POLICY IF EXISTS "Users can view their own active trades" ON active_trades;
DROP POLICY IF EXISTS "Users can create their own active trades" ON active_trades;
DROP POLICY IF EXISTS "Users can update their own active trades" ON active_trades;

DROP POLICY IF EXISTS "Everyone can view default templates" ON checklist_templates;

-- Recreate policies for user_checklist_items
CREATE POLICY "Users can view their own checklist items" ON user_checklist_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklist items" ON user_checklist_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist items" ON user_checklist_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist items" ON user_checklist_items
    FOR DELETE USING (auth.uid() = user_id);

-- Recreate policies for checklist_sessions
CREATE POLICY "Users can view their own checklist sessions" ON checklist_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklist sessions" ON checklist_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Recreate policies for active_trades (FIXED)
CREATE POLICY "Users can view their own active trades" ON active_trades
    FOR SELECT USING (auth.uid() = user_id);

-- FIX: This was missing the WITH CHECK clause
CREATE POLICY "Users can create their own active trades" ON active_trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active trades" ON active_trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy for checklist_templates
CREATE POLICY "Everyone can view default templates" ON checklist_templates
    FOR SELECT USING (is_default = true);

-- Grant necessary permissions
GRANT ALL ON checklist_templates TO authenticated;
GRANT ALL ON user_checklist_items TO authenticated;
GRANT ALL ON checklist_sessions TO authenticated;
GRANT ALL ON active_trades TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;