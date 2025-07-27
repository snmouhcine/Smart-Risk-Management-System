import React from 'react'
import { Shield, Wrench } from 'lucide-react'

const MaintenanceMode = ({ siteName = 'Smart Risk Management' }) => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gray-800 rounded-full">
              <Wrench className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Mode Maintenance</h1>
          <p className="text-gray-400 mb-8">
            {siteName} est actuellement en maintenance pour améliorer votre expérience. 
            Nous serons de retour très bientôt!
          </p>
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">
              Si vous êtes administrateur, vous pouvez toujours accéder au site.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <Shield className="h-5 w-5" />
          <span className="text-sm">{siteName}</span>
        </div>
      </div>
    </div>
  )
}

export default MaintenanceMode