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
  Activity
} from 'lucide-react';
import { formatPercentage } from '../../utils/formatters';

const Checklist = ({
  userChecklistItems,
  checklistTemplates,
  checklistSessions,
  saveChecklistSession,
  saveUserChecklistItem,
  updateUserChecklistItem,
  deleteUserChecklistItem,
  copyDefaultTemplates,
  loadingChecklist,
  activeTrade,
  createActiveTrade,
  closeActiveTrade
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
      status: 'completed'
    };

    try {
      console.log('📊 Sauvegarde session...', { activeTab, score, mandatoryMet });
      const savedSession = await saveChecklistSession(sessionData);
      console.log('✅ Session sauvegardée:', savedSession);
      
      // Si c'est une entrée, créer un trade actif
      if (activeTab === 'entry' && score >= 60 && mandatoryMet) {
        console.log('🚀 Création du trade actif...');
        const newTrade = await createActiveTrade({
          entry_session_id: savedSession.id
        });
        console.log('✅ Trade créé:', newTrade);
      }
      
      // Si c'est une sortie et qu'il y a un trade actif, le fermer
      if (activeTab === 'exit' && activeTrade && score >= 40) {
        console.log('🏁 Fermeture du trade...');
        const closedTrade = await closeActiveTrade(savedSession.id);
        console.log('✅ Trade fermé:', closedTrade);
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
              setActiveTab('exit');
              setCheckedItems(new Set());
            }}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'exit'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            } ${activeTrade ? 'animate-pulse' : ''}`}
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

      {/* Sessions Récentes */}
      {checklistSessions && checklistSessions.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-purple-600" />
            Sessions de Checklist Récentes
          </h3>
          <div className="space-y-2">
            {checklistSessions.slice(0, 5).map((session) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    session.type === 'entry' ? 'bg-blue-500' : 'bg-orange-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">{session.type === 'entry' ? 'Entrée' : 'Sortie'}</span>
                  <span className="text-sm text-slate-600">
                    {new Date(session.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    session.total_score >= 85 ? 'bg-green-100 text-green-700' :
                    session.total_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {session.total_score}%
                  </span>
                  <Award className={`w-4 h-4 ${
                    session.total_score >= 85 ? 'text-green-600' :
                    session.total_score >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Checklist;