# Stripe Payment Link Setup - Quick Guide

## Problem Solved
This guide fixes the issue where users can access the app without payment by using Stripe Payment Links.

## Step 1: Create Your Stripe Payment Link

1. **Login to Stripe Dashboard**
   - Go to https://dashboard.stripe.com/test/payment-links
   - Make sure you're in **Test mode** (toggle at top right)

2. **Create a Payment Link**
   - Click **"+ New payment link"**
   - Add a product:
     - Name: "Smart Risk Management - Abonnement Mensuel"
     - Price: €29.99 (or your preferred price)
     - Recurring: Monthly
   - In "After payment" section:
     - Success URL: `http://localhost:5173/payment-success`
     - Cancel URL: `http://localhost:5173/app`
   - In "Customer details":
     - ✅ Collect email address
     - ✅ Collect name
   - Click **"Create link"**

3. **Copy Your Payment Link**
   - After creating, you'll get a URL like:
     `https://buy.stripe.com/test/ABC123DEF456`
   - Copy this URL

## Step 2: Update Your Code

1. **Update StripeTest.jsx**
   ```javascript
   // Line 21 - Replace with your actual payment link
   const PAYMENT_LINK = 'https://buy.stripe.com/test/YOUR_ACTUAL_LINK_HERE'
   ```

2. **Update AuthGuard.jsx** (Already done, but verify)
   - The AuthGuard now properly blocks access for non-subscribed users
   - It shows a payment required screen with "Souscrire maintenant" button

## Step 3: Create .env File

Create a `.env` file in your project root:

```bash
# Supabase (you already have these)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (add these)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
VITE_STRIPE_PAYMENT_LINK=https://buy.stripe.com/test/YOUR_LINK_HERE
```

## Step 4: Update AuthGuard to Use Payment Link

Since the Edge Functions aren't deployed yet, let's update AuthGuard to use the Payment Link directly:

```javascript
// In AuthGuard.jsx, replace the onClick handler (lines 57-80) with:
onClick={() => {
  // Use Payment Link for now
  const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test/YOUR_LINK_HERE'
  const checkoutUrl = `${paymentLink}?prefilled_email=${encodeURIComponent(user.email)}`
  window.location.href = checkoutUrl
}}
```

## Step 5: Test the Flow

1. **Start your app**: `npm run dev`
2. **Try to access the app**: Go to http://localhost:5173/app
3. **You should see**: Payment required screen (not the app!)
4. **Click "Souscrire maintenant"**: You'll be redirected to Stripe
5. **Use test card**: 4242 4242 4242 4242
6. **After payment**: You'll be redirected to /payment-success

## Step 6: Manual Subscription Update (Temporary)

Until webhooks are set up, manually update user subscription in Supabase:

1. Go to Supabase Dashboard
2. Navigate to Table Editor → user_profiles
3. Find the user who just paid
4. Set `is_subscribed` to `true`
5. User can now access the app!

## Next Steps (Production)

1. **Deploy Edge Functions** for automatic subscription updates
2. **Set up Webhooks** to receive payment confirmations
3. **Add Stripe Customer Portal** for subscription management

## Troubleshooting

**User still accessing app without payment?**
- Clear browser cache
- Check user_profiles table - is `is_subscribed` false?
- Verify AuthGuard is wrapping your app routes

**Payment Link not working?**
- Ensure you're using the test mode link
- Check the URL is correctly copied
- Verify redirect URLs match your local environment

**After payment, still blocked?**
- Manually update `is_subscribed` in Supabase (temporary solution)
- Check if user profile exists in user_profiles table