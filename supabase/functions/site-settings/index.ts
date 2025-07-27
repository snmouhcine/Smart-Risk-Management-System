import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Handle GET request - fetch all settings
    if (req.method === 'GET') {
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('*')

      if (error) throw error

      // Transform array to object
      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {})

      return new Response(
        JSON.stringify(settingsObject),
        {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          },
          status: 200
        }
      )
    }

    // Handle POST request - update settings
    if (req.method === 'POST') {
      // Check if user is admin for write operations
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        return new Response('Forbidden', { status: 403 })
      }

      const updates = await req.json()

      // Update each setting
      const promises = Object.entries(updates).map(([key, value]) => {
        return supabase
          .from('site_settings')
          .upsert({
            key,
            value: JSON.stringify(value),
            category: getCategoryForKey(key),
            updated_at: new Date().toISOString(),
            updated_by: user.id
          }, {
            onConflict: 'key'
          })
      })

      const results = await Promise.all(promises)
      
      // Check for errors
      const errors = results.filter(r => r.error)
      if (errors.length > 0) {
        throw new Error(errors[0].error.message)
      }

      // Return updated settings
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('*')

      if (error) throw error

      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value
        return acc
      }, {})

      return new Response(
        JSON.stringify({ 
          success: true, 
          settings: settingsObject 
        }),
        {
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
          },
          status: 200
        }
      )
    }

    return new Response('Method not allowed', { status: 405 })

  } catch (error) {
    console.error('Error in site-settings function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 400
      }
    )
  }
})

function getCategoryForKey(key: string): string {
  const categoryMap: Record<string, string> = {
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