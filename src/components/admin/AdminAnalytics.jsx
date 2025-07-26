import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  ChevronLeft,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  Package,
  Target
} from 'lucide-react'

const AdminAnalytics = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('month')
  const [analytics, setAnalytics] = useState({
    revenue: {
      total: 0,
      current: 0,
      previous: 0,
      growth: 0,
      byPlan: [],
      byMonth: []
    },
    users: {
      total: 0,
      new: 0,
      churn: 0,
      retention: 0,
      byPlan: [],
      ltv: 0
    },
    conversion: {
      rate: 0,
      freeToBasic: 0,
      basicToPro: 0,
      trials: 0
    },
    performance: {
      mrr: 0,
      arr: 0,
      avgOrderValue: 0,
      paymentSuccess: 0
    }
  })

  useEffect(() => {
    if (!isAdmin) {
      navigate('/app')
      return
    }
    fetchAnalytics()
  }, [isAdmin, navigate, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let startDate, previousStartDate, previousEndDate

      // Define date ranges
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7))
          previousStartDate = new Date(now.setDate(now.getDate() - 14))
          previousEndDate = new Date(now.setDate(now.getDate() + 7))
          break
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1))
          previousStartDate = new Date(now.setMonth(now.getMonth() - 1))
          previousEndDate = new Date(now.setMonth(now.getMonth() + 1))
          break
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1))
          previousStartDate = new Date(now.setFullYear(now.getFullYear() - 1))
          previousEndDate = new Date(now.setFullYear(now.getFullYear() + 1))
          break
      }

      // Fetch all payments
      const { data: payments } = await supabase
        .from('payments')
        .select(`
          *,
          user_profiles(email, full_name),
          subscription_plans(name, price)
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      // Fetch all users
      const { data: users } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_statistics(*)
        `)

      // Fetch subscription plans
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)

      // Calculate revenue metrics
      const currentRevenue = payments
        ?.filter(p => new Date(p.created_at) >= startDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

      const previousRevenue = payments
        ?.filter(p => new Date(p.created_at) >= previousStartDate && new Date(p.created_at) < previousEndDate)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

      const revenueGrowth = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
        : 100

      // Revenue by plan (simplified for single plan)
      const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0
      const revenueByPlan = [{
        name: 'Pro',
        revenue: totalRevenue,
        percentage: '100'
      }]

      // Revenue by month (last 6 months)
      const revenueByMonth = []
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date()
        monthStart.setMonth(monthStart.getMonth() - i)
        monthStart.setDate(1)
        const monthEnd = new Date(monthStart)
        monthEnd.setMonth(monthEnd.getMonth() + 1)

        const monthRevenue = payments
          ?.filter(p => {
            const paymentDate = new Date(p.created_at)
            return paymentDate >= monthStart && paymentDate < monthEnd
          })
          .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

        revenueByMonth.push({
          month: monthStart.toLocaleDateString('fr-FR', { month: 'short' }),
          revenue: monthRevenue
        })
      }

      // User metrics
      const newUsers = users?.filter(u => new Date(u.created_at) >= startDate).length || 0
      const totalUsers = users?.length || 0
      
      // Users by subscription
      const subscribedUsers = users?.filter(u => u.is_subscribed).length || 0
      const freeUsers = users?.filter(u => !u.is_subscribed).length || 0
      const usersByPlan = [
        { name: 'Gratuit', count: freeUsers },
        { name: 'Pro', count: subscribedUsers }
      ]

      // Conversion rates (simplified)
      const conversionRate = totalUsers > 0 ? (subscribedUsers / totalUsers * 100).toFixed(1) : 0

      // Performance metrics
      const activeSubscriptions = subscribedUsers
      const subscriptionPrice = plans?.[0]?.price || 29.99
      
      const mrr = subscribedUsers * subscriptionPrice
      const arr = mrr * 12
      const avgOrderValue = payments?.length > 0 
        ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / payments.length
        : 0

      // Calculate LTV (simplified: avg revenue per user * avg retention months)
      const avgRevenuePerUser = totalUsers > 0 ? currentRevenue / totalUsers : 0
      const estimatedRetentionMonths = 12 // Simplified assumption
      const ltv = avgRevenuePerUser * estimatedRetentionMonths

      setAnalytics({
        revenue: {
          total: payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0,
          current: currentRevenue,
          previous: previousRevenue,
          growth: parseFloat(revenueGrowth),
          byPlan: revenueByPlan,
          byMonth: revenueByMonth
        },
        users: {
          total: totalUsers,
          new: newUsers,
          churn: 5.2, // Mock for now
          retention: 94.8, // Mock for now
          byPlan: usersByPlan,
          ltv: ltv
        },
        conversion: {
          rate: parseFloat(conversionRate),
          trials: 23 // Mock for now
        },
        performance: {
          mrr,
          arr,
          avgOrderValue,
          paymentSuccess: 98.5 // Mock for now
        }
      })

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Chargement des analytics...</p>
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
          <p className="text-gray-400">Analyse détaillée des performances</p>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="year">Cette année</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* MRR */}
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-10 w-10 opacity-80" />
            <div className="text-right">
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                analytics.revenue.growth >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
              }`}>
                {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth}%
              </span>
            </div>
          </div>
          <h3 className="text-3xl font-bold mb-1">{formatCurrency(analytics.performance.mrr)}</h3>
          <p className="text-green-200">MRR (Revenus récurrents mensuels)</p>
        </div>

        {/* ARR */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-10 w-10 opacity-80" />
            <Target className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-3xl font-bold mb-1">{formatCurrency(analytics.performance.arr)}</h3>
          <p className="text-purple-200">ARR (Revenus récurrents annuels)</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <PieChart className="h-10 w-10 opacity-80" />
            <Activity className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-3xl font-bold mb-1">{analytics.conversion.rate}%</h3>
          <p className="text-blue-200">Taux de conversion</p>
        </div>

        {/* LTV */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Users className="h-10 w-10 opacity-80" />
            <CreditCard className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-3xl font-bold mb-1">{formatCurrency(analytics.users.ltv)}</h3>
          <p className="text-orange-200">Valeur vie client (LTV)</p>
        </div>
      </div>

      {/* Revenue Charts */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
            <span>Évolution des revenus</span>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </h3>
          <div className="space-y-4">
            {analytics.revenue.byMonth.map((month, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400">{month.month}</span>
                  <span className="text-white font-medium">{formatCurrency(month.revenue)}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(month.revenue / Math.max(...analytics.revenue.byMonth.map(m => m.revenue)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
            <span>Vue d'ensemble des revenus</span>
            <Package className="h-5 w-5 text-gray-400" />
          </h3>
          <div className="bg-gray-700/50 rounded-lg p-6">
            <div className="text-center">
              <h4 className="text-white font-medium mb-2">Plan Pro</h4>
              <span className="text-3xl font-bold text-white">
                {formatCurrency(analytics.revenue.total)}
              </span>
              <p className="text-gray-400 mt-2">Revenus totaux</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{analytics.users.byPlan[1]?.count || 0}</p>
                <p className="text-sm text-gray-400">Abonnés actifs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{formatCurrency(29.99)}</p>
                <p className="text-sm text-gray-400">Prix mensuel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Metrics */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Métriques utilisateurs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Users by Plan */}
            <div>
              <h4 className="text-gray-400 mb-4">Répartition par plan</h4>
              <div className="space-y-3">
                {analytics.users.byPlan.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-gray-500' :
                        index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                      <span className="text-white">{plan.name}</span>
                    </div>
                    <span className="text-gray-400">{plan.count} utilisateurs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversion Metrics */}
            <div>
              <h4 className="text-gray-400 mb-4">Métriques de conversion</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white text-sm">Taux de conversion global</span>
                    <span className="text-green-400 text-sm font-bold">{analytics.conversion.rate}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${analytics.conversion.rate}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-gray-300 text-sm">
                    {analytics.users.byPlan[1]?.count || 0} abonnés sur {analytics.users.total} utilisateurs
                  </p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h4 className="text-gray-400 mb-4">Métriques clés</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Nouveaux utilisateurs</span>
                  <span className="text-white font-medium flex items-center">
                    {analytics.users.new}
                    <ArrowUpRight className="h-4 w-4 text-green-400 ml-1" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Taux de rétention</span>
                  <span className="text-white font-medium">{analytics.users.retention}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Taux de désabonnement</span>
                  <span className="text-white font-medium flex items-center">
                    {analytics.users.churn}%
                    <ArrowDownRight className="h-4 w-4 text-red-400 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Indicateurs de performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatCurrency(analytics.performance.avgOrderValue)}
              </div>
              <p className="text-gray-400">Panier moyen</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {analytics.performance.paymentSuccess}%
              </div>
              <p className="text-gray-400">Taux de succès paiements</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {analytics.conversion.trials}
              </div>
              <p className="text-gray-400">Essais actifs</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-2">
                {formatCurrency(analytics.revenue.total)}
              </div>
              <p className="text-gray-400">Revenus totaux</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="max-w-7xl mx-auto mt-8 flex justify-end">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Exporter les données</span>
        </button>
      </div>
      </div>
    </AdminLayout>
  )
}

export default AdminAnalytics