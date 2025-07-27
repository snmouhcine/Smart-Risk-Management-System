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
  Target,
  CheckCircle,
  UserCheck,
  Clock,
  Euro,
  Database,
  Info as InfoIcon
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

  const fetchStripeAnalytics = async (startDate, previousStartDate) => {
    try {
      // Call Supabase Edge Function to fetch Stripe analytics
      const { data, error } = await supabase.functions.invoke('stripe-analytics', {
        body: {
          startDate: startDate.toISOString(),
          previousStartDate: previousStartDate.toISOString(),
          timeRange
        }
      })

      if (error) {
        console.error('Error fetching Stripe analytics:', error)
        return {
          mrr: 0,
          churnRate: 0,
          retentionRate: 100,
          paymentSuccessRate: 100,
          trialCount: 0
        }
      }

      return data
    } catch (error) {
      console.error('Error calling Stripe analytics function:', error)
      return {
        mrr: 0,
        churnRate: 0,
        retentionRate: 100,
        paymentSuccessRate: 100,
        trialCount: 0
      }
    }
  }
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

      // Fetch all payments (including failed ones for success rate calculation)
      const { data: allPayments } = await supabase
        .from('payments')
        .select(`
          *,
          user_profiles(email, full_name),
          subscription_plans(name, price)
        `)
        .order('created_at', { ascending: false })
      
      // Filter completed payments for revenue calculations
      const payments = allPayments?.filter(p => p.status === 'completed') || []

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

      // Fetch Stripe data for more accurate analytics
      const stripeData = await fetchStripeAnalytics(startDate, previousStartDate)

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
      const subscriptionPrice = plans?.[0]?.price || 29.99
      
      const mrr = stripeData.mrr || (subscribedUsers * subscriptionPrice)
      const arr = mrr * 12
      const avgOrderValue = payments?.length > 0 
        ? payments.reduce((sum, p) => sum + parseFloat(p.amount), 0) / payments.length
        : 0

      // Use Stripe data for accurate metrics
      const churnRate = stripeData.churnRate || 0
      const retentionRate = stripeData.retentionRate || (100 - churnRate)
      const paymentSuccessRate = stripeData.paymentSuccessRate || 100
      const trialUsers = stripeData.trialCount || 0

      // Calculate LTV using Stripe's retention data
      const avgRevenuePerUser = subscribedUsers > 0 ? totalRevenue / subscribedUsers : 0
      const estimatedRetentionMonths = retentionRate > 0 ? (100 / (100 - parseFloat(retentionRate))) : 12
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
          churn: parseFloat(churnRate),
          retention: parseFloat(retentionRate),
          byPlan: usersByPlan,
          ltv: ltv
        },
        conversion: {
          rate: parseFloat(conversionRate),
          trials: trialUsers
        },
        performance: {
          mrr,
          arr,
          avgOrderValue,
          paymentSuccess: parseFloat(paymentSuccessRate)
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
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Analytics Dashboard</h1>
            <p className="text-gray-400">Données en temps réel depuis Stripe et la base de données</p>
          </div>
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

      {/* Primary Metrics from Stripe */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-500" />
          Métriques Stripe en temps réel
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* MRR */}
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="h-8 w-8 opacity-80" />
              <div className="text-right">
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  analytics.revenue.growth >= 0 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                }`}>
                  {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth}%
                </span>
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{formatCurrency(analytics.performance.mrr)}</h3>
            <p className="text-green-200 text-sm">MRR (Monthly Recurring Revenue)</p>
          </div>

          {/* Payment Success Rate */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-blue-500" />
              <span className="text-xs text-gray-500">Stripe</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{analytics.performance.paymentSuccess}%</h3>
            <p className="text-gray-400 text-sm">Taux de succès des paiements</p>
          </div>

          {/* Retention Rate */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <UserCheck className="h-8 w-8 text-purple-500" />
              <span className="text-xs text-gray-500">Stripe</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{analytics.users.retention}%</h3>
            <p className="text-gray-400 text-sm">Taux de rétention</p>
            <p className="text-xs text-red-400 mt-1">Churn: {analytics.users.churn}%</p>
          </div>

          {/* Active Trials */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Clock className="h-8 w-8 text-orange-500" />
              <span className="text-xs text-gray-500">Stripe</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{analytics.conversion.trials}</h3>
            <p className="text-gray-400 text-sm">Essais actifs</p>
          </div>
        </div>
      </div>

      {/* Database Metrics */}
      <div className="max-w-7xl mx-auto mb-8">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-500" />
          Métriques Base de Données
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Revenue */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Euro className="h-8 w-8 text-green-500" />
              <span className="text-xs text-gray-500">Database</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(analytics.revenue.total)}</h3>
            <p className="text-gray-400 text-sm">Revenus totaux</p>
            <div className="mt-3 text-sm">
              <span className="text-gray-500">Ce mois: </span>
              <span className="text-white font-medium">{formatCurrency(analytics.revenue.current)}</span>
            </div>
          </div>

          {/* User Growth */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-blue-500" />
              <span className="text-xs text-gray-500">Database</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{analytics.users.total}</h3>
            <p className="text-gray-400 text-sm">Utilisateurs totaux</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-gray-500">Nouveaux: </span>
              <span className="text-green-400 font-medium flex items-center">
                +{analytics.users.new}
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </span>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <PieChart className="h-8 w-8 text-purple-500" />
              <span className="text-xs text-gray-500">Database</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{analytics.conversion.rate}%</h3>
            <p className="text-gray-400 text-sm">Taux de conversion</p>
            <div className="mt-3 text-sm">
              <span className="text-gray-500">Abonnés: </span>
              <span className="text-white font-medium">{analytics.users.byPlan[1]?.count || 0}/{analytics.users.total}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
              Évolution des revenus
            </h3>
            <span className="text-xs text-gray-500">Données: Database</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Monthly Revenue Bars */}
            <div className="space-y-4">
              {analytics.revenue.byMonth.map((month, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">{month.month}</span>
                    <span className="text-white font-medium">{formatCurrency(month.revenue)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${(month.revenue / Math.max(...analytics.revenue.byMonth.map(m => m.revenue)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-700/30 rounded-lg p-6">
              <h4 className="text-white font-medium mb-4">Résumé</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">ARR projeté</span>
                  <span className="text-xl font-bold text-white">{formatCurrency(analytics.performance.arr)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Panier moyen</span>
                  <span className="text-lg font-medium text-white">{formatCurrency(analytics.performance.avgOrderValue)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Abonnés actifs</span>
                  <span className="text-lg font-medium text-white">{analytics.users.byPlan[1]?.count || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Sources Info */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <InfoIcon className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">Sources de données</p>
              <p className="text-blue-200/70">
                Les métriques marquées "Stripe" sont récupérées en temps réel depuis l'API Stripe. 
                Les métriques "Database" proviennent de votre base de données Supabase.
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AdminLayout>
  )
}

export default AdminAnalytics