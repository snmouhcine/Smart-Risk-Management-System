import React, { useState } from 'react'
import { CreditCard, Loader2, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Test Stripe with Payment Links (easiest method, no server needed)
const StripeTest = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleTestCheckout = () => {
    setLoading(true)
    
    // Method 1: Use Stripe Payment Links (EASIEST - NO CODE NEEDED!)
    // 1. Go to https://dashboard.stripe.com/test/payment-links
    // 2. Click "New payment link"
    // 3. Select your product/price
    // 4. Enable "Adjust quantity" and "Collect customer details"
    // 5. Copy the payment link URL
    
    // Replace this with your actual payment link
    const PAYMENT_LINK = 'https://buy.stripe.com/test/YOUR_LINK_HERE'
    
    // Add user email as a parameter
    const checkoutUrl = `${PAYMENT_LINK}?prefilled_email=${encodeURIComponent(user?.email || '')}`
    
    // Redirect to Stripe
    window.location.href = checkoutUrl
  }

  const handleCreatePaymentLink = () => {
    window.open('https://dashboard.stripe.com/test/payment-links/create', '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Test Stripe Payment Links</h2>
        
        <div className="bg-blue-700/30 border border-blue-500/50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-300 mb-2">Configuration facile (2 minutes) :</h3>
          <ol className="text-sm text-gray-300 space-y-2">
            <li>1. Créez un Payment Link dans Stripe</li>
            <li>2. Copiez l'URL du lien</li>
            <li>3. Remplacez 'YOUR_LINK_HERE' dans le code</li>
            <li>4. C'est prêt ! ✅</li>
          </ol>
        </div>

        <button
          onClick={handleCreatePaymentLink}
          className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 mb-4"
        >
          <ExternalLink className="h-5 w-5" />
          <span>Créer un Payment Link dans Stripe</span>
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">Puis</span>
          </div>
        </div>

        <button
          onClick={handleTestCheckout}
          disabled={loading}
          className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Redirection...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              <span>Tester le paiement</span>
            </>
          )}
        </button>

        <div className="mt-6 bg-gray-700/50 rounded-lg p-4">
          <p className="text-sm text-gray-300 mb-2">
            <strong>Carte de test:</strong>
          </p>
          <p className="text-sm font-mono text-blue-400">4242 4242 4242 4242</p>
          <p className="text-xs text-gray-400 mt-1">
            Expiration: Date future • CVC: 3 chiffres
          </p>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Les Payment Links sont la méthode la plus simple pour accepter des paiements.
            Aucun code serveur nécessaire !
          </p>
        </div>
      </div>
    </div>
  )
}

export default StripeTest