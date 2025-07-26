import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from './AdminLayout'
import {
  Settings,
  Globe,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
  ToggleLeft,
  ToggleRight,
  AlertCircle
} from 'lucide-react'

const AdminSettings = () => {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    siteName: 'Smart Risk Management',
    siteUrl: 'https://smartrisk.com',
    contactEmail: 'contact@smartrisk.com',
    supportEmail: 'support@smartrisk.com',
    maintenanceMode: false,
    allowRegistrations: true,
    requireEmailVerification: true,
    autoBackup: true,
    backupFrequency: 'daily',
    emailNotifications: true,
    paymentNotifications: true,
    errorNotifications: true,
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    darkMode: true
  })
  const [saved, setSaved] = useState(false)

  const tabs = [
    { id: 'general', name: 'Général', icon: Globe },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Sécurité', icon: Shield },
    { id: 'database', name: 'Base de données', icon: Database },
    { id: 'appearance', name: 'Apparence', icon: Palette }
  ]

  const handleSave = () => {
    // In a real app, save to database
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Nom du site
              </label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                URL du site
              </label>
              <input
                type="url"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Mode maintenance
              </label>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className="flex items-center space-x-3"
              >
                {settings.maintenanceMode ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
                <span className="text-white">
                  {settings.maintenanceMode ? 'Activé' : 'Désactivé'}
                </span>
              </button>
              <p className="text-sm text-gray-500 mt-1">
                Les utilisateurs ne pourront pas accéder au site
              </p>
            </div>
          </div>
        )

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email de contact
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email de support
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Notifications email</h4>
                <p className="text-sm text-gray-400">Recevoir des emails pour les événements importants</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
              >
                {settings.emailNotifications ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Notifications de paiement</h4>
                <p className="text-sm text-gray-400">Alertes pour les nouveaux paiements</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, paymentNotifications: !settings.paymentNotifications })}
              >
                {settings.paymentNotifications ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Notifications d'erreur</h4>
                <p className="text-sm text-gray-400">Alertes pour les erreurs système</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, errorNotifications: !settings.errorNotifications })}
              >
                {settings.errorNotifications ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Autoriser les inscriptions</h4>
                <p className="text-sm text-gray-400">Les nouveaux utilisateurs peuvent créer un compte</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allowRegistrations: !settings.allowRegistrations })}
              >
                {settings.allowRegistrations ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Vérification email requise</h4>
                <p className="text-sm text-gray-400">Les utilisateurs doivent vérifier leur email</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
              >
                {settings.requireEmailVerification ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        )

      case 'database':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Sauvegarde automatique</h4>
                <p className="text-sm text-gray-400">Sauvegarder automatiquement la base de données</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
              >
                {settings.autoBackup ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Fréquence de sauvegarde
              </label>
              <select
                value={settings.backupFrequency}
                onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!settings.autoBackup}
              >
                <option value="hourly">Toutes les heures</option>
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Couleur principale
              </label>
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                className="h-10 w-20 bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Couleur secondaire
              </label>
              <input
                type="color"
                value={settings.secondaryColor}
                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                className="h-10 w-20 bg-gray-700 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Mode sombre</h4>
                <p className="text-sm text-gray-400">Thème sombre par défaut</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
              >
                {settings.darkMode ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isAdmin) return null

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-gray-400">Configurez les paramètres de votre plateforme</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden md:inline">{tab.name}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            {renderTabContent()}

            {/* Save Button */}
            <div className="mt-8 flex items-center justify-between">
              {saved && (
                <div className="flex items-center space-x-2 text-green-400">
                  <AlertCircle className="h-5 w-5" />
                  <span>Paramètres sauvegardés avec succès!</span>
                </div>
              )}
              <button
                onClick={handleSave}
                className="ml-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save className="h-5 w-5" />
                <span>Enregistrer les modifications</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSettings