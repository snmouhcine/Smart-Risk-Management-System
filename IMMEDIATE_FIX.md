# Immediate Fix - Block Access Without Payment

## ✅ What's Already Fixed

1. **AuthGuard Updated**: Users without subscription now see payment screen instead of the app
2. **Payment Flow**: Clicking "Souscrire maintenant" redirects to Stripe

## 🔧 What You Need to Do Now

### 1. Create Stripe Payment Link (2 minutes)

1. Go to: https://dashboard.stripe.com/test/payment-links
2. Click "New payment link"
3. Create product:
   - Name: "Smart Risk Management"
   - Price: €29.99
   - Recurring: Monthly
4. Set redirect URLs:
   - Success: `http://localhost:5173/payment-success`
   - Cancel: `http://localhost:5173/app`
5. Click "Create link"
6. Copy the link (looks like: `https://buy.stripe.com/test/ABC123`)

### 2. Update Your Code

Open `src/components/auth/AuthGuard.jsx` and replace line 59:
```javascript
// Change this:
const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test/YOUR_LINK_HERE'

// To this (with your actual link):
const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test/ABC123'
```

### 3. Test It

1. Go to http://localhost:5173/app
2. You should see "Abonnement Requis" screen (NOT the app)
3. Click "Souscrire maintenant"
4. Pay with test card: 4242 4242 4242 4242
5. You'll be redirected to success page

### 4. Enable Access After Payment (Temporary)

After someone pays, manually update their subscription in Supabase:

1. Go to Supabase Dashboard
2. Table Editor → user_profiles
3. Find the user
4. Change `is_subscribed` from `false` to `true`
5. Save

Now they can access the app!

## 🚀 That's It!

Users can no longer access the app without paying. The payment flow is working with Stripe Payment Links.