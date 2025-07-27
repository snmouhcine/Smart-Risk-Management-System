import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_admin) {
      return new Response('Forbidden', { status: 403 })
    }

    // Parse request body
    const { startDate, previousStartDate, timeRange } = await req.json()

    const start = new Date(startDate)
    const previousStart = new Date(previousStartDate)

    // Fetch MRR and active subscriptions
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.items.price']
    })

    let mrr = 0
    let trialCount = 0
    const activeCustomerIds = new Set()

    for (const subscription of activeSubscriptions.data) {
      activeCustomerIds.add(subscription.customer)
      
      // Check if subscription is in trial
      if (subscription.status === 'trialing') {
        trialCount++
      }

      // Calculate MRR
      for (const item of subscription.items.data) {
        const price = item.price
        if (price.recurring?.interval === 'month') {
          mrr += (price.unit_amount || 0) / 100
        } else if (price.recurring?.interval === 'year') {
          mrr += ((price.unit_amount || 0) / 100) / 12
        }
      }
    }

    // Calculate churn rate
    // Get subscriptions that were active in the previous period
    const previousEndDate = new Date(start)
    const previousSubscriptions = await stripe.subscriptions.list({
      created: {
        gte: Math.floor(previousStart.getTime() / 1000),
        lt: Math.floor(previousEndDate.getTime() / 1000)
      },
      limit: 100
    })

    const previousCustomerIds = new Set(
      previousSubscriptions.data.map(sub => sub.customer)
    )

    // Calculate churned customers
    let churnedCount = 0
    for (const customerId of previousCustomerIds) {
      if (!activeCustomerIds.has(customerId)) {
        churnedCount++
      }
    }

    const churnRate = previousCustomerIds.size > 0
      ? (churnedCount / previousCustomerIds.size * 100).toFixed(1)
      : '0'

    const retentionRate = previousCustomerIds.size > 0
      ? ((activeCustomerIds.size / previousCustomerIds.size) * 100).toFixed(1)
      : '100'

    // Calculate payment success rate
    const charges = await stripe.charges.list({
      created: {
        gte: Math.floor(start.getTime() / 1000)
      },
      limit: 100
    })

    const totalCharges = charges.data.length
    const successfulCharges = charges.data.filter(charge => charge.status === 'succeeded').length
    
    const paymentSuccessRate = totalCharges > 0
      ? (successfulCharges / totalCharges * 100).toFixed(1)
      : '100'

    // Get trial subscriptions
    const trialSubscriptions = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100
    })

    return new Response(
      JSON.stringify({
        mrr,
        churnRate: parseFloat(churnRate),
        retentionRate: parseFloat(retentionRate),
        paymentSuccessRate: parseFloat(paymentSuccessRate),
        trialCount: trialSubscriptions.data.length
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Error in stripe-analytics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})