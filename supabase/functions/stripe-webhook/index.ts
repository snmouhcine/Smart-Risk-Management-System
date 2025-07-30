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
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!signature || !webhookSecret) {
    return new Response('Webhook signature missing', { status: 400 })
  }

  try {
    const body = await req.text()
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id

        if (userId) {
          // Update user profile with subscription info
          await supabase
            .from('user_profiles')
            .update({
              is_subscribed: subscription.status === 'active',
              stripe_customer_id: subscription.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', userId)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata.user_id

        if (userId) {
          // Mark subscription as cancelled
          await supabase
            .from('user_profiles')
            .update({
              is_subscribed: false,
              subscription_status: 'cancelled'
            })
            .eq('id', userId)
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.user_id

        if (userId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          // Update user profile
          await supabase
            .from('user_profiles')
            .update({
              is_subscribed: true,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', userId)

          // Create payment record
          await supabase
            .from('payments')
            .insert({
              user_id: userId,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency,
              status: 'completed',
              stripe_payment_intent_id: session.payment_intent as string,
              metadata: {
                subscription_id: subscription.id,
                customer_id: session.customer
              }
            })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = invoice.subscription as string
        
        // Get subscription to find user
        const sub = await stripe.subscriptions.retrieve(subscription)
        const userId = sub.metadata.user_id

        if (userId) {
          // Create payment record for recurring payment
          await supabase
            .from('payments')
            .insert({
              user_id: userId,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency,
              status: 'completed',
              stripe_payment_intent_id: invoice.payment_intent as string,
              metadata: {
                subscription_id: subscription,
                invoice_id: invoice.id
              }
            })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find the user associated with this customer
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userProfile) {
          // Update user profile to reflect failed payment and revoke access
          await supabase
            .from('user_profiles')
            .update({
              is_subscribed: false,
              subscription_status: 'payment_failed',
            })
            .eq('id', userProfile.id);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    // Webhook error
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    )
  }
})