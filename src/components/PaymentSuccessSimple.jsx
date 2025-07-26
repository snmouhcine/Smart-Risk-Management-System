import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PaymentSuccessSimple = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [status, setStatus] = useState('loading') // loading, success, error
  const [error, setError] = useState(null)

  useEffect(() => {
    const activateSubscription = async () => {
      console.log('PaymentSuccessSimple: Starting activation')
      
      if (!user) {
        console.log('Waiting for user...')
        // Wait a bit for auth to load
        setTimeout(() => {
          if (!user) {
            setError('Utilisateur non trouvé')
            setStatus('error')
          }
        }, 2000)
        return
      }

      try {
        console.log('Activating subscription for:', user.email)
        
        // Use RPC call to bypass RLS
        const { data, error: rpcError } = await supabase
          .rpc('activate_user_subscription', {
            user_id: user.id
          })
        
        if (rpcError) {
          console.error('RPC Error:', rpcError)
          // Fallback: Try direct update without RLS
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ is_subscribed: true })
            .eq('email', user.email)
          
          if (updateError) {
            throw updateError
          }
        }
        
        console.log('Subscription activated!')
        setStatus('success')
        
        // Refresh profile
        if (refreshProfile) {
          await refreshProfile()
        }
        
        // Redirect after delay
        setTimeout(() => {
          navigate('/app')
        }, 2000)
        
      } catch (err) {
        console.error('Error activating subscription:', err)
        setError(err.message)
        setStatus('error')
      }
    }

    activateSubscription()
  }, [user, navigate, refreshProfile])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Activation de votre abonnement...</h2>
          <p className="text-gray-400">Veuillez patienter...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Activation manuelle requise</h2>
          <p className="text-gray-300 mb-4">
            Votre paiement a été accepté, mais l'activation automatique a échoué.
          </p>
          <p className="text-gray-400 mb-6 text-sm">
            Erreur: {error || 'Problème de connexion à la base de données'}
          </p>
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm">
              Contactez l'administrateur pour activer votre compte manuellement.
              Votre email: <strong>{user?.email}</strong>
            </p>
          </div>
          <button
            onClick={() => navigate('/app')}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            Réessayer l'accès
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Paiement Réussi!</h1>
        
        <div className="mb-6">
          <Sparkles className="h-6 w-6 text-yellow-400 inline mr-2" />
          <p className="text-gray-300 inline">
            Bienvenue dans Smart Risk Management Pro!
          </p>
        </div>
        
        <p className="text-gray-400 mb-8">
          Redirection vers l'application...
        </p>
        
        <button
          onClick={() => navigate('/app')}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>Accéder maintenant</span>
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default PaymentSuccessSimple