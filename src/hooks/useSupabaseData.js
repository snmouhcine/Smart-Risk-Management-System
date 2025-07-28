import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { DataService } from '../services/dataService'

// Hook pour gérer les données utilisateur avec Supabase
export const useSupabaseData = () => {
  const { user, isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // États pour les données
  const [userSettings, setUserSettings] = useState(null)
  const [tradingJournal, setTradingJournal] = useState({})
  const [migrationCompleted, setMigrationCompleted] = useState(false)
  const [checklistTemplates, setChecklistTemplates] = useState([])
  const [userChecklistItems, setUserChecklistItems] = useState([])
  const [checklistSessions, setChecklistSessions] = useState([])
  const [activeTrade, setActiveTrade] = useState(null)
  const [completedTrades, setCompletedTrades] = useState([])

  // Charger les données utilisateur
  const loadUserData = async () => {
    if (!user?.id) {
      return;
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Charger les paramètres
      const settings = await DataService.getUserSettings(user.id)
      setUserSettings(settings)
      
      // Charger le journal
      const journal = await DataService.getTradingJournal(user.id)
      setTradingJournal(journal)
      
      // Charger les templates de checklist
      const templates = await DataService.getChecklistTemplates()
      setChecklistTemplates(templates)
      
      // Charger les items de checklist utilisateur
      const items = await DataService.getUserChecklistItems(user.id)
      setUserChecklistItems(items)
      
      // Charger les sessions de checklist récentes
      const sessions = await DataService.getChecklistSessions(user.id)
      setChecklistSessions(sessions)
      
      // Charger le trade actif s'il y en a un
      const trade = await DataService.getActiveTrade(user.id)
      setActiveTrade(trade)
      
      // Charger les trades complétés
      const completed = await DataService.getCompletedTrades(user.id)
      setCompletedTrades(completed)
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Vérifier et effectuer la migration depuis localStorage
  const checkAndMigrate = async () => {
    if (!user?.id || migrationCompleted) return
    
    try {
      setLoading(true)
      
      const localData = DataService.getLocalStorageData()
      const hasLocalData = Object.keys(localData).length > 0
      
      if (hasLocalData) {
        await DataService.migrateFromLocalStorage(user.id)
        setMigrationCompleted(true)
        // Recharger les données après migration
        await loadUserData()
      } else {
        setMigrationCompleted(true)
      }
    } catch (err) {
      setError(err.message)
      setMigrationCompleted(true) // Éviter les boucles infinies
    }
  }

  // Sauvegarder les paramètres
  const saveSettings = async (newSettings) => {
    if (!user?.id) return
    
    try {
      const updatedSettings = await DataService.saveUserSettings(user.id, newSettings)
      setUserSettings(updatedSettings)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Sauvegarder une entrée du journal
  const saveJournalEntry = async (date, entryData) => {
    if (!user?.id) return
    
    try {
      await DataService.saveTradingJournalEntry(user.id, date, entryData)
      setTradingJournal(prev => ({
        ...prev,
        [date]: entryData
      }))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Supprimer une entrée du journal
  const deleteJournalEntry = async (date) => {
    if (!user?.id) return
    
    try {
      await DataService.deleteTradingJournalEntry(user.id, date)
      setTradingJournal(prev => {
        const newJournal = { ...prev }
        delete newJournal[date]
        return newJournal
      })
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Supprimer toutes les entrées du journal
  const deleteAllJournalEntries = async () => {
    if (!user?.id) return
    
    try {
      await DataService.deleteAllTradingJournalEntries(user.id)
      setTradingJournal({})
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Sauvegarder une analyse IA
  const saveAIAnalysis = async (analysisData, modelUsed, provider) => {
    if (!user?.id) return
    
    try {
      await DataService.saveAIAnalysis(user.id, analysisData, modelUsed, provider)
    } catch (err) {
      // Silent error for AI analysis
    }
  }

  // Sauvegarder un calcul de position
  const savePositionCalculation = async (calculationData) => {
    if (!user?.id) return
    
    try {
      await DataService.savePositionCalculation(user.id, calculationData)
    } catch (err) {
      // Silent error for position calculation
    }
  }

  // === MÉTHODES CHECKLIST ===
  
  // Sauvegarder un nouvel item de checklist
  const saveChecklistItem = async (itemData) => {
    if (!user?.id) return
    
    try {
      const newItem = await DataService.saveUserChecklistItem(user.id, itemData)
      setUserChecklistItems(prev => [...prev, newItem])
      return { success: true, data: newItem }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Mettre à jour un item de checklist
  const updateChecklistItem = async (itemId, updates) => {
    if (!user?.id) return
    
    try {
      const updatedItem = await DataService.updateUserChecklistItem(user.id, itemId, updates)
      setUserChecklistItems(prev => 
        prev.map(item => item.id === itemId ? updatedItem : item)
      )
      return { success: true, data: updatedItem }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Supprimer un item de checklist
  const deleteChecklistItem = async (itemId) => {
    if (!user?.id) return
    
    try {
      await DataService.deleteUserChecklistItem(user.id, itemId)
      setUserChecklistItems(prev => prev.filter(item => item.id !== itemId))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Copier les templates par défaut
  const copyDefaultTemplates = async () => {
    if (!user?.id) return
    
    try {
      await DataService.copyDefaultTemplates(user.id)
      // Recharger les items après copie
      const items = await DataService.getUserChecklistItems(user.id)
      setUserChecklistItems(items)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Sauvegarder une session de checklist
  const saveChecklistSession = async (sessionData) => {
    if (!user?.id) return
    
    try {
      const newSession = await DataService.saveChecklistSession(user.id, sessionData)
      setChecklistSessions(prev => [newSession, ...prev])
      return { success: true, data: newSession }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Supprimer une session de checklist
  const deleteChecklistSession = async (sessionId) => {
    if (!user?.id) return
    
    try {
      await DataService.deleteChecklistSession(user.id, sessionId)
      setChecklistSessions(prev => prev.filter(s => s.id !== sessionId))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Supprimer toutes les sessions de checklist
  const deleteAllChecklistSessions = async () => {
    if (!user?.id) return
    
    try {
      await DataService.deleteAllChecklistSessions(user.id)
      setChecklistSessions([])
      setCompletedTrades([])
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // === MÉTHODES TRADES ===
  
  // Créer un nouveau trade actif
  const createActiveTrade = async (tradeData) => {
    if (!user?.id) return
    
    try {
      const newTrade = await DataService.createActiveTrade(user.id, tradeData)
      setActiveTrade(newTrade)
      return { success: true, data: newTrade }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Fermer le trade actif
  const closeActiveTrade = async (exitSessionId, tradeResult, exitScore) => {
    if (!user?.id || !activeTrade) {
      return { success: false, error: 'Aucun trade actif' }
    }
    
    try {
      const closedTrade = await DataService.closeActiveTrade(
        user.id, 
        activeTrade.id, 
        exitSessionId, 
        tradeResult,
        exitScore
      )
      setActiveTrade(null)
      setCompletedTrades(prev => [closedTrade, ...prev])
      return { success: true, data: closedTrade }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Supprimer un trade complété
  const deleteCompletedTrade = async (tradeId) => {
    if (!user?.id) return
    
    try {
      await DataService.deleteCompletedTrade(user.id, tradeId)
      setCompletedTrades(prev => prev.filter(t => t.id !== tradeId))
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Supprimer tous les trades complétés
  const deleteAllCompletedTrades = async () => {
    if (!user?.id) return
    
    try {
      await DataService.deleteAllCompletedTrades(user.id)
      setCompletedTrades([])
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }

  // Effets
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserData()
      checkAndMigrate()
    } else {
      // Réinitialiser les données si déconnecté
      setUserSettings(null)
      setTradingJournal({})
      setUserChecklistItems([])
      setChecklistSessions([])
      setActiveTrade(null)
      setCompletedTrades([])
      setLoading(false)
    }
  }, [isAuthenticated, user?.id])

  return {
    // États
    loading,
    error,
    userSettings,
    tradingJournal,
    checklistTemplates,
    userChecklistItems,
    checklistSessions,
    activeTrade,
    completedTrades,
    
    // Méthodes générales
    refreshData: loadUserData,
    saveSettings,
    saveJournalEntry,
    deleteJournalEntry,
    deleteAllJournalEntries,
    saveAIAnalysis,
    savePositionCalculation,
    
    // Méthodes checklist
    saveChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    copyDefaultTemplates,
    saveChecklistSession,
    deleteChecklistSession,
    deleteAllChecklistSessions,
    
    // Méthodes trades
    createActiveTrade,
    closeActiveTrade,
    deleteCompletedTrade,
    deleteAllCompletedTrades
  }
}