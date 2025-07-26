import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calculator, TrendingUp, AlertTriangle, DollarSign, Target, 
  TrendingDown, Calendar, Brain, Shield, BarChart3, PieChart,
  Settings, Bell, User, Menu, X, Activity, Zap, Eye, Lock, CheckCircle, AlertCircle,
  Cpu, Bot, LineChart, Flame, Skull, LogOut, Loader2, CheckSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { callAIAPI } from '../utils/aiProviders';

// Import des modules
import Dashboard from './modules/Dashboard';
import Journal from './modules/Journal';
import CalculatorModule from './modules/Calculator';
import DirecteurIA from './modules/DirecteurIA';
import SettingsModule from './modules/Settings';
import Checklist from './modules/Checklist';
import AdvancedAnalytics from './modules/AdvancedAnalytics';

const MethodeAlpha = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { 
    loading: dataLoading, 
    userSettings, 
    tradingJournal, 
    saveSettings, 
    saveJournalEntry,
    deleteJournalEntry,
    deleteAllJournalEntries,
    saveAIAnalysis,
    isDataLoaded,
    // Checklist data
    checklistTemplates,
    userChecklistItems,
    checklistSessions,
    saveUserChecklistItem,
    updateUserChecklistItem,
    deleteUserChecklistItem,
    copyDefaultTemplates,
    saveChecklistSession,
    deleteChecklistSession,
    deleteAllChecklistSessions,
    // Active trade data
    activeTrade,
    createActiveTrade,
    closeActiveTrade,
    completedTrades,
    deleteCompletedTrade,
    deleteAllCompletedTrades
  } = useSupabaseData();

  // États locaux pour l'interface
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // États dérivés des userSettings (avec fallbacks)
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

  // États spécifiques
  const [recommendations, setRecommendations] = useState(null);
  const [secureMode, setSecureMode] = useState(false);
  const [tradingTimezone, setTradingTimezone] = useState('UTC');

  // États pour le journal
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayData, setDayData] = useState({ pnl: '', notes: '', hasTraded: true });

  // États pour l'IA
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [drawdownProtection, setDrawdownProtection] = useState(null);
  const [monthlyPeak, setMonthlyPeak] = useState(0);
  const [emergencyMode, setEmergencyMode] = useState(false);

  // États pour les clés API et modèles
  const [aiProvider, setAiProvider] = useState('anthropic');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude-3-5-sonnet-20241022');

  // États pour l'IA recommandée
  const [aiRecommendedRisk, setAiRecommendedRisk] = useState(null);
  const [aiMaxDailyLoss, setAiMaxDailyLoss] = useState(null);

  // Synchroniser les états avec userSettings
  useEffect(() => {
    if (userSettings) {
      setInitialCapital(userSettings.initial_capital?.toString() || '');
      setCurrentBalance(userSettings.current_balance?.toString() || '');
      setRiskPerTrade(userSettings.risk_per_trade || 1);
      setDailyLossMax(userSettings.daily_loss_max || 3);
      setWeeklyTarget(userSettings.weekly_target || 2);
      setMonthlyTarget(userSettings.monthly_target || 8);
      setSecureMode(userSettings.secure_mode || false);
      setTradingTimezone(userSettings.trading_timezone || 'UTC');
      setAiProvider(userSettings.ai_provider || 'anthropic');
      setSelectedModel(userSettings.selected_model || 'claude-3-5-sonnet-20241022');
      setAnthropicApiKey(userSettings.anthropic_api_key || '');
      setOpenaiApiKey(userSettings.openai_api_key || '');
      
      // Synchroniser le capital avec current_balance si pas défini
      if (!capital && userSettings.current_balance) {
        setCapital(userSettings.current_balance.toString());
      }
    }
  }, [userSettings, capital]);

  // Déclencher les calculs dès que les données sont chargées
  useEffect(() => {
    if (isDataLoaded && userSettings) {
      // Petite attente pour s'assurer que tous les états sont synchronisés
      setTimeout(() => {
        updateRecommendations();
      }, 100);
    }
  }, [isDataLoaded, userSettings]);



  // Fonction pour sauvegarder les paramètres
  const saveUserSettings = async (newSettings) => {
    try {
      await saveSettings(newSettings);
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
    }
  };

  // Fonction pour sauvegarder tous les paramètres en une fois
  const saveAllSettings = async () => {
    try {
      const allSettings = {
        initial_capital: parseFloat(initialCapital) || 0,
        current_balance: parseFloat(currentBalance) || 0,
        risk_per_trade: riskPerTrade,
        daily_loss_max: dailyLossMax,
        weekly_target: weeklyTarget,
        monthly_target: monthlyTarget,
        secure_mode: secureMode,
        trading_timezone: tradingTimezone,
        ai_provider: aiProvider,
        selected_model: selectedModel,
        anthropic_api_key: anthropicApiKey,
        openai_api_key: openaiApiKey
      };
      await saveSettings(allSettings);
      return true;
    } catch (error) {
      console.error('Erreur sauvegarde paramètres:', error);
      throw error;
    }
  };

  // Fonctions wrapped pour auto-sauvegarde
  const setInitialCapitalWithSave = (value) => {
    setInitialCapital(value);
    saveUserSettings({ initial_capital: parseFloat(value) || 0 });
  };

  const setCurrentBalanceWithSave = (value) => {
    setCurrentBalance(value);
    saveUserSettings({ current_balance: parseFloat(value) || 0 });
  };

  const setRiskPerTradeWithSave = (value) => {
    setRiskPerTrade(value);
    saveUserSettings({ risk_per_trade: value });
  };

  const setDailyLossMaxWithSave = (value) => {
    setDailyLossMax(value);
    saveUserSettings({ daily_loss_max: value });
  };

  const setWeeklyTargetWithSave = (value) => {
    setWeeklyTarget(value);
    saveUserSettings({ weekly_target: value });
  };

  const setMonthlyTargetWithSave = (value) => {
    setMonthlyTarget(value);
    saveUserSettings({ monthly_target: value });
  };

  const setSecureModeWithSave = (value) => {
    setSecureMode(value);
    saveUserSettings({ secure_mode: value });
  };
  const setTradingTimezoneWithSave = (value) => {
    setTradingTimezone(value);
    saveUserSettings({ trading_timezone: value });
  };

  const setAiProviderWithSave = (value) => {
    setAiProvider(value);
    saveUserSettings({ ai_provider: value });
  };

  const setSelectedModelWithSave = (value) => {
    setSelectedModel(value);
    saveUserSettings({ selected_model: value });
  };

  const setAnthropicApiKeyWithSave = (value) => {
    setAnthropicApiKey(value);
    saveUserSettings({ anthropic_api_key: value });
  };

  const setOpenaiApiKeyWithSave = (value) => {
    setOpenaiApiKey(value);
    saveUserSettings({ openai_api_key: value });
  };

  // Définition des contrats
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
    },
    MES: {
      name: 'Micro E-mini S&P 500 (MES)',
      margin: 40,
      tickValue: 1.25,
      tickSize: 0.25,
      description: '1/10ème de l\'ES standard',
      multiplier: 5,
      category: 'sp500'
    },
    ES: {
      name: 'E-mini S&P 500 (ES)',
      margin: 800,
      tickValue: 12.50,
      tickSize: 0.25,
      description: 'Contrat standard S&P 500',
      multiplier: 50,
      category: 'sp500'
    }
  };

  // Fonction pour calculer le solde actuel depuis le journal
  const calculateCurrentBalanceFromJournal = () => {
    let total = parseFloat(initialCapital) || 0;
    
    Object.values(tradingJournal).forEach(day => {
      const pnl = parseFloat(day.pnl) || 0;
      total += pnl;
    });
    
    // Arrondir à 2 décimales pour éviter les erreurs de précision floating point
    return Math.round(total * 100) / 100;
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

  // Fonction de validation des données avant envoi à l'IA
  const validateFinancialData = (data) => {
    const errors = [];
    
    // Vérifications critiques
    if (!data.currentCapital || data.currentCapital <= 0) {
      errors.push("Capital actuel invalide");
    }
    if (!data.initialCapital || data.initialCapital <= 0) {
      errors.push("Capital initial invalide");
    }
    if (data.tradingDaysLeft === undefined || data.tradingDaysLeft < 0) {
      errors.push("Jours de trading restants invalides");
    }
    if (data.winRate < 0 || data.winRate > 100) {
      errors.push("Win rate invalide");
    }
    if (data.adjustedRiskPercent < 0 || data.adjustedRiskPercent > 100) {
      errors.push("Pourcentage de risque invalide");
    }
    
    // Log de validation pour transparence
    console.log("=== VALIDATION DES DONNÉES FINANCIÈRES ===");
    console.log("Capital actuel:", data.currentCapital);
    console.log("Jours ouvrables restants:", data.tradingDaysLeft);
    console.log("Win Rate:", data.winRate);
    console.log("Risque ajusté:", data.adjustedRiskPercent);
    console.log("Trades récents:", data.recentTrades?.length || 0);
    console.log("==========================================");
    
    if (errors.length > 0) {
      throw new Error(`Données invalides: ${errors.join(", ")}`);
    }
    
    return true;
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
      const businessDaysLeft = getBusinessDaysLeft(today);
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
        tradingDaysLeft: businessDaysLeft, // Jours ouvrables réels calculés
        todayDate: today.toISOString().split('T')[0],
        
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
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        totalPnL: stats.totalPnL,
        
        // Trading Journal Summary
        recentTrades: Object.entries(tradingJournal)
          .filter(([_, data]) => data.hasTraded)
          .sort(([a], [b]) => new Date(b) - new Date(a))
          .slice(0, 10)
          .map(([date, data]) => ({
            date,
            pnl: parseFloat(data.pnl),
            notes: data.notes
          })),
        
        // Monthly & Weekly Progress
        monthlyProgress: smartRec?.monthlyPnLPercent || 0,
        weeklyProgress: smartRec?.weeklyPnLPercent || 0,
        monthlyPnL: smartRec?.monthlyPnL || 0,
        weeklyPnL: smartRec?.weeklyPnL || 0,
        
        // Market Context
        volatilityLevel: stats.consecutiveLosses >= 2 ? "HIGH" : stats.winRate >= 60 ? "LOW" : "MEDIUM",
        tradingEfficiency: stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) : 0,
        protectionLevel: drawdown?.protectionLevel || 'safe',
        
        // Configured Targets
        weeklyTargetPercent: weeklyTarget,
        monthlyTargetPercent: monthlyTarget,
        dailyLossMaxPercent: dailyLossMax,
        riskPerTradePercent: riskPerTrade
      };

      // Valider les données avant envoi
      validateFinancialData(financialData);

      // Vérifier quelle clé API utiliser
      const apiKey = aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;
      
      if (!apiKey) {
        throw new Error(`Clé API ${aiProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} non configurée`);
      }

      const messages = [{
        role: "user",
        content: `Tu es un DIRECTEUR FINANCIER expert des marchés. Analyse ces données RÉELLES et fournis des KPIs DECISIONNELS pour un trader professionnel.

⚠️ IMPORTANT: Ces données sont RÉELLES issues du journal de trading. Tes recommandations impactent directement les décisions financières. Sois PRÉCIS et PRUDENT.

DONNÉES FINANCIÈRES RÉELLES (Date: ${today.toISOString().split('T')[0]}):
${JSON.stringify(financialData, null, 2)}

VALIDATION DES DONNÉES:
- Capital actuel: $${currentBalanceNum.toFixed(2)}
- P&L Total: $${stats.totalPnL.toFixed(2)}
- Nombre de trades: ${stats.totalTrades}
- Win Rate réel: ${stats.winRate.toFixed(1)}%
- Jours ouvrables restants ce mois: ${businessDaysLeft}

CONTEXTE CRITIQUE:
- ${monthlyObjectiveAchieved ? "🏆 OBJECTIF MENSUEL DÉJÀ ATTEINT - MODE PROTECTION CAPITAL OBLIGATOIRE" : `Objectif mensuel en cours: ${currentMonthlyReturn.toFixed(2)}% / ${monthlyTarget}%`}
- ${smartRec?.status === 'weekly_achieved' ? "✅ Objectif hebdomadaire atteint" : `Objectif hebdo: ${smartRec?.weeklyPnLPercent?.toFixed(2) || 0}% / ${weeklyTarget}%`}
- Protection drawdown: ${drawdown?.protectionLevel || 'normale'} (${drawdown?.drawdownPercent?.toFixed(2) || 0}%)

RÈGLES ABSOLUES POUR TES CALCULS:
1. Si objectif mensuel atteint → Risque MAX 0.2% et perte journalière MAX 0.5%
2. Si drawdown critique → Mode survie avec risque minimal
3. Toujours privilégier la protection du capital acquis
4. Pour "tradesLeftBudget": DOIT être = Math.floor(maxDailyLoss / currentRiskPerTrade)
5. Pour "daysToTarget": DOIT être = tradingDaysLeft (${businessDaysLeft} jours)
6. Pour "capitalAtRisk": DOIT être = adjustedRiskPercent (${adjustedRiskPercent.toFixed(2)}%)
7. Pour "winRateRequired": Calculer basé sur les vraies moyennes de gains/pertes
8. Base TOUTES tes recommandations sur l'historique réel des trades

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
      }];

      const response = await callAIAPI(aiProvider, apiKey, selectedModel, messages, 2000);
      
      let responseText;
      if (aiProvider === 'anthropic') {
        responseText = response.content[0].text;
      } else {
        // Pour OpenAI, la réponse est déjà normalisée par callAIAPI
        responseText = response.content[0].text;
      }
      
      // Nettoyer la réponse pour extraire le JSON
      responseText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      const analysis = JSON.parse(responseText);
      setAiAnalysis(analysis);
      
      // Sauvegarder l'analyse dans Supabase
      try {
        await saveAIAnalysis(analysis, selectedModel, aiProvider);
      } catch (error) {
        console.warn('Erreur sauvegarde analyse IA:', error);
      }
      
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
      const businessDaysLeft = getBusinessDaysLeft(today);
      const currentReturn = ((currentBalanceNum - parseFloat(initialCapital)) / parseFloat(initialCapital)) * 100;
      const requiredGain = ((monthlyTarget - currentReturn) / 100) * parseFloat(initialCapital);
      const drawdown = calculateDrawdownProtection();
      const stats = getJournalStats();
      
      // Calcul des valeurs ajustées selon le contexte
      let adjustedRiskPercent = riskPerTrade;
      let adjustedMaxDailyLoss = dailyLossMax;
      
      if (currentReturn >= monthlyTarget) {
        adjustedRiskPercent = 0.2;
        adjustedMaxDailyLoss = 0.5;
      } else if (drawdown?.protectionLevel === 'emergency') {
        adjustedRiskPercent = 0.2;
        adjustedMaxDailyLoss = 1;
      } else if (drawdown?.protectionLevel === 'danger') {
        adjustedRiskPercent = riskPerTrade * 0.3;
        adjustedMaxDailyLoss = dailyLossMax * 0.5;
      }
      
      const maxLossAmount = currentBalanceNum * (adjustedMaxDailyLoss / 100);
      const riskPerTradeAmount = currentBalanceNum * (adjustedRiskPercent / 100);
      const tradesLeftToday = riskPerTradeAmount > 0 ? Math.floor(maxLossAmount / riskPerTradeAmount) : 0;
      
      // Calcul du win rate requis
      const avgTradesPerDay = stats.totalTrades > 0 ? stats.totalTrades / Math.max(1, Object.keys(tradingJournal).length) : 2;
      const estimatedTradesLeft = businessDaysLeft * avgTradesPerDay;
      const winRateNeeded = calculateRequiredWinRate(requiredGain, stats.avgWin, stats.avgLoss, estimatedTradesLeft);
      
      // Log des calculs pour transparence
      console.log("=== CALCULS KPI LOCAUX (FALLBACK) ===");
      console.log("Perte max journalière:", maxLossAmount.toFixed(2));
      console.log("Risque par trade:", riskPerTradeAmount.toFixed(2));
      console.log("Trades restants aujourd'hui:", tradesLeftToday);
      console.log("Jours ouvrables restants:", businessDaysLeft);
      console.log("Win rate requis:", winRateNeeded.toFixed(1) + "%");
      console.log("Capital à risque:", adjustedRiskPercent.toFixed(1) + "%");
      console.log("=====================================");
      
      setAiAnalysis({
        executiveSummary: {
          status: drawdown?.protectionLevel === 'emergency' ? "CRITICAL" : 
                  drawdown?.protectionLevel === 'danger' ? "DANGER" : 
                  currentReturn >= monthlyTarget ? "SAFE" : "CAUTION",
          headline: error.message.includes('API') ? 
            "❌ Analyse IA indisponible - KPIs calculés localement" : 
            `Capital: $${currentBalanceNum.toFixed(2)} | Objectif: ${currentReturn >= 0 ? 'En cours' : 'À rattraper'}`,
          priority: drawdown?.protectionLevel === 'emergency' ? "ARRÊT IMMÉDIAT DU TRADING" :
                   stats.consecutiveLosses >= 3 ? "PAUSE ET ANALYSE REQUISE" :
                   "CONTINUER SELON PLAN"
        },
        kpis: {
          maxLossToday: `$${maxLossAmount.toFixed(2)}`,
          optimalRiskPerTrade: `$${riskPerTradeAmount.toFixed(2)}`,
          minDailyGainRequired: businessDaysLeft > 0 ? `$${(requiredGain / businessDaysLeft).toFixed(2)}` : "$0",
          drawdownStatus: drawdown?.protectionLevel?.toUpperCase() || "OK",
          tradesLeftBudget: `${tradesLeftToday} (ajusté)`,
          daysToTarget: `${businessDaysLeft} jours ouvrables`,
          winRateRequired: `${winRateNeeded.toFixed(1)}%`,
          capitalAtRisk: `${adjustedRiskPercent.toFixed(1)}%`
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

  // Fonction pour calculer les jours ouvrables restants
  const getBusinessDaysLeft = (date) => {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0); // Normaliser à minuit
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999); // Inclure toute la dernière journée
    
    let businessDays = 0;
    
    // Commencer à partir d'aujourd'hui pour inclure aujourd'hui si c'est un jour ouvrable
    const currentDate = new Date(today);
    
    while (currentDate <= endOfMonth) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclure dimanche (0) et samedi (6)
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Si on a déjà tradé aujourd'hui, retirer 1 jour
    const todayKey = getDateKey(today.getFullYear(), today.getMonth(), today.getDate());
    const todayTraded = tradingJournal[todayKey]?.hasTraded;
    
    return todayTraded ? businessDays - 1 : businessDays;
  };

  // Fonction pour calculer le win rate requis
  const calculateRequiredWinRate = (remainingGain, avgWin, avgLoss, tradesLeft) => {
    if (!avgWin || !avgLoss || tradesLeft <= 0) return 0;
    
    // Pour atteindre l'objectif: W * avgWin - L * avgLoss >= remainingGain
    // Où W + L = tradesLeft
    // Win Rate = W / tradesLeft
    const winRateNeeded = (remainingGain + tradesLeft * avgLoss) / (tradesLeft * (avgWin + avgLoss));
    return Math.max(0, Math.min(100, winRateNeeded * 100));
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

  const saveDayData = async () => {
    if (!selectedDate) return;
    
    try {
      await saveJournalEntry(selectedDate.dateKey, dayData);
      setShowDayModal(false);
      setSelectedDate(null);
      setDayData({ pnl: '', notes: '', hasTraded: true });
    } catch (error) {
      console.error('Erreur sauvegarde journal:', error);
    }
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

  // Calcul des recommandations intelligentes (toujours exécuté)
  const updateRecommendations = () => {
    const calculatedBalance = calculateCurrentBalanceFromJournal();
    const capitalNum = calculatedBalance || parseFloat(currentBalance || capital);
    
    if (!capitalNum || capitalNum <= 0) {
      return;
    }

    const smartRec = calculateSmartRecommendations();
    setRecommendations(smartRec);
    setDrawdownProtection(smartRec?.drawdownProtection);
  };

  const calculatePositionSize = () => {
    const calculatedBalance = calculateCurrentBalanceFromJournal();
    const capitalNum = calculatedBalance || parseFloat(currentBalance || capital);
    const stopLossTicksNum = parseFloat(stopLossTicks);
    
    // Toujours mettre à jour les recommandations
    updateRecommendations();
    
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
  };

  // Effect pour les recommandations (s'exécute même sans stopLossTicks)
  useEffect(() => {
    updateRecommendations();
  }, [capital, currentBalance, riskPerTrade, dailyLossMax, initialCapital, weeklyTarget, monthlyTarget, secureMode, tradingJournal, aiRecommendedRisk, aiMaxDailyLoss]);

  // Effect pour le calcul de position (nécessite stopLossTicks)
  useEffect(() => {
    if (stopLossTicks) {
      calculatePositionSize();
    }
  }, [capital, currentBalance, riskPerTrade, dailyLossMax, stopLossTicks, initialCapital, weeklyTarget, monthlyTarget, secureMode, tradingJournal, aiRecommendedRisk, aiMaxDailyLoss]);

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
    { id: 'checklist', name: 'Checklist', icon: CheckSquare },
    { id: 'analytics', name: 'Analyses', icon: Activity },
    { id: 'ai-analysis', name: 'Directeur IA', icon: Brain },
    { id: 'settings', name: 'Paramètres', icon: Settings },
  ];

  // Calculer automatiquement la position quand les paramètres changent
  useEffect(() => {
    if (capital && stopLossTicks) {
      try {
        calculatePositionSize();
      } catch (error) {
        console.error('Erreur calcul position:', error);
        setResults(null);
      }
    }
  }, [capital, stopLossTicks, riskPerTrade, dailyLossMax, aiRecommendedRisk, aiMaxDailyLoss]);

  // Afficher loading pendant le chargement des données
  if (dataLoading || !isDataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white text-lg">Chargement de vos données...</p>
          <p className="text-blue-200 text-sm mt-2">Synchronisation avec Supabase</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-600 hover:text-slate-900"
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
              <span className="text-sm font-medium text-slate-700">{user?.email}</span>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors text-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Administration</span>
              </button>
            )}
            
            <button
              onClick={() => {
                // Navigate first to avoid auth guard redirect
                navigate('/');
                // Then sign out
                signOut();
              }}
              className="flex items-center space-x-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300 bg-white border-r border-slate-200 shadow-sm min-h-screen`}>
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
              weeklyTarget={weeklyTarget}
              initialCapital={initialCapital}
              tradingJournal={tradingJournal}
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
              deleteJournalEntry={deleteJournalEntry}
              deleteAllJournalEntries={deleteAllJournalEntries}
            />
          )}

          {activeTab === 'checklist' && (
            <Checklist
              userChecklistItems={userChecklistItems}
              checklistTemplates={checklistTemplates}
              checklistSessions={checklistSessions}
              saveChecklistSession={saveChecklistSession}
              deleteChecklistSession={deleteChecklistSession}
              deleteAllChecklistSessions={deleteAllChecklistSessions}
              saveUserChecklistItem={saveUserChecklistItem}
              updateUserChecklistItem={updateUserChecklistItem}
              deleteUserChecklistItem={deleteUserChecklistItem}
              copyDefaultTemplates={copyDefaultTemplates}
              loadingChecklist={dataLoading}
              activeTrade={activeTrade}
              createActiveTrade={createActiveTrade}
              closeActiveTrade={closeActiveTrade}
              completedTrades={completedTrades}
              deleteCompletedTrade={deleteCompletedTrade}
              deleteAllCompletedTrades={deleteAllCompletedTrades}
            />
          )}

          {activeTab === 'analytics' && (
            <AdvancedAnalytics
              tradingJournal={tradingJournal}
              userSettings={userSettings}
              checklistSessions={checklistSessions}
              activeTrade={activeTrade}
              completedTrades={completedTrades}
            />
          )}

          {activeTab === 'ai-analysis' && (
            <DirecteurIA
              aiAnalysis={aiAnalysis}
              isAnalyzing={isAnalyzing}
              performFinancialDirectorAnalysis={performFinancialDirectorAnalysis}
              anthropicApiKey={anthropicApiKey}
              aiProvider={aiProvider}
              selectedModel={selectedModel}
              openaiApiKey={openaiApiKey}
              recommendations={recommendations}
              stats={getJournalStats()}
              capital={parseFloat(capital) || parseFloat(currentBalance) || 0}
              journalData={tradingJournal}
              monthlyObjective={{ 
                current: recommendations?.monthlyPnLPercent || 0, 
                target: monthlyTarget 
              }}
              weeklyObjective={{ 
                current: recommendations?.weeklyPnLPercent || 0, 
                target: weeklyTarget 
              }}
              tradingTimezone={tradingTimezone}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModule
              initialCapital={initialCapital}
              setInitialCapital={setInitialCapitalWithSave}
              currentBalance={currentBalance}
              setCurrentBalance={setCurrentBalanceWithSave}
              weeklyTarget={weeklyTarget}
              setWeeklyTarget={setWeeklyTargetWithSave}
              monthlyTarget={monthlyTarget}
              setMonthlyTarget={setMonthlyTargetWithSave}
              riskPerTrade={riskPerTrade}
              setRiskPerTrade={setRiskPerTradeWithSave}
              dailyLossMax={dailyLossMax}
              setDailyLossMax={setDailyLossMaxWithSave}
              anthropicApiKey={anthropicApiKey}
              setAnthropicApiKey={setAnthropicApiKeyWithSave}
              secureMode={secureMode}
              setSecureMode={setSecureModeWithSave}
              calculateCurrentBalanceFromJournal={calculateCurrentBalanceFromJournal}
              aiProvider={aiProvider}
              setAiProvider={setAiProviderWithSave}
              openaiApiKey={openaiApiKey}
              setOpenaiApiKey={setOpenaiApiKeyWithSave}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModelWithSave}
              tradingTimezone={tradingTimezone}
              setTradingTimezone={setTradingTimezoneWithSave}
              saveAllSettings={saveAllSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MethodeAlpha; 