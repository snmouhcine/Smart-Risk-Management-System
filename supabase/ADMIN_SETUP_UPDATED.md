# Admin Setup Guide - Updated

## Important: Using Existing user_profiles Table

Since you already have a `user_profiles` table with data, we'll extend it with admin functionality instead of creating a new table.

## 1. Run the Updated Migration

Execute the following SQL in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/add_admin_to_existing_profiles.sql`
4. Click "Run"

This migration will:
- Add admin role functionality to your existing `user_profiles` table
- Create the necessary tables for user statistics, subscription plans, and payments
- Update all RLS policies to support admin access
- Preserve all your existing user data

## 2. Make Yourself an Admin

After running the migration:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.user_profiles 
SET role = 'admin'::user_role 
WHERE email = 'your-email@example.com';
```

## 3. Verify Your Setup

Check that everything is working:

```sql
-- Check your user profile
SELECT id, email, full_name, role, subscription_status 
FROM public.user_profiles 
WHERE email = 'your-email@example.com';

-- Check that statistics were created for existing users
SELECT COUNT(*) as user_count FROM public.user_profiles;
SELECT COUNT(*) as stats_count FROM public.user_statistics;
-- These counts should match

-- Check subscription plans were created
SELECT * FROM public.subscription_plans;
-- Should show Gratuit, Basique, and Pro plans
```

## 4. Test the Admin Panel

1. Log in to your app with your admin account
2. You should see a purple "Administration" button in the sidebar
3. Click it to access:
   - Admin Dashboard: Overview of all metrics
   - User Management: View and edit all users
   - Analytics: Detailed revenue and user analytics

## 5. What Changed

### Your existing data:
- ✅ All existing users in `user_profiles` are preserved
- ✅ All existing settings and journal entries remain intact
- ✅ New columns added to `user_profiles`: role, subscription_status, email

### New features added:
- Role-based access control (user/admin)
- User statistics tracking
- Subscription management
- Payment tracking
- Admin dashboard with analytics

## 6. Troubleshooting

If you encounter issues:

1. **Email column errors**: The migration copies emails from auth.users. If you get constraint errors, check for duplicate emails.

2. **Role not showing**: Make sure to refresh your app after updating your role in the database.

3. **Statistics not updating**: Run this to manually update statistics for a user:
   ```sql
   SELECT public.update_user_statistics('user-id-here');
   ```

## 7. Next Steps

- Set up payment integration for subscription handling
- Configure email notifications for new users
- Customize subscription plans in the `subscription_plans` table
- Add more admin features as needed