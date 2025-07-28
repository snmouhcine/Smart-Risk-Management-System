import React from 'react'
import { Activity, Database, CheckCircle } from 'lucide-react'

const DirectDashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Bypass Notice */}
      <div className="fixed top-4 right-4 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg z-50">
        <span className="font-bold">BYPASS MODE</span> - Direct Access
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Welcome Back!</h1>
          <p className="text-xl text-gray-300">sn.mouhcine@gmail.com</p>
          
          <div className="mt-6 p-4 bg-green-500/20 rounded-lg border border-green-500">
            <CheckCircle className="h-6 w-6 text-green-400 inline mr-2" />
            <span className="text-green-300">You have successfully accessed your dashboard!</span>
          </div>
        </div>

        {/* Your Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <Activity className="h-8 w-8 text-purple-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Trading Data</h2>
            <p className="text-gray-400">Your trading journal and history</p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Status: <span className="text-green-400">Available</span></p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <Database className="h-8 w-8 text-indigo-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Local Storage</h2>
            <p className="text-gray-400">All data stored locally</p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Mode: <span className="text-yellow-400">Bypass Active</span></p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <CheckCircle className="h-8 w-8 text-green-400 mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Access Status</h2>
            <p className="text-gray-400">Full access granted</p>
            <div className="mt-4">
              <p className="text-sm text-gray-500">User: <span className="text-blue-400">Authenticated</span></p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
              View Trading Journal
            </button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
              Position Calculator
            </button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
              Checklist
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DirectDashboard