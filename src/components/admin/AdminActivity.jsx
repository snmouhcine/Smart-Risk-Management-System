import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import {
  Activity,
  User,
  LogIn,
  UserPlus,
  CreditCard,
  Settings,
  TrendingUp,
  Clock,
  Filter,
  Calendar
} from 'lucide-react'

const AdminActivity = () => {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState([])
  const [filteredActivities, setFilteredActivities] = useState([])
  const [filterType, setFilterType] = useState('all')
  const [dateRange, setDateRange] = useState('week')

  useEffect(() => {
    if (!isAdmin) return
    fetchActivities()
  }, [isAdmin, dateRange])

  useEffect(() => {
    filterActivities()
  }, [activities, filterType])

  const fetchActivities = async () => {
    try {
      // Mock activities for now - in a real app, you'd have an activity log table
      const mockActivities = [
        {
          id: 1,
          type: 'user_signup',
          user: 'nouveau@user.com',
          description: 'Nouvel utilisateur inscrit',
          timestamp: new Date().toISOString(),
          icon: UserPlus,
          color: 'text-green-400'
        },
        {
          id: 2,
          type: 'user_login',
          user: 'ryan@3fs.be',
          description: 'Connexion utilisateur',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          icon: LogIn,
          color: 'text-blue-400'
        },
        {
          id: 3,
          type: 'payment',
          user: 'client@example.com',
          description: 'Paiement abonnement Pro - €29.99',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          icon: CreditCard,
          color: 'text-green-400'
        },
        {
          id: 4,
          type: 'settings_update',
          user: 'admin@site.com',
          description: 'Modification des paramètres',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          icon: Settings,
          color: 'text-yellow-400'
        },
        {
          id: 5,
          type: 'trade_completed',
          user: 'trader@pro.com',
          description: 'Trade complété - Win',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          icon: TrendingUp,
          color: 'text-purple-400'
        }
      ]

      // In a real app, you'd fetch from a database
      setActivities(mockActivities)
      setFilteredActivities(mockActivities)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterActivities = () => {
    if (filterType === 'all') {
      setFilteredActivities(activities)
    } else {
      setFilteredActivities(activities.filter(activity => activity.type === filterType))
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`
    if (days < 7) return `Il y a ${days} jour${days > 1 ? 's' : ''}`
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const activityTypes = [
    { value: 'all', label: 'Toutes les activités' },
    { value: 'user_signup', label: 'Inscriptions' },
    { value: 'user_login', label: 'Connexions' },
    { value: 'payment', label: 'Paiements' },
    { value: 'settings_update', label: 'Paramètres' },
    { value: 'trade_completed', label: 'Trades' }
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Activity className="h-8 w-8 animate-pulse text-blue-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <p className="text-gray-400">Historique des activités de la plateforme</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Activity className="h-8 w-8 text-blue-400" />
              <span className="text-2xl font-bold text-white">
                {activities.length}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Activités aujourd'hui</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <UserPlus className="h-8 w-8 text-green-400" />
              <span className="text-2xl font-bold text-white">
                {activities.filter(a => a.type === 'user_signup').length}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Nouvelles inscriptions</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="h-8 w-8 text-purple-400" />
              <span className="text-2xl font-bold text-white">
                {activities.filter(a => a.type === 'payment').length}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Paiements reçus</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <LogIn className="h-8 w-8 text-yellow-400" />
              <span className="text-2xl font-bold text-white">
                {activities.filter(a => a.type === 'user_login').length}
              </span>
            </div>
            <p className="text-gray-400 text-sm">Connexions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <div className="flex items-center space-x-2 ml-auto">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
                <option value="year">Cette année</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-6">Timeline des activités</h3>
          
          <div className="space-y-6">
            {filteredActivities.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-start space-x-4">
                  {/* Timeline line */}
                  {index < filteredActivities.length - 1 && (
                    <div className="absolute ml-5 mt-10 h-full w-0.5 bg-gray-700" />
                  )}
                  
                  {/* Icon */}
                  <div className={`p-3 bg-gray-700 rounded-full ${activity.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{activity.description}</h4>
                        <p className="text-sm text-gray-400">{activity.user}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(activity.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucune activité trouvée</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminActivity