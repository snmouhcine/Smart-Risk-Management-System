import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import MethodeAlpha from './components/MethodeAlpha'
import Landing from './components/Landing'
import Auth from './components/auth/Auth'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Landing page - accessible to everyone */}
          <Route path="/" element={<Landing />} />
          
          {/* Auth page */}
          <Route path="/auth" element={<Auth />} />
          
          {/* Protected app route */}
          <Route 
            path="/app" 
            element={
              <AuthGuard>
                <MethodeAlpha />
              </AuthGuard>
            } 
          />
          
          {/* Redirect any unknown routes to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App