import React from 'react';
import { Calculator, CheckCircle, Skull, Brain } from 'lucide-react';

const CalculatorModule = ({
  capital,
  setCapital,
  riskPerTrade,
  dailyLossMax,
  stopLossTicks,
  setStopLossTicks,
  calculateCurrentBalanceFromJournal,
  currentBalance,
  results,
  recommendations,
  drawdownProtection,
  aiRecommendedRisk,
  aiMaxDailyLoss
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
          <Calculator className="w-6 h-6 mr-3 text-blue-600" />
          Calculateur de Position Intelligent
        </h2>
        
        {/* Indicateur si les recommandations IA sont actives */}
        {(aiRecommendedRisk !== null || aiMaxDailyLoss !== null) && (
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-800">
                🤖 Paramètres optimisés par le Directeur IA
              </span>
            </div>
            {aiRecommendedRisk !== null && (
              <div className="text-sm text-purple-700 mt-1">
                • Risque ajusté: {aiRecommendedRisk.toFixed(2)}% (au lieu de {riskPerTrade}%)
              </div>
            )}
            {aiMaxDailyLoss !== null && (
              <div className="text-sm text-purple-700">
                • Perte max ajustée: {aiMaxDailyLoss.toFixed(2)}% (au lieu de {dailyLossMax}%)
              </div>
            )}
          </div>
        )}
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Capital Trading ($)</label>
            <input
              type="number"
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              placeholder={(() => {
                const calculatedBalance = calculateCurrentBalanceFromJournal();
                return calculatedBalance ? calculatedBalance.toString() : currentBalance || "10000";
              })()}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {(() => {
              const calculatedBalance = calculateCurrentBalanceFromJournal();
              return calculatedBalance && (
                <div className="text-xs text-blue-600 mt-1">Auto du Journal: ${calculatedBalance.toLocaleString()}</div>
              );
            })()}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Risque par Trade (%)
              {aiRecommendedRisk !== null && (
                <span className="ml-2 text-xs text-purple-600">IA Active</span>
              )}
            </label>
            <input
              type="number"
              value={aiRecommendedRisk !== null ? aiRecommendedRisk.toFixed(2) : riskPerTrade}
              step="0.1"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              readOnly
            />
            <div className="text-xs text-purple-600 mt-1">
              {aiRecommendedRisk !== null 
                ? `✨ Optimisé par IA (base: ${riskPerTrade}%)`
                : recommendations && recommendations.riskAdjustment !== 1 
                ? `Ajusté par IA: ${recommendations.adjustedRiskPercent.toFixed(2)}%` 
                : 'Configuré dans Paramètres'
              }
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Perte Journalière Max (%)
              {aiMaxDailyLoss !== null && (
                <span className="ml-2 text-xs text-purple-600">IA Active</span>
              )}
            </label>
            <input
              type="number"
              value={aiMaxDailyLoss !== null ? aiMaxDailyLoss.toFixed(2) : dailyLossMax}
              step="0.1"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50"
              readOnly
            />
            <div className="text-xs text-slate-500 mt-1">
              {aiMaxDailyLoss !== null 
                ? `✨ Optimisé par IA (base: ${dailyLossMax}%)`
                : 'Configuré dans Paramètres'
              }
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Stop Loss (Ticks)</label>
            <input
              type="number"
              value={stopLossTicks}
              onChange={(e) => setStopLossTicks(e.target.value)}
              placeholder="20"
              className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="text-xs text-blue-600 mt-1">1 tick = 0.25 points</div>
          </div>
        </div>

        {results && results.recommendations.length > 0 && (
          <div className="space-y-6">
            {/* Résumé avec alertes IA */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">📊 Résumé du Trade</h3>
                {drawdownProtection?.alert && (
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    drawdownProtection.alert.color === 'red' ? 'bg-red-500 text-white' :
                    drawdownProtection.alert.color === 'orange' ? 'bg-orange-500 text-white' :
                    'bg-yellow-500 text-white'
                  }`}>
                    {drawdownProtection.protectionLevel.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">${results.maxRiskPerTrade.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">
                    Risque {aiRecommendedRisk !== null ? 'IA' : results.effectiveRiskPercent !== results.originalRiskPercent ? 'Ajusté IA' : 'Standard'}
                  </div>
                  {results.effectiveRiskPercent !== results.originalRiskPercent && (
                    <div className="text-xs text-purple-600">(était ${((results.capital * results.originalRiskPercent) / 100).toFixed(2)}$)</div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{results.stopLossTicks} ticks</div>
                  <div className="text-sm text-slate-600">{(results.stopLossTicks * 0.25).toFixed(1)} points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{results.maxTradesPerDay}</div>
                  <div className="text-sm text-slate-600">Trades Max/Jour</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">${results.maxDailyLoss.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">Limite Journalière</div>
                </div>
              </div>
            </div>

            {/* Recommandations de positions */}
            <div className="space-y-4">
              {results.recommendations.map((rec, index) => (
                <div key={rec.symbol} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{rec.contract.name}</h3>
                      <p className="text-slate-600">{rec.contract.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">{rec.recommendedContracts}</div>
                      <div className="text-sm text-slate-500">contrats</div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-5 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="font-medium text-slate-700">Risque Total</div>
                      <div className="text-lg font-bold text-red-600">${rec.totalRisk.toFixed(2)}</div>
                      <div className="text-slate-500">{rec.riskPercent.toFixed(2)}%</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="font-medium text-slate-700">Marge</div>
                      <div className="text-lg font-bold text-gray-900">${rec.totalMargin.toLocaleString()}</div>
                      <div className="text-slate-500">{rec.marginPercent.toFixed(1)}%</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-slate-700">Gain 1:1</div>
                      <div className="text-lg font-bold text-green-600">+${rec.potential1to1.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-slate-700">Gain 1:2</div>
                      <div className="text-lg font-bold text-green-600">+${rec.potential1to2.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-slate-700">Gain 1:3</div>
                      <div className="text-lg font-bold text-green-600">+${rec.potential1to3.toFixed(2)}</div>
                    </div>
                  </div>

                  {index === 0 && (
                    <div className={`mt-4 p-3 rounded-lg border ${
                      drawdownProtection?.protectionLevel === 'emergency' ? 'bg-red-50 border-red-200' :
                      drawdownProtection?.protectionLevel === 'danger' ? 'bg-orange-50 border-orange-200' :
                      aiRecommendedRisk !== null ? 'bg-purple-50 border-purple-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center">
                        {drawdownProtection?.protectionLevel === 'emergency' ? 
                          <Skull className="w-4 h-4 text-red-600 mr-2" /> :
                          aiRecommendedRisk !== null ?
                          <Brain className="w-4 h-4 text-purple-600 mr-2" /> :
                          <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                        }
                        <span className={`text-sm font-medium ${
                          drawdownProtection?.protectionLevel === 'emergency' ? 'text-red-800' :
                          drawdownProtection?.protectionLevel === 'danger' ? 'text-orange-800' : 
                          aiRecommendedRisk !== null ? 'text-purple-800' :
                          'text-green-800'
                        }`}>
                          {drawdownProtection?.protectionLevel === 'emergency' ? '🚨 URGENCE:' :
                           drawdownProtection?.protectionLevel === 'danger' ? '⚠️ ATTENTION:' : 
                           aiRecommendedRisk !== null ? '🤖 DIRECTEUR IA:' : '✅ RECOMMANDÉ:'}
                          {' '}{rec.recommendedContracts} × {rec.symbol} | SL: {results.stopLossTicks} ticks | Risque: ${rec.totalRisk.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculatorModule; 