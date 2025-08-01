-- Fix pour initialiser le month_start_capital manuellement
-- Cette requête met à jour le capital de début de mois pour août 2025

-- D'abord, calculer le capital à la fin de juillet
WITH july_end_capital AS (
    SELECT 
        us.user_id,
        us.initial_capital + COALESCE(SUM(tj.pnl), 0) as end_july_capital
    FROM user_settings us
    LEFT JOIN trading_journal tj ON us.user_id = tj.user_id 
        AND tj.trade_date < '2025-08-01'
    GROUP BY us.user_id, us.initial_capital
)
UPDATE user_settings
SET 
    month_start_capital = jec.end_july_capital,
    last_month_reset = '2025-08-01'
FROM july_end_capital jec
WHERE user_settings.user_id = jec.user_id;

-- Créer un snapshot pour juillet si nécessaire
INSERT INTO monthly_snapshots (
    user_id,
    snapshot_date,
    month,
    year,
    month_start_capital,
    month_end_capital,
    total_pnl,
    pnl_percentage,
    monthly_target,
    target_achieved,
    total_trades,
    winning_trades,
    losing_trades,
    win_rate
)
SELECT 
    us.user_id,
    '2025-07-31'::date,
    7,
    2025,
    -- Capital début juillet = initial_capital + P&L jusqu'à fin juin
    us.initial_capital + COALESCE((
        SELECT SUM(pnl) 
        FROM trading_journal 
        WHERE user_id = us.user_id 
        AND trade_date < '2025-07-01'
    ), 0) as month_start,
    -- Capital fin juillet = capital début juillet + P&L juillet
    us.initial_capital + COALESCE((
        SELECT SUM(pnl) 
        FROM trading_journal 
        WHERE user_id = us.user_id 
        AND trade_date < '2025-08-01'
    ), 0) as month_end,
    -- P&L juillet
    COALESCE((
        SELECT SUM(pnl) 
        FROM trading_journal 
        WHERE user_id = us.user_id 
        AND trade_date >= '2025-07-01'
        AND trade_date < '2025-08-01'
    ), 0) as total_pnl,
    -- Pourcentage
    CASE 
        WHEN (us.initial_capital + COALESCE((
            SELECT SUM(pnl) 
            FROM trading_journal 
            WHERE user_id = us.user_id 
            AND trade_date < '2025-07-01'
        ), 0)) > 0 
        THEN (COALESCE((
            SELECT SUM(pnl) 
            FROM trading_journal 
            WHERE user_id = us.user_id 
            AND trade_date >= '2025-07-01'
            AND trade_date < '2025-08-01'
        ), 0) / (us.initial_capital + COALESCE((
            SELECT SUM(pnl) 
            FROM trading_journal 
            WHERE user_id = us.user_id 
            AND trade_date < '2025-07-01'
        ), 0))) * 100
        ELSE 0
    END as pnl_percentage,
    us.monthly_target,
    -- Target achieved
    CASE 
        WHEN (us.initial_capital + COALESCE((
            SELECT SUM(pnl) 
            FROM trading_journal 
            WHERE user_id = us.user_id 
            AND trade_date < '2025-07-01'
        ), 0)) > 0 
        THEN (COALESCE((
            SELECT SUM(pnl) 
            FROM trading_journal 
            WHERE user_id = us.user_id 
            AND trade_date >= '2025-07-01'
            AND trade_date < '2025-08-01'
        ), 0) / (us.initial_capital + COALESCE((
            SELECT SUM(pnl) 
            FROM trading_journal 
            WHERE user_id = us.user_id 
            AND trade_date < '2025-07-01'
        ), 0))) * 100 >= us.monthly_target
        ELSE false
    END as target_achieved,
    -- Stats
    COUNT(DISTINCT CASE WHEN tj.has_traded THEN tj.trade_date END) as total_trades,
    COUNT(DISTINCT CASE WHEN tj.has_traded AND tj.pnl > 0 THEN tj.trade_date END) as winning_trades,
    COUNT(DISTINCT CASE WHEN tj.has_traded AND tj.pnl < 0 THEN tj.trade_date END) as losing_trades,
    CASE 
        WHEN COUNT(DISTINCT CASE WHEN tj.has_traded THEN tj.trade_date END) > 0
        THEN (COUNT(DISTINCT CASE WHEN tj.has_traded AND tj.pnl > 0 THEN tj.trade_date END)::numeric / 
              COUNT(DISTINCT CASE WHEN tj.has_traded THEN tj.trade_date END)::numeric) * 100
        ELSE 0
    END as win_rate
FROM user_settings us
LEFT JOIN trading_journal tj ON us.user_id = tj.user_id 
    AND tj.trade_date >= '2025-07-01'
    AND tj.trade_date < '2025-08-01'
GROUP BY us.user_id, us.initial_capital, us.monthly_target
ON CONFLICT (user_id, year, month) DO NOTHING;