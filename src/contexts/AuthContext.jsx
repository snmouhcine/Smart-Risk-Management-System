import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Erreur récupération session:', error)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            console.log('👤 Utilisateur connecté:', session.user.email)
          }
        }
      } catch (error) {
        console.error('Erreur session initiale:', error)
      }
      setLoading(false)
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'Déconnecté')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        // Log détaillé pour debug
        if (event === 'SIGNED_IN') {
          console.log('✅ Connexion réussie')
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Déconnexion')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token rafraîchi')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Inscription
  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true)
      console.log('📝 Tentative d\'inscription pour:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })
      
      if (error) throw error
      
      console.log('✅ Inscription réussie:', data.user?.email)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Erreur inscription:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Connexion
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      console.log('🔐 Tentative de connexion pour:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      console.log('✅ Connexion réussie:', data.user?.email)
      return { data, error: null }
    } catch (error) {
      console.error('❌ Erreur connexion:', error)
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Déconnexion
  const signOut = async () => {
    try {
      setLoading(true)
      console.log('👋 Déconnexion...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log('✅ Déconnexion réussie')
      // Navigation will be handled by the component calling signOut
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error)
    } finally {
      setLoading(false)
    }
  }

  // Réinitialisation mot de passe
  const resetPassword = async (email) => {
    try {
      console.log('🔄 Reset password pour:', email)
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      console.log('✅ Email de reset envoyé')
      return { data, error: null }
    } catch (error) {
      console.error('❌ Erreur reset password:', error)
      return { data: null, error }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 