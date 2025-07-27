import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { Loader2, AlertCircle } from 'lucide-react'
import Login from './Login'
import Register from './Register'

const Auth = () => {
  const { user, loading } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()
  const [authMode, setAuthMode] = useState('login') // 'login' ou 'register'

  // Redirect to app if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/app')
    }
  }, [user, navigate])

  // Loading state
  if (loading) {
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

  // Show auth forms
  return (
    <>
      {authMode === 'login' ? (
        <Login onToggleMode={() => settings.allow_registrations ? setAuthMode('register') : null} />
      ) : (
        settings.allow_registrations ? (
          <Register onToggleMode={() => setAuthMode('login')} />
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full mx-4 text-center">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Inscriptions fermées</h2>
              <p className="text-blue-200 mb-6">
                Les nouvelles inscriptions sont temporairement fermées. 
                Veuillez contacter l'administrateur pour plus d'informations.
              </p>
              <button
                onClick={() => setAuthMode('login')}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        )
      )}
    </>
  )
}

export default Auth