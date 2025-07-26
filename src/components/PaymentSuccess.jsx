import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [updating, setUpdating] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const updateSubscriptionStatus = async () => {
      console.log('PaymentSuccess: Starting update process')
      console.log('User:', user)
      
      if (!user) {
        console.error('No user found!')
        setError('Utilisateur non trouvé')
        setUpdating(false)
        return
      }
      
      try {
        console.log('Updating subscription for user:', user.id)
        
        // Add timeout wrapper
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database operation timed out')), 5000)
        )
        
        // First check if profile exists
        const fetchPromise = supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        const { data: existingProfile, error: fetchError } = await Promise.race([
          fetchPromise,
          timeoutPromise
        ]).catch(err => {
          console.error('Fetch timeout or error:', err)
          return { data: null, error: err }
        })
        
        console.log('Existing profile:', { existingProfile, fetchError })
        
        if (fetchError || !existingProfile) {
          // Profile doesn't exist, create it
          console.log('Profile not found, creating new profile...')
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: user.id,
              email: user.email,
              role: 'user',
              is_subscribed: true
            })
            .select()
            .single()
          
          console.log('Insert result:', { newProfile, insertError })
          
          if (insertError) {
            throw insertError
          }
        } else {
          // Profile exists, update it
          console.log('Updating existing profile...')
          const { data, error: updateError } = await supabase
            .from('user_profiles')
            .update({ is_subscribed: true })
            .eq('id', user.id)
            .select()
          
          console.log('Update result:', { data, error: updateError })
          
          if (updateError) {
            throw updateError
          }
        }
        
        console.log('Subscription updated successfully!')
        
        // Refresh profile to get updated status
        if (refreshProfile) {
          console.log('Refreshing profile...')
          await refreshProfile()
        }
        
        // Redirect to app after a short delay
        console.log('Redirecting to app in 2 seconds...')
        setTimeout(() => {
          navigate('/app')
        }, 2000)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Une erreur inattendue est survenue')
      } finally {
        setUpdating(false)
      }
    }

    updateSubscriptionStatus()
  }, [user, navigate, refreshProfile])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        {updating ? (
          <>
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Activation de votre abonnement...</h2>
            <p className="text-gray-400">Veuillez patienter pendant que nous activons votre accès.</p>
          </>
        ) : error ? (
          <>
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Erreur</h2>
            <p className="text-red-400 mb-6">{error}</p>
            <p className="text-gray-400 mb-4">Veuillez contacter le support ou réessayer.</p>
            <button
              onClick={() => navigate('/app')}
              className="w-full px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              Continuer quand même
            </button>
          </>
        ) : (
          <>
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
              Votre abonnement est maintenant actif. Redirection en cours...
            </p>
            
            <button
              onClick={() => navigate('/app')}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Accéder à l'application maintenant</span>
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-400">
                💡 Astuce: Vous pouvez gérer votre abonnement à tout moment depuis les paramètres de votre compte.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentSuccess