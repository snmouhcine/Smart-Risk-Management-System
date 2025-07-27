import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Euro,
  AlertCircle,
  Wallet,
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react'

const AdminPayments = () => {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dataSource, setDataSource] = useState('stripe') // 'stripe' or 'database'
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    successRate: 0,
    averagePayment: 0,
    totalTransactions: 0,
    refundedAmount: 0,
    disputeCount: 0,
    upcomingPayouts: []
  })

  useEffect(() => {
    if (!isAdmin) return
    if (dataSource === 'stripe') {
      fetchStripePayments()
    } else {
      fetchDatabasePayments()
    }
  }, [isAdmin, dataSource])

  useEffect(() => {
    filterPayments()
  }, [payments, searchTerm, filterStatus])

  const fetchStripePayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-payments', {
        body: {
          limit: 100
        }
      })

      if (error) throw error

      setPayments(data.payments || [])
      setStats(data.stats || {
        totalRevenue: 0,
        monthlyRevenue: 0,
        successRate: 0,
        averagePayment: 0,
        totalTransactions: 0,
        refundedAmount: 0,
        disputeCount: 0,
        upcomingPayouts: []
      })
    } catch (error) {
      console.error('Error fetching Stripe payments:', error)
      // Fallback to database
      fetchDatabasePayments()
    } finally {
      setLoading(false)
    }
  }

  const fetchDatabasePayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          user_profiles(email, full_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPayments(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (paymentsData) => {
    const completedPayments = paymentsData.filter(p => p.status === 'completed')
    const totalRevenue = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const monthlyPayments = completedPayments.filter(p => {
      const date = new Date(p.created_at)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    
    const successRate = paymentsData.length > 0 
      ? (completedPayments.length / paymentsData.length * 100).toFixed(1)
      : 0
      
    const averagePayment = completedPayments.length > 0
      ? (totalRevenue / completedPayments.length).toFixed(2)
      : 0

    setStats({
      totalRevenue,
      monthlyRevenue,
      successRate: parseFloat(successRate),
      averagePayment: parseFloat(averagePayment),
      totalTransactions: paymentsData.length,
      refundedAmount: 0,
      disputeCount: 0,
      upcomingPayouts: []
    })
  }

  const filterPayments = () => {
    let filtered = [...payments]

    if (searchTerm) {
      filtered = filtered.filter(payment =>
        (payment.customer_email || payment.user_profiles?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (payment.customer_name || payment.user_profiles?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(payment => payment.status === filterStatus)
    }

    setFilteredPayments(filtered)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />
      case 'refunded':
        return <RefreshCw className="h-5 w-5 text-blue-400" />
      default:
        return <RefreshCw className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'failed':
        return 'bg-red-500/20 text-red-300 border-red-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'refunded':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
    }
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
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header with Data Source Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion des Paiements</h1>
            <p className="text-gray-400">
              {dataSource === 'stripe' ? 'Données en temps réel depuis Stripe' : 'Données depuis la base de données'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setDataSource(dataSource === 'stripe' ? 'database' : 'stripe')}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Source: {dataSource === 'stripe' ? 'Stripe' : 'Database'}</span>
            </button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Euro className="h-8 w-8 text-green-400" />
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</h3>
            <p className="text-gray-400 text-sm">Revenus totaux</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <CreditCard className="h-8 w-8 text-blue-400" />
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Ce mois</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</h3>
            <p className="text-gray-400 text-sm">Revenus mensuels</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="h-8 w-8 text-purple-400" />
              <span className="text-lg font-bold text-purple-400">{stats.successRate}%</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Taux de succès</h3>
            <p className="text-gray-400 text-sm">{stats.totalTransactions} transactions</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-yellow-400" />
              {dataSource === 'stripe' && stats.refundedAmount > 0 && (
                <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-full">
                  -{formatCurrency(stats.refundedAmount)}
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.averagePayment)}</h3>
            <p className="text-gray-400 text-sm">Paiement moyen</p>
          </div>
        </div>

        {/* Stripe-specific info */}
        {dataSource === 'stripe' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {stats.disputeCount > 0 && (
              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-red-300 font-medium">Litiges en cours</p>
                    <p className="text-red-200/70">{stats.disputeCount} litige(s) nécessitant votre attention</p>
                  </div>
                </div>
              </div>
            )}
            
            {stats.upcomingPayouts.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Wallet className="h-5 w-5 text-blue-400 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-300 font-medium">Prochains virements</p>
                    <p className="text-blue-200/70">
                      {formatCurrency(stats.upcomingPayouts[0]?.amount || 0)} le {
                        stats.upcomingPayouts[0]?.arrival_date 
                          ? new Date(stats.upcomingPayouts[0].arrival_date).toLocaleDateString('fr-FR')
                          : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email, nom ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="completed">Complété</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
            </select>

            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
              <Download className="h-5 w-5" />
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Méthode
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID Transaction
                  </th>
                  {dataSource === 'stripe' && (
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Détails
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-white font-medium">
                          {payment.customer_name || payment.user_profiles?.full_name || 'Sans nom'}
                        </p>
                        <p className="text-sm text-gray-400">
                          {payment.customer_email || payment.user_profiles?.email || 'Email inconnu'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(payment.amount)}
                        </span>
                        {payment.refund_amount > 0 && (
                          <p className="text-xs text-red-400">
                            Remboursé: {formatCurrency(payment.refund_amount)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(payment.status)}
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div className="flex items-center space-x-1">
                        {payment.payment_method === 'card' && payment.stripe_data?.card_brand && (
                          <>
                            <CreditCard className="h-4 w-4" />
                            <span>{payment.stripe_data.card_brand} ••{payment.stripe_data.card_last4}</span>
                          </>
                        )}
                        {payment.payment_method !== 'card' && (
                          <span>{payment.payment_method || 'N/A'}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                      <div className="truncate max-w-xs" title={payment.transaction_id}>
                        {payment.transaction_id || 'N/A'}
                      </div>
                    </td>
                    {dataSource === 'stripe' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          {payment.receipt_url && (
                            <a
                              href={payment.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300"
                              title="Voir le reçu"
                            >
                              <FileText className="h-4 w-4" />
                            </a>
                          )}
                          {payment.stripe_data?.dispute && (
                            <span className="text-red-400" title="Litige en cours">
                              <AlertTriangle className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun paiement trouvé</p>
            </div>
          )}
        </div>

        {/* Data Source Info */}
        <div className="mt-6 bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium">Source de données</p>
              <p className="text-blue-200/70">
                {dataSource === 'stripe' 
                  ? "Les données sont récupérées en temps réel depuis l'API Stripe, incluant les remboursements, litiges et détails de carte."
                  : "Les données proviennent de votre base de données locale. Changez vers Stripe pour des informations plus détaillées."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminPayments