import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth()

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

  // Si l'utilisateur n'est pas connecté, rediriger vers la page d'auth
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Si l'utilisateur est connecté, afficher l'application
  return children
}

export default AuthGuard 