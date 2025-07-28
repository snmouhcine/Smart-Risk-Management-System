import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity } from 'lucide-react'

const QuickAccess = () => {
  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
        <Activity className="h-16 w-16 text-purple-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-4">Welcome Back!</h1>
        <p className="text-gray-300 mb-6">You're logged in as sn.mouhcine@gmail.com</p>
        
        <button
          onClick={() => navigate('/app')}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          Access Dashboard
        </button>
        
        <div className="mt-4 p-3 bg-yellow-500/20 rounded-lg">
          <p className="text-yellow-300 text-sm">Bypass Mode Active - No Database Connection</p>
        </div>
      </div>
    </div>
  )
}

export default QuickAccess