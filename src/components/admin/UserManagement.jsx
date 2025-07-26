import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import {
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Shield,
  Mail,
  Calendar,
  Activity,
  CreditCard,
  Edit,
  Trash2,
  X,
  Check,
  AlertCircle,
  TrendingUp
} from 'lucide-react'

const UserManagement = () => {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterSubscription, setFilterSubscription] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const usersPerPage = 10

  useEffect(() => {
    if (!isAdmin) {
      navigate('/app')
      return
    }
    fetchUsers()
  }, [isAdmin, navigate])

  useEffect(() => {
    filterAndSortUsers()
  }, [users, searchTerm, filterRole, filterSubscription, sortBy, sortOrder])

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_statistics (
            total_trades,
            successful_trades,
            win_rate,
            last_active
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(profilesData || [])
      setFilteredUsers(profilesData || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    // Subscription filter
    if (filterSubscription !== 'all') {
      if (filterSubscription === 'subscribed') {
        filtered = filtered.filter(user => user.is_subscribed === true)
      } else {
        filtered = filtered.filter(user => !user.is_subscribed)
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue

      switch (sortBy) {
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        case 'role':
          aValue = a.role
          bValue = b.role
          break
        case 'is_subscribed':
          aValue = a.is_subscribed ? 1 : 0
          bValue = b.is_subscribed ? 1 : 0
          break
        case 'last_active':
          aValue = a.user_statistics?.[0]?.last_active || ''
          bValue = b.user_statistics?.[0]?.last_active || ''
          break
        case 'total_trades':
          aValue = a.user_statistics?.[0]?.total_trades || 0
          bValue = b.user_statistics?.[0]?.total_trades || 0
          break
        default:
          aValue = a.created_at
          bValue = b.created_at
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredUsers(filtered)
    setCurrentPage(1)
  }

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name || '',
      role: user.role,
      is_subscribed: user.is_subscribed || false
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          full_name: editForm.full_name,
          role: editForm.role,
          is_subscribed: editForm.is_subscribed,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Update local state
      setUsers(users.map(user =>
        user.id === selectedUser.id
          ? { ...user, ...editForm }
          : user
      ))

      setShowEditModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Erreur lors de la mise à jour')
    }
  }

  const handleDeleteUser = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', selectedUser.id)

      if (error) throw error

      setUsers(users.filter(user => user.id !== selectedUser.id))
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getSubscriptionBadge = (isSubscribed) => {
    if (isSubscribed) {
      return 'bg-green-500/20 text-green-300 border-green-500/30'
    }
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  }

  const getRoleIcon = (role) => {
    return role === 'admin' ? <Shield className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />
  }

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage
  const indexOfFirstUser = indexOfLastUser - usersPerPage
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Chargement des utilisateurs...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <p className="text-gray-400">
          {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="user">Utilisateurs</option>
              <option value="admin">Administrateurs</option>
            </select>

            {/* Subscription Filter */}
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les utilisateurs</option>
              <option value="subscribed">Abonnés</option>
              <option value="free">Non abonnés</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created_at">Date d'inscription</option>
              <option value="email">Email</option>
              <option value="role">Rôle</option>
              <option value="is_subscribed">Abonnement</option>
              <option value="last_active">Dernière activité</option>
              <option value="total_trades">Nombre de trades</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Statistiques
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Dernière activité
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-white font-medium">{user.full_name || 'Sans nom'}</p>
                        <p className="text-sm text-gray-400 flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className={`text-sm ${user.role === 'admin' ? 'text-purple-300' : 'text-gray-300'}`}>
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-xs px-3 py-1 rounded-full border ${getSubscriptionBadge(user.is_subscribed)}`}>
                        {user.is_subscribed ? 'Abonné' : 'Gratuit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="flex items-center space-x-1 text-gray-300">
                          <Activity className="h-3 w-3" />
                          <span>{user.user_statistics?.[0]?.total_trades || 0} trades</span>
                        </div>
                        {user.user_statistics?.[0]?.win_rate > 0 && (
                          <div className="flex items-center space-x-1 text-green-400 mt-1">
                            <TrendingUp className="h-3 w-3" />
                            <span>{user.user_statistics?.[0]?.win_rate}% win rate</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(user.user_statistics?.[0]?.last_active || user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDeleteModal(true)
                          }}
                          className="p-2 text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Affichage {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} sur {filteredUsers.length}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Modifier l'utilisateur</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Rôle
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Abonnement
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_subscribed}
                      onChange={(e) => setEditForm({ ...editForm, is_subscribed: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-white">Utilisateur abonné</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Enregistrer</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Supprimer l'utilisateur</h3>
            </div>
            <p className="text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser.email}</strong> ? 
              Cette action est irréversible et supprimera toutes les données associées.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  )
}

export default UserManagement