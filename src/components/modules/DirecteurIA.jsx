import React, { useState, useEffect } from 'react';
import { 
  Brain, Zap, AlertTriangle, Target, TrendingUp, Shield,
  Cpu, LineChart, Lock, DollarSign, Info, X, Activity,
  Gauge, Clock, AlertCircle, CheckCircle, TrendingDown,
  BarChart3, Radar, HelpCircle
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
  capital,
  journalData,
  monthlyObjective,
  weeklyObjective
}) => {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoContent, setInfoContent] = useState({ title: '', description: '' });

  // Utiliser les vraies données de la plateforme
  const realCapital = capital || 50000;
  const realStats = stats || {
    winRate: 0,
    profitFactor: 1,
    totalTrades: 0,
    consecutiveLosses: 0,
    consecutiveWins: 0,
    totalPnL: 0
  };

  // Calcul du niveau de danger basé sur les vraies données
  const calculateDangerLevel = () => {
    let danger = 20; // Base

    // Drawdown actuel
    const currentDrawdown = realCapital > 0 ? ((realCapital - (realCapital + realStats.totalPnL)) / realCapital) * 100 : 0;
    if (currentDrawdown > 10) danger += 40;
    else if (currentDrawdown > 5) danger += 25;
    else if (currentDrawdown > 3) danger += 15;

    // Pertes consécutives
    if (realStats.consecutiveLosses >= 3) danger += 30;
    else if (realStats.consecutiveLosses >= 2) danger += 20;
    else if (realStats.consecutiveLosses >= 1) danger += 10;

    // Win rate faible
    if (realStats.winRate < 30) danger += 20;
    else if (realStats.winRate < 40) danger += 10;

    // Overtrading
    const today = new Date();
    const todayTrades = journalData ? Object.entries(journalData).filter(([dateKey, entry]) => {
      const entryDate = new Date(dateKey);
      return entryDate.toDateString() === today.toDateString() && entry.hasTraded;
    }).length : 0;
    
    if (todayTrades > 5) danger += 20;
    else if (todayTrades > 3) danger += 10;

    return Math.min(100, Math.max(0, danger));
  };

  // Calcul de l'opportunité basé sur les vraies données
  const calculateOpportunity = () => {
    let opportunity = 50; // Base neutre

    // Win rate élevé
    if (realStats.winRate > 60) opportunity += 20;
    else if (realStats.winRate > 50) opportunity += 10;

    // Profit factor
    if (realStats.profitFactor > 2) opportunity += 20;
    else if (realStats.profitFactor > 1.5) opportunity += 10;

    // Gains consécutifs
    if (realStats.consecutiveWins >= 3) opportunity += 15;
    else if (realStats.consecutiveWins >= 2) opportunity += 10;

    // Performance mensuelle
    const monthProgress = monthlyObjective?.current || 0;
    const monthTarget = monthlyObjective?.target || 8;
    if (monthProgress > monthTarget) opportunity += 15;
    else if (monthProgress > monthTarget * 0.5) opportunity += 10;

    return Math.min(100, Math.max(0, opportunity));
  };

  // Détection des patterns basée sur les vraies données
  const detectPatterns = () => {
    const patterns = {
      revenge: 0,
      overtrading: 0,
      fomo: 0,
      discipline: 100,
      patience: 100
    };

    // Revenge trading
    if (realStats.consecutiveLosses >= 3) {
      patterns.revenge = 80;
      patterns.discipline -= 40;
    } else if (realStats.consecutiveLosses >= 2) {
      patterns.revenge = 50;
      patterns.discipline -= 20;
    }

    // Overtrading
    const today = new Date();
    const todayTrades = journalData ? Object.entries(journalData).filter(([dateKey, entry]) => {
      const entryDate = new Date(dateKey);
      return entryDate.toDateString() === today.toDateString() && entry.hasTraded;
    }).length : 0;

    if (todayTrades > 5) {
      patterns.overtrading = 90;
      patterns.patience -= 50;
    } else if (todayTrades > 3) {
      patterns.overtrading = 60;
      patterns.patience -= 30;
    }

    // FOMO - Corriger la logique : ne détecter que si on a VRAIMENT tradé hors heures
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const totalMinutes = hour * 60 + minute;
    const optimalStart = 15 * 60 + 30; // 15h30
    const optimalEnd = 17 * 60 + 30; // 17h30

    // Vérifier si on a des trades aujourd'hui EN DEHORS des heures optimales
    const tradesOutsideHours = journalData ? Object.entries(journalData).filter(([dateKey, entry]) => {
      const entryDate = new Date(dateKey);
      if (entryDate.toDateString() !== today.toDateString() || !entry.hasTraded) return false;
      
      // Si on a des trades aujourd'hui, vérifier l'heure actuelle
      return totalMinutes < optimalStart || totalMinutes > optimalEnd;
    }).length : 0;

    if (tradesOutsideHours > 0) {
      patterns.fomo = 70;
      patterns.discipline -= 30;
    }

    return patterns;
  };

  const patterns = detectPatterns();
  const dangerLevel = calculateDangerLevel();
  const opportunityLevel = calculateOpportunity();

  // Déterminer l'état du timing pour Paris (15h30-17h30)
  const getTimingStatus = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;
    
    // Heures de trading Paris
    const marketOpen = 15 * 60 + 30; // 15h30
    const marketClose = 17 * 60 + 30; // 17h30
    
    if (totalMinutes >= marketOpen && totalMinutes <= marketClose) {
      return { status: 'OPTIMAL', color: 'text-green-400', icon: '▲', bg: 'bg-green-500/20' };
    } else if (totalMinutes >= marketOpen - 30 && totalMinutes < marketOpen) {
      return { status: 'PRÉPARATION', color: 'text-yellow-400', icon: '●', bg: 'bg-yellow-500/20' };
    } else if (totalMinutes > marketClose && totalMinutes <= marketClose + 30) {
      return { status: 'CLÔTURE', color: 'text-orange-400', icon: '▼', bg: 'bg-orange-500/20' };
    } else {
      return { status: 'FERMÉ', color: 'text-red-400', icon: '■', bg: 'bg-red-500/20' };
    }
  };

  const timing = getTimingStatus();
  const currentTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Explications pour le cockpit
  const cockpitExplanations = {
    danger: {
      title: "Niveau de Danger",
      description: "🎯 Cette jauge mesure votre niveau de risque actuel basé sur :\n\n• **Drawdown** : Perte depuis votre pic de capital\n• **Pertes consécutives** : Impact psychologique des pertes\n• **Win rate** : Taux de réussite actuel\n• **Overtrading** : Nombre de trades aujourd'hui\n\n📊 **Interprétation** :\n• 0-30% (VERT) : Zone sûre, tradez normalement\n• 30-60% (JAUNE) : Prudence requise, réduisez les positions\n• 60-100% (ROUGE) : Danger critique, envisagez une pause"
    },
    opportunity: {
      title: "Opportunité Marché",
      description: "📈 Cette jauge évalue vos chances de succès basées sur :\n\n• **Performance actuelle** : Win rate et profit factor\n• **Momentum** : Gains consécutifs\n• **Progression objectifs** : Vs. cibles mensuelles\n• **Conditions marché** : Volatilité et tendances\n\n💡 **Interprétation** :\n• 0-40% (GRIS) : Conditions défavorables, soyez sélectif\n• 40-70% (BLEU) : Conditions neutres, trading normal\n• 70-100% (VERT) : Conditions favorables, saisissez les opportunités"
    },
    timing: {
      title: "Timing Marché Paris",
      description: "⏰ Indicateur des heures de trading optimales (15h30-17h30 Paris) :\n\n• **OPTIMAL** (15h30-17h30) : Meilleure liquidité et volatilité\n• **PRÉPARATION** (15h00-15h30) : Préparez vos setups\n• **CLÔTURE** (17h30-18h00) : Fermez les positions\n• **FERMÉ** : Marché fermé, évitez de trader\n\n🌍 **Pourquoi ces heures ?**\n• Chevauchement Europe/USA\n• Volume maximum\n• Mouvements plus prévisibles\n• Spreads réduits"
    },
    patternRadar: {
      title: "Pattern Radar Comportemental",
      description: "🧠 Détection automatique de vos patterns de trading :\n\n**Patterns Négatifs** (à éviter) :\n• **Revenge Trading** : Tentative de récupérer les pertes rapidement\n• **Overtrading** : Trop de trades dans une journée\n• **FOMO** : Trading en dehors des heures optimales\n\n**Patterns Positifs** (à maintenir) :\n• **Discipline** : Respect des règles de trading\n• **Patience** : Attente des bons setups\n\n📊 **Comment lire** :\n• Barres ROUGES sur patterns négatifs = Danger\n• Barres VERTES sur patterns positifs = Bon\n• Objectif : Minimiser les négatifs, maximiser les positifs"
    }
  };

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
      title: "Capital à Risque",
      description: "🛡️ C'est le pourcentage de votre capital total qui est actuellement exposé au risque.\n\n💡 **À quoi ça sert ?**\n• Vous montre votre exposition totale au risque\n• Vous aide à ne pas surexposer votre compte\n• Protection contre les pertes catastrophiques\n\n📊 **Comment l'utiliser ?**\n• Restez sous 2-3% pour un trading sécurisé\n• Si > 5%, vous êtes surexposé\n• Ajustez vos positions en conséquence\n\n⚠️ **Exemple** : Si vous avez 3 trades ouverts risquant chacun 1%, votre capital à risque est 3%."
    }
  };

  const showInfo = (type, category = 'kpi') => {
    const content = category === 'cockpit' ? cockpitExplanations[type] : kpiExplanations[type];
    setInfoContent(content);
    setShowInfoModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Cockpit - Design cohérent avec l'app */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center">
              <Brain className="w-8 h-8 mr-3 text-blue-600" />
              COCKPIT DE TRADING INTELLIGENT
            </h1>
            <p className="text-slate-500 mt-1">Centre de contrôle IA pour décisions optimales</p>
          </div>
          
          <button
            onClick={performFinancialDirectorAnalysis}
            disabled={isAnalyzing}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2"
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

        {/* Tableau de bord principal - 3 jauges avec meilleur agencement */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Jauge de Danger */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                NIVEAU DE DANGER
              </h3>
              <button
                onClick={() => showInfo('danger', 'cockpit')}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Comprendre cette métrique"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="relative h-40">
              <svg className="w-full h-full" viewBox="0 0 200 120">
                {/* Arc de fond */}
                <path
                  d="M 30 90 A 60 60 0 0 1 170 90"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                />
                {/* Arc de progression */}
                <path
                  d="M 30 90 A 60 60 0 0 1 170 90"
                  fill="none"
                  stroke={dangerLevel > 60 ? '#ef4444' : dangerLevel > 30 ? '#f59e0b' : '#10b981'}
                  strokeWidth="20"
                  strokeDasharray={`${dangerLevel * 1.41} 141`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Centre du cadran */}
                <circle cx="100" cy="90" r="8" fill="#1e293b" />
                {/* Aiguille */}
                <line
                  x1="100"
                  y1="90"
                  x2={100 + Math.cos((Math.PI - (dangerLevel * Math.PI / 100))) * 50}
                  y2={90 + Math.sin((Math.PI - (dangerLevel * Math.PI / 100))) * 50}
                  stroke="#1e293b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                {/* Marqueurs */}
                <text x="30" y="100" className="fill-slate-400 text-xs">0</text>
                <text x="100" y="25" className="fill-slate-400 text-xs" textAnchor="middle">50</text>
                <text x="170" y="100" className="fill-slate-400 text-xs" textAnchor="end">100</text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center mt-12">
                  <div className="text-4xl font-bold text-slate-900">{dangerLevel}%</div>
                  <div className={`text-sm font-medium mt-1 ${dangerLevel > 60 ? 'text-red-600' : dangerLevel > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {dangerLevel > 60 ? 'CRITIQUE' : dangerLevel > 30 ? 'ATTENTION' : 'SAFE'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Jauge d'Opportunité */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                OPPORTUNITÉ MARCHÉ
              </h3>
              <button
                onClick={() => showInfo('opportunity', 'cockpit')}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Comprendre cette métrique"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="relative h-40">
              <svg className="w-full h-full" viewBox="0 0 200 120">
                <path
                  d="M 30 90 A 60 60 0 0 1 170 90"
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="20"
                />
                <path
                  d="M 30 90 A 60 60 0 0 1 170 90"
                  fill="none"
                  stroke={opportunityLevel > 70 ? '#10b981' : opportunityLevel > 40 ? '#3b82f6' : '#6b7280'}
                  strokeWidth="20"
                  strokeDasharray={`${opportunityLevel * 1.41} 141`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <circle cx="100" cy="90" r="8" fill="#1e293b" />
                <line
                  x1="100"
                  y1="90"
                  x2={100 + Math.cos((Math.PI - (opportunityLevel * Math.PI / 100))) * 50}
                  y2={90 + Math.sin((Math.PI - (opportunityLevel * Math.PI / 100))) * 50}
                  stroke="#1e293b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <text x="30" y="100" className="fill-slate-400 text-xs">0</text>
                <text x="100" y="25" className="fill-slate-400 text-xs" textAnchor="middle">50</text>
                <text x="170" y="100" className="fill-slate-400 text-xs" textAnchor="end">100</text>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center mt-12">
                  <div className="text-4xl font-bold text-slate-900">{opportunityLevel}%</div>
                  <div className={`text-sm font-medium mt-1 ${opportunityLevel > 70 ? 'text-green-600' : opportunityLevel > 40 ? 'text-blue-600' : 'text-gray-600'}`}>
                    {opportunityLevel > 70 ? 'BULLISH' : opportunityLevel > 40 ? 'NEUTRE' : 'BEARISH'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Indicateur de Timing */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                TIMING MARCHÉ
              </h3>
              <button
                onClick={() => showInfo('timing', 'cockpit')}
                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                title="Comprendre cette métrique"
              >
                <HelpCircle className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center h-40">
              <div className="text-5xl font-bold text-slate-900 mb-3">{currentTime}</div>
              <div className={`px-6 py-3 rounded-full ${timing.bg} flex items-center space-x-3`}>
                <span className={`text-2xl ${timing.color}`}>{timing.icon}</span>
                <span className={`font-bold text-lg ${timing.color}`}>{timing.status}</span>
              </div>
              <div className="text-sm text-slate-500 mt-3">
                Zone optimale: 15h30-17h30
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs Existants - Style cohérent */}
      {aiAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase">PERTE MAX</h4>
              <button
                onClick={() => showInfo('maxLossToday')}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="text-2xl font-bold text-red-600">${formatNumber(parseFloat(aiAnalysis.kpis.maxLossToday.replace(/[\$,]/g, '')))}</div>
            <div className="text-xs text-slate-500">Limite journalière</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase">RISQUE OPTIMAL</h4>
              <button
                onClick={() => showInfo('optimalRiskPerTrade')}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="text-2xl font-bold text-blue-600">${formatNumber(parseFloat(aiAnalysis.kpis.optimalRiskPerTrade.replace(/[\$,]/g, '')))}</div>
            <div className="text-xs text-slate-500">Par trade</div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase">GAIN REQUIS</h4>
              <button
                onClick={() => showInfo('minDailyGainRequired')}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="text-2xl font-bold text-green-600">${formatNumber(parseFloat(aiAnalysis.kpis.minDailyGainRequired.replace(/[\$,]/g, '')))}</div>
            <div className="text-xs text-slate-500">Par jour</div>
          </div>

          <div className={`bg-white rounded-xl p-4 border shadow-sm ${
            aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'border-red-500' :
            aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'border-orange-500' :
            'border-green-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase">DRAWDOWN</h4>
              <button
                onClick={() => showInfo('drawdownStatus')}
                className="p-1 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className={`text-2xl font-bold ${
              aiAnalysis.kpis.drawdownStatus === 'CRITICAL' ? 'text-red-600' :
              aiAnalysis.kpis.drawdownStatus === 'WARNING' ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {aiAnalysis.kpis.drawdownStatus}
            </div>
            <div className="text-xs text-slate-500">Protection</div>
          </div>
        </div>
      )}

      {/* Pattern Radar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center">
            <Radar className="w-5 h-5 mr-2 text-purple-600" />
            PATTERN RADAR
          </h3>
          <button
            onClick={() => showInfo('patternRadar', 'cockpit')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Comprendre les patterns"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        
        <div className="space-y-4">
          {Object.entries(patterns).map(([pattern, value]) => {
            const isNegative = ['revenge', 'overtrading', 'fomo'].includes(pattern);
            const color = isNegative 
              ? value > 60 ? 'bg-red-500' : value > 30 ? 'bg-orange-500' : 'bg-green-500'
              : value > 60 ? 'bg-green-500' : value > 30 ? 'bg-orange-500' : 'bg-red-500';
            
            return (
              <div key={pattern} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-700 capitalize">
                    {pattern.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">{value}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
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
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 flex items-center font-medium">
              <AlertCircle className="w-4 h-4 mr-2" />
              Pattern de revenge trading détecté! Faites une pause.
            </p>
          </div>
        )}
      </div>

      {/* Métriques secondaires existantes */}
      {aiAnalysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">Trades Restants</div>
              <button
                onClick={() => showInfo('tradesLeftBudget')}
                className="p-0.5 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {typeof aiAnalysis.kpis.tradesLeftBudget === 'string' && aiAnalysis.kpis.tradesLeftBudget.includes('(') 
                ? aiAnalysis.kpis.tradesLeftBudget.split(' ')[0]
                : aiAnalysis.kpis.tradesLeftBudget}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">Jours Restants</div>
              <button
                onClick={() => showInfo('daysToTarget')}
                className="p-0.5 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-900">{aiAnalysis.kpis.daysToTarget}</div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">Win Rate Requis</div>
              <button
                onClick={() => showInfo('winRateRequired')}
                className="p-0.5 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {typeof aiAnalysis.kpis.winRateRequired === 'string' && aiAnalysis.kpis.winRateRequired.includes('(')
                ? aiAnalysis.kpis.winRateRequired.split(' ')[0]
                : aiAnalysis.kpis.winRateRequired}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-slate-600">Capital à Risque</div>
              <button
                onClick={() => showInfo('capitalAtRisk')}
                className="p-0.5 hover:bg-slate-100 rounded transition-colors"
              >
                <Info className="w-3 h-3 text-slate-400" />
              </button>
            </div>
            <div className="text-lg font-bold text-slate-900">
              {typeof aiAnalysis.kpis.capitalAtRisk === 'string' 
                ? aiAnalysis.kpis.capitalAtRisk.replace(/\$/, '')
                : aiAnalysis.kpis.capitalAtRisk}
            </div>
          </div>
        </div>
      )}

      {/* Assessment de Risque & Stratégie */}
      {aiAnalysis && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className={`bg-white p-6 rounded-xl border-2 shadow-sm ${
            aiAnalysis.riskAssessment.level === 'EXTREME' ? 'border-red-500 bg-red-50' :
            aiAnalysis.riskAssessment.level === 'HIGH' ? 'border-orange-500 bg-orange-50' :
            aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'border-yellow-500 bg-yellow-50' :
            'border-green-500 bg-green-50'
          }`}>
            <h3 className={`text-lg font-bold mb-4 flex items-center ${
              aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-700' :
              aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-700' :
              aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-700' :
              'text-green-700'
            }`}>
              <AlertTriangle className="w-5 h-5 mr-2" />
              🎯 ASSESSMENT RISQUE
            </h3>
            <div className={`text-2xl font-bold mb-2 ${
              aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-600' :
              aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-600' :
              aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {aiAnalysis.riskAssessment.level}
            </div>
            <div className={`text-sm mb-4 ${
              aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-700' :
              aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-700' :
              aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-700' :
              'text-green-700'
            }`}>
              {aiAnalysis.riskAssessment.recommendation}
            </div>
            <div className="space-y-2">
              {aiAnalysis.riskAssessment.factors.map((factor, index) => (
                <div key={index} className={`text-sm flex items-center space-x-2 ${
                  aiAnalysis.riskAssessment.level === 'EXTREME' ? 'text-red-600' :
                  aiAnalysis.riskAssessment.level === 'HIGH' ? 'text-orange-600' :
                  aiAnalysis.riskAssessment.level === 'MEDIUM' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center">
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
            <div className="text-sm text-slate-700 mb-4">{aiAnalysis.marketStrategy.reasoning}</div>
            <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
              <div className="text-sm font-semibold text-purple-900 mb-1">PROCHAINE ACTION :</div>
              <div className="text-sm text-purple-800">{aiAnalysis.marketStrategy.nextAction}</div>
            </div>
          </div>
        </div>
      )}

      {/* État inactif */}
      {!aiAnalysis && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">Cockpit IA en Attente</h3>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            Activez l'analyse temps réel pour obtenir des insights de trading avancés basés sur vos données réelles.
          </p>
          
          {!anthropicApiKey && !openaiApiKey && (
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-8 max-w-xl mx-auto">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center justify-center">
                <Lock className="w-5 h-5 mr-2" />
                Configuration API Requise
              </h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>• Allez dans Paramètres pour ajouter votre clé API</p>
                <p>• Anthropic ou OpenAI supportés</p>
              </div>
            </div>
          )}

          <button
            onClick={performFinancialDirectorAnalysis}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            DÉMARRER L'ANALYSE
          </button>
        </div>
      )}

      {/* Modal d'information */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 flex items-center">
                <Info className="w-6 h-6 mr-2 text-blue-600" />
                {infoContent.title}
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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