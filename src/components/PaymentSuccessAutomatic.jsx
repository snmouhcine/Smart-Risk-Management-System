import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PaymentSuccessAutomatic = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [status, setStatus] = useState('activating')
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    
    const activateSubscription = async () => {
      // Wait for user to be loaded
      let attempts = 0
      while (!user && attempts < 10 && mounted) {
        await new Promise(resolve => setTimeout(resolve, 500))
        attempts++
      }

      if (!user || !mounted) {
        setError('User not found')
        setStatus('error')
        return
      }

      try {
        console.log('Activating subscription for:', user.email)
        
        // Try the force activation function first
        const { data, error } = await supabase
          .rpc('force_activate_subscription', {
            user_email: user.email
          })
        
        if (error) {
          console.error('Force activation error:', error)
          
          // Fallback: Direct update (should work with RLS disabled)
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ is_subscribed: true })
            .eq('email', user.email)
          
          if (updateError) {
            console.error('Direct update error:', updateError)
            throw new Error('Unable to activate subscription - please contact support')
          }
        }
        
        console.log('Subscription activated successfully!')
        
        // Refresh the profile to get updated data
        if (refreshProfile) {
          await refreshProfile()
        }
        
        // Update status
        if (mounted) {
          setStatus('success')
          
          // Auto redirect after 2 seconds
          setTimeout(() => {
            if (mounted) {
              navigate('/app')
            }
          }, 2000)
        }
        
      } catch (err) {
        console.error('Activation error:', err)
        if (mounted) {
          setError(err.message || 'Failed to activate subscription')
          setStatus('error')
        }
      }
    }

    activateSubscription()
    
    return () => {
      mounted = false
    }
  }, [user, navigate, refreshProfile])

  if (status === 'activating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Activation de votre abonnement...</h2>
          <p className="text-gray-400">Finalisation de votre paiement</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Problème temporaire</h2>
          <p className="text-gray-300 mb-4">
            Votre paiement a été traité avec succès, mais nous rencontrons un problème technique.
          </p>
          <p className="text-red-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 mb-3"
          >
            Réessayer
          </button>
          <button
            onClick={() => navigate('/app')}
            className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
          >
            Continuer vers l'app
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
            Votre abonnement est maintenant actif
          </p>
        </div>
        
        <p className="text-gray-400 mb-8">
          Redirection automatique dans 2 secondes...
        </p>
        
        <button
          onClick={() => navigate('/app')}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <span>Accéder à Smart Risk Management</span>
          <ArrowRight className="h-5 w-5" />
        </button>
        
        <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
          <p className="text-sm text-gray-400">
            💡 Vous pouvez gérer votre abonnement depuis les paramètres
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSuccessAutomatic