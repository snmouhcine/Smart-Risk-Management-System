import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Loader2 } from 'lucide-react'

const ForceRefresh = () => {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  
  React.useEffect(() => {
    const forceRefresh = async () => {
      console.log('🔄 Force refresh initiated')
      
      // Clear any cached data
      localStorage.removeItem('sb-localhost-auth-token')
      
      // Wait a bit for auth to reload
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Force refresh profile
      if (refreshProfile) {
        await refreshProfile()
      }
      
      // Navigate to app
      setTimeout(() => {
        navigate('/app')
      }, 1000)
    }
    
    forceRefresh()
  }, [refreshProfile, navigate])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
        <p className="text-white text-lg">Actualisation du profil...</p>
      </div>
    </div>
  )
}

export default ForceRefresh