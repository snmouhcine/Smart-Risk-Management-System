import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CreditCard, ExternalLink, Loader2, Calendar, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

const SubscriptionManager = () => {
  const { profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await supabase.functions.invoke('create-portal-session', {
        body: {}
      })

      if (response.data?.url) {
        window.location.href = response.data.url
      } else {
        throw new Error('No portal URL returned')
      }
    } catch (error) {
      console.error('Error opening customer portal:', error)
      alert('Erreur lors de l\'ouverture du portail client')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-green-400 bg-green-400/20'
      case 'trialing':
        return 'text-blue-400 bg-blue-400/20'
      case 'past_due':
        return 'text-yellow-400 bg-yellow-400/20'
      case 'canceled':
      case 'cancelled':
        return 'text-red-400 bg-red-400/20'
      default:
        return 'text-gray-400 bg-gray-400/20'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Actif'
      case 'trialing':
        return 'Période d\'essai'
      case 'past_due':
        return 'En retard'
      case 'canceled':
      case 'cancelled':
        return 'Annulé'
      default:
        return status || 'Inactif'
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <CreditCard className="h-6 w-6 mr-2 text-purple-400" />
          Gestion de l'abonnement
        </h3>
        {profile?.is_subscribed && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(profile.subscription_status)}`}>
            {getStatusText(profile.subscription_status)}
          </span>
        )}
      </div>

      {profile?.is_subscribed ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Statut de l'abonnement</p>
              <p className="text-white font-medium">{getStatusText(profile.subscription_status)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Prochaine facturation</p>
              <p className="text-white font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {formatDate(profile.subscription_end_date)}
              </p>
            </div>
          </div>

          <div className="p-4 bg-gray-700/50 rounded-lg">
            <p className="text-sm text-gray-300 mb-3">
              Gérez votre abonnement, mettez à jour vos informations de paiement ou annulez votre abonnement depuis le portail client Stripe.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={loading}
              className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Chargement...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-5 w-5" />
                  <span>Accéder au portail client</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-400" />
          </div>
          <p className="text-gray-300 mb-4">
            Vous n'avez pas d'abonnement actif.
          </p>
          <button
            onClick={() => window.location.href = '/app'}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            Souscrire maintenant
          </button>
        </div>
      )}
    </div>
  )
}

export default SubscriptionManager