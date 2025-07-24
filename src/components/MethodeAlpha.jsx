import React, { useState, useEffect } from 'react';
import { 
  Calculator, TrendingUp, AlertTriangle, DollarSign, Target, 
  TrendingDown, Calendar, Brain, Shield, BarChart3, PieChart,
  Settings, Bell, User, Menu, X, Activity, Zap, Eye, Lock, CheckCircle, AlertCircle,
  Cpu, Bot, LineChart, Flame, Skull
} from 'lucide-react';

// Import des modules
import Dashboard from './modules/Dashboard';
import Journal from './modules/Journal';
import CalculatorModule from './modules/Calculator';
import DirecteurIA from './modules/DirecteurIA';
import SettingsModule from './modules/Settings';

const MethodeAlpha = () => {
  // États existants
  const [capital, setCapital] = useState('');
  const [riskPerTrade, setRiskPerTrade] = useState(1);
  const [dailyLossMax, setDailyLossMax] = useState(3);
  const [stopLossTicks, setStopLossTicks] = useState('');
  const [results, setResults] = useState(null);

  // États pour le suivi
  const [initialCapital, setInitialCapital] = useState('');
  const [currentBalance, setCurrentBalance] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState(2);
  const [monthlyTarget, setMonthlyTarget] = useState(8);
  const [recommendations, setRecommendations] = useState(null);

  // États UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [secureMode, setSecureMode] = useState(false);

  // États Journal de Trading
  const [tradingJournal, setTradingJournal] = useState({});
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayData, setDayData] = useState({ pnl: '', notes: '', hasTraded: true });

  // NOUVEAUX États pour IA et Protection
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drawdownProtection, setDrawdownProtection] = useState(null);
  const [monthlyPeak, setMonthlyPeak] = useState(0);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  
  // NOUVEAU : État pour les recommandations IA qui seront utilisées par le calculateur
  const [aiRecommendedRisk, setAiRecommendedRisk] = useState(null);
  const [aiMaxDailyLoss, setAiMaxDailyLoss] = useState(null);

  const contracts = {
    MNQ: {
      name: 'Micro E-mini Nasdaq (MNQ)',
      margin: 50,
      tickValue: 0.50,
      tickSize: 0.25,
      description: '1/10ème du NQ standard',
      multiplier: 2,
      category: 'nasdaq'
    },
    NQ: {
      name: 'E-mini Nasdaq (NQ)',
      margin: 1000,
      tickValue: 5.00,
      tickSize: 0.25,
      description: 'Contrat standard Nasdaq',
      multiplier: 20,
      category: 'nasdaq'
    }
  };

  // Calcul du capital actuel basé sur le journal
  const calculateCurrentBalanceFromJournal = () => {
    const initialCapitalNum = parseFloat(initialCapital);
    if (!initialCapitalNum) return null;
    
    const totalPnL = Object.values(tradingJournal).reduce((sum, day) => {
      if (day.hasTraded && day.pnl) {
        return sum + parseFloat(day.pnl);
      }
      return sum;
    }, 0);
    
    return parseFloat((initialCapitalNum + totalPnL).toFixed(2));
  };

  // NOUVEAU : Calcul du Drawdown Dynamique
  const calculateDrawdownProtection = () => {
    const calculatedBalance = calculateCurrentBalanceFromJournal();
    const currentBalanceNum = calculatedBalance || parseFloat(currentBalance);
    const initialCapitalNum = parseFloat(initialCapital);
    
    if (!currentBalanceNum || !initialCapitalNum) return null;

    // Calcul du pic mensuel (plus haut capital ce mois-ci)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    let monthlyPeakValue = initialCapitalNum;
    let peakDate = null;
    
    // Calculer le capital jour par jour ce mois-ci
    const sortedEntries = Object.entries(tradingJournal)
      .filter(([dateKey, dayData]) => {
        const tradeDate = new Date(dateKey);
        return tradeDate >= firstDayOfMonth && dayData.hasTraded;
      })
      .sort(([a], [b]) => new Date(a) - new Date(b));
    
    let runningBalance = initialCapitalNum;
    
    // Recalculer le capital à chaque jour pour trouver le pic
    const dailyBalances = [];
    for (const [dateKey, dayData] of sortedEntries) {
      if (dayData.pnl) {
        runningBalance += parseFloat(dayData.pnl);
        dailyBalances.push({ date: dateKey, balance: runningBalance });
        
        if (runningBalance > monthlyPeakValue) {
          monthlyPeakValue = runningBalance;
          peakDate = dateKey;
        }
      }
    }

    const drawdownAmount = monthlyPeakValue - currentBalanceNum;
    const drawdownPercent = (drawdownAmount / monthlyPeakValue) * 100;
    
    // Seuils de protection dynamiques
    let protectionLevel = 'safe';
    let riskMultiplier = 1;
    let alert = null;
    
    if (drawdownPercent >= 8) {
      protectionLevel = 'emergency';
      riskMultiplier = 0.2;
      alert = {
        type: 'error',
        title: '🚨 ALERTE ROUGE - Mode Survie',
        message: 'Drawdown critique ! Réduction risque à 20%. Arrêt trading recommandé.',
        color: 'red'
      };
    } else if (drawdownPercent >= 5) {
      protectionLevel = 'danger';
      riskMultiplier = 0.3;
      alert = {
        type: 'warning',
        title: '⚠️ ALERTE ORANGE - Drawdown Élevé',
        message: 'Protection activée. Risque réduit à 30%. Trading défensif requis.',
        color: 'orange'
      };
    } else if (drawdownPercent >= 3) {
      protectionLevel = 'warning';
      riskMultiplier = 0.6;
      alert = {
        type: 'caution',
        title: '🟡 Attention - Drawdown Modéré',
        message: 'Vigilance requise. Risque réduit à 60%. Soyez sélectif.',
        color: 'yellow'
      };
    } else if (drawdownPercent >= 1.5) {
      protectionLevel = 'caution';
      riskMultiplier = 0.8;
      alert = {
        type: 'info',
        title: '🔵 Surveillance - Léger Drawdown',
        message: 'Drawdown détecté. Risque réduit à 80%. Restez discipliné.',
        color: 'blue'
      };
    }

    return {
      monthlyPeak: monthlyPeakValue,
      peakDate,
      currentBalance: currentBalanceNum,
      drawdownAmount,
      drawdownPercent,
      protectionLevel,
      riskMultiplier,
      alert,
      daysInDrawdown: peakDate ? Math.floor((new Date() - new Date(peakDate)) / (1000 * 60 * 60 * 24)) : 0
    };
  };

  // NOUVEAU : Analyse IA comme Directeur Financier
  const performFinancialDirectorAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const calculatedBalance = calculateCurrentBalanceFromJournal();
      const currentBalanceNum = calculatedBalance || parseFloat(currentBalance);
      const initialCapitalNum = parseFloat(initialCapital);
      const drawdown = calculateDrawdownProtection();
      const stats = getJournalStats();
      const smartRec = calculateSmartRecommendations();
      
      // Calculs KPIs temps réel
      const today = new Date();
      const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
      const currentMonthlyReturn = ((currentBalanceNum - initialCapitalNum) / initialCapitalNum) * 100;
      const requiredGainToTarget = ((monthlyTarget - currentMonthlyReturn) / 100) * initialCapitalNum;
      
      // Vérifier si l'objectif mensuel est atteint
      const monthlyObjectiveAchieved = currentMonthlyReturn >= monthlyTarget;
      
      // Ajuster les recommandations en fonction des objectifs
      let adjustedRiskPercent = riskPerTrade;
      let adjustedMaxDailyLoss = dailyLossMax;
      
      if (monthlyObjectiveAchieved) {
        adjustedRiskPercent = 0.2; // Mode protection capital
        adjustedMaxDailyLoss = 0.5; // Limite très basse
      } else if (drawdown?.protectionLevel === 'emergency') {
        adjustedRiskPercent = 0.2;
        adjustedMaxDailyLoss = 1;
      } else if (drawdown?.protectionLevel === 'danger') {
        adjustedRiskPercent = riskPerTrade * 0.3;
        adjustedMaxDailyLoss = dailyLossMax * 0.5;
      } else if (smartRec?.riskAdjustment) {
        adjustedRiskPercent = riskPerTrade * smartRec.riskAdjustment;
      }
      
      const maxLossAllowed = currentBalanceNum * (adjustedMaxDailyLoss / 100);
      const optimalRiskPerTrade = currentBalanceNum * (adjustedRiskPercent / 100);
      
      // Données pour l'IA Directeur Financier
      const financialData = {
        // Capital et Performance
        initialCapital: initialCapitalNum,
        currentCapital: currentBalanceNum,
        totalReturn: currentMonthlyReturn,
        targetReturn: monthlyTarget,
        gapToTarget: requiredGainToTarget,
        monthlyObjectiveAchieved: monthlyObjectiveAchieved,
        weeklyObjectiveAchieved: smartRec?.status === 'weekly_achieved',
        
        // Temporal Analysis
        daysLeftInMonth: daysLeftInMonth,
        tradingDaysLeft: Math.floor(daysLeftInMonth * 0.71), // Environ 5/7 jours sont trading
        
        // Risk Metrics
        currentDrawdown: drawdown?.drawdownPercent || 0,
        maxDrawdownAllowed: 8, // Seuil critique
        maxDailyLoss: maxLossAllowed,
        currentRiskPerTrade: optimalRiskPerTrade,
        adjustedRiskPercent: adjustedRiskPercent,
        adjustedMaxDailyLoss: adjustedMaxDailyLoss,
        
        // Performance Metrics
        winRate: stats.winRate,
        profitFactor: stats.profitFactor,
        avgWin: stats.avgWin,
        avgLoss: stats.avgLoss,
        consecutiveLosses: stats.consecutiveLosses,
        totalTrades: stats.totalTrades,
        
        // Market Context
        volatilityLevel: stats.consecutiveLosses >= 2 ? "HIGH" : stats.winRate >= 60 ? "LOW" : "MEDIUM",
        tradingEfficiency: stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) : 0,
        protectionLevel: drawdown?.protectionLevel || 'safe'
      };

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(anthropicApiKey && { "x-api-key": anthropicApiKey }),
          ...(anthropicApiKey && { "anthropic-version": "2023-06-01" })
        },
        body: JSON.stringify({
          model: "claude-3-sonnet-20240229",
          max_tokens: 2000,
          messages: [
            { 
              role: "user", 
              content: `Tu es un DIRECTEUR FINANCIER expert des marchés. Analyse ces données et fournis des KPIs DECISIONNELS pour un trader professionnel.

DONNÉES FINANCIÈRES:
${JSON.stringify(financialData, null, 2)}

CONTEXTE CRITIQUE:
- ${monthlyObjectiveAchieved ? "🏆 OBJECTIF MENSUEL DÉJÀ ATTEINT - MODE PROTECTION CAPITAL OBLIGATOIRE" : "Objectif mensuel en cours"}
- ${smartRec?.status === 'weekly_achieved' ? "✅ Objectif hebdomadaire atteint" : "Objectif hebdomadaire en cours"}
- Protection drawdown: ${drawdown?.protectionLevel || 'normale'}

RÈGLES ABSOLUES:
1. Si objectif mensuel atteint → Risque MAX 0.2% et perte journalière MAX 0.5%
2. Si drawdown critique → Mode survie avec risque minimal
3. Toujours privilégier la protection du capital acquis

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "executiveSummary": {
    "status": "SAFE|CAUTION|DANGER|CRITICAL",
    "headline": "Titre exécutif en 1 phrase",
    "priority": "Action prioritaire immédiate"
  },
  "kpis": {
    "maxLossToday": "Perte max autorisée aujourd'hui en $",
    "optimalRiskPerTrade": "Risque optimal par trade en $",
    "minDailyGainRequired": "Gain minimum requis par jour en $",
    "drawdownStatus": "État du drawdown (OK/WARNING/CRITICAL)",
    "tradesLeftBudget": "Nombre de trades restants dans budget risque",
    "daysToTarget": "Jours restants pour atteindre objectif",
    "winRateRequired": "Win rate requis pour objectif (%)",
    "capitalAtRisk": "Capital total exposé au risque (%)"
  },
  "financialDirectives": [
    "Directive 1 - Action concrète",
    "Directive 2 - Action concrète", 
    "Directive 3 - Action concrète"
  ],
  "riskAssessment": {
    "level": "LOW|MEDIUM|HIGH|EXTREME",
    "factors": ["Facteur risque 1", "Facteur risque 2"],
    "recommendation": "Recommandation de gestion de risque"
  },
  "marketStrategy": {
    "approach": "AGGRESSIVE|BALANCED|CONSERVATIVE|DEFENSIVE",
    "reasoning": "Raison de cette approche",
    "nextAction": "Prochaine action recommandée"
  }
}

IMPORTANT: Réponse UNIQUEMENT en JSON valide, analyse comme un vrai directeur financier de trading floor.`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      let responseText = data.content[0].text;
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const analysis = JSON.parse(responseText);
      setAiAnalysis(analysis);
      
      // Stocker les recommandations pour le calculateur
      if (analysis.kpis) {
        const recommendedRisk = parseFloat(analysis.kpis.optimalRiskPerTrade.replace('$', ''));
        const recommendedMaxLoss = parseFloat(analysis.kpis.maxLossToday.replace('$', ''));
        
        // Calculer le pourcentage de risque recommandé
        const riskPercent = (recommendedRisk / currentBalanceNum) * 100;
        const maxLossPercent = (recommendedMaxLoss / currentBalanceNum) * 100;
        
        setAiRecommendedRisk(riskPercent);
        setAiMaxDailyLoss(maxLossPercent);
      }
      
    } catch (error) {
      console.error("Erreur analyse Directeur Financier:", error);
      
      // Fallback avec calculs locaux
      const calculatedBalance = calculateCurrentBalanceFromJournal();
      const currentBalanceNum = calculatedBalance || parseFloat(currentBalance);
      const today = new Date();
      const daysLeftInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
      const currentReturn = ((currentBalanceNum - parseFloat(initialCapital)) / parseFloat(initialCapital)) * 100;
      const requiredGain = ((monthlyTarget - currentReturn) / 100) * parseFloat(initialCapital);
      const drawdown = calculateDrawdownProtection();
      const stats = getJournalStats();
      
      setAiAnalysis({
        executiveSummary: {
          status: drawdown?.protectionLevel === 'emergency' ? "CRITICAL" : 
                  drawdown?.protectionLevel === 'danger' ? "DANGER" : 
                  currentReturn >= monthlyTarget ? "SAFE" : "CAUTION",
          headline: error.message.includes('API') ? 
            "❌ Analyse IA indisponible - KPIs calculés localement" : 
            `Capital: ${currentBalanceNum.toFixed(2)} | Objectif: ${currentReturn >= 0 ? 'En cours' : 'À rattraper'}`,
          priority: drawdown?.protectionLevel === 'emergency' ? "ARRÊT IMMÉDIAT DU TRADING" :
                   stats.consecutiveLosses >= 3 ? "PAUSE ET ANALYSE REQUISE" :
                   "CONTINUER SELON PLAN"
        },
        kpis: {
          maxLossToday: `${(currentBalanceNum * dailyLossMax / 100).toFixed(2)}`,
          optimalRiskPerTrade: `${(currentBalanceNum * riskPerTrade / 100).toFixed(2)}`,
          minDailyGainRequired: daysLeftInMonth > 0 ? `${(requiredGain / daysLeftInMonth).toFixed(2)}` : "$0",
          drawdownStatus: drawdown?.protectionLevel || "OK",
          tradesLeftBudget: Math.floor((currentBalanceNum * dailyLossMax / 100) / (currentBalanceNum * riskPerTrade / 100)),
          daysToTarget: daysLeftInMonth,
          winRateRequired: "Calcul indisponible (IA offline)",
          capitalAtRisk: `${((currentBalanceNum * riskPerTrade / 100) / currentBalanceNum * 100).toFixed(1)}%`
        },
        financialDirectives: [
          "Vérifiez votre clé API Anthropic pour l'analyse complète",
          "Suivez les alertes de protection drawdown",
          "Respectez strictement les limites de risque configurées"
        ],
        riskAssessment: {
          level: drawdown?.protectionLevel === 'emergency' ? "EXTREME" : 
                 drawdown?.protectionLevel === 'danger' ? "HIGH" : "MEDIUM",
          factors: ["Service IA temporairement indisponible", "Calculs basés sur données locales"],
          recommendation: "Activez l'IA pour une analyse complète"
        },
        marketStrategy: {
          approach: currentReturn >= monthlyTarget ? "DEFENSIVE" : "BALANCED",
          reasoning: "Mode conservateur en attendant l'analyse IA complète",
          nextAction: "Configurez l'API Claude pour analyse temps réel"
        }
      });
      
      // Stocker les recommandations même en cas d'erreur
      setAiRecommendedRisk(adjustedRiskPercent);
      setAiMaxDailyLoss(adjustedMaxDailyLoss);
      
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Fonctions existantes pour le calendrier
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return firstDay === 0 ? 7 : firstDay;
  };

  const getDateKey = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getDayStatus = (dateKey) => {
    const dayData = tradingJournal[dateKey];
    if (!dayData) return 'no-data';
    if (!dayData.hasTraded) return 'no-trade';
    const pnl = parseFloat(dayData.pnl) || 0;
    return pnl > 0 ? 'profit' : pnl < 0 ? 'loss' : 'breakeven';
  };

  const handleDayClick = (year, month, day) => {
    const dateKey = getDateKey(year, month, day);
    const existingData = tradingJournal[dateKey] || { pnl: '', notes: '', hasTraded: true };
    setSelectedDate({ year, month, day, dateKey });
    setDayData(existingData);
    setShowDayModal(true);
  };

  const saveDayData = () => {
    if (!selectedDate) return;
    
    setTradingJournal(prev => ({
      ...prev,
      [selectedDate.dateKey]: { ...dayData }
    }));
    
    setShowDayModal(false);
    setSelectedDate(null);
    setDayData({ pnl: '', notes: '', hasTraded: true });
  };

  // Stats du journal
  const getJournalStats = () => {
    const entries = Object.values(tradingJournal).filter(day => day.hasTraded);
    const profits = entries.filter(day => parseFloat(day.pnl) > 0);
    const losses = entries.filter(day => parseFloat(day.pnl) < 0);
    
    const totalPnL = entries.reduce((sum, day) => sum + (parseFloat(day.pnl) || 0), 0);
    const winRate = entries.length > 0 ? (profits.length / entries.length * 100) : 0;
    const avgWin = profits.length > 0 ? profits.reduce((sum, day) => sum + parseFloat(day.pnl), 0) / profits.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((sum, day) => sum + parseFloat(day.pnl), 0) / losses.length) : 0;
    
    // Pattern Analysis
    const recentTrades = entries.slice(-5);
    const consecutiveLosses = recentTrades.reverse().findIndex(day => parseFloat(day.pnl) >= 0);
    const actualConsecutiveLosses = consecutiveLosses === -1 ? recentTrades.length : consecutiveLosses;
    
    return {
      totalTrades: entries.length,
      winningTrades: profits.length,
      losingTrades: losses.length,
      totalPnL,
      winRate,
      avgWin,
      avgLoss,
      consecutiveLosses: actualConsecutiveLosses,
      profitFactor: avgLoss > 0 ? (avgWin * profits.length) / (avgLoss * losses.length) : 0
    };
  };

  // NOUVEAU : Calcul avancé avec protection IA
  const calculateSmartRecommendations = () => {
    const calculatedBalance = calculateCurrentBalanceFromJournal();
    const currentBalanceNum = calculatedBalance || parseFloat(currentBalance);
    const initialCapitalNum = parseFloat(initialCapital);
    
    if (!currentBalanceNum || !initialCapitalNum) return null;

    const totalPnL = currentBalanceNum - initialCapitalNum;
    const totalPnLPercent = (totalPnL / initialCapitalNum) * 100;
    
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const mondayOfThisWeek = new Date(today);
    mondayOfThisWeek.setDate(today.getDate() - daysFromMonday);
    mondayOfThisWeek.setHours(0, 0, 0, 0);
    
    const weeklyPnL = Object.entries(tradingJournal).reduce((sum, [dateKey, dayData]) => {
      if (!dayData.hasTraded || !dayData.pnl) return sum;
      const tradeDate = new Date(dateKey);
      if (tradeDate >= mondayOfThisWeek) {
        return sum + parseFloat(dayData.pnl);
      }
      return sum;
    }, 0);
    
    const weeklyPnLPercent = (weeklyPnL / initialCapitalNum) * 100;
    
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyPnL = Object.entries(tradingJournal).reduce((sum, [dateKey, dayData]) => {
      if (!dayData.hasTraded || !dayData.pnl) return sum;
      const tradeDate = new Date(dateKey);
      if (tradeDate >= firstDayOfMonth) {
        return sum + parseFloat(dayData.pnl);
      }
      return sum;
    }, 0);
    
    const monthlyPnLPercent = (monthlyPnL / initialCapitalNum) * 100;

    // Intégration du système de protection drawdown
    const drawdownProtection = calculateDrawdownProtection();
    const stats = getJournalStats();
    
    let status = 'neutral';
    let riskAdjustment = 1;
    let message = '';
    let suggestions = [];
    let nextTradeAdvice = '';

    // APPLICATION DE LA PROTECTION DRAWDOWN
    if (drawdownProtection?.protectionLevel === 'emergency') {
      status = 'emergency';
      riskAdjustment = 0.2;
      message = `🚨 MODE SURVIE ACTIVÉ`;
      suggestions = [
        '🚨 STOP TRADING - Drawdown critique',
        'Analysez vos erreurs avant de reprendre',
        'Considérez une pause de 24-48h',
        'Mode survival : protection capitale maximum'
      ];
    } else if (drawdownProtection?.protectionLevel === 'danger') {
      status = 'danger';
      riskAdjustment = drawdownProtection.riskMultiplier;
      message = `⚠️ PROTECTION DRAWDOWN ACTIVE`;
      suggestions = [
        '⚠️ Trading défensif uniquement',
        'Setups haute probabilité seulement',
        'Évitez absolument le revenge trading',
        `Drawdown: ${drawdownProtection.drawdownPercent.toFixed(1)}%`
      ];
    } else if (stats.consecutiveLosses >= 3) {
      status = 'pattern_warning';
      riskAdjustment = 0.5;
      message = `🔴 ALERTE PATTERN - ${stats.consecutiveLosses} pertes consécutives`;
      suggestions = [
        `🔴 ${stats.consecutiveLosses} pertes d'affilée détectées`,
        'PAUSE obligatoire recommandée',
        'Analysez votre état psychologique',
        'Reprenez avec micro-positions'
      ];
    } else if (monthlyPnLPercent >= monthlyTarget) {
      status = 'monthly_achieved';
      riskAdjustment = 0.2;
      message = `🏆 OBJECTIF MENSUEL ATTEINT !`;
      suggestions = [
        '🏆 BRAVO ! Objectif mensuel réalisé',
        'MODE CAPITAL PRESERVATION',
        'Plus aucun risque nécessaire ce mois',
        'Profitez de votre succès !'
      ];
    } else if (weeklyPnLPercent >= weeklyTarget) {
      status = 'weekly_achieved';
      riskAdjustment = 0.4;
      message = `🎯 Objectif hebdomadaire atteint !`;
      suggestions = [
        '🎯 Excellent ! Objectif hebdo atteint',
        'Mode conservateur automatique',
        'Protégez vos gains acquis',
        'Trading sélectif uniquement'
      ];
    } else {
      // Application de la protection drawdown normale
      if (drawdownProtection) {
        riskAdjustment *= drawdownProtection.riskMultiplier;
      }
      
      message = `📈 En progression`;
      suggestions = [
        'Progression normale, continuez !',
        'Respectez votre plan de trading',
        `Reste ${(weeklyTarget - weeklyPnLPercent).toFixed(2)}% pour l'objectif hebdo`,
        'Discipline et patience'
      ];
    }

    // Calcul du conseil de trade
    const finalRisk = riskPerTrade * riskAdjustment * (secureMode ? 0.5 : 1);
    const riskAmount = (currentBalanceNum * finalRisk) / 100;
    
    nextTradeAdvice = `Prochain trade : ${finalRisk.toFixed(2)}% du capital (${riskAmount.toFixed(2)}$)`;

    return {
      totalPnL, totalPnLPercent, weeklyPnL, weeklyPnLPercent,
      monthlyPnL, monthlyPnLPercent, weeklyTarget, monthlyTarget,
      status, riskAdjustment, message, suggestions, nextTradeAdvice,
      adjustedRiskPercent: finalRisk,
      maxRiskAmount: riskAmount,
      weekProgress: Math.min(100, Math.abs(weeklyPnLPercent / weeklyTarget) * 100),
      monthProgress: Math.min(100, Math.abs(monthlyPnLPercent / monthlyTarget) * 100),
      daysFromMonday: daysFromMonday + 1,
      drawdownProtection: drawdownProtection,
      patternWarning: stats.consecutiveLosses >= 2
    };
  };

  const calculatePositionSize = () => {
    const calculatedBalance = calculateCurrentBalanceFromJournal();
    const capitalNum = calculatedBalance || parseFloat(currentBalance || capital);
    const stopLossTicksNum = parseFloat(stopLossTicks);
    
    if (!capitalNum || capitalNum <= 0 || !stopLossTicksNum || stopLossTicksNum <= 0) {
      setResults(null);
      return;
    }

    const smartRec = calculateSmartRecommendations();
    
    // Utiliser les recommandations de l'IA si disponibles, sinon utiliser les calculs smart
    const effectiveRiskPercent = aiRecommendedRisk !== null ? aiRecommendedRisk : 
                                (smartRec ? smartRec.adjustedRiskPercent : riskPerTrade);
    const effectiveDailyLossMax = aiMaxDailyLoss !== null ? aiMaxDailyLoss : dailyLossMax;
    
    const maxRiskPerTrade = (capitalNum * effectiveRiskPercent) / 100;
    const maxDailyLoss = (capitalNum * effectiveDailyLossMax) / 100;
    const maxTradesPerDay = Math.floor(maxDailyLoss / maxRiskPerTrade);
    
    const positionRecommendations = [];

    Object.entries(contracts).forEach(([symbol, contract]) => {
      const lossPerContract = stopLossTicksNum * contract.tickValue;
      const maxContractsByRisk = Math.floor(maxRiskPerTrade / lossPerContract);
      const maxContractsByMargin = Math.floor(capitalNum / contract.margin);
      const recommendedContracts = Math.min(maxContractsByRisk, maxContractsByMargin);
      
      if (recommendedContracts > 0) {
        const totalRisk = recommendedContracts * lossPerContract;
        const totalMargin = recommendedContracts * contract.margin;
        const riskPercent = (totalRisk / capitalNum) * 100;
        const marginPercent = (totalMargin / capitalNum) * 100;
        
        positionRecommendations.push({
          symbol, contract, recommendedContracts, totalRisk, totalMargin,
          riskPercent, marginPercent, lossPerContract, maxContractsByRisk,
          maxContractsByMargin,
          potential1to1: totalRisk,
          potential1to2: totalRisk * 2,
          potential1to3: totalRisk * 3
        });
      }
    });

    positionRecommendations.sort((a, b) => b.recommendedContracts - a.recommendedContracts);

    setResults({
      capital: capitalNum, maxRiskPerTrade, maxDailyLoss, maxTradesPerDay,
      stopLossTicks: stopLossTicksNum, effectiveRiskPercent,
      originalRiskPercent: riskPerTrade, recommendations: positionRecommendations
    });

    setRecommendations(smartRec);
    setDrawdownProtection(smartRec?.drawdownProtection);
  };

  useEffect(() => {
    calculatePositionSize();
  }, [capital, currentBalance, riskPerTrade, dailyLossMax, stopLossTicks, initialCapital, weeklyTarget, monthlyTarget, secureMode, tradingJournal]);

  const getStatusStyles = (status) => {
    switch (status) {
      case 'emergency':
        return 'from-red-600 to-red-800 text-white';
      case 'danger':
        return 'from-orange-500 to-red-500 text-white';
      case 'pattern_warning':
        return 'from-red-500 to-rose-600 text-white';
      case 'weekly_achieved':
      case 'monthly_achieved':
        return 'from-emerald-500 to-green-600 text-white';
      case 'approaching_target':
        return 'from-blue-500 to-indigo-600 text-white';
      case 'warning':
        return 'from-orange-500 to-yellow-500 text-white';
      default:
        return 'from-slate-500 to-gray-600 text-white';
    }
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'calculator':
        setActiveTab('calculator');
        break;
      case 'analyze':
        performFinancialDirectorAnalysis();
        break;
      case 'secure':
        setSecureMode(!secureMode);
        break;
    }
  };

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'calculator', name: 'Calculateur', icon: Calculator },
    { id: 'journal', name: 'Journal', icon: Calendar },
    { id: 'ai-analysis', name: 'Directeur IA', icon: Brain },
    { id: 'settings', name: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-600 hover:text-slate-900 lg:hidden"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Méthode Alpha AI
                </h1>
                <p className="text-sm text-slate-500">Smart Risk Management System</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Indicateurs de statut */}
            {drawdownProtection?.alert && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                drawdownProtection.alert.color === 'red' ? 'bg-red-100 text-red-800' :
                drawdownProtection.alert.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                drawdownProtection.alert.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                <AlertTriangle className="w-4 h-4" />
                <span>{drawdownProtection.protectionLevel.toUpperCase()}</span>
              </div>
            )}
            
            {secureMode && (
              <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                <Lock className="w-4 h-4" />
                <span>Mode Sécurisé</span>
              </div>
            )}
            
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {drawdownProtection?.alert && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
            </button>
            
            <div className="flex items-center space-x-3 bg-slate-100 rounded-full px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-slate-700">Trader Pro AI</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-slate-200 shadow-sm`}>
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-auto">
          {activeTab === 'dashboard' && (
            <Dashboard 
              calculateCurrentBalanceFromJournal={calculateCurrentBalanceFromJournal}
              currentBalance={currentBalance}
              recommendations={recommendations}
              drawdownProtection={drawdownProtection}
              monthlyTarget={monthlyTarget}
              handleQuickAction={handleQuickAction}
              isAnalyzing={isAnalyzing}
              secureMode={secureMode}
              getStatusStyles={getStatusStyles}
            />
          )}

          {activeTab === 'calculator' && (
            <CalculatorModule
              capital={capital}
              setCapital={setCapital}
              riskPerTrade={riskPerTrade}
              dailyLossMax={dailyLossMax}
              stopLossTicks={stopLossTicks}
              setStopLossTicks={setStopLossTicks}
              calculateCurrentBalanceFromJournal={calculateCurrentBalanceFromJournal}
              currentBalance={currentBalance}
              results={results}
              recommendations={recommendations}
              drawdownProtection={drawdownProtection}
              aiRecommendedRisk={aiRecommendedRisk}
              aiMaxDailyLoss={aiMaxDailyLoss}
            />
          )}

          {activeTab === 'journal' && (
            <Journal
              tradingJournal={tradingJournal}
              showDayModal={showDayModal}
              setShowDayModal={setShowDayModal}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              dayData={dayData}
              setDayData={setDayData}
              handleDayClick={handleDayClick}
              saveDayData={saveDayData}
              getJournalStats={getJournalStats}
              getDaysInMonth={getDaysInMonth}
              getFirstDayOfMonth={getFirstDayOfMonth}
              getDateKey={getDateKey}
              getDayStatus={getDayStatus}
            />
          )}

          {activeTab === 'ai-analysis' && (
            <DirecteurIA
              aiAnalysis={aiAnalysis}
              isAnalyzing={isAnalyzing}
              performFinancialDirectorAnalysis={performFinancialDirectorAnalysis}
              anthropicApiKey={anthropicApiKey}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              initialCapital={initialCapital}
              setInitialCapital={setInitialCapital}
              currentBalance={currentBalance}
              setCurrentBalance={setCurrentBalance}
              weeklyTarget={weeklyTarget}
              setWeeklyTarget={setWeeklyTarget}
              monthlyTarget={monthlyTarget}
              setMonthlyTarget={setMonthlyTarget}
              riskPerTrade={riskPerTrade}
              setRiskPerTrade={setRiskPerTrade}
              dailyLossMax={dailyLossMax}
              setDailyLossMax={setDailyLossMax}
              anthropicApiKey={anthropicApiKey}
              setAnthropicApiKey={setAnthropicApiKey}
              secureMode={secureMode}
              setSecureMode={setSecureMode}
              calculateCurrentBalanceFromJournal={calculateCurrentBalanceFromJournal}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MethodeAlpha; 