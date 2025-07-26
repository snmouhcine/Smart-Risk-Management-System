# Admin Setup Guide - Final Version

## Overview

This guide sets up admin functionality with:
- Single subscription plan (Pro at €29.99/month)
- Simple boolean subscription status (subscribed/not subscribed)
- Uses your existing `user_profiles` table
- No duplicate tables

## 1. Run the Simplified Migration

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/add_admin_simplified.sql`
4. Click "Run"

## 2. Make Yourself Admin

```sql
-- Replace with your email
UPDATE public.user_profiles 
SET role = 'admin'::user_role 
WHERE email = 'your-email@example.com';
```

## 3. What This Creates

### Extended user_profiles table:
- `role`: user or admin
- `is_subscribed`: boolean for subscription status
- `email`: user email
- `subscription_start_date`: when subscription started
- `subscription_end_date`: when subscription ends

### New tables:
- `user_statistics`: Trading statistics per user
- `subscription_plans`: Single Pro plan
- `payments`: Payment history

## 4. Admin Features

As an admin, you can:
- View all users and their subscription status
- Toggle user subscriptions
- View revenue analytics
- Monitor user statistics
- Track payments

## 5. Testing

1. Log in with your admin account
2. Click the purple "Administration" button
3. Access:
   - **Dashboard**: Overview metrics
   - **Users**: Manage all users
   - **Analytics**: Revenue and conversion data

## 6. User Subscription Flow

Since we have a single plan:
- Users are either subscribed (Pro) or not subscribed (Free)
- Admins can manually toggle subscription status
- Payment integration can be added later

## 7. Quick Checks

```sql
-- Check your admin status
SELECT id, email, role, is_subscribed 
FROM public.user_profiles 
WHERE email = 'your-email@example.com';

-- Check total subscribers
SELECT COUNT(*) as subscribers 
FROM public.user_profiles 
WHERE is_subscribed = true;

-- Check the Pro plan
SELECT * FROM public.subscription_plans;
```

## Notes

- All existing user data is preserved
- The system is ready for payment gateway integration
- You can manually manage subscriptions until payment is automated