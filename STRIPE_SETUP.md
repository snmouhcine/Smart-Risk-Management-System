# Stripe Integration Setup Guide

## Prerequisites
1. A Stripe account (create one at https://stripe.com)
2. Supabase project with Edge Functions enabled

## Step 1: Stripe Configuration

### 1.1 Create Products and Prices in Stripe
1. Go to your Stripe Dashboard > Products
2. Create a new product (e.g., "Smart Risk Management Pro")
3. Add pricing:
   - Monthly subscription (e.g., €29.99/month)
   - Yearly subscription (e.g., €299.99/year) - optional

### 1.2 Get Your API Keys
1. In Stripe Dashboard, go to Developers > API keys
2. Copy your:
   - Publishable key (starts with `pk_`)
   - Secret key (starts with `sk_`)

### 1.3 Configure Customer Portal
1. Go to Settings > Billing > Customer portal
2. Enable the customer portal
3. Configure what customers can do:
   - Update payment methods ✓
   - Cancel subscriptions ✓
   - Update subscriptions ✓
   - View invoices ✓

## Step 2: Environment Variables

### 2.1 Local Development
Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PRICE_ID_MONTHLY=price_...
VITE_STRIPE_PRICE_ID_YEARLY=price_... (optional)
```

### 2.2 Supabase Edge Functions
Set environment variables in Supabase:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 3: Database Setup

Run the migration to add Stripe fields:
```sql
-- Run this in your Supabase SQL editor
-- See: supabase/migrations/add_stripe_fields.sql
```

## Step 4: Deploy Edge Functions

### 4.1 Deploy Functions
```bash
# Deploy create-checkout-session function
supabase functions deploy create-checkout-session

# Deploy create-portal-session function
supabase functions deploy create-portal-session

# Deploy stripe-webhook function
supabase functions deploy stripe-webhook
```

### 4.2 Get Function URLs
Your functions will be available at:
- `https://[project-ref].supabase.co/functions/v1/create-checkout-session`
- `https://[project-ref].supabase.co/functions/v1/create-portal-session`
- `https://[project-ref].supabase.co/functions/v1/stripe-webhook`

## Step 5: Configure Stripe Webhook

### 5.1 Create Webhook Endpoint
1. In Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint:
   - URL: `https://[project-ref].supabase.co/functions/v1/stripe-webhook`
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`

### 5.2 Get Webhook Secret
Copy the webhook signing secret (starts with `whsec_`) and add it to Supabase:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 6: Testing

### 6.1 Test Checkout Flow
1. Sign up for a new account
2. You should be redirected to the subscription required page
3. Click "Subscribe Now" to go to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Verify user profile is updated with subscription

### 6.2 Test Customer Portal
1. Go to Settings > Subscription tab
2. Click "Access Customer Portal"
3. Verify you can manage subscription

### 6.3 Test Webhook
Use Stripe CLI for local testing:
```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Production Checklist

- [ ] Switch to live Stripe API keys
- [ ] Update all environment variables in production
- [ ] Test with real payment method
- [ ] Verify webhook is receiving events
- [ ] Monitor first few real subscriptions
- [ ] Set up error alerts

## Troubleshooting

### "Infinite recursion" error
Run the SQL in `disable_rls_subscription_plans.sql`

### Webhook not receiving events
- Check webhook URL is correct
- Verify webhook secret is set
- Check Supabase function logs

### Customer portal not opening
- Ensure Stripe customer ID is saved in user profile
- Check customer portal is enabled in Stripe

## Support
For issues, check:
- Stripe Dashboard > Developers > Logs
- Supabase Dashboard > Functions > Logs
- Browser console for frontend errors