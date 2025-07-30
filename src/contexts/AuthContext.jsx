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

  useEffect(() => {
    setLoading(true)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log(`[AuthContext] onAuthStateChange event: ${event}`)
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        console.log(`[AuthContext] useEffect[user] - Fetching profile for user: ${user.id}`)
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, full_name, role, is_subscribed, subscription_status, subscription_end_date, is_admin')
            .eq('id', user.id)
            .single()

          if (error) {
            console.error('[AuthContext] Error fetching profile:', error)
            setProfile(null)
          } else {
            console.log('[AuthContext] Profile fetched:', data)
            setProfile(data)
          }
        } catch (e) {
          console.error('[AuthContext] Critical error fetching profile:', e)
          setProfile(null)
        } finally {
          console.log('[AuthContext] Profile fetch finished. Setting loading to false.')
          setLoading(false)
        }
      } else {
        console.log('[AuthContext] No user session. Setting loading to false.')
        setLoading(false)
        setProfile(null)
      }
    }

    fetchProfile()
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      console.log('No user to refresh profile for.')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name, role, is_subscribed, subscription_status, subscription_end_date, is_admin')
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
    profileLoading: loading, 
    isAdmin: profile?.is_admin || false
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}