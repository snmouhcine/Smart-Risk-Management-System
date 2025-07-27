import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
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
  AlertCircle,
  CreditCard,
  Upload,
  RefreshCw
} from 'lucide-react'

const AdminSettings = () => {
  const { isAdmin } = useAuth()
  const { settings: globalSettings, updateSettings, loading: settingsLoading } = useSettings()
  const [activeTab, setActiveTab] = useState('general')
  const [localSettings, setLocalSettings] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)

  const tabs = [
    { id: 'general', name: 'Général', icon: Globe },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'security', name: 'Sécurité', icon: Shield },
    { id: 'payment', name: 'Paiement', icon: CreditCard },
    { id: 'database', name: 'Base de données', icon: Database },
    { id: 'appearance', name: 'Apparence', icon: Palette }
  ]

  useEffect(() => {
    if (!settingsLoading && globalSettings) {
      setLocalSettings(globalSettings)
    }
  }, [globalSettings, settingsLoading])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    
    try {
      const result = await updateSettings(localSettings)
      
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      setError('Erreur lors de la sauvegarde des paramètres')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleFaviconUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploadingFavicon(true)
    setError(null)

    try {
      // In a real app, you would upload to your storage
      // For now, we'll use a data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setLocalSettings({
          ...localSettings,
          site_favicon: e.target.result
        })
        setUploadingFavicon(false)
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('Erreur lors du téléchargement du favicon')
      setUploadingFavicon(false)
    }
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
                value={localSettings.site_name || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, site_name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Smart Risk Management"
              />
              <p className="text-xs text-gray-500 mt-1">Affiché dans l'en-tête et les emails</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Titre du navigateur
              </label>
              <input
                type="text"
                value={localSettings.site_title || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, site_title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Smart Risk Management - Gestion intelligente des risques"
              />
              <p className="text-xs text-gray-500 mt-1">Affiché dans l'onglet du navigateur</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                URL du site
              </label>
              <input
                type="url"
                value={localSettings.site_url || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, site_url: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://smartrisk.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Favicon
              </label>
              <div className="flex items-center space-x-4">
                {localSettings.site_favicon && (
                  <img 
                    src={localSettings.site_favicon} 
                    alt="Favicon" 
                    className="w-8 h-8 object-contain bg-gray-600 rounded p-1"
                  />
                )}
                <input
                  type="file"
                  accept="image/x-icon,image/png,image/jpeg"
                  onChange={handleFaviconUpload}
                  className="hidden"
                  id="favicon-upload"
                />
                <label
                  htmlFor="favicon-upload"
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>{uploadingFavicon ? 'Téléchargement...' : 'Changer le favicon'}</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">Format recommandé: .ico, .png (32x32 ou 16x16)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Mode maintenance
              </label>
              <button
                onClick={() => setLocalSettings({ ...localSettings, maintenance_mode: !localSettings.maintenance_mode })}
                className="flex items-center space-x-3"
              >
                {localSettings.maintenance_mode ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
                <span className="text-white">
                  {localSettings.maintenance_mode ? 'Activé' : 'Désactivé'}
                </span>
              </button>
              <p className="text-sm text-gray-500 mt-1">
                Les utilisateurs ne pourront pas accéder au site (sauf les admins)
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
                value={localSettings.contact_email || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, contact_email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@smartrisk.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email de support
              </label>
              <input
                type="email"
                value={localSettings.support_email || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, support_email: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="support@smartrisk.com"
              />
            </div>

            <div className="border-t border-gray-700 pt-6">
              <h4 className="text-lg font-medium text-white mb-4">Configuration SMTP</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Serveur SMTP
                  </label>
                  <input
                    type="text"
                    value={localSettings.smtp_host || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, smtp_host: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="smtp.gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Port SMTP
                  </label>
                  <input
                    type="number"
                    value={localSettings.smtp_port || 587}
                    onChange={(e) => setLocalSettings({ ...localSettings, smtp_port: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="587"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Utilisateur SMTP
                  </label>
                  <input
                    type="text"
                    value={localSettings.smtp_user || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, smtp_user: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Mot de passe SMTP
                  </label>
                  <input
                    type="password"
                    value={localSettings.smtp_password || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, smtp_password: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Nom de l'expéditeur
                  </label>
                  <input
                    type="text"
                    value={localSettings.email_from_name || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, email_from_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Smart Risk Management"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email de l'expéditeur
                  </label>
                  <input
                    type="email"
                    value={localSettings.email_from_address || ''}
                    onChange={(e) => setLocalSettings({ ...localSettings, email_from_address: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="noreply@smartrisk.com"
                  />
                </div>
              </div>
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
                onClick={() => setLocalSettings({ ...localSettings, email_notifications: !localSettings.email_notifications })}
              >
                {localSettings.email_notifications ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Notifications de paiement</h4>
                <p className="text-sm text-gray-400">Alertes pour les nouveaux paiements et abonnements</p>
              </div>
              <button
                onClick={() => setLocalSettings({ ...localSettings, payment_notifications: !localSettings.payment_notifications })}
              >
                {localSettings.payment_notifications ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Notifications d'erreur</h4>
                <p className="text-sm text-gray-400">Alertes pour les erreurs système et problèmes critiques</p>
              </div>
              <button
                onClick={() => setLocalSettings({ ...localSettings, error_notifications: !localSettings.error_notifications })}
              >
                {localSettings.error_notifications ? (
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
                onClick={() => setLocalSettings({ ...localSettings, allow_registrations: !localSettings.allow_registrations })}
              >
                {localSettings.allow_registrations ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Vérification email requise</h4>
                <p className="text-sm text-gray-400">Les utilisateurs doivent vérifier leur email avant d'accéder</p>
              </div>
              <button
                onClick={() => setLocalSettings({ ...localSettings, require_email_verification: !localSettings.require_email_verification })}
              >
                {localSettings.require_email_verification ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Stripe Webhook Secret
              </label>
              <input
                type="password"
                value={localSettings.stripe_webhook_secret || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, stripe_webhook_secret: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="whsec_..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Trouvez ce secret dans votre dashboard Stripe > Webhooks
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Webhooks configurés</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <p>• checkout.session.completed</p>
                <p>• customer.subscription.created</p>
                <p>• customer.subscription.updated</p>
                <p>• customer.subscription.deleted</p>
                <p>• invoice.payment_succeeded</p>
                <p>• invoice.payment_failed</p>
              </div>
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
                onClick={() => setLocalSettings({ ...localSettings, auto_backup: !localSettings.auto_backup })}
              >
                {localSettings.auto_backup ? (
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
                value={localSettings.backup_frequency || 'daily'}
                onChange={(e) => setLocalSettings({ ...localSettings, backup_frequency: e.target.value })}
                className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!localSettings.auto_backup}
              >
                <option value="hourly">Toutes les heures</option>
                <option value="daily">Quotidienne</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="monthly">Mensuelle</option>
              </select>
            </div>

            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              onClick={() => alert('Sauvegarde manuelle déclenchée (fonctionnalité à implémenter)')}
            >
              <Database className="h-4 w-4" />
              <span>Sauvegarder maintenant</span>
            </button>
          </div>
        )

      case 'appearance':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Couleur principale
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={localSettings.primary_color || '#3B82F6'}
                  onChange={(e) => setLocalSettings({ ...localSettings, primary_color: e.target.value })}
                  className="h-10 w-20 bg-gray-700 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.primary_color || '#3B82F6'}
                  onChange={(e) => setLocalSettings({ ...localSettings, primary_color: e.target.value })}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#3B82F6"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Couleur secondaire
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={localSettings.secondary_color || '#8B5CF6'}
                  onChange={(e) => setLocalSettings({ ...localSettings, secondary_color: e.target.value })}
                  className="h-10 w-20 bg-gray-700 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={localSettings.secondary_color || '#8B5CF6'}
                  onChange={(e) => setLocalSettings({ ...localSettings, secondary_color: e.target.value })}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="#8B5CF6"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium">Mode sombre</h4>
                <p className="text-sm text-gray-400">Thème sombre par défaut pour l'interface</p>
              </div>
              <button
                onClick={() => setLocalSettings({ ...localSettings, dark_mode: !localSettings.dark_mode })}
              >
                {localSettings.dark_mode ? (
                  <ToggleRight className="h-8 w-8 text-blue-500" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-gray-500" />
                )}
              </button>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Aperçu des couleurs</h4>
              <div className="space-y-2">
                <button 
                  className="w-full px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: localSettings.primary_color || '#3B82F6' }}
                >
                  Bouton principal
                </button>
                <button 
                  className="w-full px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ backgroundColor: localSettings.secondary_color || '#8B5CF6' }}
                >
                  Bouton secondaire
                </button>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isAdmin) return null

  if (settingsLoading) {
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <p className="text-gray-400">Configurez les paramètres de votre plateforme</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 bg-gray-800 p-1 rounded-lg overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all whitespace-nowrap ${
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
              <div className="flex-1">
                {error && (
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                )}
                {saved && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>Paramètres sauvegardés avec succès!</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="ml-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminSettings