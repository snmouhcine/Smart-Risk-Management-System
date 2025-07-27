import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'

const DebugInfo = () => {
  const { user } = useAuth()
  const [debugData, setDebugData] = useState({
    environment: {
      url: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      nodeEnv: import.meta.env.NODE_ENV,
      mode: import.meta.env.MODE
    },
    userProfile: null,
    tables: {},
    errors: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkEverything()
  }, [user])

  const checkEverything = async () => {
    if (!user) return

    const errors = []
    const tables = {}

    try {
      // Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        errors.push(`User profile error: ${profileError.message}`)
      } else {
        setDebugData(prev => ({ ...prev, userProfile: profile }))
      }

      // Check tables existence and data
      const tablesToCheck = [
        'user_profiles',
        'site_settings',
        'subscription_plans',
        'payments',
        'user_subscriptions'
      ]

      for (const table of tablesToCheck) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })

          if (error) {
            tables[table] = { exists: false, error: error.message }
            if (error.code === '42P01') {
              errors.push(`Table '${table}' does not exist`)
            } else {
              errors.push(`${table}: ${error.message}`)
            }
          } else {
            tables[table] = { exists: true, count }
          }
        } catch (err) {
          tables[table] = { exists: false, error: err.message }
        }
      }

      // Check specific columns in user_profiles
      try {
        const { data: columnCheck } = await supabase
          .from('user_profiles')
          .select('id, is_admin, role, is_subscribed')
          .eq('id', user.id)
          .single()

        tables.user_profiles_columns = {
          has_is_admin: columnCheck && 'is_admin' in columnCheck,
          has_role: columnCheck && 'role' in columnCheck,
          has_is_subscribed: columnCheck && 'is_subscribed' in columnCheck
        }
      } catch (err) {
        errors.push(`Column check error: ${err.message}`)
      }

      setDebugData(prev => ({
        ...prev,
        tables,
        errors
      }))
    } catch (error) {
      errors.push(`General error: ${error.message}`)
      setDebugData(prev => ({ ...prev, errors }))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-yellow-500" />
          Debug Information
        </h2>

        {/* Environment */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Environment</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Supabase URL:</span>
              <span className="text-white font-mono">
                {debugData.environment.url ? '✓ Configured' : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Anon Key:</span>
              <span className="text-white">
                {debugData.environment.hasAnonKey ? '✓ Present' : '✗ Missing'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Mode:</span>
              <span className="text-white">{debugData.environment.mode}</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">User Profile</h3>
          {debugData.userProfile ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Is Admin:</span>
                <span className="text-white">
                  {debugData.userProfile.is_admin ? '✓ Yes' : '✗ No'} 
                  (is_admin: {String(debugData.userProfile.is_admin)})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Role:</span>
                <span className="text-white">
                  {debugData.userProfile.role || 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Subscribed:</span>
                <span className="text-white">
                  {debugData.userProfile.is_subscribed ? '✓ Yes' : '✗ No'}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-red-400">No profile found</p>
          )}
        </div>

        {/* Tables */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">Database Tables</h3>
          <div className="space-y-2">
            {Object.entries(debugData.tables).map(([table, info]) => (
              <div key={table} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{table}:</span>
                <span className={info.exists ? 'text-green-400' : 'text-red-400'}>
                  {info.exists ? (
                    <>
                      <CheckCircle className="inline h-4 w-4 mr-1" />
                      Exists ({info.count} rows)
                    </>
                  ) : (
                    <>
                      <XCircle className="inline h-4 w-4 mr-1" />
                      {info.error}
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Errors */}
        {debugData.errors.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3 text-red-400">Errors</h3>
            <div className="space-y-2">
              {debugData.errors.map((error, idx) => (
                <div key={idx} className="text-sm text-red-400">
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-400 mb-2">To Fix:</h4>
          <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
            <li>Check Vercel environment variables</li>
            <li>Run SQL migrations in production Supabase</li>
            <li>Ensure your user has is_admin = true</li>
            <li>Check if Edge Functions are deployed</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default DebugInfo