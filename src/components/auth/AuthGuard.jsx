import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import Login from './Login'
import Register from './Register'

const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState('login') // 'login' ou 'register'

  // Affichage de chargement pendant la vérification d'authentification
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

  // Si l'utilisateur n'est pas connecté, afficher les formulaires d'auth
  if (!user) {
    return (
      <>
        {authMode === 'login' ? (
          <Login onToggleMode={() => setAuthMode('register')} />
        ) : (
          <Register onToggleMode={() => setAuthMode('login')} />
        )}
      </>
    )
  }

  // Si l'utilisateur est connecté, afficher l'application
  return children
}

export default AuthGuard 