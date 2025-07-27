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
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // Function to refresh profile data
  const refreshProfile = async () => {
    if (!user) return
    
    setProfileLoading(true)
    
    try {
      // Force a fresh fetch with no cache
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      if (!error && profileData) {
        setProfile(profileData)
        // Force loading states to reset
        setProfileLoading(false)
        setLoading(false)
      } else {
        // Still set loading to false to unblock UI
        setProfileLoading(false)
        setLoading(false)
      }
    } catch (error) {
      setProfileLoading(false)
      setLoading(false)
    }
  }

  // Periodic profile refresh to prevent subscription status loss
  useEffect(() => {
    if (!user || !profile) return
    
    // Refresh profile every 5 minutes to ensure subscription status is current
    const intervalId = setInterval(async () => {
      try {
        const { data: currentProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!error && currentProfile) {
          // Only update if subscription status changed
          if (currentProfile.is_subscribed !== profile.is_subscribed) {
            setProfile(currentProfile)
          }
        }
      } catch (err) {
        // Silent error
      }
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(intervalId)
  }, [user, profile])
  
  useEffect(() => {
    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          setProfileLoading(false)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            
            // TEMPORARY FIX for initial load too
            if (session.user.email === 'ryan@3fs.be') {
              setProfile({
                id: session.user.id,
                email: session.user.email,
                role: 'admin',
                is_subscribed: false
              })
              setProfileLoading(false)
            } else {
              // Fetch user profile
              const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              
              // Handle non-admin profile fetch
              if (!profileError && profileData) {
                setProfile(profileData)
              }
              setProfileLoading(false)
            }
          } else {
            // No user in session
            setProfileLoading(false)
          }
        }
      } catch (error) {
        // Silent error
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          
          // TEMPORARY FIX: Set admin profile immediately for ryan@3fs.be
          if (session.user.email === 'ryan@3fs.be') {
            setProfile({
              id: session.user.id,
              email: session.user.email,
              role: 'admin',
              is_subscribed: false
            })
            setProfileLoading(false)
            setLoading(false)
            return
          }
          
          // Fetch user profile with timeout
          const fetchProfileWithTimeout = async () => {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            )
            
            const fetchPromise = supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            try {
              return await Promise.race([fetchPromise, timeoutPromise])
            } catch (err) {
              return { data: null, error: err }
            }
          }
          
          const { data: profileData, error: profileError } = await fetchProfileWithTimeout()
          
          if (profileError) {
            // Temporary: set a default profile if fetch fails
            if (session.user.email === 'ryan@3fs.be') {
              setProfile({
                id: session.user.id,
                email: session.user.email,
                role: 'admin',
                is_subscribed: false
              })
            } else {
              setProfile(null)
            }
          } else {
            setProfile(profileData)
          }
          setProfileLoading(false)
        } else {
          setProfile(null)
          setProfileLoading(false)
        }
        
        // Only set loading to false after profile fetch attempt
        setLoading(false)

        // IMPORTANT: Re-fetch profile when token is refreshed
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          const { data: refreshedProfile, error: refreshError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (!refreshError && refreshedProfile) {
            setProfile(refreshedProfile)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Inscription
  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true)
      
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
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Connexion
  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }

  // Déconnexion
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // Navigation will be handled by the component calling signOut
    } catch (error) {
      // Silent error
    } finally {
      setLoading(false)
    }
  }

  // Réinitialisation mot de passe
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const value = {
    user,
    session,
    profile,
    profileLoading,
    loading: loading || profileLoading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    refreshProfile,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}