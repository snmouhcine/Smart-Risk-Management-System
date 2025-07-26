import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2, ShieldX } from 'lucide-react'

const AdminGuard = ({ children }) => {
  const { user, profile, loading, isAdmin } = useAuth()
  
  console.log('AdminGuard - Loading:', loading)
  console.log('AdminGuard - User:', user?.email)
  console.log('AdminGuard - Profile:', profile)
  console.log('AdminGuard - IsAdmin:', isAdmin)

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Vérification des permissions...</p>
          <p className="text-blue-200 text-sm mt-2">Chargement de l'interface admin</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, redirect to auth page
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // If user is authenticated but not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
              <ShieldX className="h-10 w-10 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Accès refusé</h2>
          <p className="text-gray-300 mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette section.
          </p>
          <button
            onClick={() => window.location.href = '/app'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retour à l'application
          </button>
        </div>
      </div>
    )
  }

  // If user is admin, render children
  return children
}

export default AdminGuard