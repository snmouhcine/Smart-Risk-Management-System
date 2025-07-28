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
  const [loading, setLoading] = useState(true) // Commence en chargement

  useEffect(() => {
    // onAuthStateChange gère la session initiale et tous les changements.
    // Le premier événement reçu est 'INITIAL_SESSION'.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        const currentUser = session?.user
        setUser(currentUser ?? null)

        if (currentUser) {
          try {
            const { data, error } = await supabase
              .from('user_profiles')
              .select('id, email, full_name, role, is_subscribed, subscription_end_date')
              .eq('id', currentUser.id)
              .single()

            if (error) {
              console.error("AuthContext: Error fetching profile:", error)
              setProfile(null)
            } else {
              setProfile(data)
            }
          } catch (e) {
            console.error("AuthContext: Critical error fetching profile:", e)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        
        // Le premier événement (INITIAL_SESSION) désactivera le chargement initial.
        // Les événements suivants (TOKEN_REFRESHED) mettront à jour les données silencieusement.
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  const refreshProfile = useCallback(async () => {
    if (user) {
      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, full_name, role, is_subscribed, subscription_end_date')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error("AuthContext: Error refreshing profile:", error)
          setProfile(null)
        } else {
          setProfile(data)
        }
      } catch (e) {
        console.error("AuthContext: Critical error on refresh:", e)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }
  }, [user])

  // Fonctions d'authentification simplifiées
  const signUp = (email, password, fullName) => 
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })

  const signIn = (email, password) => 
    supabase.auth.signInWithPassword({ email, password })

  const signOut = () => 
    supabase.auth.signOut()

  const resetPassword = (email) => 
    supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })

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
    profileLoading: loading, // `profileLoading` est maintenant un alias de `loading`
    isAdmin: profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}