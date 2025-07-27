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

    // Parse request body for filters
    const { startDate, endDate, limit = 100 } = await req.json()

    // Fetch charges from Stripe (includes payments and refunds)
    const chargesParams: Stripe.ChargeListParams = {
      limit,
      expand: ['data.customer', 'data.balance_transaction', 'data.refunds']
    }

    if (startDate) {
      chargesParams.created = {
        gte: Math.floor(new Date(startDate).getTime() / 1000)
      }
    }

    if (endDate) {
      chargesParams.created = {
        ...chargesParams.created,
        lte: Math.floor(new Date(endDate).getTime() / 1000)
      }
    }

    const charges = await stripe.charges.list(chargesParams)

    // Fetch payment intents for more detailed payment info
    const paymentIntents = await stripe.paymentIntents.list({
      limit,
      expand: ['data.customer', 'data.latest_charge']
    })

    // Transform Stripe data into a consistent format
    const payments = charges.data.map(charge => {
      const customer = charge.customer as Stripe.Customer | null
      const refundAmount = charge.refunds?.data.reduce((sum, refund) => sum + refund.amount, 0) || 0
      
      return {
        id: charge.id,
        amount: (charge.amount - refundAmount) / 100, // Convert from cents to currency
        currency: charge.currency.toUpperCase(),
        status: charge.refunded ? 'refunded' : 
                charge.status === 'succeeded' ? 'completed' : 
                charge.status === 'failed' ? 'failed' : 'pending',
        created_at: new Date(charge.created * 1000).toISOString(),
        payment_method: charge.payment_method_details?.type || 'card',
        transaction_id: charge.id,
        stripe_payment_intent_id: charge.payment_intent,
        customer_email: customer?.email || charge.billing_details?.email || null,
        customer_name: customer?.name || charge.billing_details?.name || null,
        description: charge.description,
        metadata: charge.metadata,
        refunded: charge.refunded,
        refund_amount: refundAmount / 100,
        failure_message: charge.failure_message,
        receipt_url: charge.receipt_url,
        // Additional Stripe-specific data
        stripe_data: {
          balance_transaction_id: charge.balance_transaction,
          invoice_id: charge.invoice,
          transfer_id: charge.transfer,
          application_fee_amount: charge.application_fee_amount,
          dispute: charge.dispute ? true : false,
          card_brand: charge.payment_method_details?.card?.brand,
          card_last4: charge.payment_method_details?.card?.last4,
          card_country: charge.payment_method_details?.card?.country
        }
      }
    })

    // Calculate statistics
    const completedPayments = payments.filter(p => p.status === 'completed')
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyPayments = completedPayments.filter(p => {
      const date = new Date(p.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0)
    
    const successRate = payments.length > 0 
      ? (completedPayments.length / payments.length * 100).toFixed(1)
      : 0
      
    const averagePayment = completedPayments.length > 0
      ? (totalRevenue / completedPayments.length).toFixed(2)
      : 0

    // Get recent disputes
    const disputes = await stripe.disputes.list({ limit: 10 })
    
    // Get upcoming payouts
    const payouts = await stripe.payouts.list({ 
      limit: 5,
      status: 'pending'
    })

    return new Response(
      JSON.stringify({
        payments,
        stats: {
          totalRevenue,
          monthlyRevenue,
          successRate: parseFloat(successRate),
          averagePayment: parseFloat(averagePayment),
          totalTransactions: payments.length,
          refundedAmount: payments.reduce((sum, p) => sum + p.refund_amount, 0),
          disputeCount: disputes.data.length,
          upcomingPayouts: payouts.data.map(payout => ({
            amount: payout.amount / 100,
            arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
            status: payout.status
          }))
        }
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
    // Error in stripe-payments function
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})