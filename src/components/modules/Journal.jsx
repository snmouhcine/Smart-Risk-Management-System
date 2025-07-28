import React, { useState } from 'react';
import { Calendar, AlertTriangle, BarChart3, X, ChevronLeft, ChevronRight, RotateCcw, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber, parseNumberInput } from '../../utils/formatters';

const Journal = ({
  tradingJournal,
  showDayModal,
  setShowDayModal,
  selectedDate,
  setSelectedDate,
  dayData,
  setDayData,
  handleDayClick,
  saveDayData,
  getJournalStats,
  getDaysInMonth,
  getFirstDayOfMonth,
  getDateKey,
  getDayStatus,
  deleteJournalEntry,
  deleteAllJournalEntries
}) => {
  const today = new Date();
  
  // État pour la navigation dans l'historique
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  // État pour les confirmations de suppression
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [dayToDelete, setDayToDelete] = useState(null);
  
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfMonth = getFirstDayOfMonth(viewDate);
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const stats = getJournalStats();

  // Fonctions de navigation
  const navigateMonth = (direction) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setViewDate(newDate);
  };

  const goToCurrentMonth = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Vérifier si on est sur le mois actuel
  const isCurrentMonth = viewDate.getMonth() === today.getMonth() && viewDate.getFullYear() === today.getFullYear();

  return (
    <div className="space-y-6">
      {/* Header du Journal */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <Calendar className="w-6 h-6 mr-3 text-green-600" />
              Journal de Trading Intelligent
            </h2>
            <p className="text-slate-600">Enregistrez vos performances - L'IA analysera vos patterns</p>
          </div>
          
          {/* Stats rapides avec nouvelles métriques */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">{stats.winRate.toFixed(1)}%</div>
              <div className="text-xs text-green-700">Win Rate</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{stats.totalTrades}</div>
              <div className="text-xs text-blue-700">Trades</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-purple-600">{stats.profitFactor.toFixed(2)}</div>
              <div className="text-xs text-purple-700">Profit Factor</div>
            </div>
          </div>
        </div>

        {/* Alerte pattern si nécessaire */}
        {stats.consecutiveLosses >= 2 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-medium text-red-800">
                ⚠️ Pattern d'échec détecté: {stats.consecutiveLosses} pertes consécutives
              </span>
            </div>
          </div>
        )}

        {/* Calendrier */}
        <div>
          {/* Header du calendrier avec navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {/* Boutons de navigation */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Mois précédent"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                
                <button
                  onClick={() => navigateMonth(1)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Mois suivant"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
                
                {!isCurrentMonth && (
                  <button
                    onClick={goToCurrentMonth}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                    title="Retour au mois actuel"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Titre du mois avec indicateur */}
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-slate-800">
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                {isCurrentMonth && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Actuel
                  </span>
                )}
                {!isCurrentMonth && (
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                    Historique
                  </span>
                )}
              </div>
            </div>

            {/* Légende et bouton de suppression globale */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-slate-600">Gain</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-slate-600">Perte</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-slate-300 rounded"></div>
                  <span className="text-slate-600">No Trade</span>
                </div>
              </div>
              
              {/* Bouton suppression globale */}
              {Object.keys(tradingJournal).length > 0 && (
                <button
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer tous les trades"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Tout effacer</span>
                </button>
              )}
            </div>
          </div>

          {/* Grille du calendrier */}
          <div className="grid grid-cols-7 gap-2">
            {/* Noms des jours */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-slate-500 p-2">
                {day}
              </div>
            ))}
            
            {/* Cases vides pour les jours précédents */}
            {Array.from({ length: firstDayOfMonth - 1 }, (_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}
            
            {/* Jours du mois */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateKey = getDateKey(currentYear, currentMonth, day);
              const status = getDayStatus(dateKey);
              const isToday = isCurrentMonth && day === today.getDate();
              const dayData = tradingJournal[dateKey];
              
              // Vérifier si c'est un jour futur
              const currentDate = new Date(currentYear, currentMonth, day);
              const isFutureDay = currentDate > today;
              
              const getStatusStyles = () => {
                if (isFutureDay) {
                  return 'bg-slate-50 text-slate-400 cursor-not-allowed';
                }
                switch (status) {
                  case 'profit':
                    return 'bg-green-500 text-white hover:bg-green-600';
                  case 'loss':
                    return 'bg-red-500 text-white hover:bg-red-600';
                  case 'no-trade':
                    return 'bg-slate-300 text-slate-700 hover:bg-slate-400';
                  case 'breakeven':
                    return 'bg-yellow-500 text-white hover:bg-yellow-600';
                  default:
                    return 'bg-slate-100 text-slate-700 hover:bg-slate-200';
                }
              };

              return (
                <button
                  key={day}
                  onClick={() => !isFutureDay && handleDayClick(currentYear, currentMonth, day)}
                  disabled={isFutureDay}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${!isFutureDay ? 'hover:shadow-md' : ''} ${getStatusStyles()} ${
                    isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">{day}</div>
                    {dayData && dayData.hasTraded && (
                      <div className="text-xs mt-1">
                        {(() => {
                          const trades = dayData.pnl ? dayData.pnl.split(',').map(t => parseFloat(t.trim())).filter(t => !isNaN(t)) : [];
                          const total = trades.reduce((sum, t) => sum + t, 0);
                          return (
                            <>
                              {total > 0 ? '+' : ''}
                              {formatCurrency(total)}
                              {trades.length > 1 && (
                                <div className="text-[10px] opacity-80">
                                  ({trades.length} trades)
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    )}
                    {dayData && !dayData.hasTraded && (
                      <div className="text-xs mt-1">-</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats détaillées avec nouvelles métriques */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
          Statistiques Avancées
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalPnL >= 0 ? '+' : ''}{stats.totalPnL.toFixed(2)}
            </div>
            <div className="text-sm text-green-700">P&L Total</div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.winRate.toFixed(2)}%</div>
            <div className="text-sm text-blue-700">Win Rate</div>
            <div className="text-xs text-blue-600">{stats.winningTrades}W / {stats.losingTrades}L</div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">${stats.avgWin.toFixed(2)}</div>
            <div className="text-sm text-purple-700">Gain Moyen</div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">${stats.avgLoss.toFixed(2)}</div>
            <div className="text-sm text-orange-700">Perte Moyenne</div>
          </div>
        </div>

        {/* Nouvelles métriques IA */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg ${stats.consecutiveLosses >= 3 ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}>
            <div className="text-lg font-bold text-slate-900">{stats.consecutiveLosses}</div>
            <div className="text-sm text-slate-700">Pertes Consécutives</div>
            {stats.consecutiveLosses >= 3 && (
              <div className="text-xs text-red-600 mt-1">⚠️ Pattern risqué</div>
            )}
          </div>
          
          <div className={`p-4 rounded-lg ${stats.profitFactor >= 2 ? 'bg-green-50' : stats.profitFactor >= 1 ? 'bg-yellow-50' : 'bg-red-50'}`}>
            <div className="text-lg font-bold text-slate-900">{stats.profitFactor.toFixed(2)}</div>
            <div className="text-sm text-slate-700">Profit Factor</div>
            <div className="text-xs text-slate-600 mt-1">
              {stats.profitFactor >= 2 ? '✅ Excellent' : stats.profitFactor >= 1 ? '🔶 Correct' : '⚠️ Améliorer'}
            </div>
          </div>
        </div>
      </div>

      {/* Modal pour saisir les données journalières */}
      {showDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-900">
                {selectedDate.day} {monthNames[selectedDate.month]} {selectedDate.year}
              </h3>
              <button
                onClick={() => setShowDayModal(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="hasTraded"
                  checked={dayData.hasTraded}
                  onChange={(e) => setDayData(prev => ({ ...prev, hasTraded: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="hasTraded" className="text-sm font-medium text-slate-700">
                  J'ai tradé ce jour-là
                </label>
              </div>

              {dayData.hasTraded && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      P&L par trade ($)
                    </label>
                    <div className="text-xs text-slate-500 mb-2">
                      Entrez chaque trade séparé par une virgule (ex: 150, -75, 200)
                    </div>
                    <input
                      type="text"
                      value={dayData.pnl}
                      onChange={(e) => setDayData(prev => ({ ...prev, pnl: e.target.value }))}
                      placeholder="Ex: 150, -75.50, 200"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {dayData.pnl && (
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                        <div className="text-sm">
                          {(() => {
                            const trades = dayData.pnl.split(',').map(t => parseFloat(t.trim())).filter(t => !isNaN(t));
                            const total = trades.reduce((sum, t) => sum + t, 0);
                            return (
                              <>
                                <div className="font-medium text-slate-700">
                                  {trades.length} trade{trades.length > 1 ? 's' : ''} • Total: {formatCurrency(total)}
                                </div>
                                {trades.length > 0 && (
                                  <div className="text-xs text-slate-600 mt-1">
                                    Détail: {trades.map(t => formatCurrency(t)).join(' | ')}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={dayData.notes}
                  onChange={(e) => setDayData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Stratégie, marché, état psychologique..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                {/* Bouton supprimer si le jour a des données */}
                {tradingJournal[selectedDate.dateKey] && (
                  <button
                    onClick={() => {
                      setDayToDelete(selectedDate.dateKey);
                      setShowDayModal(false);
                    }}
                    className="px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer
                  </button>
                )}
                
                <div className="flex-1 flex space-x-3">
                  <button
                    onClick={() => setShowDayModal(false)}
                    className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveDayData}
                    disabled={dayData.hasTraded && !dayData.pnl.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour supprimer un jour */}
      {dayToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer les données de trading de cette journée ?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDayToDelete(null)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteJournalEntry(dayToDelete);
                    setDayToDelete(null);
                  } catch (error) {
                    console.error('Erreur suppression:', error);
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour tout supprimer */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Supprimer toutes les données
            </h3>
            <div className="mb-6 space-y-2">
              <p className="text-slate-600">
                Cette action supprimera définitivement TOUTES vos données de trading :
              </p>
              <ul className="text-sm text-slate-500 space-y-1 ml-4">
                <li>• Tous les trades enregistrés</li>
                <li>• Toutes les notes</li>
                <li>• Tout l'historique de performance</li>
              </ul>
              <p className="text-red-600 font-medium mt-4">
                Cette action est irréversible !
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  try {
                    await deleteAllJournalEntries();
                    setShowDeleteAllConfirm(false);
                  } catch (error) {
                    console.error('Erreur suppression globale:', error);
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Tout supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal; 