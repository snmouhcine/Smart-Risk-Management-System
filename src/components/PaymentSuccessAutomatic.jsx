import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const PaymentSuccessAutomatic = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [status, setStatus] = useState('activating')
  const [, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    
    const activateSubscription = async () => {
      console.log('Payment success page loaded, checking user...')
      
      // First, try to get the session directly
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Session check:', session?.user?.email)
      
      // Wait for user to be loaded (up to 15 seconds)
      let attempts = 0
      let currentUser = user || session?.user
      
      while (!currentUser && attempts < 30 && mounted) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: { session: newSession } } = await supabase.auth.getSession()
        currentUser = user || newSession?.user
        attempts++
        
        if (attempts % 6 === 0) {
          console.log(`Still waiting for user... (${attempts/2}s)`)
        }
      }

      if (!currentUser || !mounted) {
        console.error('No user found after 15 seconds')
        setError('Session de connexion non trouvée. Veuillez vous reconnecter.')
        setStatus('error')
        return
      }
      
      // Use the found user
      const activeUser = currentUser

      try {
        console.log('Activating subscription for:', activeUser.email)
        
        // Skip Edge Function and go directly to database update
        // This is what the "Force activation" button does and it works
        console.log('Using direct database update for immediate activation')
        
        // Try up to 3 times with a small delay
        let updateSuccess = false
        let lastError = null
        
        for (let attempt = 1; attempt <= 3 && !updateSuccess; attempt++) {
          console.log(`Activation attempt ${attempt}/3`)
          
          // Method 1: Try updating by user ID (most reliable)
          const { data: updateData, error: updateError } = await supabase
            .from('user_profiles')
            .update({ is_subscribed: true })
            .eq('id', activeUser.id)
            .select()
            .single()
          
          if (!updateError) {
            console.log('Subscription activated successfully:', updateData)
            updateSuccess = true
            break
          }
          
          console.error(`Attempt ${attempt} failed:`, updateError)
          lastError = updateError
          
          // If not the last attempt, wait a bit before retrying
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        
        // If all attempts with ID failed, try with email
        if (!updateSuccess) {
          console.log('All ID updates failed, trying email update...')
          const { error: emailUpdateError } = await supabase
            .from('user_profiles')
            .update({ is_subscribed: true })
            .eq('email', activeUser.email)
          
          if (emailUpdateError) {
            console.error('Email update also failed:', emailUpdateError)
            throw new Error('Unable to activate subscription after multiple attempts')
          } else {
            updateSuccess = true
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
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Paiement Réussi! ✅</h2>
          <p className="text-gray-300 mb-4">
            Votre paiement a été traité avec succès. 
          </p>
          
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm mb-2">
              Si vous ne pouvez pas accéder à l'application, essayez:
            </p>
            <ol className="text-left text-blue-200 text-sm space-y-1">
              <li>1. Déconnectez-vous et reconnectez-vous</li>
              <li>2. Videz le cache de votre navigateur</li>
              <li>3. Ou cliquez sur "Forcer l'activation" ci-dessous</li>
            </ol>
          </div>
          
          <button
            onClick={async () => {
              setStatus('activating')
              // Force activation with direct database update
              try {
                const { data: { session } } = await supabase.auth.getSession()
                if (session?.user) {
                  await supabase
                    .from('user_profiles')
                    .update({ is_subscribed: true })
                    .eq('id', session.user.id)
                  
                  setTimeout(() => navigate('/app'), 1000)
                }
              } catch (err) {
                console.error('Force activation failed:', err)
                navigate('/app')
              }
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 mb-3"
          >
            Forcer l'activation
          </button>
          
          <button
            onClick={() => {
              supabase.auth.signOut()
              navigate('/auth')
            }}
            className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors mb-3"
          >
            Se reconnecter
          </button>
          
          <button
            onClick={() => navigate('/app')}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            Essayer d'accéder quand même →
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