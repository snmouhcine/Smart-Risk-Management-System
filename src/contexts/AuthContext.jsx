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
    
    console.log('🔄 Force refreshing profile for:', user.email)
    setProfileLoading(true)
    
    try {
      // Force a fresh fetch with no cache
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      console.log('Profile refresh result:', { profileData, error })
        
      if (!error && profileData) {
        console.log('✅ Profile updated:', profileData)
        setProfile(profileData)
        // Force loading states to reset
        setProfileLoading(false)
        setLoading(false)
      } else {
        console.error('❌ Profile refresh error:', error)
        // Still set loading to false to unblock UI
        setProfileLoading(false)
        setLoading(false)
      }
    } catch (error) {
      console.error('❌ Error refreshing profile:', error)
      setProfileLoading(false)
      setLoading(false)
    }
  }

  // Periodic profile refresh to prevent subscription status loss
  useEffect(() => {
    if (!user || !profile) return
    
    // Refresh profile every 5 minutes to ensure subscription status is current
    const intervalId = setInterval(async () => {
      console.log('⏰ Periodic profile refresh...')
      try {
        const { data: currentProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (!error && currentProfile) {
          // Only update if subscription status changed
          if (currentProfile.is_subscribed !== profile.is_subscribed) {
            console.log('📊 Subscription status changed:', profile.is_subscribed, '→', currentProfile.is_subscribed)
            setProfile(currentProfile)
          }
        }
      } catch (err) {
        console.error('Error in periodic refresh:', err)
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
          console.error('Erreur récupération session:', error)
          setProfileLoading(false)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            console.log('👤 Utilisateur connecté:', session.user.email)
            
            // TEMPORARY FIX for initial load too
            if (session.user.email === 'ryan@3fs.be') {
              console.log('IMMEDIATE INITIAL: Setting admin profile for ryan@3fs.be')
              console.log('YOUR USER ID IS:', session.user.id) // This will show your user ID
              setProfile({
                id: session.user.id,
                email: session.user.email,
                role: 'admin',
                is_subscribed: false
              })
              setProfileLoading(false)
            } else {
              console.log('Fetching profile for user ID:', session.user.id)
              // Fetch user profile
              const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()
              console.log('Profile fetch result:', { profileData, profileError })
              
              // Handle non-admin profile fetch
              if (profileError) {
                console.error('Error fetching profile:', profileError)
              } else if (profileData) {
                console.log('Profile loaded:', profileData)
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
        console.error('Erreur session initiale:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event, session?.user?.email || 'Déconnecté')
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Don't set loading to false until profile is fetched
          console.log('Auth state change - Fetching profile for:', session.user.email)
          
          // TEMPORARY FIX: Set admin profile immediately for ryan@3fs.be
          if (session.user.email === 'ryan@3fs.be') {
            console.log('IMMEDIATE: Setting admin profile for ryan@3fs.be')
            console.log('YOUR USER ID IS:', session.user.id) // This will show your user ID
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
              console.error('Profile fetch timeout or error:', err)
              return { data: null, error: err }
            }
          }
          
          const { data: profileData, error: profileError } = await fetchProfileWithTimeout()
          console.log('Auth state change - Profile result:', { profileData, profileError })
          
          if (profileError) {
            console.error('Error fetching profile on auth change:', profileError)
            // Temporary: set a default profile if fetch fails
            if (session.user.email === 'ryan@3fs.be') {
              console.log('Setting default admin profile for ryan@3fs.be on auth change')
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
            console.log('Profile loaded on auth change:', profileData)
            setProfile(profileData)
          }
          setProfileLoading(false)
        } else {
          setProfile(null)
          setProfileLoading(false)
        }
        
        // Only set loading to false after profile fetch attempt
        setLoading(false)

        // Log détaillé pour debug
        if (event === 'SIGNED_IN') {
          console.log('✅ Connexion réussie')
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 Déconnexion')
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token rafraîchi - Recharging profile...')
          
          // IMPORTANT: Re-fetch profile when token is refreshed
          if (session?.user) {
            const { data: refreshedProfile, error: refreshError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (!refreshError && refreshedProfile) {
              console.log('✅ Profile refreshed after token refresh:', refreshedProfile)
              setProfile(refreshedProfile)
            } else {
              console.error('❌ Error refreshing profile after token refresh:', refreshError)
            }
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
  
  // Debug log
  if (user) {
    console.log('AuthContext Value:', {
      userEmail: user.email,
      loading,
      profile,
      isAdmin: profile?.role === 'admin'
    })
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 