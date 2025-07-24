import React, { useState } from 'react';
import { Settings, Brain, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { AI_MODELS, testAPIConnection } from '../../utils/aiProviders';

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
  // Nouvelles props pour multi-modèles
  aiProvider = 'anthropic',
  setAiProvider,
  openaiApiKey = '',
  setOpenaiApiKey,
  selectedModel = 'claude-3-5-sonnet-20241022',
  setSelectedModel
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    const apiKey = aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;
    const result = await testAPIConnection(aiProvider, apiKey);
    
    setConnectionStatus(result);
    setTestingConnection(false);
    
    // Réinitialiser le statut après 5 secondes
    setTimeout(() => setConnectionStatus(null), 5000);
  };

  const handleProviderChange = (newProvider) => {
    setAiProvider(newProvider);
    // Sélectionner le premier modèle du nouveau provider
    const models = AI_MODELS[newProvider];
    if (models && models.length > 0) {
      setSelectedModel(models[0].id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Settings className="w-6 h-6 mr-3 text-purple-600" />
          Configuration Trading IA
        </h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Capital & Performance */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
              💰 Capital & Performance
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Capital Initial ($)</label>
                <input
                  type="number"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(e.target.value)}
                  placeholder="48518.30"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-xs text-slate-500 mt-1">Capital de départ pour calculs de performance et drawdown</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Capital Actuel ($)</label>
                <input
                  type="number"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  placeholder="51628.12"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-xs text-purple-600 mt-1">⚡ Base pour TOUS les calculs de risque (compound)</div>
                {calculateCurrentBalanceFromJournal() && (
                  <div className="text-xs text-green-600 mt-1">📅 Auto-calculé du journal: ${calculateCurrentBalanceFromJournal().toLocaleString()}</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Objectif Hebdomadaire (%)</label>
                <input
                  type="number"
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(parseFloat(e.target.value))}
                  step="0.5"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-xs text-blue-600 mt-1">📅 Se réinitialise chaque lundi</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Objectif Mensuel (%)</label>
                <input
                  type="number"
                  value={monthlyTarget}
                  onChange={(e) => setMonthlyTarget(parseFloat(e.target.value))}
                  step="0.5"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-xs text-green-600 mt-1">🎯 Objectif principal - L'IA optimise pour l'atteindre</div>
              </div>
            </div>
          </div>

          {/* Money Management IA */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
              🧠 Money Management IA
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Risque par Trade (%)</label>
                <input
                  type="number"
                  value={riskPerTrade}
                  onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
                  step="0.1"
                  min="0.1"
                  max="10"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-xs text-slate-500 mt-1">L'IA ajustera automatiquement selon les conditions</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Perte Max Journalière (%)</label>
                <input
                  type="number"
                  value={dailyLossMax}
                  onChange={(e) => setDailyLossMax(parseFloat(e.target.value))}
                  step="0.1"
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="text-xs text-red-600 mt-1">🚨 Limite absolue - Recommandé: 1-2% maximum</div>
              </div>
              
              {/* Nouveaux seuils de protection */}
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

              {/* Sélection du Provider AI */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3">🤖 Modèle IA</h4>
                
                {/* Provider Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-purple-800 mb-2">Fournisseur IA</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleProviderChange('anthropic')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        aiProvider === 'anthropic'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-purple-700 border border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      Anthropic (Claude)
                    </button>
                    <button
                      onClick={() => handleProviderChange('openai')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-purple-800 mb-2">Modèle</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  >
                    {AI_MODELS[aiProvider]?.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-purple-700 mt-1">
                    {AI_MODELS[aiProvider]?.find(m => m.id === selectedModel)?.description}
                  </div>
                </div>

                {/* API Key Input */}
                <div>
                  <label className="block text-sm font-medium text-purple-800 mb-2">
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
                    className="w-full px-4 py-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="text-xs text-purple-700 mt-1">
                    ⚙️ Requis pour utiliser le Directeur IA
                  </div>
                </div>

                {/* Test Connection Button */}
                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !(aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey)}
                  className="mt-3 w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
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
                  <div className={`mt-2 p-2 rounded-lg text-sm flex items-center ${
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
            </div>
          </div>
        </div>

        {/* Système IA - Nouveau */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h4 className="font-semibold text-purple-900 mb-4 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              🤖 Système IA Méthode Alpha
            </h4>
            <ul className="text-sm text-purple-800 space-y-2">
              <li>• <strong>Multi-Modèles:</strong> Support Claude (Anthropic) et GPT (OpenAI)</li>
              <li>• <strong>Protection Drawdown:</strong> Surveillance continue du pic mensuel</li>
              <li>• <strong>Analyse Patterns:</strong> Détection automatique des séries de pertes</li>
              <li>• <strong>Risque Adaptatif:</strong> Ajustement en temps réel selon performance</li>
              <li>• <strong>Objectif Prioritaire:</strong> Optimisation pour finir le mois POSITIF</li>
              <li>• <strong>Mode Survie:</strong> Activation automatique en cas de drawdown critique</li>
            </ul>
          </div>

          <button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2">
            <CheckCircle className="w-5 h-5" />
            <span>Sauvegarder Configuration IA</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModule; 