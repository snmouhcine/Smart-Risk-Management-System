# 🔧 Stripe Customer Portal Setup

## Step 1: Configure Customer Portal in Stripe

1. **Go to Stripe Dashboard**:
   - Test mode: https://dashboard.stripe.com/test/settings/billing/portal
   - Live mode: https://dashboard.stripe.com/settings/billing/portal

2. **Enable Customer Portal**:
   - Toggle "Customer portal" to ON
   - Configure settings:
     - ✅ Allow customers to update payment methods
     - ✅ Allow customers to update billing addresses
     - ✅ Allow customers to cancel subscriptions
     - ✅ Allow customers to view billing history

3. **Set Business Information**:
   - Business name: "Smart Risk Management"
   - Privacy policy: Your URL
   - Terms of service: Your URL

4. **Save Changes**

## Step 2: Create Portal Sessions (Two Options)

### Option A: Direct Link (Simple but Limited)

The Customer Portal link format is:
```
https://billing.stripe.com/p/login/TEST_OR_LIVE_ID
```

But you need to create sessions for each customer.

### Option B: Dynamic Portal Sessions (Recommended)

Create an Edge Function to generate portal sessions:

```typescript
// supabase/functions/create-portal-session/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerEmail, returnUrl } = await req.json()

    // Find or create customer
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    })

    let customerId
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      // Create customer if doesn't exist
      const customer = await stripe.customers.create({
        email: customerEmail,
      })
      customerId = customer.id
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'https://your-app.vercel.app/app',
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
```

## Step 3: Update Your App

### Update Settings Component

Replace the hardcoded link in `Settings.jsx`:

```javascript
// Old code
onClick={() => window.open('https://billing.stripe.com/p/login/test_YOUR_LINK', '_blank')}

// New code
onClick={async () => {
  try {
    const { data, error } = await supabase.functions.invoke('create-portal-session', {
      body: {
        customerEmail: user.email,
        returnUrl: window.location.origin + '/app'
      }
    })
    
    if (data?.url) {
      window.location.href = data.url
    } else {
      alert('Erreur lors de l\'accès au portail')
    }
  } catch (error) {
    console.error('Portal error:', error)
    alert('Service temporairement indisponible')
  }
}}
```

## Step 4: Quick Fix Without Edge Functions

If you haven't deployed Edge Functions yet, here's a temporary solution:

1. **Create a Test Customer in Stripe**:
   - Go to https://dashboard.stripe.com/test/customers
   - Create a customer with your test email
   - Copy the customer ID

2. **Generate a Portal Link**:
   - Use Stripe CLI or API to create a portal session
   - Or use this quick Node.js script:

```javascript
// generate-portal-link.js
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY');

async function createPortalLink() {
  const session = await stripe.billingPortal.sessions.create({
    customer: 'cus_YOUR_CUSTOMER_ID',
    return_url: 'http://localhost:5173/app',
  });
  
  console.log('Portal URL:', session.url);
}

createPortalLink();
```

## Step 5: Alternative - Stripe-Hosted Portal

For immediate use without Edge Functions:

1. **Use Stripe's Pre-built Portal**:
   - When users pay via Payment Link, Stripe creates a customer
   - Send users to: `https://billing.stripe.com/p/login/YOUR_LIVE_OR_TEST_ID`
   - They'll need to enter their email to access

2. **Find Your Portal ID**:
   - It's in your Customer Portal settings
   - Or check the URL when you preview the portal

## Step 6: Update Settings.jsx Immediately

For now, update your Settings component with this simple fix:

```javascript
<button
  onClick={() => {
    // Temporary: Direct users to Stripe support for subscription management
    alert(
      'Pour gérer votre abonnement:\n\n' +
      '1. Envoyez un email à: votre-email@support.com\n' +
      '2. Ou visitez: https://billing.stripe.com\n' +
      '3. Utilisez l\'email de votre compte: ' + user?.email
    );
  }}
  className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
>
  <CreditCard className="h-4 w-4" />
  Gérer mon abonnement
</button>
```

## Recommended Approach

1. **Immediate**: Update the button to show instructions
2. **Next Step**: Deploy the Edge Function
3. **Best Practice**: Use dynamic portal sessions

This ensures users can always manage their subscriptions!