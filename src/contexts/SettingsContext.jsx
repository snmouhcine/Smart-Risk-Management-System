import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { defaultLandingContent } from '../constants/defaultContent'

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
      // If value is already an object (not a string), use it directly
      if (typeof value === 'object' && value !== null) {
        acc[key] = value;
      } else if (typeof value === 'string') {
        // Try to parse string values
        acc[key] = JSON.parse(value);
      } else {
        // For other types, use as-is
        acc[key] = value;
      }
    } catch (e) {
      // If parsing fails, use the original value
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
    email_from_address: 'noreply@smartrisk.com',
    // Include default landing page content as fallback
    ...defaultLandingContent
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (loading) return;

    if (settings.site_title) {
      document.title = settings.site_title;
    }
    
    if (settings.site_favicon) {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = settings.site_favicon;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--primary-color', settings.primary_color);
      document.documentElement.style.setProperty('--secondary-color', settings.secondary_color);
      
      if (settings.dark_mode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [settings.site_title, settings.site_favicon, settings.primary_color, settings.secondary_color, settings.dark_mode, loading]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // First, try to get settings from the edge function
      try {
        const { data: funcData, error: funcError } = await supabase.functions.invoke('site-settings', {
          method: 'GET'
        });

        if (!funcError && funcData && Object.keys(funcData).length > 0) {
          const parsedSettings = parseSettings(funcData);
          setSettings(prev => ({ ...prev, ...parsedSettings }));
          setLoading(false);
          return;
        }
      } catch (funcError) {
        console.warn('Edge function failed, falling back to direct DB query:', funcError);
      }

      // Fallback to direct database query
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
      // General settings
      site_name: 'general',
      site_title: 'general',
      site_url: 'general',
      site_favicon: 'general',
      maintenance_mode: 'general',
      
      // Email settings
      contact_email: 'email',
      support_email: 'email',
      smtp_host: 'email',
      smtp_port: 'email',
      smtp_user: 'email',
      smtp_password: 'email',
      email_from_name: 'email',
      email_from_address: 'email',
      
      // Security settings
      allow_registrations: 'security',
      require_email_verification: 'security',
      
      // Database settings
      auto_backup: 'database',
      backup_frequency: 'database',
      
      // Notification settings
      email_notifications: 'notifications',
      payment_notifications: 'notifications',
      error_notifications: 'notifications',
      
      // Appearance settings
      primary_color: 'appearance',
      secondary_color: 'appearance',
      dark_mode: 'appearance',
      
      // Payment settings
      stripe_webhook_secret: 'payment',
      
      // Landing page content
      hero_badge: 'landing_page',
      hero_title: 'landing_page',
      hero_title_highlight: 'landing_page',
      hero_subtitle: 'landing_page',
      hero_cta_main: 'landing_page',
      hero_cta_secondary: 'landing_page',
      hero_trust_1: 'landing_page',
      hero_trust_2: 'landing_page',
      hero_trust_3: 'landing_page',
      
      features_title: 'landing_page',
      features_title_highlight: 'landing_page',
      features_subtitle: 'landing_page',
      
      benefits_title: 'landing_page',
      benefits_title_highlight: 'landing_page',
      benefits_subtitle: 'landing_page',
      
      pricing_title: 'landing_page',
      pricing_title_highlight: 'landing_page',
      pricing_subtitle: 'landing_page',
      pricing_popular_badge: 'landing_page',
      pricing_cta_button: 'landing_page',
      pricing_guarantee: 'landing_page',
      
      testimonials_title: 'landing_page',
      testimonials_title_highlight: 'landing_page',
      testimonials_subtitle: 'landing_page',
      
      final_cta_title: 'landing_page',
      final_cta_subtitle: 'landing_page',
      final_cta_button1: 'landing_page',
      final_cta_button2: 'landing_page',
      final_cta_subtext: 'landing_page',
      
      // Feature content
      feature_1_title: 'landing_page',
      feature_1_description: 'landing_page',
      feature_1_item_1: 'landing_page',
      feature_1_item_2: 'landing_page',
      feature_1_item_3: 'landing_page',
      
      feature_2_title: 'landing_page',
      feature_2_description: 'landing_page',
      feature_2_item_1: 'landing_page',
      feature_2_item_2: 'landing_page',
      feature_2_item_3: 'landing_page',
      
      feature_3_title: 'landing_page',
      feature_3_description: 'landing_page',
      feature_3_item_1: 'landing_page',
      feature_3_item_2: 'landing_page',
      feature_3_item_3: 'landing_page',
      
      feature_4_title: 'landing_page',
      feature_4_description: 'landing_page',
      feature_4_item_1: 'landing_page',
      feature_4_item_2: 'landing_page',
      feature_4_item_3: 'landing_page',
      
      feature_5_title: 'landing_page',
      feature_5_description: 'landing_page',
      feature_5_item_1: 'landing_page',
      feature_5_item_2: 'landing_page',
      feature_5_item_3: 'landing_page',
      
      feature_6_title: 'landing_page',
      feature_6_description: 'landing_page',
      feature_6_item_1: 'landing_page',
      feature_6_item_2: 'landing_page',
      feature_6_item_3: 'landing_page',
      
      // Benefit content
      benefit_1_title: 'landing_page',
      benefit_1_description: 'landing_page',
      benefit_2_title: 'landing_page',
      benefit_2_description: 'landing_page',
      benefit_3_title: 'landing_page',
      benefit_3_description: 'landing_page',
      benefit_4_title: 'landing_page',
      benefit_4_description: 'landing_page',
      
      // ROI Calculator
      roi_calculator_title: 'landing_page',
      roi_calculator_label_1: 'landing_page',
      roi_calculator_label_2: 'landing_page',
      roi_calculator_label_3: 'landing_page',
      roi_calculator_disclaimer: 'landing_page',
      
      // Testimonials
      testimonial_1_text: 'landing_page',
      testimonial_1_name: 'landing_page',
      testimonial_1_role: 'landing_page',
      testimonial_2_text: 'landing_page',
      testimonial_2_name: 'landing_page',
      testimonial_2_role: 'landing_page',
      testimonial_3_text: 'landing_page',
      testimonial_3_name: 'landing_page',
      testimonial_3_role: 'landing_page',
      
      // Footer content
      footer_description: 'landing_page',
      footer_copyright: 'landing_page',
      footer_section_1_title: 'landing_page',
      footer_section_1_link_1: 'landing_page',
      footer_section_1_link_2: 'landing_page',
      footer_section_1_link_3: 'landing_page',
      footer_section_1_link_4: 'landing_page',
      footer_section_2_title: 'landing_page',
      footer_section_2_link_1: 'landing_page',
      footer_section_2_link_2: 'landing_page',
      footer_section_2_link_3: 'landing_page',
      footer_section_2_link_4: 'landing_page',
      footer_section_3_title: 'landing_page',
      footer_section_3_link_1: 'landing_page',
      footer_section_3_link_2: 'landing_page',
      footer_section_3_link_3: 'landing_page',
      footer_section_3_link_4: 'landing_page'
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
