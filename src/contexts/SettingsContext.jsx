import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const SettingsContext = createContext({})

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    site_name: 'Smart Risk Management',
    site_title: 'Smart Risk Management - Gestion intelligente des risques',
    site_url: 'https://smartrisk.com',
    site_favicon: '/favicon.ico',
    contact_email: 'contact@smartrisk.com',
    support_email: 'support@smartrisk.com',
    maintenance_mode: false,
    allow_registrations: true,
    require_email_verification: true,
    auto_backup: true,
    backup_frequency: 'daily',
    email_notifications: true,
    payment_notifications: true,
    error_notifications: true,
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    dark_mode: true,
    stripe_webhook_secret: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    email_from_name: 'Smart Risk Management',
    email_from_address: 'noreply@smartrisk.com'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
    
    // Update document title when settings change
    if (settings.site_title) {
      document.title = settings.site_title
    }
    
    // Update favicon when settings change
    if (settings.site_favicon) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = settings.site_favicon
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    
    // Apply color theme
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--primary-color', settings.primary_color)
      document.documentElement.style.setProperty('--secondary-color', settings.secondary_color)
      
      // Apply dark mode
      if (settings.dark_mode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [settings.site_title, settings.site_favicon, settings.primary_color, settings.secondary_color, settings.dark_mode])

  const loadSettings = async () => {
    try {
      // First, check if the table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('site_settings')
        .select('key, value')
        .limit(1)
      
      if (tableError && tableError.code === '42P01') {
        console.log('Settings table does not exist yet. Using defaults.')
        setLoading(false)
        return
      }
      
      // Try to use Edge Function first
      try {
        const { data, error } = await supabase.functions.invoke('site-settings', {
          method: 'GET'
        })

        if (!error && data) {
          // Parse JSON values
          const parsedSettings = Object.entries(data).reduce((acc, [key, value]) => {
            try {
              acc[key] = JSON.parse(value)
            } catch {
              acc[key] = value
            }
            return acc
          }, {})
          setSettings(prev => ({ ...prev, ...parsedSettings }))
          setLoading(false)
          return
        }
      } catch (funcError) {
        console.log('Edge Function not available, falling back to direct database query')
      }
      
      // Fallback: Try direct database query
      const { data: dbSettings, error: dbError } = await supabase
        .from('site_settings')
        .select('*')
      
      if (!dbError && dbSettings) {
        const settingsObject = dbSettings.reduce((acc, setting) => {
          try {
            acc[setting.key] = JSON.parse(setting.value)
          } catch {
            acc[setting.key] = setting.value
          }
          return acc
        }, {})
        setSettings(prev => ({ ...prev, ...settingsObject }))
      }
    } catch (error) {
      console.error('Error in loadSettings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updates) => {
    try {
      // First check if table exists
      const { error: tableError } = await supabase
        .from('site_settings')
        .select('key')
        .limit(1)
      
      if (tableError && tableError.code === '42P01') {
        return { 
          success: false, 
          error: 'Settings table not found. Please execute the SQL script first.' 
        }
      }
      
      // Try Edge Function first
      try {
        const { data, error } = await supabase.functions.invoke('site-settings', {
          method: 'POST',
          body: updates
        })

        if (!error) {
          // Update local state
          setSettings(prev => ({ ...prev, ...updates }))
          return { success: true }
        }
      } catch (funcError) {
        console.log('Edge Function not available, using direct database update')
      }

      // Fallback: Use RPC functions which have SECURITY DEFINER
      const promises = Object.entries(updates).map(([key, value]) => {
        return supabase.rpc('update_site_setting', {
          p_key: key,
          p_value: JSON.stringify(value)
        })
      })

      const results = await Promise.all(promises)
      const errors = results.filter(r => r.error)
      
      if (errors.length > 0) {
        // If RPC fails, try direct update as last resort
        const directPromises = Object.entries(updates).map(([key, value]) => {
          return supabase
            .from('site_settings')
            .upsert({
              key,
              value: JSON.stringify(value),
              category: getCategoryForKey(key),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'key'
            })
        })

        const directResults = await Promise.all(directPromises)
        const directErrors = directResults.filter(r => r.error)
        
        if (directErrors.length > 0) {
          throw new Error(directErrors[0].error.message)
        }
      }

      // Update local state
      setSettings(prev => ({ ...prev, ...updates }))
      
      return { success: true }
    } catch (error) {
      console.error('Error updating settings:', error)
      return { success: false, error: error.message }
    }
  }
  
  const getCategoryForKey = (key) => {
    const categoryMap = {
      site_name: 'general',
      site_title: 'general',
      site_url: 'general',
      site_favicon: 'general',
      contact_email: 'email',
      support_email: 'email',
      maintenance_mode: 'general',
      allow_registrations: 'security',
      require_email_verification: 'security',
      auto_backup: 'database',
      backup_frequency: 'database',
      email_notifications: 'notifications',
      payment_notifications: 'notifications',
      error_notifications: 'notifications',
      primary_color: 'appearance',
      secondary_color: 'appearance',
      dark_mode: 'appearance',
      stripe_webhook_secret: 'payment',
      smtp_host: 'email',
      smtp_port: 'email',
      smtp_user: 'email',
      smtp_password: 'email',
      email_from_name: 'email',
      email_from_address: 'email'
    }
    
    return categoryMap[key] || 'general'
  }

  const value = {
    settings,
    loading,
    updateSettings,
    reloadSettings: loadSettings
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}