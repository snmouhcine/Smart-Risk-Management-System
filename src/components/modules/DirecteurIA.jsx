import React from 'react';
import { 
  Brain, Zap, AlertTriangle, Target, TrendingUp, Shield,
  Cpu, LineChart, Lock, DollarSign
} from 'lucide-react';

const DirecteurIA = ({
  aiAnalysis,
  isAnalyzing,
  performFinancialDirectorAnalysis,
  anthropicApiKey,
  aiProvider,
  selectedModel,
  openaiApiKey
}) => {
  return (
    <div className="space-y-6">
      {/* Header Directeur Financier */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Directeur Financier IA</h2>
              <p className="text-blue-200">Analyse Temps Réel • Décisions Rapides • Performance Maximale</p>
            </div>
          </div>
          <button 
            onClick={performFinancialDirectorAnalysis}
            disabled={isAnalyzing || (!anthropicApiKey && !openaiApiKey)}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyse...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>ANALYSE TEMPS RÉEL</span>
              </>
            )}
          </button>
        </div>

        {/* Message d'information */}
        <div className="mt-4 p-3 bg-blue-800/30 rounded-lg border border-blue-400/50">
          <p className="text-sm text-blue-200">
            💡 Les recommandations du Directeur IA seront automatiquement appliquées dans le Calculateur de Position
          </p>
          {(anthropicApiKey || openaiApiKey) && (
            <p className="text-xs text-blue-300 mt-1">
              🤖 Modèle actif: {aiProvider === 'anthropic' ? 'Claude' : 'GPT'} ({selectedModel})
            </p>
          )}
        </div>

        {/* Status Exécutif */}
        {aiAnalysis && (
          <div className={`p-4 rounded-lg border-2 ${
            aiAnalysis.executiveSummary.status === 'CRITICAL' ? 'bg-red-900/50 border-red-500' :
            aiAnalysis.executiveSummary.status === 'DANGER' ? 'bg-orange-900/50 border-orange-500' :
            aiAnalysis.executiveSummary.status === 'CAUTION' ? 'bg-yellow-900/50 border-yellow-500' :
            'bg-green-900/50 border-green-500'
          }`}>
            <div className="flex items-center space-x-3">
              <span className={`w-3 h-3 rounded-full ${
                aiAnalysis.executiveSummary.status === 'CRITICAL' ? 'bg-red-500 animate-pulse' :
                aiAnalysis.executiveSummary.status === 'DANGER' ? 'bg-orange-500' :
                aiAnalysis.executiveSummary.status === 'CAUTION' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></span>
              <div className="flex-1">
                <div className="text-lg font-bold">{aiAnalysis.executiveSummary.headline}</div>
                <div className="text-sm opacity-90">PRIORITÉ: {aiAnalysis.executiveSummary.priority}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                aiAnalysis.executiveSummary.status === 'CRITICAL' ? 'bg-red-500' :
                aiAnalysis.executiveSummary.status === 'DANGER' ? 'bg-orange-500' :
                aiAnalysis.executiveSummary.status === 'CAUTION' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}>
                {aiAnalysis.executiveSummary.status}
              </div>
            </div>
          </div>
        )}
      </div>

      {aiAnalysis && (
        <div className="space-y-6">
          {/* KPIs Temps Réel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">PERTE MAX AUJOURD'HUI</h3>
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-2xl font-bold text-red-600">{aiAnalysis.kpis.maxLossToday}</div>
              <div className="text-xs text-slate-500">Limite absolue journalière</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">RISQUE OPTIMAL</h3>
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{aiAnalysis.kpis.optimalRiskPerTrade}</div>
              <div className="text-xs text-slate-500">Par trade recommandé</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">GAIN MIN REQUIS</h3>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{aiAnalysis.kpis.minDailyGainRequired}</div>
              <div className="text-xs text-slate-500">Par jour pour objectif</div>
            </div>

            <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${
              aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'border-red-500' :
              aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'border-orange-500' :
              'border-green-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">DRAWDOWN STATUS</h3>
                <Shield className={`w-5 h-5 ${
                  aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'text-red-500' :
                  aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'text-orange-500' :
                  'text-green-500'
                }`} />
              </div>
              <div className={`text-2xl font-bold ${
                aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'text-red-600' :
                aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {aiAnalysis.kpis.drawdownStatus}
              </div>
              <div className="text-xs text-slate-500">État de protection</div>
            </div>
          </div>

          {/* Métriques Secondaires */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-600">TRADES RESTANTS</div>
              <div className="text-xl font-bold text-slate-900">{aiAnalysis.kpis.tradesLeftBudget}</div>
              <div className="text-xs text-slate-500">Dans budget risque</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-600">JOURS RESTANTS</div>
              <div className="text-xl font-bold text-slate-900">{aiAnalysis.kpis.daysToTarget}</div>
              <div className="text-xs text-slate-500">Pour atteindre objectif</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-600">WIN RATE REQUIS</div>
              <div className="text-xl font-bold text-slate-900">{aiAnalysis.kpis.winRateRequired}</div>
              <div className="text-xs text-slate-500">Pour réussir objectif</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="text-sm font-medium text-slate-600">CAPITAL À RISQUE</div>
              <div className="text-xl font-bold text-slate-900">{aiAnalysis.kpis.capitalAtRisk}</div>
              <div className="text-xs text-slate-500">Exposition totale</div>
            </div>
          </div>

          {/* Directives Financières */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
            <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2" />
              📋 DIRECTIVES FINANCIÈRES IMMÉDIATES
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {aiAnalysis.financialDirectives.map((directive, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-indigo-100">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="text-sm text-indigo-800">{directive}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment de Risque & Stratégie */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-xl border-2 ${
              aiAnalysis.riskAssessment.level === 'EXTREME' ? 'bg-red-50 border-red-200' :
              aiAnalysis.riskAssessment.level === 'HIGH' ? 'bg-orange-50 border-orange-200' :
              aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200' :
              'bg-green-50 border-green-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 flex items-center ${
                aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-900' :
                aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-900' :
                aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-900' :
                'text-green-900'
              }`}>
                <AlertTriangle className="w-5 h-5 mr-2" />
                🎯 ASSESSMENT RISQUE
              </h3>
              <div className={`text-2xl font-bold mb-2 ${
                aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-700' :
                aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-700' :
                aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-700' :
                'text-green-700'
              }`}>
                {aiAnalysis.riskAssessment.level}
              </div>
              <div className={`text-sm mb-3 ${
                aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-800' :
                aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-800' :
                aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-800' :
                'text-green-800'
              }`}>
                {aiAnalysis.riskAssessment.recommendation}
              </div>
              <div className="space-y-1">
                {aiAnalysis.riskAssessment.factors.map((factor, index) => (
                  <div key={index} className={`text-xs flex items-center space-x-2 ${
                    aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-700' :
                    aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-700' :
                    aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                    <span>{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-purple-600" />
                🎯 STRATÉGIE MARCHÉ
              </h3>
              <div className={`text-2xl font-bold mb-2 ${
                aiAnalysis.marketStrategy.approach === 'AGGRESSIVE' ? 'text-red-600' :
                aiAnalysis.marketStrategy.approach === 'BALANCED' ? 'text-blue-600' :
                aiAnalysis.marketStrategy.approach === 'CONSERVATIVE' ? 'text-green-600' :
                'text-orange-600'
              }`}>
                {aiAnalysis.marketStrategy.approach}
              </div>
              <div className="text-sm text-slate-600 mb-3">{aiAnalysis.marketStrategy.reasoning}</div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="text-sm font-medium text-purple-900">PROCHAINE ACTION :</div>
                <div className="text-sm text-purple-800 mt-1">{aiAnalysis.marketStrategy.nextAction}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!aiAnalysis && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Directeur Financier IA Inactif</h3>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Cliquez sur <strong>"ANALYSE TEMPS RÉEL"</strong> pour obtenir des KPIs décisionnels et des recommandations de votre directeur financier IA personnel.
          </p>
          
          {!anthropicApiKey && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 mb-8 max-w-2xl mx-auto">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center justify-center">
                <Lock className="w-5 h-5 mr-2" />
                🔑 Configuration API Recommandée
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Allez dans <strong>Paramètres</strong> pour ajouter votre clé API</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Obtenez votre clé sur <strong>console.anthropic.com</strong></span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Analyses illimitées avec votre propre compte</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg max-w-3xl mx-auto">
            <h4 className="font-semibold text-slate-800 mb-4">🎯 Votre Directeur Financier IA analysera :</h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span>Perte maximale autorisée aujourd'hui</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  <span>Risque optimal par trade</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Gain minimum requis pour objectif</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-orange-500" />
                  <span>État de protection drawdown</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-purple-500" />
                  <span>Stratégie marché personnalisée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Assessment de risque temps réel</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirecteurIA; 