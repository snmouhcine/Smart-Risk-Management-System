import React, { createContext, useContext, useState, useEffect } from 'react'
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
  // BYPASS MODE - Automatically logged in
  const BYPASS_EMAIL = 'sn.mouhcine@gmail.com'
  const BYPASS_USER = {
    id: 'bypass-user-id',
    email: BYPASS_EMAIL,
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  }
  
  const [user, setUser] = useState(BYPASS_USER)
  const [session, setSession] = useState({ user: BYPASS_USER, access_token: 'bypass-token' })
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    id: BYPASS_USER.id,
    email: BYPASS_USER.email,
    is_subscribed: true,
    role: 'user',
    full_name: BYPASS_EMAIL
  })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    // BYPASS MODE - No database connection needed
    console.log('BYPASS MODE ACTIVE - Logged in as:', BYPASS_EMAIL)
    // Keep the subscription for compatibility but it won't do anything
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {})
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    // BYPASS MODE - Always succeed
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 500)
    return { data: { user: BYPASS_USER, session: { user: BYPASS_USER } }, error: null }
  }

  const signOut = async () => {
    // BYPASS MODE - Just pretend to sign out but stay logged in
    console.log('BYPASS MODE - Sign out ignored, staying logged in')
  }

  const refreshProfile = async () => {
    // Do nothing - we're using fake profile
  }

  const value = {
    user,
    session,
    loading,
    profile,
    profileLoading,
    isAdmin: profile?.role === 'admin',
    signIn,
    signUp: signIn, // Use signIn for now
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext