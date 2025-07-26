import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import Login from './Login'
import Register from './Register'

const Auth = () => {
  const { user, loading } = useAuth()
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
        <Login onToggleMode={() => setAuthMode('register')} />
      ) : (
        <Register onToggleMode={() => setAuthMode('login')} />
      )}
    </>
  )
}

export default Auth