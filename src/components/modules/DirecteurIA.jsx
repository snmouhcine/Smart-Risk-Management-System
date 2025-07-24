import React, { useState } from 'react';
import { 
  Brain, Zap, AlertTriangle, Target, TrendingUp, Shield,
  Cpu, LineChart, Lock, DollarSign, Info, X
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const DirecteurIA = ({
  aiAnalysis,
  isAnalyzing,
  performFinancialDirectorAnalysis,
  anthropicApiKey,
  aiProvider,
  selectedModel,
  openaiApiKey
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', description: '' });

  // Définitions des explications pour chaque métrique
  const kpiExplanations = {
    maxLossToday: {
      title: "Perte Max Aujourd'hui",
      description: "💰 C'est le montant maximum que vous pouvez vous permettre de perdre aujourd'hui selon votre stratégie de gestion du risque.\n\n🎯 Calculé en fonction de :\n• Votre capital total\n• Votre limite de perte journalière (ex: 3%)\n• Votre performance récente\n\n⚠️ IMPORTANT : Si vous atteignez cette limite, vous devez ARRÊTER de trader pour la journée. C'est votre filet de sécurité pour protéger votre capital."
    },
    optimalRiskPerTrade: {
      title: "Risque Optimal par Trade",
      description: "🎯 C'est le montant recommandé à risquer sur chaque trade individuel pour maximiser vos profits tout en protégeant votre capital.\n\n📊 Calculé selon :\n• La méthode Kelly ou règle du 1-2%\n• Votre win rate actuel\n• Votre ratio risque/récompense\n• Votre niveau de drawdown\n\n💡 Si vous risquez ce montant par trade avec un bon setup, vous optimisez vos chances de succès à long terme."
    },
    minDailyGainRequired: {
      title: "Gain Minimum Requis par Jour",
      description: "📈 C'est le montant minimum que vous devez gagner chaque jour pour atteindre votre objectif mensuel.\n\n🗓️ Calculé selon :\n• Votre objectif mensuel (ex: 8%)\n• Les jours restants dans le mois\n• Votre performance actuelle du mois\n\n🎯 Si vous gagnez au moins ce montant quotidiennement, vous êtes sur la bonne voie pour réussir votre objectif mensuel."
    },
    drawdownStatus: {
      title: "Statut de Drawdown",
      description: "📊 Indique votre niveau de perte par rapport à votre pic de capital le plus récent.\n\n🚦 Les niveaux :\n• 🟢 SAFE : Drawdown < 5% - Trading normal\n• 🟡 WARNING : Drawdown 5-10% - Soyez prudent\n• 🔴 CRITICAL : Drawdown > 10% - Mode défensif strict\n\n💡 Le drawdown vous aide à identifier si vous traversez une mauvaise passe et devez ajuster votre stratégie."
    },
    tradesLeftBudget: {
      title: "Trades Restants dans le Budget",
      description: "🎲 Nombre de trades que vous pouvez encore faire aujourd'hui sans dépasser votre limite de perte journalière.\n\n🧮 Calcul :\n• Perte max journalière ÷ Risque par trade\n• Exemple : $1,500 ÷ $500 = 3 trades\n\n⚠️ Si ce chiffre est faible (ex: 1.2), vous avez déjà utilisé la majorité de votre budget risque aujourd'hui. Soyez très sélectif sur vos prochains trades."
    },
    daysToTarget: {
      title: "Jours Restants pour l'Objectif",
      description: "📅 Nombre de jours de trading restants dans le mois pour atteindre votre objectif mensuel.\n\n🗓️ Calcul automatique :\n• Jours ouvrables restants jusqu'à la fin du mois\n• Exclut weekends et jours fériés\n\n⏰ Plus ce nombre diminue, plus la pression augmente pour performer chaque jour restant."
    },
    winRateRequired: {
      title: "Win Rate Requis pour l'Objectif",
      description: "🎯 Le pourcentage de trades gagnants dont vous avez besoin pour atteindre votre objectif mensuel.\n\n📊 Basé sur :\n• Votre ratio risque/récompense moyen\n• Le montant restant à gagner\n• Le nombre de trades prévus\n\n💡 Si votre win rate actuel est inférieur à ce requis, vous devez soit améliorer votre sélection de trades, soit augmenter votre ratio R:R."
    },
    capitalAtRisk: {
      title: "Capital à Risque Total",
      description: "💼 Montant total de votre capital qui pourrait être en danger selon votre stratégie actuelle.\n\n🔍 Inclut :\n• Positions ouvertes actuelles\n• Exposition maximale possible\n• Marge utilisée\n\n⚠️ Ne devrait jamais dépasser 20-30% de votre capital total pour une gestion de risque saine."
    }
  };

  const showInfo = (kpiType) => {
    setInfoContent(kpiExplanations[kpiType]);
    setShowInfoModal(true);
  };
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => showInfo('maxLossToday')}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors"
                    title="Voir explication détaillée"
                  >
                    <Info className="w-4 h-4 text-red-500" />
                  </button>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">${formatNumber(parseFloat(aiAnalysis.kpis.maxLossToday.replace(/[\$,]/g, '')))}</div>
              <div className="text-xs text-slate-500">Limite absolue journalière</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">RISQUE OPTIMAL</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => showInfo('optimalRiskPerTrade')}
                    className="p-1 hover:bg-blue-100 rounded-full transition-colors"
                    title="Voir explication détaillée"
                  >
                    <Info className="w-4 h-4 text-blue-500" />
                  </button>
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">${formatNumber(parseFloat(aiAnalysis.kpis.optimalRiskPerTrade.replace(/[\$,]/g, '')))}</div>
              <div className="text-xs text-slate-500">Par trade recommandé</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">GAIN MIN REQUIS</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => showInfo('minDailyGainRequired')}
                    className="p-1 hover:bg-green-100 rounded-full transition-colors"
                    title="Voir explication détaillée"
                  >
                    <Info className="w-4 h-4 text-green-500" />
                  </button>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">${formatNumber(parseFloat(aiAnalysis.kpis.minDailyGainRequired.replace(/[\$,]/g, '')))}</div>
              <div className="text-xs text-slate-500">Par jour pour objectif</div>
            </div>

            <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${
              aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'border-red-500' :
              aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'border-orange-500' :
              'border-green-500'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-600">DRAWDOWN STATUS</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => showInfo('drawdownStatus')}
                    className={`p-1 rounded-full transition-colors ${
                      aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'hover:bg-red-100' :
                      aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'hover:bg-orange-100' :
                      'hover:bg-green-100'
                    }`}
                    title="Voir explication détaillée"
                  >
                    <Info className={`w-4 h-4 ${
                      aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'text-red-500' :
                      aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'text-orange-500' :
                      'text-green-500'
                    }`} />
                  </button>
                  <Shield className={`w-5 h-5 ${
                    aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'text-red-500' :
                    aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'text-orange-500' :
                    'text-green-500'
                  }`} />
                </div>
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
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">TRADES RESTANTS</div>
                <button
                  onClick={() => showInfo('tradesLeftBudget')}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  title="Voir explication détaillée"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="text-xl font-bold text-slate-900">{aiAnalysis.kpis.tradesLeftBudget}</div>
              <div className="text-xs text-slate-500">Dans budget risque</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">JOURS RESTANTS</div>
                <button
                  onClick={() => showInfo('daysToTarget')}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  title="Voir explication détaillée"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="text-xl font-bold text-slate-900">{aiAnalysis.kpis.daysToTarget}</div>
              <div className="text-xs text-slate-500">Pour atteindre objectif</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">WIN RATE REQUIS</div>
                <button
                  onClick={() => showInfo('winRateRequired')}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  title="Voir explication détaillée"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="text-xl font-bold text-slate-900">{aiAnalysis.kpis.winRateRequired}</div>
              <div className="text-xs text-slate-500">Pour réussir objectif</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-slate-600">CAPITAL À RISQUE</div>
                <button
                  onClick={() => showInfo('capitalAtRisk')}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  title="Voir explication détaillée"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="text-xl font-bold text-slate-900">${aiAnalysis.kpis.capitalAtRisk}</div>
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

      {/* Modal d'Information */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900 flex items-center">
                <Info className="w-6 h-6 mr-2 text-blue-600" />
                {infoContent.title}
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-500 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="prose prose-sm max-w-none">
              <div className="text-slate-700 whitespace-pre-line leading-relaxed">
                {infoContent.description}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirecteurIA; 