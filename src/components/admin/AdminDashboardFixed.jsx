import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import {
  Users,
  UserCheck,
  DollarSign,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  Activity,
  ArrowUp,
  ArrowDown,
  ExternalLink
} from 'lucide-react'

const AdminDashboardFixed = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    subscribedUsers: 0,
    unsubscribedUsers: 0,
    adminUsers: 0,
    recentUsers: []
  })

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
      console.log('Fetching dashboard data...')
      
      // Fetch all users
      const { data: allUsers, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching users:', error)
        throw error
      }

      console.log('All users:', allUsers)

      // Calculate statistics
      const totalUsers = allUsers?.length || 0
      const subscribedUsers = allUsers?.filter(u => u.is_subscribed).length || 0
      const unsubscribedUsers = totalUsers - subscribedUsers
      const adminUsers = allUsers?.filter(u => u.role === 'admin').length || 0
      
      // Get recent users (last 5)
      const recentUsers = allUsers?.slice(0, 5) || []

      // Calculate active users (subscribed users for now)
      const activeUsers = subscribedUsers

      setStats({
        totalUsers,
        activeUsers,
        subscribedUsers,
        unsubscribedUsers,
        adminUsers,
        recentUsers
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const stats_cards = [
    {
      title: "Utilisateurs Total",
      value: stats.totalUsers,
      icon: Users,
      change: "+12%",
      trend: "up",
      color: "purple"
    },
    {
      title: "Utilisateurs Actifs",
      value: stats.activeUsers,
      icon: UserCheck,
      change: "+8%",
      trend: "up",
      color: "green"
    },
    {
      title: "Abonnés",
      value: stats.subscribedUsers,
      icon: CreditCard,
      change: `${stats.totalUsers > 0 ? Math.round((stats.subscribedUsers / stats.totalUsers) * 100) : 0}%`,
      trend: "up",
      color: "blue"
    },
    {
      title: "Administrateurs",
      value: stats.adminUsers,
      icon: Activity,
      change: `${stats.adminUsers}`,
      trend: "neutral",
      color: "yellow"
    }
  ]

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Tableau de Bord</h1>
            <p className="text-gray-400 mt-1">Vue d'ensemble de votre plateforme</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats_cards.map((stat, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${stat.color}-500/20`}>
                    <stat.icon className={`h-6 w-6 text-${stat.color}-400`} />
                  </div>
                  {stat.trend !== "neutral" && (
                    <span className={`flex items-center text-xs font-medium ${
                      stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stat.trend === 'up' ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      {stat.change}
                    </span>
                  )}
                </div>
                <h3 className="text-gray-400 text-sm font-medium">{stat.title}</h3>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Utilisateurs Récents</h2>
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center"
                  >
                    Voir tout
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {stats.recentUsers.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">Aucun utilisateur</p>
                  ) : (
                    stats.recentUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">{user.email}</p>
                            <p className="text-xs text-gray-400">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {formatDate(user.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {user.is_subscribed ? (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                              Abonné
                            </span>
                          ) : (
                            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">
                              Non abonné
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <div className="p-6 border-b border-gray-700/50">
                <h2 className="text-lg font-semibold text-white">Statistiques Rapides</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Subscription Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-400">Taux d'abonnement</span>
                      <span className="text-sm font-semibold text-white">
                        {stats.totalUsers > 0 ? Math.round((stats.subscribedUsers / stats.totalUsers) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${stats.totalUsers > 0 ? (stats.subscribedUsers / stats.totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* User Distribution */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Distribution des Utilisateurs</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Utilisateurs standards</span>
                        <span className="text-sm font-semibold text-white">
                          {stats.totalUsers - stats.adminUsers}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Administrateurs</span>
                        <span className="text-sm font-semibold text-white">{stats.adminUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Non abonnés</span>
                        <span className="text-sm font-semibold text-white">{stats.unsubscribedUsers}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="pt-4 border-t border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Actions Rapides</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => navigate('/admin/users')}
                        className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors text-sm"
                      >
                        Gérer Utilisateurs
                      </button>
                      <button
                        onClick={() => navigate('/admin/subscriptions')}
                        className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                      >
                        Abonnements
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AdminDashboardFixed