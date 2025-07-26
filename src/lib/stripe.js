import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
// Replace with your actual Stripe publishable key
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Stripe configuration
export const STRIPE_CONFIG = {
  // Price IDs from your Stripe dashboard
  // These will be created when you set up products in Stripe
  priceIds: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_ID_MONTHLY,
    yearly: import.meta.env.VITE_STRIPE_PRICE_ID_YEARLY
  },
  
  // Success and cancel URLs
  urls: {
    success: `${window.location.origin}/payment-success`,
    cancel: `${window.location.origin}/payment-cancelled`,
    customerPortal: import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL
  }
};

// Create checkout session
export const createCheckoutSession = async (priceId, customerEmail, userId) => {
  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        customerEmail,
        userId,
        successUrl: STRIPE_CONFIG.urls.success,
        cancelUrl: STRIPE_CONFIG.urls.cancel
      }),
    });

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Redirect to customer portal
export const redirectToCustomerPortal = async (customerId) => {
  try {
    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId
      }),
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error redirecting to customer portal:', error);
    throw error;
  }
};