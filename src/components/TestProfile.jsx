import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TestProfile = () => {
  const { user } = useAuth()
  const [testResult, setTestResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testProfileFetch = async () => {
      if (!user) return
      
      console.log('TestProfile: Starting test for user:', user.id)
      
      try {
        // Test 1: Direct query
        const { data: directData, error: directError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('TestProfile: Direct query result:', { directData, directError })
        
        // Test 2: Query by email
        const { data: emailData, error: emailError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('email', user.email)
          .single()
        
        console.log('TestProfile: Email query result:', { emailData, emailError })
        
        // Test 3: Get current user from auth
        const { data: { user: authUser } } = await supabase.auth.getUser()
        console.log('TestProfile: Auth user:', authUser)
        
        setTestResult({
          directQuery: { data: directData, error: directError },
          emailQuery: { data: emailData, error: emailError },
          authUser: authUser
        })
      } catch (error) {
        console.error('TestProfile: Exception:', error)
        setTestResult({ error: error.message })
      } finally {
        setLoading(false)
      }
    }
    
    testProfileFetch()
  }, [user])

  if (loading) return <div>Testing profile fetch...</div>
  
  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg">
      <h3 className="text-lg font-bold mb-2">Profile Test Results</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(testResult, null, 2)}
      </pre>
    </div>
  )
}

export default TestProfile