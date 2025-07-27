# Settings Setup Instructions

## The RLS Error

You're getting "new row violates row-level security policy" because Row Level Security (RLS) is preventing inserts/updates. This is a security feature in Supabase.

## Quick Fix (Recommended)

Run the `create_settings_table_v2.sql` script in your Supabase SQL Editor. This script:
1. Creates the table
2. Inserts default values BEFORE enabling RLS
3. Sets up proper RLS policies
4. Creates helper functions with SECURITY DEFINER (bypasses RLS)

### Steps:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire contents of `create_settings_table_v2.sql`
5. Click "Run"

## Alternative Fix

If you already created the table, run `fix_settings_rls.sql` which:
1. Temporarily disables RLS
2. Inserts default values
3. Re-enables RLS with proper policies

## How It Works

The solution uses three approaches:
1. **RLS Policies**: Allow admins to manage settings
2. **SECURITY DEFINER Functions**: Bypass RLS when called by authenticated users
3. **Service Role**: Edge Functions can bypass RLS entirely

## Testing

After running the SQL:
1. Go to `/admin/settings`
2. Try changing any setting
3. Click "Save"
4. The changes should persist and apply immediately

## Edge Function (Optional)

The Edge Function is optional. The app works perfectly fine without it using the database functions. If you want to deploy it later:

```bash
supabase functions deploy site-settings
```

## Troubleshooting

If you still get errors:
1. Make sure you're logged in as an admin user
2. Check that your user has `is_admin = true` in the `user_profiles` table
3. Try refreshing the page after running the SQL script