import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../../lib/supabase'

const AuthGuard = ({ children }) => {
  const { user, loading, profile, profileLoading } = useAuth()

  // Affichage de chargement pendant la vérification d'authentification
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Chargement...</p>
          <p className="text-blue-200 text-sm mt-2">Vérification de l'authentification</p>
        </div>
      </div>
    )
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page d'auth
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Check subscription status (exempt admin users)
  // If profile is null or user is not subscribed (and not admin), show payment required
  if (!profile || (!profile.is_subscribed && profile.role !== 'admin')) {
    // Special case: if profile is null and it's still loading, wait
    if (!profile && profileLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
            <p className="text-white text-lg">Vérification du profil...</p>
          </div>
        </div>
      )
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-yellow-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Abonnement Requis</h2>
          <p className="text-gray-300 mb-6">
            Pour accéder à la plateforme Smart Risk Management, vous devez souscrire à un abonnement.
          </p>
          
          <button
            onClick={() => {
              // Use Payment Link from environment variable
              const paymentLink = import.meta.env.VITE_STRIPE_PAYMENT_LINK
              
              if (!paymentLink || paymentLink === 'YOUR_ACTUAL_LINK') {
                alert('Stripe Payment Link not configured properly in .env file')
                return
              }
              
              // Add user email to prefill the form
              const checkoutUrl = `${paymentLink}?prefilled_email=${encodeURIComponent(user.email)}`
              
              // Redirect to Stripe
              window.location.href = checkoutUrl
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CreditCard className="h-5 w-5" />
            <span>Souscrire maintenant</span>
          </button>
          
          <button
            onClick={() => {
              supabase.auth.signOut()
              window.location.href = '/'
            }}
            className="mt-4 text-gray-400 hover:text-white transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  // Si l'utilisateur est connecté et abonné, afficher l'application
  return children
}

export default AuthGuard