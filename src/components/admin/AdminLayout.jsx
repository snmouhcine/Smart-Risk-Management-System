import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
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
  LogOut
} from 'lucide-react'

const AdminLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Utilisateurs actifs</span>
                  <span className="text-sm font-bold text-green-400">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Revenus du mois</span>
                  <span className="text-sm font-bold text-blue-400">€3,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">Taux conversion</span>
                  <span className="text-sm font-bold text-purple-400">24.5%</span>
                </div>
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