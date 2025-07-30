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

// Helper function to parse settings from DB/function response
const parseSettings = (data) => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    try {
      acc[key] = JSON.parse(value);
    } catch (e) {
      acc[key] = value;
    }
    return acc;
  }, {});
};


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
    
    if (settings.site_title) {
      document.title = settings.site_title
    }
    
    if (settings.site_favicon) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      link.href = settings.site_favicon
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--primary-color', settings.primary_color)
      document.documentElement.style.setProperty('--secondary-color', settings.secondary_color)
      
      if (settings.dark_mode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [settings.site_title, settings.site_favicon, settings.primary_color, settings.secondary_color, settings.dark_mode])

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Plan A: Attempt to invoke Edge Function
      const { data: funcData, error: funcError } = await supabase.functions.invoke('site-settings', {
        method: 'GET'
      });

      if (funcData && Object.keys(funcData).length > 0) {
        const parsedSettings = parseSettings(funcData);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
        setLoading(false);
        return; // Success, we are done.
      }
      
      // Plan B: Fallback to direct database query
      if(funcError) console.warn(`Edge function failed: ${funcError.message}. Falling back to DB.`);

      const { data: dbSettings, error: dbError } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('category', ['landing_page', 'general', 'appearance']);
      
      if (dbError) throw dbError;

      if (dbSettings) {
        const settingsFromDb = dbSettings.reduce((acc, { key, value }) => {
            acc[key] = value;
            return acc;
        }, {});
        const parsedSettings = parseSettings(settingsFromDb);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates) => {
    try {
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
      
      try {
        const { data, error } = await supabase.functions.invoke('site-settings', {
          method: 'POST',
          body: updates
        })

        if (!error) {
          setSettings(prev => ({ ...prev, ...updates }))
          return { success: true }
        }
      } catch (funcError) {
        // Fallback
      }

      const promises = Object.entries(updates).map(([key, value]) => {
        return supabase.rpc('update_site_setting', {
          p_key: key,
          p_value: JSON.stringify(value)
        })
      })

      const results = await Promise.all(promises)
      const errors = results.filter(r => r.error)
      
      if (errors.length > 0) {
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

      setSettings(prev => ({ ...prev, ...updates }))
      
      return { success: true }
    } catch (error) {
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
