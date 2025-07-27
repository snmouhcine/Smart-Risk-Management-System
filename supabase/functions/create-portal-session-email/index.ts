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
    
    if (!customerEmail) {
      throw new Error('Customer email is required')
    }

    // Search for existing customer by email
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    })

    let customerId
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
      // Found existing customer
    } else {
      // Create a new customer if none exists
      const customer = await stripe.customers.create({
        email: customerEmail,
      })
      customerId = customer.id
      // Created new customer
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || 'https://smart-risk-management.vercel.app/app',
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    // Portal session error
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})