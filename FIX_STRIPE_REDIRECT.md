# Fix Stripe Payment Link Redirect Issue

## The Problem
After payment, you're stuck on Stripe's page because the redirect URLs aren't configured.

## Solution

### Option 1: Configure Your Payment Link (Recommended)

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/payment-links
2. **Find your payment link** and click on it
3. **Click "Edit"** 
4. **Scroll to "After payment" section**
5. **Enable "Don't show confirmation page"**
6. **Set the redirect URLs**:
   - Success URL: `http://localhost:5173/payment-success`
   - Cancel URL: `http://localhost:5173/app`
7. **Save changes**

### Option 2: Create a New Payment Link with Redirect

1. Go to: https://dashboard.stripe.com/test/payment-links/create
2. Add your product/price
3. In "After payment":
   - Turn ON: "Don't show confirmation page"
   - Success URL: `http://localhost:5173/payment-success`
   - Cancel URL: `http://localhost:5173/app`
4. Create the link
5. Update your `.env` file with the new link

### Option 3: Manual Navigation (Temporary)

Since your payment was successful, manually navigate to:
```
http://localhost:5173/payment-success
```

This will trigger the subscription activation.

## Verify It Works

1. Go to http://localhost:5173/payment-success manually
2. You should see "Activation de votre abonnement..."
3. Check console for any errors
4. After 2 seconds, you'll be redirected to the app

## Important Note

Without proper redirect configuration, users will always get stuck after payment. Make sure to fix the Payment Link settings in Stripe Dashboard!