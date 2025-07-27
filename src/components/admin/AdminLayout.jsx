import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../ui/HoverCard'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  Shield,
  Menu,
  X,
  ChevronLeft,
  Package,
  Activity,
  TrendingUp,
  Bell,
  LogOut,
  User,
  Mail,
  Calendar
} from 'lucide-react'

const AdminLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [quickStats, setQuickStats] = useState({
    activeUsers: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    newUsersToday: 0,
    isLoading: true,
    isStripeData: false
  })
  const [userProfile, setUserProfile] = useState(null)

  const menuItems = [
    {
      title: 'Tableau de Bord',
      icon: LayoutDashboard,
      path: '/admin',
      color: 'text-blue-400'
    },
    {
      title: 'Utilisateurs',
      icon: Users,
      path: '/admin/users',
      color: 'text-green-400'
    },
    {
      title: 'Analytics',
      icon: BarChart3,
      path: '/admin/analytics',
      color: 'text-purple-400'
    },
    {
      title: 'Paiements',
      icon: CreditCard,
      path: '/admin/payments',
      color: 'text-yellow-400'
    },
    {
      title: 'Abonnements',
      icon: Package,
      path: '/admin/subscriptions',
      color: 'text-pink-400'
    },
    {
      title: 'Paramètres',
      icon: Settings,
      path: '/admin/settings',
      color: 'text-gray-400'
    }
  ]

  const isActive = (path) => {
    return location.pathname === path
  }

  useEffect(() => {
    fetchQuickStats()
    fetchUserProfile()
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchQuickStats, 30000)
    return () => clearInterval(interval)
  }, [user])

  const fetchQuickStats = async () => {
    try {
      // Get active users count
      const { count: activeUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_subscribed', true)

      // Get total users for conversion rate
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Get new users today
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { count: newUsersToday } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      // Try to get monthly revenue from Stripe
      let monthlyRevenue = 0
      let isStripeData = false
      try {
        const { data: stripeData } = await supabase.functions.invoke('stripe-analytics', {
          body: {
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            previousStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            timeRange: 'month'
          }
        })
        
        if (stripeData?.mrr) {
          monthlyRevenue = stripeData.mrr
          isStripeData = true
          console.log('MRR from Stripe:', stripeData.mrr)
        } else {
          // Fallback: Get actual plan price from database
          const { data: activePlan } = await supabase
            .from('subscription_plans')
            .select('price')
            .eq('is_active', true)
            .single()
          
          const planPrice = activePlan?.price || 40.99
          monthlyRevenue = (activeUsers || 0) * planPrice
          console.log('MRR calculated:', monthlyRevenue, 'for', activeUsers, 'users at', planPrice, 'EUR each')
        }
      } catch (error) {
        // If Stripe fails, use simple calculation with your actual price
        console.log('Stripe API error:', error)
        const { data: activePlan } = await supabase
          .from('subscription_plans')
          .select('price')
          .eq('is_active', true)
          .single()
        
        const planPrice = activePlan?.price || 40.99
        monthlyRevenue = (activeUsers || 0) * planPrice
      }

      const conversionRate = totalUsers > 0 
        ? ((activeUsers / totalUsers) * 100).toFixed(1)
        : 0

      setQuickStats({
        activeUsers: activeUsers || 0,
        monthlyRevenue,
        conversionRate: parseFloat(conversionRate),
        newUsersToday: newUsersToday || 0,
        isLoading: false,
        isStripeData
      })
    } catch (error) {
      console.error('Error fetching quick stats:', error)
      setQuickStats(prev => ({ ...prev, isLoading: false }))
    }
  }

  const fetchUserProfile = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!error && data) {
        console.log('User profile data:', data) // Debug log
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-800 transition-all duration-300 flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              <Shield className="h-8 w-8 text-purple-500" />
              {sidebarOpen && (
                <div>
                  <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                  <p className="text-xs text-gray-400">Smart Risk Management</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5 text-gray-400" /> : <Menu className="h-5 w-5 text-gray-400" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-gray-700 text-white shadow-lg'
                        : 'hover:bg-gray-700 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive(item.path) ? item.color : ''}`} />
                    {sidebarOpen && (
                      <span className="font-medium">{item.title}</span>
                    )}
                    {sidebarOpen && isActive(item.path) && (
                      <div className="ml-auto w-1 h-6 bg-purple-500 rounded-full" />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {/* Quick Stats */}
          {sidebarOpen && (
            <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Aperçu Rapide</h3>
              {quickStats.isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-600 rounded animate-pulse" />
                  <div className="h-4 bg-gray-600 rounded animate-pulse" />
                  <div className="h-4 bg-gray-600 rounded animate-pulse" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Utilisateurs actifs</span>
                    <span className="text-sm font-bold text-green-400">{quickStats.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">
                      MRR {quickStats.isStripeData ? '✓' : '~'}
                    </span>
                    <span className="text-sm font-bold text-blue-400" title={quickStats.isStripeData ? 'Données Stripe' : 'Estimation basée sur les abonnés'}>
                      {formatCurrency(quickStats.monthlyRevenue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Taux conversion</span>
                    <span className="text-sm font-bold text-purple-400">{quickStats.conversionRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">Nouveaux aujourd'hui</span>
                    <span className="text-sm font-bold text-yellow-400">+{quickStats.newUsersToday}</span>
                  </div>
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-gray-600">
                <button
                  onClick={fetchQuickStats}
                  className="w-full text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center justify-center space-x-1"
                >
                  <Activity className="h-3 w-3" />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => navigate('/app')}
            className={`w-full flex items-center space-x-3 px-3 py-2 mb-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-gray-300 hover:text-white ${
              !sidebarOpen && 'justify-center'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
            {sidebarOpen && <span>Retour à l'app</span>}
          </button>
          
          {sidebarOpen && (
            <div className="mt-3 px-3 py-2 bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-400">Connecté en tant que</p>
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">
                {menuItems.find(item => item.path === location.pathname)?.title || 'Administration'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-gray-400" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              
              {/* User Hover Card */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-700 rounded-lg transition-colors">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-medium text-white">
                        {userProfile?.full_name || user?.email?.split('@')[0] || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(userProfile?.is_admin || userProfile?.role === 'admin') ? 'Administrateur' : 'Utilisateur'}
                      </p>
                    </div>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {userProfile?.full_name || user?.email?.split('@')[0] || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 border-t dark:border-gray-700 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Statut</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (userProfile?.is_admin || userProfile?.role === 'admin')
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' 
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {(userProfile?.is_admin || userProfile?.role === 'admin') ? 'Administrateur' : 'Utilisateur'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Abonnement</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userProfile?.is_subscribed 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {userProfile?.is_subscribed ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      
                      {userProfile?.created_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-3 w-3" />
                          <span>Membre depuis {formatDate(userProfile.created_at)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-3 border-t dark:border-gray-700">
                      <button
                        onClick={() => navigate('/app')}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Retour à l'application
                      </button>
                      <button
                        onClick={() => navigate('/admin/settings')}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Paramètres
                      </button>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              
              <button
                onClick={() => {
                  navigate('/')
                  signOut()
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-900">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout