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

const UserManagementFixed = () => {
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
      console.log('Fetching users from database...')
      
      // Fetch all user profiles
      const { data: profilesData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user profiles:', error)
        throw error
      }

      console.log('Fetched users:', profilesData)
      
      // Add computed fields for display
      const enrichedUsers = (profilesData || []).map(user => ({
        ...user,
        // Add display fields
        status: user.is_subscribed ? 'active' : 'inactive',
        display_role: user.role === 'admin' ? 'Admin' : 'User',
        // Format dates
        formatted_created_at: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'
      }))

      setUsers(enrichedUsers)
      setFilteredUsers(enrichedUsers)
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
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    // Subscription filter
    if (filterSubscription !== 'all') {
      filtered = filtered.filter(user => {
        if (filterSubscription === 'subscribed') return user.is_subscribed
        if (filterSubscription === 'unsubscribed') return !user.is_subscribed
        return true
      })
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy === 'created_at') {
        aValue = new Date(aValue || 0)
        bValue = new Date(bValue || 0)
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
      email: user.email,
      role: user.role,
      is_subscribed: user.is_subscribed
    })
    setShowEditModal(true)
  }

  const handleUpdateUser = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          role: editForm.role,
          is_subscribed: editForm.is_subscribed
        })
        .eq('id', selectedUser.id)

      if (error) throw error

      // Refresh users
      await fetchUsers()
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

      // Refresh users
      await fetchUsers()
      setShowDeleteModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Erreur lors de la suppression')
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage)
  const startIndex = (currentPage - 1) * usersPerPage
  const endIndex = startIndex + usersPerPage
  const currentUsers = filteredUsers.slice(startIndex, endIndex)

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Gestion des Utilisateurs</h1>
            <p className="text-gray-400 mt-1">
              {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} au total
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tous les rôles</option>
              <option value="user">Utilisateurs</option>
              <option value="admin">Administrateurs</option>
            </select>

            {/* Subscription Filter */}
            <select
              value={filterSubscription}
              onChange={(e) => setFilterSubscription(e.target.value)}
              className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tous les abonnements</option>
              <option value="subscribed">Abonnés</option>
              <option value="unsubscribed">Non abonnés</option>
            </select>

            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}
              className="px-4 py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="created_at-desc">Plus récents</option>
              <option value="created_at-asc">Plus anciens</option>
              <option value="email-asc">Email (A-Z)</option>
              <option value="email-desc">Email (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700/50 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Chargement...</p>
            </div>
          ) : currentUsers.length === 0 ? (
            <div className="p-12 text-center">
              <UserX className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50 border-b border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date d'inscription
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {currentUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{user.email}</div>
                            <div className="text-sm text-gray-400">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100/20 text-purple-400 border border-purple-400/30'
                            : 'bg-gray-100/20 text-gray-400 border border-gray-400/30'
                        }`}>
                          {user.role === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                          {user.display_role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_subscribed
                            ? 'bg-green-100/20 text-green-400 border border-green-400/30'
                            : 'bg-red-100/20 text-red-400 border border-red-400/30'
                        }`}>
                          {user.is_subscribed ? (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Abonné
                            </>
                          ) : (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Non abonné
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {user.formatted_created_at}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-purple-400 hover:text-purple-300 mr-3"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowDeleteModal(true)
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-gray-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === i + 1
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 bg-gray-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Modifier l'utilisateur</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    disabled
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Rôle</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="user">Utilisateur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Abonnement</label>
                  <select
                    value={editForm.is_subscribed}
                    onChange={(e) => setEditForm({ ...editForm, is_subscribed: e.target.value === 'true' })}
                    className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white"
                  >
                    <option value="true">Abonné</option>
                    <option value="false">Non abonné</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-400 mr-3" />
                <h3 className="text-xl font-bold text-white">Confirmer la suppression</h3>
              </div>
              
              <p className="text-gray-400 mb-6">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <span className="text-white font-semibold">{selectedUser.email}</span> ?
                Cette action est irréversible.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setSelectedUser(null)
                  }}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default UserManagementFixed