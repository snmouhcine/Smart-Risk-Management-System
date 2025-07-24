import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import MethodeAlpha from './components/MethodeAlpha'

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <MethodeAlpha />
      </AuthGuard>
    </AuthProvider>
  )
}

export default App