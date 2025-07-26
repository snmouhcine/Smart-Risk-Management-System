# Quick Stripe Test Setup (Without Edge Functions)

This guide helps you test Stripe integration immediately without deploying Edge Functions.

## Step 1: Get Your Stripe Keys

1. **Create a Stripe account** (if you don't have one):
   - Go to https://stripe.com and sign up
   - It's free for testing

2. **Get your test keys**:
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your **Publishable key** (starts with `pk_test_`)
   - Keep your **Secret key** (starts with `sk_test_`) for later

## Step 2: Create a Test Product

1. **Go to Products**:
   - https://dashboard.stripe.com/test/products
   - Click "Add product"

2. **Create your subscription product**:
   - Name: "Smart Risk Management Pro"
   - Pricing model: "Recurring"
   - Price: €29.99 (or your preferred amount)
   - Billing period: Monthly
   - Click "Save product"

3. **Copy the Price ID**:
   - After creating, click on the product
   - Find the price and copy its ID (starts with `price_`)

## Step 3: Update the Test Component

1. **Open** `src/components/StripeTest.jsx`

2. **Replace the placeholders**:
   ```javascript
   // Line 19 - Replace with your publishable key
   const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_ACTUAL_KEY_HERE'
   
   // Line 33 - Replace with your price ID
   price: 'price_YOUR_ACTUAL_PRICE_ID_HERE',
   ```

## Step 4: Test the Integration

1. **Start your app**:
   ```bash
   npm run dev
   ```

2. **Visit the test page**:
   - Go to http://localhost:5173/stripe-test

3. **Click "Tester le paiement"**

4. **Use test card details**:
   - Card number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - Name: Any name
   - Email: Any email

5. **Complete the test payment**

## What Happens Next?

- You'll be redirected to `/payment-success` if successful
- You'll be redirected to `/payment-cancelled` if you cancel

## Important Notes

⚠️ **This is just for testing!** In production:
- Use environment variables for keys
- Deploy the Edge Functions for secure payment processing
- Set up webhooks to update user subscription status

## Troubleshooting

### "Invalid API Key" Error
- Make sure you copied the correct key
- Ensure it starts with `pk_test_`
- Check you're using the test key, not live

### "No such price" Error
- Verify the price ID is correct
- Make sure the product is active
- Check you're in test mode in Stripe Dashboard

### Still Having Issues?
1. Check the browser console for errors
2. Verify you're logged in (the user email is passed to Stripe)
3. Make sure your Stripe account is activated

## Next Steps

Once testing works:
1. Set up environment variables
2. Deploy Edge Functions
3. Configure webhooks
4. Test the full flow with database updates

---

For production setup, see `STRIPE_SETUP.md`