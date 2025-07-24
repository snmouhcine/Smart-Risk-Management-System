import React, { useState, useEffect } from 'react';
import { 
  Brain, Zap, AlertTriangle, Target, TrendingUp, Shield,
  Cpu, LineChart, Lock, DollarSign, Info, X, Activity,
  Gauge, Clock, AlertCircle, CheckCircle, TrendingDown,
  BarChart3, Radar
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

const DirecteurIA = ({
  aiAnalysis,
  isAnalyzing,
  performFinancialDirectorAnalysis,
  anthropicApiKey,
  aiProvider,
  selectedModel,
  openaiApiKey,
  recommendations,
  stats,
  capital
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', description: '' });
  const [selectedPattern, setSelectedPattern] = useState(null);

  // Calcul du niveau de danger (0-100)
  const calculateDangerLevel = () => {
    if (!recommendations) return 30;
    
    let danger = 0;
    if (recommendations.status === 'emergency') danger = 90;
    else if (recommendations.status === 'danger') danger = 75;
    else if (recommendations.status === 'pattern_warning') danger = 60;
    else if (recommendations.status === 'warning') danger = 45;
    else danger = 30;
    
    return danger;
  };

  // Calcul de l'opportunité (0-100)
  const calculateOpportunity = () => {
    if (!stats) return 50;
    
    const winRate = stats.winRate || 50;
    const profitFactor = stats.profitFactor || 1;
    const opportunity = Math.min(100, (winRate * 0.7 + profitFactor * 15));
    
    return Math.round(opportunity);
  };

  // Détection des patterns
  const detectPatterns = () => {
    const patterns = {
      revenge: 0,
      overtrading: 0,
      fomo: 0,
      discipline: 100,
      patience: 100
    };

    if (stats?.consecutiveLosses >= 2) {
      patterns.revenge = Math.min(100, stats.consecutiveLosses * 30);
      patterns.discipline -= stats.consecutiveLosses * 20;
    }

    if (stats?.totalTrades > 5) {
      patterns.overtrading = Math.min(100, (stats.totalTrades - 5) * 20);
      patterns.patience -= (stats.totalTrades - 5) * 15;
    }

    return patterns;
  };

  const patterns = detectPatterns();
  const dangerLevel = calculateDangerLevel();
  const opportunityLevel = calculateOpportunity();

  // Déterminer l'état du timing
  const getTimingStatus = () => {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    
    // Heures optimales de trading (9h30-11h30 et 14h-15h30)
    if ((hour === 9 && minute >= 30) || (hour === 10) || (hour === 11 && minute <= 30)) {
      return { status: 'OPTIMAL', color: 'text-green-600', icon: '▲' };
    } else if ((hour === 14) || (hour === 15 && minute <= 30)) {
      return { status: 'BON', color: 'text-blue-600', icon: '●' };
    } else if (hour >= 16 || hour < 9) {
      return { status: 'FERMÉ', color: 'text-red-600', icon: '■' };
    } else {
      return { status: 'MOYEN', color: 'text-yellow-600', icon: '▼' };
    }
  };

  const timing = getTimingStatus();
  const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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
      {/* Header Cockpit Ultra Moderne */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Effet de grille futuriste en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px),
                            repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 36px)`
          }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Brain className="w-10 h-10 mr-4 text-cyan-400" />
                COCKPIT DE TRADING INTELLIGENT
              </h1>
              <p className="text-purple-200 mt-2">Centre de contrôle IA pour décisions optimales</p>
            </div>
            
            <button
              onClick={performFinancialDirectorAnalysis}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-3"
            >
              {isAnalyzing ? (
                <>
                  <Cpu className="w-5 h-5 animate-spin" />
                  <span>ANALYSE EN COURS...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>ANALYSE TEMPS RÉEL</span>
                </>
              )}
            </button>
          </div>

          {/* Tableau de bord principal - 3 jauges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Jauge de Danger */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white/80 text-sm font-medium mb-4 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                NIVEAU DE DANGER
              </h3>
              <div className="relative h-32">
                <svg className="w-full h-full" viewBox="0 0 200 100">
                  {/* Arc de fond */}
                  <path
                    d="M 20 80 A 60 60 0 0 1 180 80"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="20"
                  />
                  {/* Arc de progression */}
                  <path
                    d="M 20 80 A 60 60 0 0 1 180 80"
                    fill="none"
                    stroke={dangerLevel > 70 ? '#ef4444' : dangerLevel > 40 ? '#f59e0b' : '#10b981'}
                    strokeWidth="20"
                    strokeDasharray={`${dangerLevel * 1.57} 157`}
                    className="transition-all duration-1000"
                  />
                  {/* Aiguille */}
                  <line
                    x1="100"
                    y1="80"
                    x2={100 + Math.cos((Math.PI - (dangerLevel * Math.PI / 100))) * 50}
                    y2={80 + Math.sin((Math.PI - (dangerLevel * Math.PI / 100))) * 50}
                    stroke="white"
                    strokeWidth="3"
                    className="transition-all duration-1000"
                  />
                  <circle cx="100" cy="80" r="5" fill="white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center mt-8">
                    <div className="text-3xl font-bold text-white">{dangerLevel}%</div>
                    <div className={`text-sm ${dangerLevel > 70 ? 'text-red-400' : dangerLevel > 40 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {dangerLevel > 70 ? 'CRITIQUE' : dangerLevel > 40 ? 'ATTENTION' : 'SAFE'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Jauge d'Opportunité */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white/80 text-sm font-medium mb-4 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-400" />
                OPPORTUNITÉ MARCHÉ
              </h3>
              <div className="relative h-32">
                <svg className="w-full h-full" viewBox="0 0 200 100">
                  <path
                    d="M 20 80 A 60 60 0 0 1 180 80"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="20"
                  />
                  <path
                    d="M 20 80 A 60 60 0 0 1 180 80"
                    fill="none"
                    stroke={opportunityLevel > 70 ? '#10b981' : opportunityLevel > 40 ? '#3b82f6' : '#6b7280'}
                    strokeWidth="20"
                    strokeDasharray={`${opportunityLevel * 1.57} 157`}
                    className="transition-all duration-1000"
                  />
                  <line
                    x1="100"
                    y1="80"
                    x2={100 + Math.cos((Math.PI - (opportunityLevel * Math.PI / 100))) * 50}
                    y2={80 + Math.sin((Math.PI - (opportunityLevel * Math.PI / 100))) * 50}
                    stroke="white"
                    strokeWidth="3"
                    className="transition-all duration-1000"
                  />
                  <circle cx="100" cy="80" r="5" fill="white" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center mt-8">
                    <div className="text-3xl font-bold text-white">{opportunityLevel}%</div>
                    <div className={`text-sm ${opportunityLevel > 70 ? 'text-green-400' : opportunityLevel > 40 ? 'text-blue-400' : 'text-gray-400'}`}>
                      {opportunityLevel > 70 ? 'BULLISH' : opportunityLevel > 40 ? 'NEUTRE' : 'BEARISH'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicateur de Timing */}
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white/80 text-sm font-medium mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-400" />
                TIMING MARCHÉ
              </h3>
              <div className="flex flex-col items-center justify-center h-32">
                <div className="text-4xl font-bold text-white mb-2">{currentTime}</div>
                <div className={`flex items-center space-x-2 ${timing.color}`}>
                  <span className="text-2xl">{timing.icon}</span>
                  <span className="font-semibold">{timing.status}</span>
                </div>
                <div className="text-xs text-white/60 mt-2">
                  Prochaine zone: 14h00
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Existants - Nouveau Design */}
      {aiAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* On garde tous les KPIs mais avec un nouveau style */}
          <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-sm rounded-xl p-4 border border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-red-300">PERTE MAX</h4>
              <button
                onClick={() => showInfo('maxLossToday')}
                className="p-1 hover:bg-red-500/20 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-red-400" />
              </button>
            </div>
            <div className="text-2xl font-bold text-red-400">${formatNumber(parseFloat(aiAnalysis.kpis.maxLossToday.replace(/[\$,]/g, '')))}</div>
            <div className="text-xs text-red-300/70">Limite journalière</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-300">RISQUE OPTIMAL</h4>
              <button
                onClick={() => showInfo('optimalRiskPerTrade')}
                className="p-1 hover:bg-blue-500/20 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-blue-400" />
              </button>
            </div>
            <div className="text-2xl font-bold text-blue-400">${formatNumber(parseFloat(aiAnalysis.kpis.optimalRiskPerTrade.replace(/[\$,]/g, '')))}</div>
            <div className="text-xs text-blue-300/70">Par trade</div>
          </div>

          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-green-300">GAIN REQUIS</h4>
              <button
                onClick={() => showInfo('minDailyGainRequired')}
                className="p-1 hover:bg-green-500/20 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-green-400" />
              </button>
            </div>
            <div className="text-2xl font-bold text-green-400">${formatNumber(parseFloat(aiAnalysis.kpis.minDailyGainRequired.replace(/[\$,]/g, '')))}</div>
            <div className="text-xs text-green-300/70">Par jour</div>
          </div>

          <div className={`bg-gradient-to-br ${
            aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'from-red-500/10 to-red-600/10' :
            aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'from-orange-500/10 to-orange-600/10' :
            'from-green-500/10 to-green-600/10'
          } backdrop-blur-sm rounded-xl p-4 border ${
            aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'border-red-500/20' :
            aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'border-orange-500/20' :
            'border-green-500/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-white/80">DRAWDOWN</h4>
              <button
                onClick={() => showInfo('drawdownStatus')}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-white/60" />
              </button>
            </div>
            <div className={`text-2xl font-bold ${
              aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'text-red-400' :
              aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'text-orange-400' :
              'text-green-400'
            }`}>
              {aiAnalysis.kpis.drawdownStatus}
            </div>
            <div className="text-xs text-white/60">Protection</div>
          </div>
        </div>
      )}

      {/* Pattern Radar et Simulateur */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pattern Radar */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Radar className="w-5 h-5 mr-2 text-purple-400" />
            PATTERN RADAR
          </h3>
          
          <div className="space-y-4">
            {Object.entries(patterns).map(([pattern, value]) => {
              const isNegative = ['revenge', 'overtrading', 'fomo'].includes(pattern);
              const color = isNegative 
                ? value > 60 ? 'bg-red-500' : value > 30 ? 'bg-orange-500' : 'bg-green-500'
                : value > 60 ? 'bg-green-500' : value > 30 ? 'bg-orange-500' : 'bg-red-500';
              
              return (
                <div key={pattern} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-300 capitalize">
                      {pattern.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-sm text-slate-400">{value}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {patterns.revenge > 60 && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
              <p className="text-sm text-red-300 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Pattern de revenge trading détecté!
              </p>
            </div>
          )}
        </div>

        {/* Simulateur Live */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-cyan-400" />
            SIMULATEUR LIVE
          </h3>
          
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Si vous tradez MAINTENANT:</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-400">Probabilité Win</div>
                  <div className="text-xl font-bold text-green-400">{opportunityLevel}%</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Risk/Reward</div>
                  <div className="text-xl font-bold text-blue-400">1:2.3</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Gain potentiel:</span>
                  <span className="text-green-400">+{formatCurrency(capital * 0.01 * 2.3)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Risque max:</span>
                  <span className="text-red-400">-{formatCurrency(capital * 0.01)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                VALIDER TRADE
              </button>
              <button className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors">
                SIMULER
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Métriques secondaires existantes */}
      {aiAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">Trades Restants</div>
              <button
                onClick={() => showInfo('tradesLeftBudget')}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-slate-500" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-200">{aiAnalysis.kpis.tradesLeftBudget}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">Jours Restants</div>
              <button
                onClick={() => showInfo('daysToTarget')}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-slate-500" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-200">{aiAnalysis.kpis.daysToTarget}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">Win Rate Requis</div>
              <button
                onClick={() => showInfo('winRateRequired')}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-slate-500" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-200">{aiAnalysis.kpis.winRateRequired}</div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-400">Capital à Risque</div>
              <button
                onClick={() => showInfo('capitalAtRisk')}
                className="p-1 hover:bg-slate-700 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-slate-500" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-200">${aiAnalysis.kpis.capitalAtRisk}</div>
          </div>
        </div>
      )}

      {/* Directives Financières */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 backdrop-blur-sm p-6 rounded-xl border border-indigo-500/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-indigo-400" />
            📋 DIRECTIVES FINANCIÈRES IMMÉDIATES
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {aiAnalysis.financialDirectives.map((directive, index) => (
              <div key={index} className="bg-black/30 p-4 rounded-lg border border-indigo-500/20">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="text-sm text-indigo-200">{directive}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment de Risque & Stratégie */}
      {aiAnalysis && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`p-6 rounded-xl border-2 ${
            aiAnalysis.riskAssessment.level === 'EXTREME' ? 'bg-red-900/20 border-red-500' :
            aiAnalysis.riskAssessment.level === 'HIGH' ? 'bg-orange-900/20 border-orange-500' :
            aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-900/20 border-yellow-500' :
            'bg-green-900/20 border-green-500'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${
              aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-400' :
              aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-400' :
              aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-400' :
              'text-green-400'
            }`}>
              <AlertTriangle className="w-5 h-5 mr-2" />
              🎯 ASSESSMENT RISQUE
            </h3>
            <div className={`text-2xl font-bold mb-2 ${
              aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-300' :
              aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-300' :
              aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-300' :
              'text-green-300'
            }`}>
              {aiAnalysis.riskAssessment.level}
            </div>
            <div className={`text-sm mb-3 ${
              aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-200' :
              aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-200' :
              aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-200' :
              'text-green-200'
            }`}>
              {aiAnalysis.riskAssessment.recommendation}
            </div>
            <div className="space-y-1">
              {aiAnalysis.riskAssessment.factors.map((factor, index) => (
                <div key={index} className={`text-xs flex items-center space-x-2 ${
                  aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-300' :
                  aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-300' :
                  aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-300' :
                  'text-green-300'
                }`}>
                  <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 p-6 rounded-xl border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <LineChart className="w-5 h-5 mr-2 text-purple-400" />
              🎯 STRATÉGIE MARCHÉ
            </h3>
            <div className={`text-2xl font-bold mb-2 ${
              aiAnalysis.marketStrategy.approach === 'AGGRESSIVE' ? 'text-red-400' :
              aiAnalysis.marketStrategy.approach === 'BALANCED' ? 'text-blue-400' :
              aiAnalysis.marketStrategy.approach === 'CONSERVATIVE' ? 'text-green-400' :
              'text-orange-400'
            }`}>
              {aiAnalysis.marketStrategy.approach}
            </div>
            <div className="text-sm text-slate-300 mb-3">{aiAnalysis.marketStrategy.reasoning}</div>
            <div className="bg-purple-800/30 border border-purple-400/30 rounded-lg p-3">
              <div className="text-sm font-medium text-purple-300">PROCHAINE ACTION :</div>
              <div className="text-sm text-purple-200 mt-1">{aiAnalysis.marketStrategy.nextAction}</div>
            </div>
          </div>
        </div>
      )}

      {/* État inactif */}
      {!aiAnalysis && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-12 text-center border border-slate-700">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-4">Cockpit IA en Attente</h3>
          <p className="text-slate-400 mb-8 max-w-2xl mx-auto">
            Activez l'analyse temps réel pour obtenir des insights de trading avancés et des recommandations basées sur l'IA.
          </p>
          
          {!anthropicApiKey && !openaiApiKey && (
            <div className="bg-gradient-to-r from-blue-900/50 to-indigo-900/50 p-6 rounded-lg border border-blue-500/20 mb-8 max-w-2xl mx-auto">
              <h4 className="font-semibold text-blue-300 mb-3 flex items-center justify-center">
                <Lock className="w-5 h-5 mr-2" />
                🔑 Configuration API Recommandée
              </h4>
              <div className="text-sm text-blue-200 space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Allez dans <strong>Paramètres</strong> pour ajouter votre clé API</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Obtenez votre clé sur <strong>console.anthropic.com</strong> ou <strong>platform.openai.com</strong></span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span>Analyses illimitées avec votre propre compte</span>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={performFinancialDirectorAnalysis}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold rounded-xl hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            DÉMARRER L'ANALYSE
          </button>

          <div className="bg-gradient-to-r from-slate-700/50 to-slate-800/50 p-6 rounded-lg max-w-3xl mx-auto mt-8">
            <h4 className="font-semibold text-slate-200 mb-4">🎯 Votre Cockpit IA analysera :</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-slate-300">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Niveau de danger en temps réel</span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span>Opportunités de marché</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Timing optimal de trading</span>
              </div>
              <div className="flex items-center space-x-2">
                <Radar className="w-4 h-4 text-purple-400" />
                <span>Détection de patterns</span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Simulation en direct</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-orange-400" />
                <span>Protection du capital</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'information (réutilisée du composant original) */}
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