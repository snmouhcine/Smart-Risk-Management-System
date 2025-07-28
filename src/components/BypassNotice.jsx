import React from 'react'
import { AlertCircle } from 'lucide-react'

const BypassNotice = () => {
  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
      <AlertCircle className="h-5 w-5" />
      <span className="font-medium">BYPASS MODE ACTIVE - No Database</span>
    </div>
  )
}

export default BypassNotice