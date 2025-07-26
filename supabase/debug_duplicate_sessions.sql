-- Debug script to check for duplicate or orphaned checklist sessions

-- 1. Check how many sessions each user has
SELECT 
    user_id,
    COUNT(*) as session_count,
    COUNT(DISTINCT id) as unique_sessions
FROM checklist_sessions
GROUP BY user_id
ORDER BY session_count DESC;

-- 2. Check for sessions without proper user_id
SELECT * FROM checklist_sessions
WHERE user_id IS NULL OR user_id = '';

-- 3. Check for duplicate sessions (same user, same timestamp)
SELECT 
    user_id,
    created_at,
    COUNT(*) as duplicate_count
FROM checklist_sessions
GROUP BY user_id, created_at
HAVING COUNT(*) > 1;

-- 4. Check sessions with their trade associations
SELECT 
    cs.id,
    cs.user_id,
    cs.type,
    cs.created_at,
    cs.symbol,
    COUNT(DISTINCT at1.id) as entry_trade_count,
    COUNT(DISTINCT at2.id) as exit_trade_count
FROM checklist_sessions cs
LEFT JOIN active_trades at1 ON cs.id = at1.entry_session_id
LEFT JOIN active_trades at2 ON cs.id = at2.exit_session_id
GROUP BY cs.id, cs.user_id, cs.type, cs.created_at, cs.symbol
ORDER BY cs.created_at DESC;

-- 5. Check for orphaned trades (trades without valid sessions)
SELECT * FROM active_trades
WHERE entry_session_id NOT IN (SELECT id FROM checklist_sessions)
   OR (exit_session_id IS NOT NULL AND exit_session_id NOT IN (SELECT id FROM checklist_sessions));