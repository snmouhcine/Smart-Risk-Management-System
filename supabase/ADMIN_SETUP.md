# Admin Setup Guide

## 1. Run the Admin Migration

Execute the following SQL in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/add_user_roles_and_admin.sql`
4. Click "Run"

## 2. Make Yourself an Admin

After running the migration and signing up/logging in:

```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE public.profiles 
SET role = 'admin'::user_role 
WHERE email = 'your-email@example.com';
```

## 3. Verify Admin Access

You can verify your admin status:

```sql
SELECT id, email, role FROM public.profiles WHERE email = 'your-email@example.com';
```

## 4. What This Migration Creates

### Tables:
- **profiles**: Stores user profiles with roles (user/admin)
- **user_statistics**: Tracks user trading statistics
- **subscription_plans**: Manages subscription tiers
- **payments**: Records payment transactions

### Features:
- Role-based access control (admin/user)
- Automatic profile creation on signup
- User statistics tracking
- Subscription management
- Payment tracking

### Default Subscription Plans:
1. **Gratuit** (Free): 10 trades max, basic features
2. **Basique** ($9.99): 100 trades max, advanced features
3. **Pro** ($29.99): Unlimited trades, all features

## 5. Admin Capabilities

As an admin, you can:
- View all user profiles
- Update user roles and subscription status
- View all user statistics
- View all payments
- Manage subscription plans

## 6. Security

All tables have Row Level Security (RLS) enabled:
- Users can only see their own data
- Admins can see all data
- Role changes are protected