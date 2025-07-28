import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TestLogin = () => {
  const { user, signIn, signOut, loading } = useAuth()
  const [email, setEmail] = useState('sn.mouhcine@gmail.com')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setStatus('Logging in...')
    setError('')
    
    try {
      const { data, error } = await signIn(email, password)
      if (error) {
        setError(`Login error: ${error.message}`)
        setStatus('')
      } else {
        setStatus('Login successful!')
      }
    } catch (err) {
      setError(`Exception: ${err.message}`)
      setStatus('')
    }
  }

  const testDatabaseConnection = async () => {
    setStatus('Testing database connection...')
    setError('')
    
    try {
      // Test 1: Basic connection
      const { data: settings, error: settingsError } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
      
      if (settingsError) {
        setError(`Settings error: ${settingsError.message}`)
        return
      }
      
      // Test 2: User profile
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          setError(`Profile error: ${profileError.message}`)
          return
        }
        
        setStatus(`Database OK! Profile: ${JSON.stringify(profile)}`)
      } else {
        setStatus('Database connection OK! (Not logged in)')
      }
    } catch (err) {
      setError(`Database test failed: ${err.message}`)
      setStatus('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Login Test Page</h1>
        
        {/* Current Status */}
        <div className="bg-gray-800 p-4 rounded mb-6">
          <h2 className="text-xl font-semibold mb-2">Current Status:</h2>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>User: {user ? user.email : 'Not logged in'}</p>
          <p>User ID: {user ? user.id : 'N/A'}</p>
        </div>

        {/* Login Form */}
        {!user && (
          <div className="bg-gray-800 p-4 rounded mb-6">
            <h2 className="text-xl font-semibold mb-4">Login Form:</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full p-2 mb-2 bg-gray-700 rounded"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-2 mb-4 bg-gray-700 rounded"
            />
            <button
              onClick={handleLogin}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Login
            </button>
          </div>
        )}

        {/* Logged In Actions */}
        {user && (
          <div className="bg-gray-800 p-4 rounded mb-6">
            <h2 className="text-xl font-semibold mb-4">Actions:</h2>
            <button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded mr-2"
            >
              Logout
            </button>
            <button
              onClick={testDatabaseConnection}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
            >
              Test Database
            </button>
          </div>
        )}

        {/* Status Messages */}
        {status && (
          <div className="bg-green-800 p-4 rounded mb-4">
            <p>{status}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-800 p-4 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Debug Info:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify({ user, loading }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default TestLogin