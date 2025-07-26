# Quick Webhook Setup Commands

Run these commands in order to set up your Stripe webhooks:

## 1. First, login to Supabase CLI

```bash
supabase login
```

## 2. Link your project

```bash
# Replace with your project ID from Supabase dashboard
supabase link --project-ref YOUR_PROJECT_ID
```

## 3. Deploy the Edge Functions

```bash
# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy payment confirmation
supabase functions deploy confirm-payment

# Deploy other functions
supabase functions deploy create-checkout-session
supabase functions deploy create-portal-session
```

## 4. Set your secrets

```bash
# Get these from your Stripe dashboard
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

## 5. Get your webhook URL

Your webhook URL will be:
```
https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
```

## 6. Add webhook in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Paste your webhook URL
4. Select these events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted

## 7. Test the webhook

```bash
# Stripe CLI test (optional)
stripe listen --forward-to https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook

# In another terminal
stripe trigger checkout.session.completed
```

## 8. Update your app code

Replace the manual update in `PaymentSuccessAutomatic.jsx`:

```javascript
// Old code (remove this)
const { data, error } = await supabase
  .rpc('force_activate_subscription', {
    user_email: user.email
  })

// New code (add this)
const { data, error } = await supabase.functions.invoke('confirm-payment', {
  body: { 
    sessionId: new URLSearchParams(window.location.search).get('session_id'),
    userEmail: user.email 
  }
})
```

## 9. Re-enable RLS (IMPORTANT!)

Run this SQL in Supabase:

```sql
-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Ensure service role can update
CREATE POLICY "Service role full access" 
ON user_profiles 
TO service_role
USING (true)
WITH CHECK (true);
```

## Troubleshooting

If webhooks aren't working:

1. Check function logs:
```bash
supabase functions logs stripe-webhook
```

2. Verify secrets are set:
```bash
supabase secrets list
```

3. Test with Stripe CLI:
```bash
stripe logs tail
```

That's it! Your webhooks are now set up. 🎉