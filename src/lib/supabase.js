import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables d\'environnement Supabase manquantes. Vérifiez votre fichier .env.local')
  console.warn('VITE_SUPABASE_URL =', supabaseUrl ? '✅ Configurée' : '❌ Manquante')
  console.warn('VITE_SUPABASE_ANON_KEY =', supabaseAnonKey ? '✅ Configurée' : '❌ Manquante')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
})

// Helper pour obtenir l'utilisateur actuel
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error)
    return null
  }
}

// Helper pour la session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Erreur récupération session:', error)
    return null
  }
}

// Test de connexion à Supabase
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    if (error) throw error
    console.log('✅ Connexion Supabase réussie')
    return true
  } catch (error) {
    console.error('❌ Erreur connexion Supabase:', error.message)
    return false
  }
} 