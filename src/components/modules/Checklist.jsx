import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  AlertCircle, 
  ChevronRight,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  TrendingUp,
  LogOut,
  ChevronUp,
  ChevronDown,
  Copy,
  FileText,
  Target,
  Shield,
  Brain,
  Clock,
  Zap,
  Award,
  Timer,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';
import { formatPercentage } from '../../utils/formatters';

// Liste des symboles futures uniquement
const TRADING_SYMBOLS = [
  // Indices Futures
  'NQ',   // E-mini Nasdaq-100
  'MNQ',  // Micro E-mini Nasdaq-100
  'ES',   // E-mini S&P 500
  'MES',  // Micro E-mini S&P 500
  'YM',   // E-mini Dow
  'MYM',  // Micro E-mini Dow
  'RTY',  // E-mini Russell 2000
  'M2K',  // Micro E-mini Russell 2000
  // Commodities Futures
  'CL',   // Crude Oil
  'GC',   // Gold
  'SI',   // Silver
  // Treasury Futures
  'ZB',   // 30-Year T-Bond
  'ZN',   // 10-Year T-Note
  'ZF',   // 5-Year T-Note
  'ZT'    // 2-Year T-Note
];

const Checklist = ({
  userChecklistItems,
  checklistTemplates,
  checklistSessions,
  saveChecklistSession,
  deleteChecklistSession,
  deleteAllChecklistSessions,
  saveUserChecklistItem,
  updateUserChecklistItem,
  deleteUserChecklistItem,
  copyDefaultTemplates,
  loadingChecklist,
  activeTrade,
  createActiveTrade,
  closeActiveTrade,
  completedTrades,
  deleteCompletedTrade,
  deleteAllCompletedTrades
}) => {
  const [activeTab, setActiveTab] = useState('entry');
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [isManageMode, setIsManageMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    weight: 10,
    is_mandatory: false,
    category: 'Personnel'
  });
  
  // État pour les détails du trade
  const [tradeDetails, setTradeDetails] = useState({
    symbol: 'NQ' // Symbole futures par défaut
  });
  
  // État pour le popup de résultat du trade
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [pendingExitSession, setPendingExitSession] = useState(null);
  
  // État pour le timer du trade
  const [tradeStartTime, setTradeStartTime] = useState(null);
  const [tradeDuration, setTradeDuration] = useState(0);

  // Debug: Vérifier les props reçues
  useEffect(() => {
    console.log('🔍 Checklist Props:', {
      activeTrade,
      createActiveTrade: typeof createActiveTrade,
      closeActiveTrade: typeof closeActiveTrade
    });
  }, [activeTrade, createActiveTrade, closeActiveTrade]);

  // Effet pour basculer automatiquement vers l'onglet exit si un trade est actif
  useEffect(() => {
    if (activeTrade) {
      console.log('📍 Trade actif détecté:', activeTrade);
      setActiveTab('exit');
      setTradeStartTime(new Date(activeTrade.entry_time));
    } else {
      console.log('📍 Aucun trade actif');
      setTradeStartTime(null);
      setTradeDuration(0);
    }
  }, [activeTrade]);

  // Timer pour la durée du trade
  useEffect(() => {
    if (tradeStartTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now - tradeStartTime) / 1000);
        setTradeDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [tradeStartTime]);

  // Formater la durée du trade
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Obtenir les items de checklist pour l'onglet actuel
  const getChecklistItems = () => {
    const userItems = userChecklistItems?.filter(item => item.type === activeTab && item.is_active) || [];
    
    // Si l'utilisateur n'a pas d'items, afficher les templates par défaut
    if (userItems.length === 0) {
      return checklistTemplates?.filter(item => item.type === activeTab) || [];
    }
    
    return userItems.sort((a, b) => a.order_index - b.order_index);
  };

  const items = getChecklistItems();
  const isUsingDefaults = items.length > 0 && items[0].user_id === undefined;

  // Calculer le score total
  const calculateScore = () => {
    let score = 0;
    let mandatoryMet = true;

    items.forEach(item => {
      if (checkedItems.has(item.id)) {
        score += item.weight;
      } else if (item.is_mandatory) {
        mandatoryMet = false;
      }
    });

    return { score, mandatoryMet };
  };

  const { score, mandatoryMet } = calculateScore();

  // Déterminer le statut selon la couleur et le message
  const getStatus = () => {
    if (activeTab === 'entry') {
      if (!mandatoryMet) return { color: 'red', level: 'BLOQUÉ', gradient: 'from-red-500 to-red-600' };
      if (score < 60) return { color: 'red', level: 'RISQUE ÉLEVÉ', gradient: 'from-red-500 to-red-600' };
      if (score < 85) return { color: 'yellow', level: 'ACCEPTABLE', gradient: 'from-yellow-500 to-orange-500' };
      return { color: 'green', level: 'EXCELLENT', gradient: 'from-green-500 to-emerald-600' };
    } else {
      if (score >= 40) return { color: 'green', level: 'SORTIR MAINTENANT', gradient: 'from-green-500 to-emerald-600' };
      if (score >= 25) return { color: 'yellow', level: 'À CONSIDÉRER', gradient: 'from-yellow-500 to-orange-500' };
      return { color: 'gray', level: 'CONSERVER', gradient: 'from-gray-500 to-slate-600' };
    }
  };

  const status = getStatus();

  // Gérer le changement de checkbox
  const handleCheck = (itemId) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId);
    } else {
      newChecked.add(itemId);
    }
    setCheckedItems(newChecked);
  };

  // Sauvegarder la session de checklist
  const handleSaveSession = async () => {
    const sessionData = {
      type: activeTab,
      checked_items: Array.from(checkedItems),
      item_details: items.map(item => ({
        id: item.id,
        name: item.name,
        weight: item.weight,
        checked: checkedItems.has(item.id)
      })),
      total_score: score,
      status: 'completed',
      trade_date: new Date().toISOString().split('T')[0],
      symbol: tradeDetails.symbol // Ajouter le symbole pour toutes les sessions
    };

    try {
      console.log('📊 Sauvegarde session...', { activeTab, score, mandatoryMet });
      const savedSession = await saveChecklistSession(sessionData);
      console.log('✅ Session sauvegardée:', savedSession);
      
      // Si c'est une entrée, créer un trade actif
      if (activeTab === 'entry' && score >= 60 && mandatoryMet) {
        console.log('🚀 Création du trade actif...');
        const newTrade = await createActiveTrade({
          entry_session_id: savedSession.id,
          entry_score: score,
          symbol: tradeDetails.symbol
        });
        console.log('✅ Trade créé:', newTrade);
      }
      
      // Si c'est une sortie et qu'il y a un trade actif, montrer le popup de résultat
      if (activeTab === 'exit' && activeTrade && score >= 40) {
        console.log('🏁 Préparation fermeture du trade...');
        setPendingExitSession(savedSession);
        setShowResultPopup(true);
        return; // Ne pas fermer le trade tout de suite, attendre le choix du résultat
      }
      
      // Réinitialiser après sauvegarde
      setCheckedItems(new Set());
    } catch (error) {
      console.error('❌ Erreur sauvegarde session:', error);
      alert('Erreur lors de la sauvegarde. Vérifiez la console.');
    }
  };

  // Procéder au trade (entrée) ou sortir du trade (sortie)
  const handleProceed = async () => {
    if (activeTab === 'entry') {
      // Sauvegarder la session et créer un trade actif
      await handleSaveSession();
    } else {
      // Sauvegarder la session et fermer le trade actif
      await handleSaveSession();
    }
  };

  // Icônes de catégorie
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Analyse Technique': return <ChevronRight className="w-4 h-4" />;
      case 'Gestion du Risque': return <Shield className="w-4 h-4" />;
      case 'Conditions de Marché': return <Target className="w-4 h-4" />;
      case 'Psychologie': return <Brain className="w-4 h-4" />;
      case 'Objectifs de Profit': return <TrendingUp className="w-4 h-4" />;
      case 'Structure de Marché': return <FileText className="w-4 h-4" />;
      case 'Temps et Événements': return <Clock className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  // Regrouper les items par catégorie
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Autre';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Gérer la gestion des items
  const handleAddItem = async () => {
    if (!newItem.name || newItem.weight <= 0) return;

    const itemData = {
      ...newItem,
      type: activeTab,
      order_index: items.length
    };

    try {
      await saveUserChecklistItem(itemData);
      setShowAddForm(false);
      setNewItem({
        name: '',
        description: '',
        weight: 10,
        is_mandatory: false,
        category: 'Personnel'
      });
    } catch (error) {
      console.error('Erreur ajout item:', error);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      await updateUserChecklistItem(itemId, updates);
      setEditingItem(null);
    } catch (error) {
      console.error('Erreur mise à jour item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      try {
        await deleteUserChecklistItem(itemId);
      } catch (error) {
        console.error('Erreur suppression item:', error);
      }
    }
  };

  const handleCopyDefaults = async () => {
    if (window.confirm('Cela copiera tous les éléments de checklist par défaut dans votre checklist personnelle. Continuer ?')) {
      try {
        await copyDefaultTemplates();
      } catch (error) {
        console.error('Erreur copie des défauts:', error);
      }
    }
  };

  // Gérer la fermeture du trade avec résultat
  const handleCloseTradeWithResult = async (result) => {
    if (!pendingExitSession || !activeTrade) return;
    
    try {
      console.log('🏁 Fermeture du trade avec résultat:', result);
      const closedTrade = await closeActiveTrade(pendingExitSession.id, result, pendingExitSession.total_score);
      console.log('✅ Trade fermé:', closedTrade);
      
      // Réinitialiser les états
      setShowResultPopup(false);
      setPendingExitSession(null);
      setCheckedItems(new Set());
    } catch (error) {
      console.error('❌ Erreur fermeture trade:', error);
      alert('Erreur lors de la fermeture du trade.');
    }
  };

  // Gérer la suppression d'une session
  const handleDeleteSession = async (sessionId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      try {
        console.log('🗑️ Tentative de suppression session:', sessionId);
        await deleteChecklistSession(sessionId);
        console.log('✅ Session supprimée avec succès');
      } catch (error) {
        console.error('❌ Erreur suppression session:', error);
        alert(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
      }
    }
  };
  
  // Gérer la suppression de toutes les sessions
  const handleDeleteAllSessions = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ? Cette action est irréversible.')) {
      try {
        console.log('🗑️ Suppression de tout l\'historique...');
        await deleteAllChecklistSessions();
        console.log('✅ Historique supprimé avec succès');
      } catch (error) {
        console.error('❌ Erreur suppression historique:', error);
        alert(`Erreur lors de la suppression de l'historique: ${error.message || 'Erreur inconnue'}`);
      }
    }
  };
  
  // Gérer la suppression d'un trade
  const handleDeleteTrade = async (tradeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce trade ?')) {
      try {
        console.log('🗑️ Tentative de suppression trade:', tradeId);
        await deleteCompletedTrade(tradeId);
        console.log('✅ Trade supprimé avec succès');
      } catch (error) {
        console.error('❌ Erreur suppression trade:', error);
        alert(`Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}`);
      }
    }
  };
  
  // Gérer la suppression de tous les trades
  const handleDeleteAllTrades = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique des trades ? Cette action est irréversible.')) {
      try {
        console.log('🗑️ Suppression de tous les trades...');
        await deleteAllCompletedTrades();
        console.log('✅ Tous les trades supprimés avec succès');
      } catch (error) {
        console.error('❌ Erreur suppression trades:', error);
        alert(`Erreur lors de la suppression des trades: ${error.message || 'Erreur inconnue'}`);
      }
    }
  };

  // Vérifier si on peut procéder (pour entrée) ou devrait sortir (pour sortie)
  const canProceed = activeTab === 'entry' 
    ? score >= 60 && mandatoryMet && !activeTrade
    : score >= 40 && activeTrade;

  // Calculer le poids total
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const isWeightValid = totalWeight === 100;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center">
              <CheckSquare className="w-6 h-6 mr-3 text-purple-600" />
              Système de Checklist Trading
            </h2>
            <p className="text-slate-600">Validation systématique avant chaque décision de trading</p>
          </div>
          
          <button
            onClick={() => setIsManageMode(!isManageMode)}
            className="flex items-center space-x-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>{isManageMode ? 'Terminé' : 'Gérer'}</span>
          </button>
        </div>

        {/* Indicateur de trade actif */}
        {activeTrade && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-blue-600 animate-pulse" />
                <div>
                  <h3 className="font-semibold text-blue-900">Trade en cours</h3>
                  <p className="text-sm text-blue-700">Durée: {formatDuration(tradeDuration)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-700">{formatDuration(tradeDuration)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Onglets */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => {
              if (!activeTrade) {
                setActiveTab('entry');
                setCheckedItems(new Set());
              }
            }}
            disabled={activeTrade}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'entry'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : activeTrade 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <LogOut className="w-5 h-5 rotate-180" />
            <span>Checklist d'Entrée</span>
          </button>
          <button
            onClick={() => {
              if (activeTrade) {
                setActiveTab('exit');
                setCheckedItems(new Set());
              }
            }}
            disabled={!activeTrade}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'exit'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : !activeTrade
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            } ${activeTrade && activeTab === 'exit' ? 'animate-pulse' : ''}`}
          >
            <LogOut className="w-5 h-5" />
            <span>Checklist de Sortie</span>
          </button>
        </div>

        {/* Indicateur de statut */}
        {!isManageMode && (
          <div className="mb-6">
            {/* Avis d'utilisation des défauts */}
            {isUsingDefaults && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2 text-blue-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">Utilisation du modèle par défaut. Créez votre checklist personnalisée pour de meilleurs résultats.</span>
                </div>
                <button
                  onClick={handleCopyDefaults}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copier dans Ma Checklist</span>
                </button>
              </div>
            )}

            {/* Affichage du Score */}
            <div className="flex flex-col items-center">
              <div className={`relative w-48 h-48 mb-4`}>
                {/* Cercle de fond */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    fill="none"
                  />
                  {/* Cercle de progression */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="16"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(score / 100) * 553} 553`}
                    className="transition-all duration-500 ease-out"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" className={`${
                        status.color === 'green' ? 'text-green-500' : 
                        status.color === 'yellow' ? 'text-yellow-500' : 
                        status.color === 'red' ? 'text-red-500' : 
                        'text-gray-500'
                      }`} stopColor="currentColor" />
                      <stop offset="100%" className={`${
                        status.color === 'green' ? 'text-emerald-600' : 
                        status.color === 'yellow' ? 'text-orange-500' : 
                        status.color === 'red' ? 'text-red-600' : 
                        'text-slate-600'
                      }`} stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                
                {/* Contenu central */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-slate-900">{score}%</div>
                  <div className={`text-sm font-medium mt-1 ${
                    status.color === 'green' ? 'text-green-600' : 
                    status.color === 'yellow' ? 'text-yellow-600' : 
                    status.color === 'red' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {status.level}
                  </div>
                </div>
              </div>

              {/* Avertissement pour les items obligatoires */}
              {!mandatoryMet && activeTab === 'entry' && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Les éléments obligatoires doivent être cochés</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Éléments de la Checklist */}
        <div className="space-y-4">
          {!isManageMode ? (
            // Vue checklist normale
            Object.entries(groupedItems).map(([category, categoryItems]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                  {getCategoryIcon(category)}
                  <span>{category}</span>
                </div>
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      checkedItems.has(item.id)
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={checkedItems.has(item.id)}
                        onChange={() => handleCheck(item.id)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">{item.name}</span>
                          {item.is_mandatory && (
                            <span className="text-red-500 text-sm">*</span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.weight >= 20 ? 'bg-purple-100 text-purple-700' :
                        item.weight >= 10 ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {item.weight}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ))
          ) : (
            // Vue mode gestion
            <div className="space-y-4">
              {/* Validation du poids */}
              {!isWeightValid && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-800">
                    <AlertCircle className="w-5 h-5" />
                    <span>Le poids total doit être égal à 100% (actuel: {totalWeight}%)</span>
                  </div>
                </div>
              )}

              {/* Liste des items */}
              {items.map((item, index) => (
                <div key={item.id} className="p-4 bg-slate-50 rounded-lg">
                  {editingItem === item.id ? (
                    // Mode édition
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                      <div className="flex space-x-3">
                        <input
                          type="number"
                          value={item.weight}
                          onChange={(e) => handleUpdateItem(item.id, { weight: parseInt(e.target.value) || 0 })}
                          className="w-20 px-3 py-2 border border-slate-300 rounded-lg"
                          min="0"
                          max="100"
                        />
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={item.is_mandatory}
                            onChange={(e) => handleUpdateItem(item.id, { is_mandatory: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm">Obligatoire</span>
                        </label>
                      </div>
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Enregistrer
                      </button>
                    </div>
                  ) : (
                    // Mode visualisation
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-slate-600">
                          Poids: {item.weight}% {item.is_mandatory && '• Obligatoire'}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!isUsingDefaults && (
                          <>
                            <button
                              onClick={() => setEditingItem(item.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Formulaire d'ajout de nouvel item */}
              {!isUsingDefaults && (
                <>
                  {showAddForm ? (
                    <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                      <input
                        type="text"
                        placeholder="Nom de l'élément"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                      />
                      <textarea
                        placeholder="Description (optionnelle)"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg"
                        rows="2"
                      />
                      <div className="flex space-x-3">
                        <input
                          type="number"
                          placeholder="Poids %"
                          value={newItem.weight}
                          onChange={(e) => setNewItem({ ...newItem, weight: parseInt(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 border border-purple-300 rounded-lg"
                          min="0"
                          max="100"
                        />
                        <select
                          value={newItem.category}
                          onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                          className="flex-1 px-3 py-2 border border-purple-300 rounded-lg"
                        >
                          <option value="Personnel">Personnel</option>
                          <option value="Analyse Technique">Analyse Technique</option>
                          <option value="Gestion du Risque">Gestion du Risque</option>
                          <option value="Conditions de Marché">Conditions de Marché</option>
                          <option value="Psychologie">Psychologie</option>
                        </select>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={newItem.is_mandatory}
                            onChange={(e) => setNewItem({ ...newItem, is_mandatory: e.target.checked })}
                            className="w-4 h-4 text-purple-600 rounded"
                          />
                          <span className="text-sm">Obligatoire</span>
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleAddItem}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Ajouter l'Élément
                        </button>
                        <button
                          onClick={() => {
                            setShowAddForm(false);
                            setNewItem({
                              name: '',
                              description: '',
                              weight: 10,
                              is_mandatory: false,
                              category: 'Personnel'
                            });
                          }}
                          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddForm(true)}
                      className="w-full p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-purple-400 hover:text-purple-600 flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Ajouter un Nouvel Élément</span>
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Formulaire de détails du trade pour l'entrée */}
        {!isManageMode && activeTab === 'entry' && score >= 60 && mandatoryMet && !activeTrade && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Détails du Trade
            </h4>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Symbole/Paire</label>
              <select
                value={tradeDetails.symbol}
                onChange={(e) => setTradeDetails({...tradeDetails, symbol: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                {TRADING_SYMBOLS.map(symbol => (
                  <option key={symbol} value={symbol}>{symbol}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Boutons d'action */}
        {!isManageMode && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => setCheckedItems(new Set())}
              className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Réinitialiser</span>
            </button>
            
            <button
              onClick={handleSaveSession}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Sauvegarder Session</span>
            </button>
            
            <button
              onClick={handleProceed}
              disabled={!canProceed}
              className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all ${
                canProceed
                  ? `bg-gradient-to-r ${status.gradient} text-white hover:shadow-lg ${activeTrade && activeTab === 'exit' ? 'animate-pulse' : ''}`
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {activeTab === 'entry' ? (
                <>
                  <TrendingUp className="w-5 h-5" />
                  <span>Procéder au Trade</span>
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  <span>Sortir du Trade</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Popup de résultat du trade */}
      {showResultPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
              <TrendingUp className="w-6 h-6 mr-2 text-purple-600" />
              Résultat du Trade
            </h3>
            <p className="text-slate-600 mb-6">
              Le trade est-il terminé avec un profit ou une perte ?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => handleCloseTradeWithResult('win')}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center space-x-2"
              >
                <TrendingUp className="w-5 h-5" />
                <span>Profit</span>
              </button>
              <button
                onClick={() => handleCloseTradeWithResult('loss')}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center space-x-2"
              >
                <ChevronDown className="w-5 h-5" />
                <span>Perte</span>
              </button>
            </div>
            <button
              onClick={() => {
                setShowResultPopup(false);
                setPendingExitSession(null);
              }}
              className="w-full mt-3 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Journal de Trading Détaillé */}
      {completedTrades && completedTrades.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Journal de Trading - Historique Détaillé
            </h3>
            <button
              onClick={handleDeleteAllTrades}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Effacer tout</span>
            </button>
          </div>
          
          {/* En-têtes du tableau */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Date Entrée</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Date Sortie</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Symbole</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Score Entrée</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Score Sortie</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Durée</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Résultat</th>
                  <th className="px-3 py-2 text-left text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completedTrades.slice(0, 20).map((trade) => {
                  return (
                    <tr key={trade.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3 text-sm">
                        {new Date(trade.entry_time).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {new Date(trade.exit_time).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium">
                        {trade.symbol || '-'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-8 rounded ${
                            trade.entry_score >= 85 ? 'bg-green-500' :
                            trade.entry_score >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} 
                          style={{height: `${(trade.entry_score / 100) * 32}px`}} />
                          <span className="text-sm font-medium">{trade.entry_score}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-8 rounded ${
                            trade.exit_score >= 85 ? 'bg-green-500' :
                            trade.exit_score >= 60 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`} 
                          style={{height: `${(trade.exit_score / 100) * 32}px`}} />
                          <span className="text-sm font-medium">{trade.exit_score}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {trade.duration_seconds ? formatDuration(trade.duration_seconds) : '-'}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          trade.trade_result === 'win'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {trade.trade_result === 'win' ? 'Profit' : 'Perte'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => handleDeleteTrade(trade.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* KPIs Dashboard */}
          <div className="mt-6 space-y-6">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Trades */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5 rounded-2xl border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-blue-900">{completedTrades.length}</span>
                </div>
                <h3 className="text-sm font-medium text-blue-700">Total Trades</h3>
                <p className="text-xs text-blue-600 mt-1">Trades complétés</p>
              </div>

              {/* Win Rate */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-5 rounded-2xl border border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-green-900">
                    {completedTrades.length > 0 
                      ? Math.round((completedTrades.filter(t => t.trade_result === 'win').length / completedTrades.length) * 100)
                      : 0}%
                  </span>
                </div>
                <h3 className="text-sm font-medium text-green-700">Taux de Réussite</h3>
                <p className="text-xs text-green-600 mt-1">
                  {completedTrades.filter(t => t.trade_result === 'win').length} gains / {completedTrades.filter(t => t.trade_result === 'loss').length} pertes
                </p>
              </div>

              {/* Average Entry Score */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 p-5 rounded-2xl border border-purple-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-bold text-purple-900">
                    {completedTrades.length > 0
                      ? Math.round(completedTrades.reduce((sum, t) => sum + t.entry_score, 0) / completedTrades.length)
                      : 0}%
                  </span>
                </div>
                <h3 className="text-sm font-medium text-purple-700">Score Moyen d'Entrée</h3>
                <p className="text-xs text-purple-600 mt-1">Qualité des setups</p>
              </div>

              {/* Average Duration */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-5 rounded-2xl border border-orange-200 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Timer className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-orange-900">
                    {completedTrades.length > 0
                      ? formatDuration(Math.round(completedTrades.reduce((sum, t) => sum + (t.duration_seconds || 0), 0) / completedTrades.length))
                      : '-'}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-orange-700">Durée Moyenne</h3>
                <p className="text-xs text-orange-600 mt-1">Par trade</p>
              </div>
            </div>

            {/* Performance par Score d'Entrée */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                Performance par Score d'Entrée
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(() => {
                  const scoreRanges = [
                    { min: 90, max: 100, label: '90-100%', color: 'emerald', icon: '🏆' },
                    { min: 80, max: 89, label: '80-89%', color: 'green', icon: '✨' },
                    { min: 70, max: 79, label: '70-79%', color: 'yellow', icon: '📊' },
                    { min: 60, max: 69, label: '60-69%', color: 'orange', icon: '📈' }
                  ];
                  
                  return scoreRanges.map(range => {
                    const tradesInRange = completedTrades.filter(t => 
                      t.entry_score >= range.min && t.entry_score <= range.max
                    );
                    const wins = tradesInRange.filter(t => t.trade_result === 'win').length;
                    const total = tradesInRange.length;
                    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                    
                    return (
                      <div key={range.label} className={`bg-white p-4 rounded-xl border-2 shadow-sm ${
                        range.color === 'emerald' ? 'border-emerald-200' :
                        range.color === 'green' ? 'border-green-200' :
                        range.color === 'yellow' ? 'border-yellow-200' :
                        'border-orange-200'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{range.icon}</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                            range.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                            range.color === 'green' ? 'bg-green-100 text-green-700' :
                            range.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {range.label}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-sm text-slate-600">Win Rate</span>
                            <span className={`text-2xl font-bold ${winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {total > 0 ? `${winRate}%` : '-'}
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-500 ${
                                winRate >= 70 ? 'bg-green-500' : 
                                winRate >= 50 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}
                              style={{ width: `${winRate}%` }}
                            />
                          </div>
                          
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>{wins} gains</span>
                            <span>{total - wins} pertes</span>
                          </div>
                          
                          <div className="text-center pt-2 border-t border-gray-100">
                            <span className="text-xs font-medium text-slate-600">
                              {total} {total === 1 ? 'trade' : 'trades'} total
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Statistiques par Symbole */}
            {(() => {
              const symbolStats = completedTrades.reduce((acc, trade) => {
                const symbol = trade.symbol || 'N/A';
                if (!acc[symbol]) {
                  acc[symbol] = { total: 0, wins: 0, totalDuration: 0 };
                }
                acc[symbol].total++;
                if (trade.trade_result === 'win') acc[symbol].wins++;
                acc[symbol].totalDuration += trade.duration_seconds || 0;
                return acc;
              }, {});

              const symbolArray = Object.entries(symbolStats)
                .map(([symbol, stats]) => ({
                  symbol,
                  ...stats,
                  winRate: Math.round((stats.wins / stats.total) * 100),
                  avgDuration: Math.round(stats.totalDuration / stats.total)
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

              if (symbolArray.length === 0) return null;

              return (
                <div className="bg-gradient-to-br from-indigo-50 to-blue-100 p-6 rounded-2xl border border-indigo-200 shadow-sm">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                    <PieChart className="w-5 h-5 mr-2 text-indigo-600" />
                    Performance par Symbole (Top 5)
                  </h4>
                  <div className="space-y-3">
                    {symbolArray.map((item, index) => (
                      <div key={item.symbol} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-bold text-indigo-600">#{index + 1}</span>
                          <div>
                            <span className="font-medium text-slate-800">{item.symbol}</span>
                            <span className="text-xs text-slate-500 ml-2">{item.total} trades</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${item.winRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.winRate}% win
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatDuration(item.avgDuration)} moy
                            </div>
                          </div>
                          <div className="w-24">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${
                                  item.winRate >= 70 ? 'bg-green-500' : 
                                  item.winRate >= 50 ? 'bg-yellow-500' : 
                                  'bg-red-500'
                                }`}
                                style={{ width: `${item.winRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklist;