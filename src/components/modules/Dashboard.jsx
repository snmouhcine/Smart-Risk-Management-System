import React from 'react';
import { 
  DollarSign, TrendingUp, Target, Shield, AlertTriangle, 
  Brain, Calculator, Lock, Skull, Flame, AlertCircle,
  LineChart, Cpu, Activity
} from 'lucide-react';
import { formatCurrency, formatPercentage, calculateMonthlyTargetAmount, calculateWeeklyTargetAmount } from '../../utils/formatters';

const Dashboard = ({ 
  calculateCurrentBalanceFromJournal,
  currentBalance,
  recommendations,
  drawdownProtection,
  monthlyTarget,
  weeklyTarget,
  initialCapital,
  tradingJournal,
  handleQuickAction,
  isAnalyzing,
  secureMode,
  getStatusStyles
}) => {
  // Calculs des objectifs
  const calculatedBalance = calculateCurrentBalanceFromJournal();
  const actualBalance = calculatedBalance || parseFloat(currentBalance) || 0;
  const monthlyTargetInfo = calculateMonthlyTargetAmount(actualBalance, initialCapital, monthlyTarget);
  const weeklyTargetInfo = calculateWeeklyTargetAmount(tradingJournal, actualBalance, weeklyTarget);
  return (
    <div className="space-y-6">
      {/* NOUVELLE Alerte de Protection Drawdown */}
      {drawdownProtection?.alert && (
        <div className={`p-6 rounded-2xl shadow-lg border-2 ${
          drawdownProtection.alert.color === 'red' ? 'bg-red-50 border-red-200' :
          drawdownProtection.alert.color === 'orange' ? 'bg-orange-50 border-orange-200' :
          drawdownProtection.alert.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              drawdownProtection.alert.color === 'red' ? 'bg-red-500' :
              drawdownProtection.alert.color === 'orange' ? 'bg-orange-500' :
              drawdownProtection.alert.color === 'yellow' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}>
              {drawdownProtection.alert.color === 'red' ? <Skull className="w-6 h-6 text-white" /> : 
               <AlertTriangle className="w-6 h-6 text-white" />}
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${
                drawdownProtection.alert.color === 'red' ? 'text-red-900' :
                drawdownProtection.alert.color === 'orange' ? 'text-orange-900' :
                drawdownProtection.alert.color === 'yellow' ? 'text-yellow-900' :
                'text-blue-900'
              }`}>
                {drawdownProtection.alert.title}
              </h3>
              <p className={`text-lg mb-4 ${
                drawdownProtection.alert.color === 'red' ? 'text-red-800' :
                drawdownProtection.alert.color === 'orange' ? 'text-orange-800' :
                drawdownProtection.alert.color === 'yellow' ? 'text-yellow-800' :
                'text-blue-800'
              }`}>
                {drawdownProtection.alert.message}
              </p>
              <div className={`grid md:grid-cols-3 gap-4 text-sm ${
                drawdownProtection.alert.color === 'red' ? 'text-red-700' :
                drawdownProtection.alert.color === 'orange' ? 'text-orange-700' :
                drawdownProtection.alert.color === 'yellow' ? 'text-yellow-700' :
                'text-blue-700'
              }`}>
                <div>
                  <span className="font-semibold">Pic Mensuel:</span> ${drawdownProtection.monthlyPeak.toFixed(2)}
                </div>
                <div>
                  <span className="font-semibold">Drawdown:</span> {drawdownProtection.drawdownPercent.toFixed(2)}%
                </div>
                <div>
                  <span className="font-semibold">Jours DD:</span> {drawdownProtection.daysInDrawdown}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards avec nouvelles métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className={`text-sm font-medium ${recommendations && recommendations.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {recommendations ? `${recommendations.totalPnLPercent >= 0 ? '+' : ''}${recommendations.totalPnLPercent.toFixed(2)}%` : '---'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            ${(() => {
              const calculatedBalance = calculateCurrentBalanceFromJournal();
              const displayBalance = calculatedBalance || parseFloat(currentBalance);
              return displayBalance ? displayBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '---';
            })()}
          </h3>
          <p className="text-slate-500 text-sm">
            Capital Actuel {calculateCurrentBalanceFromJournal() ? '(Auto)' : '(Manuel)'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-blue-600 text-sm font-medium">
              {drawdownProtection ? `DD: ${drawdownProtection.drawdownPercent.toFixed(1)}%` : 'Semaine'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {recommendations ? `${recommendations.weeklyPnLPercent.toFixed(2)}%` : '---'}
          </h3>
          <p className="text-slate-500 text-sm mb-3">Performance Hebdo</p>
          {recommendations && (
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  recommendations.weekProgress >= 100 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                  recommendations.weekProgress >= 80 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 
                  'bg-gradient-to-r from-blue-400 to-blue-500'
                }`}
                style={{ width: `${Math.min(100, recommendations.weekProgress)}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-purple-600 text-sm font-medium">
              {drawdownProtection?.monthlyPeak ? `Pic: $${drawdownProtection.monthlyPeak.toFixed(0)}` : 'Mensuel'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {recommendations ? `${recommendations.monthlyPnLPercent.toFixed(2)}%` : '---'}
          </h3>
          <p className="text-slate-500 text-sm mb-3">vs {monthlyTarget}% objectif</p>
          {recommendations && (
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  recommendations.monthProgress >= 100 ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 
                  recommendations.monthProgress >= 80 ? 'bg-gradient-to-r from-purple-400 to-purple-500' : 
                  'bg-gradient-to-r from-purple-300 to-purple-400'
                }`}
                style={{ width: `${Math.min(100, recommendations.monthProgress)}%` }}
              ></div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              drawdownProtection?.protectionLevel === 'emergency' ? 'bg-gradient-to-r from-red-600 to-red-800' :
              drawdownProtection?.protectionLevel === 'danger' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
              'bg-gradient-to-r from-orange-500 to-red-600'
            }`}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className={`text-sm font-medium ${
              drawdownProtection?.protectionLevel === 'emergency' ? 'text-red-600' :
              drawdownProtection?.protectionLevel === 'danger' ? 'text-orange-600' :
              'text-orange-600'
            }`}>
              {drawdownProtection ? `${(drawdownProtection.riskMultiplier * 100).toFixed(0)}%` : 'Risque'}
            </span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">
            {recommendations ? `${recommendations.adjustedRiskPercent.toFixed(2)}%` : '---'}
          </h3>
          <p className="text-slate-500 text-sm">
            {drawdownProtection?.protectionLevel === 'emergency' ? 'SURVIE' :
             drawdownProtection?.protectionLevel === 'danger' ? 'PROTECTION' : 
             'Par Trade'}
          </p>
        </div>
      </div>

      {/* Section Objectifs avec montants en $ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Objectif Mensuel */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Objectif Mensuel</h3>
                <p className="text-sm text-slate-600">{formatPercentage(monthlyTarget)} visé</p>
              </div>
            </div>
            {monthlyTargetInfo.isAchieved && (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Objectif</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(monthlyTargetInfo.targetAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Actuel</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(actualBalance)}</span>
            </div>

            {!monthlyTargetInfo.isAchieved ? (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Restant</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(monthlyTargetInfo.remainingAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Dépassement</span>
                <span className="text-xl font-bold text-green-600">+{formatCurrency(actualBalance - monthlyTargetInfo.targetAmount)}</span>
              </div>
            )}

            {/* Barre de progression */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Progression</span>
                <span>{Math.min(100, monthlyTargetInfo.currentProgress).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    monthlyTargetInfo.isAchieved ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                    monthlyTargetInfo.currentProgress >= 75 ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 
                    'bg-gradient-to-r from-blue-400 to-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, monthlyTargetInfo.currentProgress)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Objectif Hebdomadaire */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Objectif Hebdomadaire</h3>
                <p className="text-sm text-slate-600">{formatPercentage(weeklyTarget)} visé • Jour {weeklyTargetInfo.daysFromMonday}/7</p>
              </div>
            </div>
            {weeklyTargetInfo.isAchieved && (
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Capital début semaine</span>
              <span className="text-lg font-bold text-slate-600">{formatCurrency(weeklyTargetInfo.weekStartBalance)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">Objectif semaine</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(weeklyTargetInfo.targetAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-700">P&L semaine</span>
              <span className={`text-lg font-bold ${weeklyTargetInfo.currentWeeklyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {weeklyTargetInfo.currentWeeklyPnL >= 0 ? '+' : ''}{formatCurrency(weeklyTargetInfo.currentWeeklyPnL)}
              </span>
            </div>

            {!weeklyTargetInfo.isAchieved ? (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Restant à gagner</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(weeklyTargetInfo.remainingAmount)}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Dépassement</span>
                <span className="text-xl font-bold text-green-600">+{formatCurrency(weeklyTargetInfo.currentWeeklyPnL - weeklyTargetInfo.targetAmount)}</span>
              </div>
            )}

            {/* Barre de progression */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Progression</span>
                <span>{Math.min(100, weeklyTargetInfo.currentProgress).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    weeklyTargetInfo.isAchieved ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 
                    weeklyTargetInfo.currentProgress >= 75 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                    'bg-gradient-to-r from-green-400 to-green-500'
                  }`}
                  style={{ width: `${Math.min(100, weeklyTargetInfo.currentProgress)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommandations IA Avancées */}
      {recommendations && (
        <div className={`p-6 rounded-2xl shadow-lg bg-gradient-to-r ${getStatusStyles(recommendations.status)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Brain className="w-8 h-8" />
              <div>
                <h2 className="text-xl font-bold">{recommendations.message}</h2>
                <p className="opacity-90">Assistant IA Money Management Avancé</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {recommendations.totalPnL >= 0 ? '+' : ''}${recommendations.totalPnL.toFixed(2)}
              </div>
              <div className="opacity-90">P&L Total</div>
            </div>
          </div>
          
          {/* Nouveau conseil pour le prochain trade */}
          <div className="mb-4 p-4 bg-white/20 backdrop-blur rounded-xl">
            <h3 className="font-semibold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              💡 Conseil IA pour votre prochain trade
            </h3>
            <p className="text-lg font-medium">{recommendations.nextTradeAdvice}</p>
            {recommendations.patternWarning && (
              <div className="mt-2 text-sm opacity-90 flex items-center">
                <Flame className="w-4 h-4 mr-2" />
                Pattern d'échec détecté - Extra prudence requise !
              </div>
            )}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <LineChart className="w-5 h-5 mr-2" />
                📊 Métriques de Performance
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cette semaine:</span>
                  <span className="font-medium">{recommendations.weeklyPnLPercent.toFixed(2)}% / {recommendations.weeklyTarget.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Ce mois:</span>
                  <span className="font-medium">{recommendations.monthlyPnLPercent.toFixed(2)}% / {recommendations.monthlyTarget.toFixed(2)}%</span>
                </div>
                {drawdownProtection && (
                  <div className="flex justify-between">
                    <span>Drawdown:</span>
                    <span className="font-medium">{drawdownProtection.drawdownPercent.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <h3 className="font-semibold mb-3 flex items-center">
                <Cpu className="w-5 h-5 mr-2" />
                🧠 Recommandations IA
              </h3>
              <ul className="text-sm space-y-1">
                {recommendations.suggestions.slice(0, 3).map((suggestion, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-white rounded-full mt-2 flex-shrink-0"></span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions avec IA */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-purple-600" />
          Actions Intelligentes
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleQuickAction('calculator')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <Calculator className="w-5 h-5" />
            <span>Calculer Position</span>
          </button>
          
          <button 
            onClick={() => handleQuickAction('analyze')}
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Analyse...</span>
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                <span>Directeur IA</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => handleQuickAction('secure')}
            className={`px-6 py-4 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 ${
              secureMode 
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' 
                : 'bg-gradient-to-r from-slate-500 to-gray-500 text-white'
            }`}
          >
            <Lock className="w-5 h-5" />
            <span>{secureMode ? 'Désactiver' : 'Activer'} Mode Sécurisé</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 