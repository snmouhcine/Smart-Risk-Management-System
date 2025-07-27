import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SettingsProvider, useSettings } from './contexts/SettingsContext'
import { supabase } from './lib/supabase'
import AuthGuard from './components/auth/AuthGuard'
import AdminGuard from './components/admin/AdminGuard'
import MethodeAlpha from './components/MethodeAlpha'
import Landing from './components/Landing'
import Auth from './components/auth/Auth'
import AdminDashboardFixed from './components/admin/AdminDashboardFixed'
import UserManagementFixed from './components/admin/UserManagementFixed'
import AdminAnalytics from './components/admin/AdminAnalytics'
import AdminPayments from './components/admin/AdminPayments'
import AdminSubscriptions from './components/admin/AdminSubscriptions'
import AdminSettings from './components/admin/AdminSettings'
import PaymentSuccessAutomatic from './components/PaymentSuccessAutomatic'
import PaymentCancelled from './components/PaymentCancelled'
import MaintenanceMode from './components/MaintenanceMode'
import DebugInfo from './components/admin/DebugInfo'

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AppContent />
        </SettingsProvider>
      </AuthProvider>
    </Router>
  )
}

function AppContent() {
  const { settings, loading } = useSettings()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [profileLoading, setProfileLoading] = React.useState(true)
  
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false)
        setProfileLoading(false)
        return
      }
      
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()
        
        setIsAdmin(data?.is_admin || false)
      } catch (error) {
        // Error checking admin status
        setIsAdmin(false)
      } finally {
        setProfileLoading(false)
      }
    }
    
    checkAdminStatus()
  }, [user?.id])
  
  // Show loading while settings are being fetched
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }
  
  // Check maintenance mode (admins can bypass)
  if (settings.maintenance_mode && !isAdmin) {
    return <MaintenanceMode siteName={settings.site_name} />
  }
  
  return (
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
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <AdminGuard>
                <AdminDashboardFixed />
              </AdminGuard>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminGuard>
                <UserManagementFixed />
              </AdminGuard>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <AdminGuard>
                <AdminAnalytics />
              </AdminGuard>
            } 
          />
          <Route 
            path="/admin/payments" 
            element={
              <AdminGuard>
                <AdminPayments />
              </AdminGuard>
            } 
          />
          <Route 
            path="/admin/subscriptions" 
            element={
              <AdminGuard>
                <AdminSubscriptions />
              </AdminGuard>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <AdminGuard>
                <AdminSettings />
              </AdminGuard>
            } 
          />
          <Route 
            path="/admin/debug" 
            element={
              <AdminGuard>
                <DebugInfo />
              </AdminGuard>
            } 
          />
          
          {/* Payment routes */}
          <Route path="/payment-success" element={<PaymentSuccessAutomatic />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          
          {/* Redirect any unknown routes to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  )
}

export default App