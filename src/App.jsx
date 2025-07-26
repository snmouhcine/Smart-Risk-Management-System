import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AuthGuard from './components/auth/AuthGuard'
import AdminGuard from './components/admin/AdminGuard'
import MethodeAlpha from './components/MethodeAlpha'
import Landing from './components/Landing'
import Auth from './components/auth/Auth'
import AdminDashboard from './components/admin/AdminDashboard'
import UserManagement from './components/admin/UserManagement'
import AdminAnalytics from './components/admin/AdminAnalytics'
import AdminPayments from './components/admin/AdminPayments'
import AdminSubscriptions from './components/admin/AdminSubscriptions'
import AdminSettings from './components/admin/AdminSettings'
import PaymentSuccessAutomatic from './components/PaymentSuccessAutomatic'
import PaymentCancelled from './components/PaymentCancelled'
import StripeTest from './components/StripeTest'
import ForceRefresh from './components/ForceRefresh'

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
          
          {/* Admin routes */}
          <Route 
            path="/admin" 
            element={
              <AdminGuard>
                <AdminDashboard />
              </AdminGuard>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminGuard>
                <UserManagement />
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
          
          {/* Payment routes */}
          <Route path="/payment-success" element={<PaymentSuccessAutomatic />} />
          <Route path="/payment-cancelled" element={<PaymentCancelled />} />
          <Route path="/stripe-test" element={<StripeTest />} />
          <Route path="/force-refresh" element={<ForceRefresh />} />
          
          {/* Redirect any unknown routes to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App