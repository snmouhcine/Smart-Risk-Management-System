import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  BarChart,
  AreaChart,
  ComposedChart,
  PieChart,
  RadarChart,
  Area,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Brush,
  Dot
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Award,
  AlertTriangle,
  Calendar,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Percent,
  Zap,
  Shield,
  Brain,
  ChevronRight,
  Info,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Minus
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const AdvancedAnalytics = ({
  tradingJournal,
  userSettings,
  checklistSessions,
  activeTrade
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedMetric, setSelectedMetric] = useState('balance');
  const [animationComplete, setAnimationComplete] = useState(false);
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Close tooltip on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Check if click is outside tooltip button and tooltip content
      if (showTooltip && !e.target.closest('.tooltip-trigger') && !e.target.closest('.tooltip-content')) {
        setShowTooltip(null);
      }
    };
    
    if (showTooltip) {
      // Small delay to prevent immediate closing
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 100);
    }
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showTooltip]);

  // Process trading data for balance evolution
  const balanceData = useMemo(() => {
    if (!tradingJournal || Object.keys(tradingJournal).length === 0) {
      return [];
    }

    const sortedDates = Object.keys(tradingJournal).sort();
    
    // Apply date filter
    let filteredDates = sortedDates;
    if (selectedPeriod !== 'all') {
      const today = new Date();
      const daysToFilter = selectedPeriod === '7j' ? 7 : selectedPeriod === '30j' ? 30 : 90;
      const filterDate = new Date(today.getTime() - (daysToFilter * 24 * 60 * 60 * 1000));
      
      filteredDates = sortedDates.filter(date => new Date(date) >= filterDate);
    }
    
    // Calculate initial balance up to filter date if needed
    let cumulativeBalance = userSettings?.initial_capital || 0;
    if (selectedPeriod !== 'all' && filteredDates.length < sortedDates.length) {
      // Add P&L from dates before filter to get correct starting balance
      sortedDates.forEach(date => {
        if (!filteredDates.includes(date)) {
          const entry = tradingJournal[date];
          cumulativeBalance += parseFloat(entry.pnl) || 0;
        }
      });
    }
    
    let maxDrawdown = 0;
    let peak = cumulativeBalance;

    const data = [];
    let previousBalance = cumulativeBalance;
    
    filteredDates.forEach((date, index) => {
      const entry = tradingJournal[date];
      const pnl = parseFloat(entry.pnl) || 0;
      cumulativeBalance += pnl;
      
      // Calculate drawdown
      if (cumulativeBalance > peak) {
        peak = cumulativeBalance;
      }
      const drawdown = peak > 0 ? ((peak - cumulativeBalance) / peak) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, drawdown);

      // Calculate daily return
      const dailyReturn = previousBalance > 0 ? 
        ((cumulativeBalance - previousBalance) / previousBalance) * 100 : 0;

      data.push({
        date,
        displayDate: new Date(date).toLocaleDateString('fr-FR', { 
          day: 'numeric', 
          month: 'short' 
        }),
        balance: cumulativeBalance,
        pnl,
        dailyReturn,
        drawdown,
        peak,
        hasTraded: entry.hasTraded,
        notes: entry.notes
      });
      
      previousBalance = cumulativeBalance;
    });

    return data;
  }, [tradingJournal, userSettings, selectedPeriod]);

  // Calculate comprehensive KPIs
  const kpis = useMemo(() => {
    if (!balanceData.length) {
      return {
        totalReturn: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        bestTrade: 0,
        worstTrade: 0,
        avgDailyPnL: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0
      };
    }

    const trades = balanceData.filter(d => d.hasTraded && d.pnl !== 0);
    const wins = trades.filter(d => d.pnl > 0);
    const losses = trades.filter(d => d.pnl < 0);
    
    const totalPnL = trades.reduce((sum, d) => sum + d.pnl, 0);
    const totalWins = wins.reduce((sum, d) => sum + d.pnl, 0);
    const totalLosses = Math.abs(losses.reduce((sum, d) => sum + d.pnl, 0));
    
    // Calculate consecutive wins/losses
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    
    trades.forEach(trade => {
      if (trade.pnl > 0) {
        currentStreak = currentStreak >= 0 ? currentStreak + 1 : 1;
        maxWinStreak = Math.max(maxWinStreak, currentStreak);
      } else {
        currentStreak = currentStreak <= 0 ? currentStreak - 1 : -1;
        maxLossStreak = Math.max(maxLossStreak, Math.abs(currentStreak));
      }
    });

    // Calculate Sharpe Ratio (simplified)
    const returns = trades.map(d => d.dailyReturn);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    return {
      totalReturn: ((balanceData[balanceData.length - 1].balance - userSettings?.initial_capital) / userSettings?.initial_capital) * 100,
      winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
      avgWin: wins.length > 0 ? totalWins / wins.length : 0,
      avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
      profitFactor: totalLosses > 0 ? totalWins / totalLosses : 0,
      sharpeRatio,
      maxDrawdown: Math.max(...balanceData.map(d => d.drawdown)),
      totalTrades: trades.length,
      winningTrades: wins.length,
      losingTrades: losses.length,
      bestTrade: Math.max(...trades.map(d => d.pnl), 0),
      worstTrade: Math.min(...trades.map(d => d.pnl), 0),
      avgDailyPnL: totalPnL / trades.length,
      consecutiveWins: maxWinStreak,
      consecutiveLosses: maxLossStreak
    };
  }, [balanceData, userSettings]);

  // Process checklist performance data
  const checklistPerformance = useMemo(() => {
    if (!checklistSessions || !tradingJournal) return [];

    // Group sessions by score ranges
    const scoreRanges = [
      { min: 85, max: 100, label: 'Excellent (85-100%)', color: '#10b981' },
      { min: 70, max: 84, label: 'Bon (70-84%)', color: '#3b82f6' },
      { min: 60, max: 69, label: 'Acceptable (60-69%)', color: '#f59e0b' },
      { min: 0, max: 59, label: 'Risqué (<60%)', color: '#ef4444' }
    ];

    const performance = scoreRanges.map(range => {
      const sessions = checklistSessions.filter(s => 
        s.type === 'entry' && 
        s.total_score >= range.min && 
        s.total_score <= range.max
      );

      // Calculate P&L for trades in this score range
      let totalPnL = 0;
      let tradeCount = 0;
      let wins = 0;

      sessions.forEach(session => {
        const tradeDate = new Date(session.created_at).toISOString().split('T')[0];
        const journalEntry = tradingJournal[tradeDate];
        if (journalEntry && journalEntry.hasTraded) {
          const pnl = parseFloat(journalEntry.pnl) || 0;
          totalPnL += pnl;
          tradeCount++;
          if (pnl > 0) wins++;
        }
      });

      return {
        range: range.label,
        color: range.color,
        sessions: sessions.length,
        trades: tradeCount,
        totalPnL,
        avgPnL: tradeCount > 0 ? totalPnL / tradeCount : 0,
        winRate: tradeCount > 0 ? (wins / tradeCount) * 100 : 0
      };
    });

    return performance;
  }, [checklistSessions, tradingJournal]);

  // Trading patterns analysis
  const tradingPatterns = useMemo(() => {
    if (!tradingJournal) return { byDayOfWeek: [], byHour: [] };

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const byDayOfWeek = Array(7).fill(null).map((_, i) => ({
      day: dayNames[i],
      trades: 0,
      totalPnL: 0,
      winRate: 0
    }));

    Object.entries(tradingJournal).forEach(([date, entry]) => {
      if (entry.hasTraded) {
        const dayIndex = new Date(date).getDay();
        byDayOfWeek[dayIndex].trades++;
        byDayOfWeek[dayIndex].totalPnL += parseFloat(entry.pnl) || 0;
      }
    });

    // Calculate win rates
    byDayOfWeek.forEach(day => {
      if (day.trades > 0) {
        const wins = Object.entries(tradingJournal).filter(([date, entry]) => {
          return new Date(date).getDay() === dayNames.indexOf(day.day) &&
                 entry.hasTraded &&
                 parseFloat(entry.pnl) > 0;
        }).length;
        day.winRate = (wins / day.trades) * 100;
      }
    });

    return { byDayOfWeek };
  }, [tradingJournal]);

  // Custom tooltip for balance chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900">{data.displayDate}</p>
          <div className="mt-2 space-y-1">
            <p className="text-sm">
              <span className="text-slate-600">Balance:</span>
              <span className="font-medium ml-2">{formatCurrency(data.balance)}</span>
            </p>
            <p className="text-sm">
              <span className="text-slate-600">P&L:</span>
              <span className={`font-medium ml-2 ${data.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.pnl)}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-slate-600">Retour:</span>
              <span className={`font-medium ml-2 ${data.dailyReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(data.dailyReturn)}
              </span>
            </p>
            {data.drawdown > 0 && (
              <p className="text-sm">
                <span className="text-slate-600">Drawdown:</span>
                <span className="font-medium ml-2 text-orange-600">
                  {formatPercentage(data.drawdown)}
                </span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom dot for important points
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (payload.pnl > kpis.avgWin * 2 || payload.pnl < kpis.avgLoss * -2) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={payload.pnl > 0 ? '#10b981' : '#ef4444'}
          stroke="#fff"
          strokeWidth={2}
          className="animate-pulse"
        />
      );
    }
    return null;
  };

  // Information tooltips content
  const tooltipContent = {
    totalReturn: {
      title: "Retour Total",
      description: "Le pourcentage de gain ou perte total depuis le capital initial. Calculé comme: ((Balance Actuelle - Capital Initial) / Capital Initial) × 100"
    },
    winRate: {
      title: "Taux de Réussite",
      description: "Le pourcentage de trades gagnants par rapport au nombre total de trades. Un taux supérieur à 50% indique plus de trades gagnants que perdants."
    },
    profitFactor: {
      title: "Profit Factor",
      description: "Le ratio entre les gains totaux et les pertes totales. Un profit factor > 1 signifie que vous gagnez plus que vous ne perdez. Idéalement > 1.5"
    },
    maxDrawdown: {
      title: "Drawdown Maximum",
      description: "La plus grande perte en pourcentage depuis un pic de performance. Mesure le risque maximum encouru. Plus c'est bas, mieux c'est."
    },
    sharpeRatio: {
      title: "Sharpe Ratio",
      description: "Mesure le rendement ajusté au risque. Plus le ratio est élevé, meilleur est le rendement par rapport au risque pris. > 1 est bon, > 2 est excellent."
    },
    avgWin: {
      title: "Gain Moyen",
      description: "Le montant moyen gagné sur les trades gagnants. Compare avec la perte moyenne pour évaluer votre ratio risque/récompense."
    },
    avgLoss: {
      title: "Perte Moyenne",
      description: "Le montant moyen perdu sur les trades perdants. Devrait idéalement être inférieur au gain moyen."
    },
    expectancy: {
      title: "Expectancy",
      description: "Le montant moyen que vous pouvez espérer gagner (ou perdre) par trade. Positive = système profitable à long terme."
    },
    consecutiveWins: {
      title: "Gains Consécutifs Max",
      description: "Le nombre maximum de trades gagnants consécutifs. Utile pour comprendre les séries positives de votre système."
    },
    consecutiveLosses: {
      title: "Pertes Consécutives Max",
      description: "Le nombre maximum de trades perdants consécutifs. Important pour la gestion du risque et la préparation psychologique."
    },
    riskScore: {
      title: "Score de Risque",
      description: "Évaluation visuelle du risque basée sur le drawdown maximum. 5 points = risque très faible, 1 point = risque élevé."
    }
  };

  // Tooltip Component
  const InfoTooltip = ({ id }) => {
    const content = tooltipContent[id];
    if (!content) return null;

    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Tooltip clicked:', id);
            setShowTooltip(showTooltip === id ? null : id);
          }}
          className="ml-1 p-1 rounded-full hover:bg-slate-200 transition-colors tooltip-trigger cursor-pointer"
        >
          <Info className="w-4 h-4 text-slate-500 hover:text-slate-700" />
        </button>
        
        {showTooltip === id && (
          <div className="absolute z-[100] w-64 p-3 bg-slate-900 text-white rounded-lg shadow-xl bottom-full mb-2 left-1/2 -translate-x-1/2 tooltip-content">
            <div className="absolute w-2 h-2 bg-slate-900 transform rotate-45 bottom-[-4px] left-1/2 -translate-x-1/2"></div>
            <h4 className="font-semibold text-sm mb-1">{content.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{content.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-purple-600" />
              Analyses Avancées
            </h2>
            <p className="text-slate-600 mt-1">Visualisez vos performances avec des analyses détaillées</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center space-x-2">
            {['7j', '30j', '90j', 'all'].map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {period === 'all' ? 'Tout' : period}
              </button>
            ))}
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="text-sm text-green-700 font-medium">Retour Total</p>
                  <InfoTooltip id="totalReturn" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {formatPercentage(kpis.totalReturn)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${kpis.totalReturn >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                {kpis.totalReturn >= 0 ? 
                  <TrendingUp className="w-6 h-6 text-white" /> : 
                  <TrendingDown className="w-6 h-6 text-white" />
                }
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="text-sm text-blue-700 font-medium">Taux de Réussite</p>
                  <InfoTooltip id="winRate" />
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {formatPercentage(kpis.winRate)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {kpis.winningTrades}W / {kpis.losingTrades}L
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="text-sm text-purple-700 font-medium">Profit Factor</p>
                  <InfoTooltip id="profitFactor" />
                </div>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {kpis.profitFactor.toFixed(2)}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Ratio Gains/Pertes
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <Award className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="text-sm text-orange-700 font-medium">Max Drawdown</p>
                  <InfoTooltip id="maxDrawdown" />
                </div>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {formatPercentage(kpis.maxDrawdown)}
                </p>
                <p className="text-xs text-orange-600 mt-1">
                  Pire perte depuis un pic
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Evolution Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-purple-600" />
          Évolution du Capital
        </h3>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={balanceData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              onMouseMove={(e) => setHoveredDataPoint(e?.activePayload?.[0]?.payload)}
              onMouseLeave={() => setHoveredDataPoint(null)}
            >
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line for initial capital */}
              <ReferenceLine 
                y={userSettings?.initial_capital || 0} 
                stroke="#94a3b8" 
                strokeDasharray="5 5"
                label={{ value: "Capital Initial", position: "left", fill: "#64748b" }}
              />
              
              {/* Main balance area */}
              <Area
                type="monotone"
                dataKey="balance"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorBalance)"
                animationDuration={2000}
                animationEasing="ease-out"
                dot={<CustomDot />}
              />
              
              {/* Peak line */}
              <Line
                type="monotone"
                dataKey="peak"
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                opacity={0.5}
              />
              
              {/* Brush for zoom */}
              <Brush 
                dataKey="displayDate" 
                height={30} 
                stroke="#8b5cf6"
                fill="#f3f4f6"
                travellerWidth={10}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mini stats below chart */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Balance Actuelle</p>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(balanceData[balanceData.length - 1]?.balance || 0)}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center">
              <p className="text-sm text-slate-600">Gain Moyen</p>
              <InfoTooltip id="avgWin" />
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(kpis.avgWin)}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center">
              <p className="text-sm text-slate-600">Perte Moyenne</p>
              <InfoTooltip id="avgLoss" />
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(kpis.avgLoss)}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-center">
              <p className="text-sm text-slate-600">Sharpe Ratio</p>
              <InfoTooltip id="sharpeRatio" />
            </div>
            <p className="text-lg font-bold text-purple-600">
              {kpis.sharpeRatio.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Performance by Checklist Score */}
      {checklistPerformance.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-purple-600" />
              Performance par Score de Checklist
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={checklistPerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 11 }}
                    angle={-20}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
                            <p className="font-semibold text-sm">{data.range}</p>
                            <p className="text-xs mt-1">Sessions: {data.sessions}</p>
                            <p className="text-xs">Trades: {data.trades}</p>
                            <p className="text-xs">P&L Total: {formatCurrency(data.totalPnL)}</p>
                            <p className="text-xs">Taux de Réussite: {formatPercentage(data.winRate)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgPnL" name="P&L Moyen">
                    {checklistPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trading Patterns */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-600" />
              Patterns de Trading par Jour
            </h3>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={tradingPatterns.byDayOfWeek}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 10 }}
                  />
                  <Radar 
                    name="Taux de Réussite" 
                    dataKey="winRate" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                  />
                  <Radar 
                    name="Nombre de Trades" 
                    dataKey="trades" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.3}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Statistics */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
          <Brain className="w-5 h-5 mr-2 text-purple-600" />
          Statistiques Avancées
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Win/Loss Distribution */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">Distribution Gains/Pertes</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Meilleur Trade</span>
                <span className="text-sm font-bold text-green-600">{formatCurrency(kpis.bestTrade)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Pire Trade</span>
                <span className="text-sm font-bold text-red-600">{formatCurrency(kpis.worstTrade)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">P&L Moyen par Trade</span>
                <span className={`text-sm font-bold ${kpis.avgDailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(kpis.avgDailyPnL)}
                </span>
              </div>
            </div>
          </div>

          {/* Consecutive Trades */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">Séries Consécutives</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-slate-600">Gains Consécutifs Max</span>
                  <InfoTooltip id="consecutiveWins" />
                </div>
                <span className="text-sm font-bold text-green-600">{kpis.consecutiveWins}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-slate-600">Pertes Consécutives Max</span>
                  <InfoTooltip id="consecutiveLosses" />
                </div>
                <span className="text-sm font-bold text-red-600">{kpis.consecutiveLosses}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Trades Total</span>
                <span className="text-sm font-bold text-slate-700">{kpis.totalTrades}</span>
              </div>
            </div>
          </div>

          {/* Risk Metrics */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-700">Métriques de Risque</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Ratio Gain/Perte</span>
                <span className="text-sm font-bold text-purple-600">
                  {kpis.avgLoss > 0 ? (kpis.avgWin / kpis.avgLoss).toFixed(2) : '∞'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-slate-600">Expectancy</span>
                  <InfoTooltip id="expectancy" />
                </div>
                <span className={`text-sm font-bold ${kpis.avgDailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(kpis.avgDailyPnL)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm text-slate-600">Score de Risque</span>
                  <InfoTooltip id="riskScore" />
                </div>
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i <= Math.min(5, Math.max(1, 5 - Math.floor(kpis.maxDrawdown / 10)))
                          ? 'bg-green-500'
                          : 'bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trade Indicator */}
      {activeTrade && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 animate-pulse" />
            <div>
              <p className="font-semibold">Trade Actif en Cours</p>
              <p className="text-sm opacity-90">
                Démarré à {new Date(activeTrade.entry_time).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span className="font-mono text-lg">En cours...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;