import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Check,
  AlertCircle,
  Euro,
  Star,
  Users,
  TrendingUp
} from 'lucide-react'

const AdminSubscriptions = () => {
  const { isAdmin } = useAuth()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState([])
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    features: []
  })
  const [newFeature, setNewFeature] = useState('')
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalSubscribers: 0,
    monthlyRevenue: 0
  })

  useEffect(() => {
    if (!isAdmin) return
    fetchPlans()
    fetchStats()
  }, [isAdmin])

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Get subscriber count
      const { count: subscribers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_subscribed', true)

      // Get active plans count
      const { count: activePlans } = await supabase
        .from('subscription_plans')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Calculate monthly revenue (simplified)
      const monthlyRevenue = (subscribers || 0) * 29.99

      setStats({
        totalPlans: plans.length,
        activePlans: activePlans || 0,
        totalSubscribers: subscribers || 0,
        monthlyRevenue
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleAddPlan = () => {
    setFormData({
      name: '',
      price: '',
      features: []
    })
    setShowAddPlan(true)
    setEditingPlan(null)
  }

  const handleEditPlan = (plan) => {
    setFormData({
      name: plan.name,
      price: plan.price,
      features: plan.features?.features || []
    })
    setEditingPlan(plan.id)
    setShowAddPlan(true)
  }

  const handleSavePlan = async () => {
    try {
      const planData = {
        name: formData.name,
        price: parseFloat(formData.price),
        features: { features: formData.features },
        is_active: true
      }

      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert([planData])

        if (error) throw error
      }

      fetchPlans()
      setShowAddPlan(false)
      setEditingPlan(null)
    } catch (error) {
      console.error('Error saving plan:', error)
      if (error.code === '42P17') {
        alert('Erreur de permissions. Veuillez exécuter cette requête SQL dans votre dashboard Supabase:\n\n' +
          '-- Fix RLS policies\n' +
          'DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;\n' +
          'CREATE POLICY "Admins can manage plans" ON subscription_plans\n' +
          '  FOR ALL USING (\n' +
          '    auth.uid() IN (\n' +
          '      SELECT id FROM user_profiles WHERE role = \'admin\'\n' +
          '    )\n' +
          '  );')
      } else {
        alert('Erreur lors de la sauvegarde')
      }
    }
  }

  const handleDeletePlan = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce plan ?')) return

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({ is_active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      fetchPlans()
    } catch (error) {
      console.error('Error toggling plan status:', error)
    }
  }

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      })
      setNewFeature('')
    }
  }

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gray-400">Gérez vos plans d'abonnement</p>
          </div>
          <button
            onClick={handleAddPlan}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter un plan</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Package className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{stats.totalPlans}</h3>
            <p className="text-gray-400 text-sm">Plans totaux</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Check className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{stats.activePlans}</h3>
            <p className="text-gray-400 text-sm">Plans actifs</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{stats.totalSubscribers}</h3>
            <p className="text-gray-400 text-sm">Abonnés actifs</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">{formatCurrency(stats.monthlyRevenue)}</h3>
            <p className="text-gray-400 text-sm">MRR estimé</p>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`bg-gray-800 rounded-xl p-6 border ${
                plan.is_active ? 'border-gray-700' : 'border-gray-600 opacity-60'
              } relative`}
            >
              {/* Recommended Badge */}
              {index === 1 && plan.is_active && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-4 py-1 rounded-full flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>Recommandé</span>
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(plan.id, plan.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      plan.is_active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {plan.is_active ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{formatCurrency(plan.price)}</span>
                <span className="text-gray-400">/mois</span>
              </div>

              <div className="space-y-2">
                {plan.features?.features?.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Plan Modal */}
        {showAddPlan && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">
                {editingPlan ? 'Modifier le plan' : 'Ajouter un plan'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nom du plan
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Pro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Prix (€/mois)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="29.99"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Fonctionnalités
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ajouter une fonctionnalité"
                    />
                    <button
                      onClick={addFeature}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded-lg">
                        <span className="text-sm text-white">{feature}</span>
                        <button
                          onClick={() => removeFeature(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddPlan(false)
                    setEditingPlan(null)
                  }}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSavePlan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminSubscriptions