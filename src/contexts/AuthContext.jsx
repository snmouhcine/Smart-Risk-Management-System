import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
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
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, is_subscribed, subscription_end_date')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error("AuthContext Error fetching profile:", error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (e) {
      console.error("AuthContext Critical error fetching profile:", e)
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true)
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()

        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
          await fetchProfile(initialSession.user)
        }
      } catch (e) {
        console.error("Error in initial session fetch:", e)
      } finally {
        setLoading(false)
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setLoading(true)
          setSession(session)
          const currentUser = session?.user
          setUser(currentUser ?? null)
          
          if (currentUser) {
            await fetchProfile(currentUser)
          } else {
            setProfile(null)
          }
          setLoading(false)
        }
      )

      return () => {
        subscription.unsubscribe()
      }
    }

    initializeAuth()
  }, [fetchProfile])
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      setLoading(true)
      await fetchProfile(user)
      setLoading(false)
    }
  }, [user, fetchProfile])


  // Inscription
  const signUp = (email, password, fullName) => {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
  }

  // Connexion
  const signIn = (email, password) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  // Déconnexion
  const signOut = () => {
    return supabase.auth.signOut()
  }

  // Réinitialisation mot de passe
  const resetPassword = (email) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  }

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
    isAuthenticated: !!user,
    profileLoading: loading, // Utiliser le même état de chargement
    isAdmin: profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}