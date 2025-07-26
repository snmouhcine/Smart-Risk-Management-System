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
  activeTrade,
  completedTrades = []
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
    if (!completedTrades || completedTrades.length === 0) return [];

    console.log('Processing completed trades:', completedTrades);

    // Group trades by entry score ranges
    const scoreRanges = [
      { min: 85, max: 100, label: 'Excellent (85-100%)', color: '#10b981' },
      { min: 70, max: 84, label: 'Bon (70-84%)', color: '#3b82f6' },
      { min: 60, max: 69, label: 'Acceptable (60-69%)', color: '#f59e0b' },
      { min: 0, max: 59, label: 'Risqué (<60%)', color: '#ef4444' }
    ];

    const performance = scoreRanges.map(range => {
      const trades = completedTrades.filter(trade => 
        trade.entry_score >= range.min && 
        trade.entry_score <= range.max
      );

      // Calculate win rate
      let wins = 0;
      trades.forEach(trade => {
        console.log('Trade result:', trade.trade_result, 'Entry score:', trade.entry_score);
        if (trade.trade_result === 'win') wins++;
      });

      return {
        range: range.label,
        color: range.color,
        trades: trades.length,
        winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0
      };
    });

    return performance;
  }, [completedTrades]);

  // Trading patterns analysis
  const tradingPatterns = useMemo(() => {
    if (!tradingJournal) return { byDayOfWeek: [], byHour: [] };

    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
    const dayIndices = [1, 2, 3, 4, 5]; // Monday to Friday
    const byDayOfWeek = dayNames.map((dayName, i) => ({
      day: dayName,
      trades: 0,
      totalPnL: 0,
      winRate: 0
    }));

    Object.entries(tradingJournal).forEach(([date, entry]) => {
      if (entry.hasTraded) {
        const dayIndex = new Date(date).getDay();
        // Only process weekdays (1-5)
        if (dayIndex >= 1 && dayIndex <= 5) {
          const arrayIndex = dayIndex - 1; // Convert to 0-based array index
          byDayOfWeek[arrayIndex].trades++;
          byDayOfWeek[arrayIndex].totalPnL += parseFloat(entry.pnl) || 0;
        }
      }
    });

    // Calculate win rates
    byDayOfWeek.forEach((day, index) => {
      if (day.trades > 0) {
        const dayIndex = index + 1; // Convert back to day index (1-5)
        const wins = Object.entries(tradingJournal).filter(([date, entry]) => {
          return new Date(date).getDay() === dayIndex &&
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

      {/* Performance by Checklist Score - Custom Beautiful Design */}
      {checklistPerformance.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-purple-50 via-white to-pink-50 p-6 rounded-2xl shadow-lg border border-purple-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mr-3">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              Performance par Score de Checklist
            </h3>
            
            <div className="space-y-4">
              {checklistPerformance.map((perf, index) => {
                // Calculate bar widths
                const maxTrades = Math.max(...checklistPerformance.map(p => p.trades), 1);
                const tradeBarWidth = (perf.trades / maxTrades) * 100;
                const winRateWidth = perf.winRate;
                
                return (
                  <div key={index} className="relative">
                    {/* Score Range Label */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: perf.color }}
                        />
                        <span className="text-sm font-medium text-slate-700">{perf.range}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="text-slate-600">{perf.trades} trades</span>
                        <span className="font-semibold" style={{ color: perf.color }}>
                          {perf.winRate.toFixed(1)}% réussite
                        </span>
                      </div>
                    </div>
                    
                    {/* Custom Progress Bars */}
                    <div className="space-y-2">
                      {/* Trades Bar */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">Nombre de trades</span>
                        </div>
                        <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                            style={{ 
                              width: `${tradeBarWidth}%`,
                              backgroundColor: perf.color,
                              opacity: 0.7
                            }}
                          >
                            {/* Animated shimmer effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -translate-x-full animate-[shimmer_2s_infinite]" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Win Rate Bar */}
                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-500">Taux de réussite</span>
                        </div>
                        <div className="h-6 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden flex items-center justify-end pr-2"
                            style={{ 
                              width: `${winRateWidth}%`,
                              background: `linear-gradient(90deg, ${perf.color}88, ${perf.color})`
                            }}
                          >
                            {perf.winRate > 20 && (
                              <span className="text-xs font-semibold text-white">
                                {perf.winRate.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Summary Stats */}
              <div className="mt-6 pt-4 border-t border-purple-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                    <p className="text-2xl font-bold text-purple-700">
                      {checklistPerformance.reduce((sum, p) => sum + p.trades, 0)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Total Trades</p>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                    <p className="text-2xl font-bold text-green-700">
                      {checklistPerformance.length > 0 
                        ? (checklistPerformance.reduce((sum, p) => sum + (p.winRate * p.trades), 0) / 
                           checklistPerformance.reduce((sum, p) => sum + p.trades, 0) || 0).toFixed(1)
                        : '0'}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">Taux Global</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add shimmer animation keyframes */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes shimmer {
                to {
                  transform: translateX(100%);
                }
              }
            `}} />
          </div>

          {/* Trading Patterns - Enhanced Custom Design */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-2xl shadow-lg border border-indigo-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mr-3">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              Patterns de Trading par Jour
            </h3>
            
            {/* Enhanced Day Analysis */}
            <div className="space-y-4">
              {/* Best/Worst Day Summary */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(() => {
                  const sortedByWinRate = [...tradingPatterns.byDayOfWeek]
                    .filter(d => d.trades > 0)
                    .sort((a, b) => b.winRate - a.winRate);
                  const bestDay = sortedByWinRate[0];
                  const worstDay = sortedByWinRate[sortedByWinRate.length - 1];
                  
                  return (
                    <>
                      {bestDay && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-3 rounded-xl border border-green-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-green-700">Meilleur Jour</span>
                            <Award className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="text-lg font-bold text-green-900">{bestDay.day}</p>
                          <p className="text-xs text-green-600">{bestDay.winRate.toFixed(0)}% réussite</p>
                        </div>
                      )}
                      {worstDay && (
                        <div className="bg-gradient-to-br from-red-50 to-orange-100 p-3 rounded-xl border border-red-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-red-700">Jour à Éviter</span>
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          </div>
                          <p className="text-lg font-bold text-red-900">{worstDay.day}</p>
                          <p className="text-xs text-red-600">{worstDay.winRate.toFixed(0)}% réussite</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* Detailed Day-by-Day Analysis */}
              <div className="space-y-3">
                {tradingPatterns.byDayOfWeek.map((dayData, index) => {
                  const maxTrades = Math.max(...tradingPatterns.byDayOfWeek.map(d => d.trades), 1);
                  
                  return (
                    <div 
                      key={dayData.day}
                      className="relative p-4 rounded-xl border bg-white border-slate-200 transition-all hover:shadow-md"
                    >
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                            dayData.winRate >= 70 ? 'bg-green-100 text-green-700' :
                            dayData.winRate >= 50 ? 'bg-blue-100 text-blue-700' :
                            dayData.winRate >= 30 ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {dayData.day.substring(0, 3).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{dayData.day}</p>
                            <p className="text-xs text-slate-500">
                              {dayData.trades} {dayData.trades === 1 ? 'trade' : 'trades'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Win Rate Badge */}
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            dayData.winRate >= 50 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {dayData.trades > 0 ? `${dayData.winRate.toFixed(0)}%` : '-'}
                          </div>
                          <p className="text-xs text-slate-500">Win Rate</p>
                        </div>
                      </div>
                      
                      {/* Visual Bars */}
                      {dayData.trades > 0 && (
                        <div className="space-y-2">
                          {/* Trade Volume Bar */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">Volume</span>
                              <span className="text-xs text-slate-600">{dayData.trades} trades</span>
                            </div>
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${(dayData.trades / maxTrades) * 100}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* Win/Loss Breakdown */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-slate-500">Gains vs Pertes</span>
                              <span className="text-xs text-slate-600">
                                {Math.round(dayData.trades * dayData.winRate / 100)}W / 
                                {Math.round(dayData.trades * (100 - dayData.winRate) / 100)}L
                              </span>
                            </div>
                            <div className="h-2 bg-red-200 rounded-full overflow-hidden flex">
                              <div 
                                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                                style={{ width: `${dayData.winRate}%` }}
                              />
                            </div>
                          </div>
                          
                          {/* P&L Indicator */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-500">P&L Total</span>
                            <div className={`flex items-center space-x-1 ${
                              dayData.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {dayData.totalPnL >= 0 ? (
                                <TrendingUp className="w-3 h-3" />
                              ) : (
                                <TrendingDown className="w-3 h-3" />
                              )}
                              <span className="text-sm font-semibold">
                                {formatCurrency(dayData.totalPnL)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* No trades indicator */}
                      {dayData.trades === 0 && (
                        <div className="text-center py-2">
                          <p className="text-xs text-slate-400">Aucun trade ce jour</p>
                        </div>
                      )}
                      
                    </div>
                  );
                })}
              </div>
              
              {/* Weekly Summary Stats */}
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl">
                <h4 className="text-sm font-semibold text-purple-800 mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-1" />
                  Résumé Hebdomadaire
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {tradingPatterns.byDayOfWeek.reduce((sum, d) => sum + d.trades, 0)}
                    </p>
                    <p className="text-xs text-purple-600">Trades/Semaine</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {tradingPatterns.byDayOfWeek.filter(d => d.trades > 0).length}
                    </p>
                    <p className="text-xs text-purple-600">Jours Actifs</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      tradingPatterns.byDayOfWeek.reduce((sum, d) => sum + d.totalPnL, 0) >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {formatCurrency(tradingPatterns.byDayOfWeek.reduce((sum, d) => sum + d.totalPnL, 0))}
                    </p>
                    <p className="text-xs text-purple-600">P&L Hebdo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {(() => {
                        const totalTrades = tradingPatterns.byDayOfWeek.reduce((sum, d) => sum + d.trades, 0);
                        const totalWins = tradingPatterns.byDayOfWeek.reduce((sum, d) => 
                          sum + Math.round(d.trades * d.winRate / 100), 0
                        );
                        return totalTrades > 0 ? Math.round((totalWins / totalTrades) * 100) : 0;
                      })()}%
                    </p>
                    <p className="text-xs text-purple-600">Win Rate Global</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Statistics - Custom Beautiful Design */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-purple-50 p-8 rounded-2xl shadow-xl border border-purple-100">
        <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg mr-3">
            <Brain className="w-6 h-6 text-white" />
          </div>
          Statistiques Avancées
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Win/Loss Distribution - Visual Card */}
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-red-100 rounded-full blur-2xl opacity-20" />
            
            <div className="relative">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                <div className="w-8 h-1 bg-gradient-to-r from-green-500 to-red-500 rounded-full mr-2" />
                Distribution Gains/Pertes
              </h4>
              
              {/* Visual representation of best/worst trades */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Amplitude des trades</span>
                </div>
                <div className="relative h-12 bg-slate-100 rounded-lg overflow-hidden">
                  {/* Center line */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-400" />
                  
                  {/* Best trade bar */}
                  {kpis.bestTrade > 0 && (
                    <div 
                      className="absolute top-1 bottom-1 left-1/2 bg-gradient-to-r from-green-400 to-green-600 rounded-r-md"
                      style={{ width: `${Math.min((kpis.bestTrade / (kpis.bestTrade + Math.abs(kpis.worstTrade))) * 50, 45)}%` }}
                    >
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                        +{kpis.bestTrade}
                      </span>
                    </div>
                  )}
                  
                  {/* Worst trade bar */}
                  {kpis.worstTrade < 0 && (
                    <div 
                      className="absolute top-1 bottom-1 right-1/2 bg-gradient-to-l from-red-400 to-red-600 rounded-l-md"
                      style={{ width: `${Math.min((Math.abs(kpis.worstTrade) / (kpis.bestTrade + Math.abs(kpis.worstTrade))) * 50, 45)}%` }}
                    >
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                        {kpis.worstTrade}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Stats details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-800">Meilleur Trade</span>
                  </div>
                  <span className="text-lg font-bold text-green-700">{formatCurrency(kpis.bestTrade)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-800">Pire Trade</span>
                  </div>
                  <span className="text-lg font-bold text-red-700">{formatCurrency(kpis.worstTrade)}</span>
                </div>
                
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  kpis.avgDailyPnL >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      kpis.avgDailyPnL >= 0 ? 'bg-blue-500' : 'bg-orange-500'
                    }`} />
                    <span className={`text-sm ${
                      kpis.avgDailyPnL >= 0 ? 'text-blue-800' : 'text-orange-800'
                    }`}>P&L Moyen</span>
                  </div>
                  <span className={`text-lg font-bold ${
                    kpis.avgDailyPnL >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    {formatCurrency(kpis.avgDailyPnL)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Consecutive Trades - Visual Streaks */}
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-2xl opacity-20" />
            
            <div className="relative">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mr-2" />
                Séries Consécutives
              </h4>
              
              {/* Visual streak representation */}
              <div className="mb-6">
                {/* Win streak */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-green-600 font-medium">Série de gains</span>
                    <span className="text-2xl font-bold text-green-600">{kpis.consecutiveWins}</span>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(Math.min(kpis.consecutiveWins, 10))].map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 h-3 bg-gradient-to-t from-green-500 to-green-400 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                    {kpis.consecutiveWins > 10 && (
                      <span className="text-xs text-green-600 font-bold">+{kpis.consecutiveWins - 10}</span>
                    )}
                  </div>
                </div>
                
                {/* Loss streak */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-red-600 font-medium">Série de pertes</span>
                    <span className="text-2xl font-bold text-red-600">{kpis.consecutiveLosses}</span>
                  </div>
                  <div className="flex space-x-1">
                    {[...Array(Math.min(kpis.consecutiveLosses, 10))].map((_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 h-3 bg-gradient-to-t from-red-500 to-red-400 rounded-full animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                    {kpis.consecutiveLosses > 10 && (
                      <span className="text-xs text-red-600 font-bold">+{kpis.consecutiveLosses - 10}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Total trades circular indicator */}
              <div className="relative mt-6">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#purpleGradient)"
                        strokeWidth="8"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(kpis.winningTrades / Math.max(kpis.totalTrades, 1)) * 352} 352`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#ec4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-slate-800">{kpis.totalTrades}</span>
                      <span className="text-xs text-slate-500">trades total</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-center space-x-4 mt-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-xs text-slate-600">{kpis.winningTrades} gains</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-xs text-slate-600">{kpis.losingTrades} pertes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Risk Metrics - Visual Gauges */}
          <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full blur-2xl opacity-20" />
            
            <div className="relative">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center">
                <div className="w-8 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full mr-2" />
                Métriques de Risque
              </h4>
              
              {/* Risk/Reward Ratio Visual */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600">Ratio Gain/Perte</span>
                  <span className="text-2xl font-bold text-indigo-600">
                    {kpis.avgLoss > 0 ? (kpis.avgWin / kpis.avgLoss).toFixed(2) : '∞'}:1
                  </span>
                </div>
                
                {/* Visual ratio bar */}
                <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div className="absolute inset-y-0 left-0 right-0 flex">
                    <div 
                      className="bg-gradient-to-r from-red-400 to-red-500 flex items-center justify-center"
                      style={{ width: kpis.avgLoss > 0 ? '33.33%' : '0%' }}
                    >
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center"
                      style={{ width: kpis.avgLoss > 0 ? `${Math.min(66.66 * (kpis.avgWin / kpis.avgLoss), 66.66)}%` : '66.66%' }}
                    >
                      <span className="text-xs font-bold text-white">
                        {kpis.avgLoss > 0 ? (kpis.avgWin / kpis.avgLoss).toFixed(1) : '∞'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Expectancy Meter */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xs text-slate-600">Expectancy</span>
                    <InfoTooltip id="expectancy" />
                  </div>
                  <span className={`text-lg font-bold ${kpis.avgDailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(kpis.avgDailyPnL)}
                  </span>
                </div>
                
                {/* Expectancy gauge */}
                <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-1000 ${
                      kpis.avgDailyPnL >= 0 
                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                        : 'bg-gradient-to-r from-red-600 to-red-400'
                    }`}
                    style={{ 
                      width: `${Math.min(Math.abs(kpis.avgDailyPnL) / 100 * 100, 100)}%` 
                    }}
                  />
                </div>
              </div>
              
              {/* Risk Score Stars */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-xs text-slate-600">Score de Risque</span>
                    <InfoTooltip id="riskScore" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map(i => {
                    const filled = i <= Math.min(5, Math.max(1, 5 - Math.floor(kpis.maxDrawdown / 10)));
                    return (
                      <div key={i} className="relative">
                        <Shield 
                          className={`w-8 h-8 transition-all duration-500 ${
                            filled 
                              ? 'text-indigo-500 fill-indigo-100' 
                              : 'text-slate-300'
                          }`}
                          style={{ 
                            transform: filled ? 'scale(1.1)' : 'scale(1)',
                            animationDelay: `${i * 100}ms`
                          }}
                        />
                        {filled && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                <p className="text-xs text-slate-500 mt-2">
                  {Math.min(5, Math.max(1, 5 - Math.floor(kpis.maxDrawdown / 10))) >= 4 
                    ? 'Excellent contrôle du risque' 
                    : Math.min(5, Math.max(1, 5 - Math.floor(kpis.maxDrawdown / 10))) >= 2
                    ? 'Risque modéré'
                    : 'Risque élevé - Attention!'}
                </p>
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