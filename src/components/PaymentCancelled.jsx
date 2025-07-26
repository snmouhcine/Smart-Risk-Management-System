import React from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react'

const PaymentCancelled = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-orange-900 to-amber-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="h-10 w-10 text-red-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Paiement Annulé</h1>
        
        <p className="text-gray-300 mb-8">
          Votre paiement a été annulé. Aucun montant n'a été prélevé sur votre compte.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/app')}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>Réessayer</span>
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <HelpCircle className="h-5 w-5 text-blue-400" />
            <p className="text-sm font-medium text-gray-300">Besoin d'aide?</p>
          </div>
          <p className="text-sm text-gray-400">
            Contactez notre support à support@smartrisk.com
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentCancelled