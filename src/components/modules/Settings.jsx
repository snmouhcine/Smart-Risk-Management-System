import React, { useState } from 'react';
import { 
  Settings, 
  Brain, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  DollarSign,
  Shield,
  User,
  Save,
  Eye,
  EyeOff,
  Globe,
  CreditCard
} from 'lucide-react';
import { AI_MODELS, testAPIConnection } from '../../utils/aiProviders';
import { parseNumberInput, formatCurrency } from '../../utils/formatters';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import SubscriptionManager from '../SubscriptionManager';

const SettingsModule = ({
  initialCapital,
  setInitialCapital,
  currentBalance,
  setCurrentBalance,
  weeklyTarget,
  setWeeklyTarget,
  monthlyTarget,
  setMonthlyTarget,
  riskPerTrade,
  setRiskPerTrade,
  dailyLossMax,
  setDailyLossMax,
  anthropicApiKey,
  setAnthropicApiKey,
  secureMode,
  setSecureMode,
  calculateCurrentBalanceFromJournal,
  aiProvider = 'anthropic',
  setAiProvider,
  openaiApiKey = '',
  setOpenaiApiKey,
  selectedModel = 'claude-3-5-sonnet-20241022',
  setSelectedModel,
  tradingTimezone = 'UTC',
  setTradingTimezone,
  saveAllSettings
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('capital');
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  
  // Profile tab states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    const apiKey = aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;
    const result = await testAPIConnection(aiProvider, apiKey);
    
    setConnectionStatus(result);
    setTestingConnection(false);
    
    setTimeout(() => setConnectionStatus(null), 5000);
  };

  const handleProviderChange = (newProvider) => {
    setAiProvider(newProvider);
    const models = AI_MODELS[newProvider];
    if (models && models.length > 0) {
      setSelectedModel(models[0].id);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setSaveStatus(null);
    
    try {
      if (saveAllSettings) {
        await saveAllSettings();
      }
      setSaveStatus({ success: true, message: 'Paramètres sauvegardés avec succès!' });
    } catch (error) {
      setSaveStatus({ success: false, message: 'Erreur lors de la sauvegarde' });
    } finally {
      setSavingSettings(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  const handlePasswordUpdate = async () => {
    setPasswordError('');
    
    if (!newPassword) {
      setPasswordError('Veuillez entrer un nouveau mot de passe');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setUpdatingPassword(true);
    
    try {
      // Note: Supabase doesn't require current password for password update
      // when user is already authenticated
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      setSaveStatus({ success: true, message: 'Mot de passe mis à jour avec succès!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (error) {
      setPasswordError(error.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const tabs = [
    { id: 'capital', label: 'Capital & Performance', icon: DollarSign },
    { id: 'management', label: 'Money Management IA', icon: Brain },
    { id: 'ai', label: 'Modèles IA', icon: Brain },
    { id: 'profile', label: 'Profil & Mot de passe', icon: User },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        {/* Header with tabs */}
        <div className="border-b border-slate-200">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Settings className="w-6 h-6 mr-3 text-purple-600" />
              Configuration Trading IA
            </h2>
          </div>
          
          <div className="flex space-x-1 px-6 mt-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                    ${activeTab === tab.id 
                      ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* Capital & Performance Tab */}
          {activeTab === 'capital' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Capital Initial ($)</label>
                  <input
                    type="text"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(parseNumberInput(e.target.value, 2))}
                    placeholder="48518.30"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-slate-500 mt-1">Capital de départ pour calculs de performance et drawdown</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Capital Actuel ($)</label>
                  <input
                    type="text"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(parseNumberInput(e.target.value, 2))}
                    placeholder="51628.12"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-purple-600 mt-1">⚡ Base pour TOUS les calculs de risque (compound)</div>
                  {calculateCurrentBalanceFromJournal() && (
                    <div className="text-xs text-green-600 mt-1">📅 Auto-calculé du journal: {formatCurrency(calculateCurrentBalanceFromJournal())}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Objectif Hebdomadaire (%)</label>
                  <input
                    type="text"
                    value={weeklyTarget}
                    onChange={(e) => setWeeklyTarget(parseFloat(parseNumberInput(e.target.value, 2)) || 0)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-blue-600 mt-1">📅 Se réinitialise chaque lundi</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Objectif Mensuel (%)</label>
                  <input
                    type="text"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(parseFloat(parseNumberInput(e.target.value, 2)) || 0)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-green-600 mt-1">🎯 Objectif principal - L'IA optimise pour l'atteindre</div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📊 Notes sur le Capital</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Le capital initial sert de référence pour calculer votre performance globale</li>
                  <li>• Le capital actuel est utilisé pour tous les calculs de taille de position</li>
                  <li>• Les objectifs hebdomadaires et mensuels guident l'IA dans ses recommandations</li>
                </ul>
              </div>
            </div>
          )}

          {/* Money Management IA Tab */}
          {activeTab === 'management' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Risque par Trade (%)</label>
                  <input
                    type="text"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(parseFloat(parseNumberInput(e.target.value, 2)) || 0)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-slate-500 mt-1">L'IA ajustera automatiquement selon les conditions</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Perte Max Journalière (%)</label>
                  <input
                    type="text"
                    value={dailyLossMax}
                    onChange={(e) => setDailyLossMax(parseFloat(parseNumberInput(e.target.value, 2)) || 0)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-red-600 mt-1">🚨 Limite absolue - Recommandé: 1-2% maximum</div>
                </div>
              </div>
              
              {/* Protection Drawdown */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">🛡️ Protection Drawdown Automatique</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-blue-800">
                    <span className="font-medium">Seuil 1:</span> 1.5% → Risque -20%
                  </div>
                  <div className="text-blue-800">
                    <span className="font-medium">Seuil 2:</span> 3% → Risque -40%
                  </div>
                  <div className="text-orange-800">
                    <span className="font-medium">Seuil 3:</span> 5% → Risque -70%
                  </div>
                  <div className="text-red-800">
                    <span className="font-medium">Seuil 4:</span> 8% → MODE SURVIE
                  </div>
                </div>
              </div>
              
              {/* Mode Sécurisé */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-orange-900">Mode Sécurisé</h4>
                    <p className="text-sm text-orange-700">Réduit automatiquement tous les risques de 50%</p>
                  </div>
                  <button
                    onClick={() => setSecureMode(!secureMode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      secureMode
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {secureMode ? 'Activé' : 'Désactivé'}
                  </button>
                </div>
              </div>
              
              {/* Trading Timezone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Fuseau Horaire Trading
                </label>
                <select
                  value={tradingTimezone}
                  onChange={(e) => setTradingTimezone(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="UTC">UTC (Temps Universel Coordonné)</option>
                  <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="America/New_York">America/New York (EST/EDT)</option>
                  <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</option>
                  <option value="Africa/Casablanca">Africa/Casablanca (WET)</option>
                </select>
                <div className="text-xs text-slate-600 mt-1">
                  ⏰ Les heures de trading (13:30-15:30) sont définies dans ce fuseau horaire
                </div>
              </div>
              
              {/* Système IA Info */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Système de Protection IA
                </h4>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>• <strong>Analyse Continue:</strong> L'IA surveille votre performance en temps réel</li>
                  <li>• <strong>Ajustement Dynamique:</strong> Le risque s'adapte selon les conditions du marché</li>
                  <li>• <strong>Protection Capital:</strong> Activation automatique des mesures de sécurité</li>
                  <li>• <strong>Mode Survie:</strong> Protection maximale en cas de drawdown sévère</li>
                </ul>
              </div>
            </div>
          )}

          {/* AI Models Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Fournisseur IA</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleProviderChange('anthropic')}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                      aiProvider === 'anthropic'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    Anthropic (Claude)
                  </button>
                  <button
                    onClick={() => handleProviderChange('openai')}
                    className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                      aiProvider === 'openai'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-green-700 border border-green-300 hover:bg-green-50'
                    }`}
                  >
                    OpenAI (GPT)
                  </button>
                </div>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Modèle</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {AI_MODELS[aiProvider]?.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-slate-600 mt-1">
                  {AI_MODELS[aiProvider]?.find(m => m.id === selectedModel)?.description}
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Clé API {aiProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                </label>
                <input
                  type="password"
                  value={aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey}
                  onChange={(e) => {
                    if (aiProvider === 'anthropic') {
                      setAnthropicApiKey(e.target.value);
                    } else {
                      setOpenaiApiKey(e.target.value);
                    }
                  }}
                  placeholder={aiProvider === 'anthropic' ? "sk-ant-api03-..." : "sk-..."}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-xs text-slate-600 mt-1">
                  ⚙️ Requis pour utiliser le Directeur IA
                </div>
              </div>

              {/* Test Connection Button */}
              <button
                onClick={handleTestConnection}
                disabled={testingConnection || !(aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey)}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  'Tester la connexion'
                )}
              </button>

              {/* Connection Status */}
              {connectionStatus && (
                <div className={`p-3 rounded-lg text-sm flex items-center ${
                  connectionStatus.success 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {connectionStatus.success ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {connectionStatus.message}
                </div>
              )}
              
              {/* AI Features */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
                <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
                  <Brain className="w-5 h-5 mr-2" />
                  Capacités du Système IA
                </h4>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>• <strong>Multi-Modèles:</strong> Support Claude (Anthropic) et GPT (OpenAI)</li>
                  <li>• <strong>Analyse Contextuelle:</strong> Compréhension profonde de votre style de trading</li>
                  <li>• <strong>Recommandations Personnalisées:</strong> Conseils adaptés à votre profil de risque</li>
                  <li>• <strong>Détection de Patterns:</strong> Identification des tendances dans votre trading</li>
                  <li>• <strong>Optimisation Continue:</strong> Amélioration constante des stratégies</li>
                </ul>
              </div>
            </div>
          )}

          {/* Profile & Password Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 mb-3">Informations du compte</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Email:</span>
                    <span className="font-medium text-slate-900">{user?.email || 'Non connecté'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">ID Utilisateur:</span>
                    <span className="font-mono text-xs text-slate-700">{user?.id || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Dernière connexion:</span>
                    <span className="text-slate-700">{user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : '-'}</span>
                  </div>
                </div>
              </div>

              {/* Password Change */}
              <div>
                <h4 className="font-medium text-slate-900 mb-4">Changer le mot de passe</h4>
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Confirmer le nouveau mot de passe</label>
                    <input
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  
                  {passwordError && (
                    <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {passwordError}
                    </div>
                  )}
                  
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={updatingPassword || !newPassword}
                    className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {updatingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mise à jour...
                      </>
                    ) : (
                      'Mettre à jour le mot de passe'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Security Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">🔒 Conseils de sécurité</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Utilisez un mot de passe d'au moins 8 caractères</li>
                  <li>• Incluez des lettres majuscules et minuscules, des chiffres et des symboles</li>
                  <li>• Ne réutilisez pas le même mot de passe sur d'autres sites</li>
                  <li>• Activez l'authentification à deux facteurs si disponible</li>
                </ul>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div>
              <SubscriptionManager />
            </div>
          )}
        </div>

        {/* Footer with Save Button */}
        <div className="px-6 pb-6 border-t border-slate-200 pt-6">
          <div className="flex justify-between items-center">
            {saveStatus && (
              <div className={`flex items-center text-sm ${
                saveStatus.success ? 'text-green-600' : 'text-red-600'
              }`}>
                {saveStatus.success ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                {saveStatus.message}
              </div>
            )}
            
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Sauvegarder Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule;