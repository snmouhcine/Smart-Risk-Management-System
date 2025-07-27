# Stripe Analytics Setup Instructions

## Overview
The admin analytics page now fetches real-time data from both your database and Stripe API to provide accurate metrics for:
- Monthly Recurring Revenue (MRR)
- Churn & Retention rates
- Payment success rates
- Trial user counts

## Setup Steps

### 1. Deploy the New Edge Function
Deploy the `stripe-analytics` function to Supabase:

```bash
supabase functions deploy stripe-analytics
```

### 2. Database Updates Needed
To track subscription history accurately, you'll need to add these fields to your `user_profiles` table if they don't exist:

```sql
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

### 3. Update Stripe Webhook
Modify your `stripe-webhook` function to track subscription start dates:

In the `customer.subscription.created` case, add:
```typescript
subscription_start_date: new Date().toISOString()
```

## What's Changed

### Previous Implementation (Hard-coded):
- Churn rate: 5.2%
- Retention rate: 94.8%
- Trial users: 23
- Payment success: 98.5%

### New Implementation (Real data from Stripe):
- **MRR**: Calculated from all active Stripe subscriptions
- **Churn Rate**: Based on customers who had subscriptions but canceled
- **Retention Rate**: Percentage of customers who remain subscribed
- **Payment Success**: Actual success rate from Stripe charges
- **Trial Users**: Count of subscriptions with `trialing` status

## Fallback Behavior
If the Stripe API call fails, the system falls back to:
- Calculating metrics from your database (less accurate)
- Using default values to prevent the dashboard from breaking

## Required Environment Variables
Ensure these are set in your Supabase project:
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your service role key

## Testing
1. Check the Supabase logs after deployment
2. Visit the Admin Analytics page
3. Verify that metrics update when you change the time range
4. Monitor the browser console for any errors

## Future Improvements
Consider adding:
- Caching to reduce Stripe API calls
- More detailed cohort analysis
- Revenue forecasting based on trends
- Subscription lifecycle tracking table