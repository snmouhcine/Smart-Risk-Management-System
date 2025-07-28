import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

const AuthGuardSimple = ({ children }) => {
  const { user, loading } = useAuth()

  // Simple loading check
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Chargement...</p>
        </div>
      </div>
    )
  }

  // Only check if user exists - bypass profile completely
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // User exists, allow access regardless of profile
  return children
}

export default AuthGuardSimple