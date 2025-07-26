import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  CreditCard,
  UserCheck,
  Calendar,
  BarChart3,
  ChevronRight,
  RefreshCw,
  Shield,
  Settings
} from 'lucide-react'

const AdminDashboard = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    avgRevenuePerUser: 0,
    userGrowth: 0,
    conversionRate: 0,
    churnRate: 0
  })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentPayments, setRecentPayments] = useState([])

  useEffect(() => {
    if (!isAdmin) {
      navigate('/app')
      return
    }
    fetchDashboardData()
  }, [isAdmin, navigate])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch active users (active in last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: activeUsersData } = await supabase
        .from('user_statistics')
        .select('*')
        .gte('last_active', thirtyDaysAgo.toISOString())
      
      // Fetch recent users
      const { data: recentUsersData } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch revenue data
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')

      // Fetch recent payments
      const { data: recentPaymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          user_profiles(email, full_name),
          subscription_plans(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // Calculate statistics
      const totalRevenue = paymentsData?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0
      
      // Monthly revenue (current month)
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyPayments = paymentsData?.filter(payment => {
        const paymentDate = new Date(payment.created_at)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })
      const monthlyRevenue = monthlyPayments?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0

      // Calculate user growth (compare to last month)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const { count: lastMonthUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', lastMonth.toISOString())
      
      const userGrowth = lastMonthUsers > 0 
        ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
        : 100

      // Calculate conversion rate (subscribed users / total users)
      const { data: paidUsers } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('is_subscribed', true)
      
      const conversionRate = totalUsers > 0 
        ? (paidUsers?.length / totalUsers * 100).toFixed(1)
        : 0

      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsersData?.length || 0,
        totalRevenue,
        monthlyRevenue,
        avgRevenuePerUser: totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : 0,
        userGrowth: parseFloat(userGrowth),
        conversionRate: parseFloat(conversionRate),
        churnRate: 5.2 // Mock for now
      })

      setRecentUsers(recentUsersData || [])
      setRecentPayments(recentPaymentsData || [])

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400">Vue d'ensemble de votre plateforme</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-12 w-12 opacity-80" />
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${stats.userGrowth >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {stats.userGrowth >= 0 ? '+' : ''}{stats.userGrowth}%
            </span>
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.totalUsers}</h3>
          <p className="text-blue-200">Utilisateurs totaux</p>
        </div>

        {/* Active Users */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-12 w-12 opacity-80" />
            <UserCheck className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-3xl font-bold mb-1">{stats.activeUsers}</h3>
          <p className="text-green-200">Utilisateurs actifs (30j)</p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-12 w-12 opacity-80" />
            <Calendar className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-3xl font-bold mb-1">{formatCurrency(stats.monthlyRevenue)}</h3>
          <p className="text-purple-200">Revenus mensuels</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-12 w-12 opacity-80" />
            <BarChart3 className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-3xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</h3>
          <p className="text-orange-200">Revenus totaux</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-medium text-white">ARPU</h4>
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(stats.avgRevenuePerUser)}</p>
          <p className="text-sm text-gray-400 mt-1">Revenu moyen par utilisateur</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-medium text-white">Taux de conversion</h4>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.conversionRate}%</p>
          <p className="text-sm text-gray-400 mt-1">Utilisateurs payants</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-medium text-white">Taux de désabonnement</h4>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats.churnRate}%</p>
          <p className="text-sm text-gray-400 mt-1">Mensuel</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Utilisateurs récents</h3>
            <button
              onClick={() => navigate('/admin/users')}
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 text-sm"
            >
              <span>Voir tous</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">{user.full_name || 'Sans nom'}</p>
                  <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.is_subscribed ? 'bg-green-500/20 text-green-300' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {user.is_subscribed ? 'Abonné' : 'Gratuit'}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white">Paiements récents</h3>
            <button
              onClick={() => navigate('/admin/payments')}
              className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 text-sm"
            >
              <span>Voir tous</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-white font-medium">
                    {payment.user_profiles?.full_name || payment.user_profiles?.email || 'Utilisateur'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {payment.subscription_plans?.name || 'Plan'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(payment.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Actions rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/admin/users')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-3"
            >
              <Users className="h-6 w-6 text-blue-400" />
              <span className="text-white">Gérer les utilisateurs</span>
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-3"
            >
              <BarChart3 className="h-6 w-6 text-green-400" />
              <span className="text-white">Analytics détaillés</span>
            </button>
            <button
              onClick={() => navigate('/admin/settings')}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center space-x-3"
            >
              <Settings className="h-6 w-6 text-purple-400" />
              <span className="text-white">Paramètres</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard