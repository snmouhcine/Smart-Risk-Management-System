import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }});
  }

  try {
    // Handle GET request - fetch PUBLIC settings for everyone
    if (req.method === 'GET') {
      const { data: settings, error } = await supabase
        .from('site_settings')
        .select('*')
        .in('category', ['landing_page', 'general', 'appearance']);

      if (error) throw error;

      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      return new Response(JSON.stringify(settingsObject), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      });
    }

    // Handle POST request - secure update for admins only
    if (req.method === 'POST') {
      // Step 1: Verify authentication
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return new Response('Unauthorized', { status: 401 });
      
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) return new Response('Unauthorized', { status: 401 });

      // Step 2: Verify if the user is an admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profile?.role !== 'admin') {
        return new Response('Forbidden: You must be an admin to update settings.', { status: 403 });
      }

      // Step 3: Process the update
      const updates = await req.json();
      const promises = Object.entries(updates).map(([key, value]) => 
        supabase.from('site_settings').upsert({
            key,
            value: value, // The admin panel already stringifies the JSON
            category: getCategoryForKey(key),
            updated_at: new Date().toISOString(),
            updated_by: user.id,
          }, { onConflict: 'key' })
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error(errors[0].error.message);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 200,
      });
    }

    return new Response('Method not allowed', { status: 405 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        status: 400,
      }
    );
  }
});

function getCategoryForKey(key: string): string {
  const categoryMap: Record<string, string> = {
    // General settings
    site_name: 'general',
    site_title: 'general',
    site_url: 'general',
    site_favicon: 'general',
    
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
    maintenance_mode: 'general',
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
    final_cta_subtext: 'landing_page'
  }
  
  return categoryMap[key] || 'general'
}