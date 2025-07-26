# Database Migration Instructions

To fix the database error, you need to run the migration script to update your Supabase tables.

## Steps to Run Migration:

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the content from `supabase/migrations/add_trade_details.sql`
4. Click "Run" to execute the migration

## Alternative: Direct SQL

If you prefer, you can run this simplified version directly:

```sql
-- Add symbol column to checklist_sessions if it doesn't exist
ALTER TABLE checklist_sessions 
ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);

-- Add duration and trade result to active_trades
ALTER TABLE active_trades
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS trade_result VARCHAR(10) CHECK (trade_result IN ('profit', 'loss', NULL));
```

## Verify the Migration

After running the migration, you can verify it worked by running:

```sql
-- Check checklist_sessions columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'checklist_sessions';

-- Check active_trades columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'active_trades';
```

The application should work correctly after running these migrations.