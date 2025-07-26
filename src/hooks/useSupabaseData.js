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
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('📚 Chargement des données utilisateur...')
      
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
      
      // Charger le trade actif s'il existe
      const trade = await DataService.getActiveTrade(user.id)
      setActiveTrade(trade)
      
      // Charger les trades complétés
      const completed = await DataService.getCompletedTrades(user.id)
      setCompletedTrades(completed)
      
      console.log('✅ Données utilisateur chargées')
      
    } catch (err) {
      console.error('❌ Erreur chargement données:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // Migrer les données localStorage si nécessaire
  const migrateLocalData = async () => {
    if (!user?.id || migrationCompleted) return
    
    try {
      console.log('🔄 Vérification migration localStorage...')
      
      // Vérifier s'il y a des données localStorage
      const localData = DataService.getLocalStorageData()
      
      if (Object.keys(localData).length > 0) {
        console.log('📦 Données localStorage trouvées, migration...')
        await DataService.migrateFromLocalStorage(user.id)
        
        // Recharger les données après migration
        await loadUserData()
      }
      
      setMigrationCompleted(true)
      
    } catch (err) {
      console.error('❌ Erreur migration:', err)
      setError(err)
    }
  }

  // Sauvegarder les paramètres
  const saveSettings = async (newSettings) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Sauvegarde paramètres...')
      const savedSettings = await DataService.saveUserSettings(user.id, newSettings)
      setUserSettings(savedSettings)
      return savedSettings
    } catch (err) {
      console.error('❌ Erreur sauvegarde paramètres:', err)
      setError(err)
      throw err
    }
  }

  // Sauvegarder une entrée du journal
  const saveJournalEntry = async (date, entryData) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Sauvegarde entrée journal:', date)
      await DataService.saveTradingJournalEntry(user.id, date, entryData)
      
      // Mettre à jour l'état local
      setTradingJournal(prev => ({
        ...prev,
        [date]: entryData
      }))
      
      return true
    } catch (err) {
      console.error('❌ Erreur sauvegarde journal:', err)
      setError(err)
      throw err
    }
  }

  // Supprimer une entrée du journal
  const deleteJournalEntry = async (date) => {
    if (!user?.id) return
    
    try {
      console.log('🗑️ Suppression entrée journal:', date)
      await DataService.deleteTradingJournalEntry(user.id, date)
      
      // Mettre à jour l'état local
      setTradingJournal(prev => {
        const newJournal = { ...prev }
        delete newJournal[date]
        return newJournal
      })
      
      return true
    } catch (err) {
      console.error('❌ Erreur suppression journal:', err)
      setError(err)
      throw err
    }
  }
  
  // Supprimer toutes les entrées du journal
  const deleteAllJournalEntries = async () => {
    if (!user?.id) return
    
    try {
      console.log('🗑️ Suppression de toutes les entrées du journal...')
      await DataService.deleteAllTradingJournalEntries(user.id)
      
      // Mettre à jour l'état local
      setTradingJournal({})
      
      return true
    } catch (err) {
      console.error('❌ Erreur suppression globale journal:', err)
      setError(err)
      throw err
    }
  }

  // Sauvegarder une analyse IA
  const saveAIAnalysis = async (analysisData, modelUsed, provider) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Sauvegarde analyse IA...')
      return await DataService.saveAIAnalysis(user.id, analysisData, modelUsed, provider)
    } catch (err) {
      console.error('❌ Erreur sauvegarde analyse IA:', err)
      setError(err)
      throw err
    }
  }

  // Sauvegarder un calcul de position
  const savePositionCalculation = async (calculationData) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Sauvegarde calcul position...')
      return await DataService.savePositionCalculation(user.id, calculationData)
    } catch (err) {
      console.error('❌ Erreur sauvegarde calcul:', err)
      setError(err)
      throw err
    }
  }
  
  // === CHECKLIST FUNCTIONS ===
  
  // Sauvegarder un item de checklist
  const saveUserChecklistItem = async (itemData) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Sauvegarde item checklist...')
      const saved = await DataService.saveUserChecklistItem(user.id, itemData)
      
      // Mettre à jour l'état local
      setUserChecklistItems(prev => [...prev, saved])
      
      return saved
    } catch (err) {
      console.error('❌ Erreur sauvegarde item:', err)
      setError(err)
      throw err
    }
  }
  
  // Mettre à jour un item de checklist
  const updateUserChecklistItem = async (itemId, updates) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Mise à jour item checklist...')
      const updated = await DataService.updateUserChecklistItem(user.id, itemId, updates)
      
      // Mettre à jour l'état local
      setUserChecklistItems(prev => 
        prev.map(item => item.id === itemId ? updated : item)
      )
      
      return updated
    } catch (err) {
      console.error('❌ Erreur mise à jour item:', err)
      setError(err)
      throw err
    }
  }
  
  // Supprimer un item de checklist
  const deleteUserChecklistItem = async (itemId) => {
    if (!user?.id) return
    
    try {
      console.log('🗑️ Suppression item checklist...')
      await DataService.deleteUserChecklistItem(user.id, itemId)
      
      // Mettre à jour l'état local
      setUserChecklistItems(prev => prev.filter(item => item.id !== itemId))
      
      return true
    } catch (err) {
      console.error('❌ Erreur suppression item:', err)
      setError(err)
      throw err
    }
  }
  
  // Copier les templates par défaut
  const copyDefaultTemplates = async () => {
    if (!user?.id) return
    
    try {
      console.log('📋 Copie des templates par défaut...')
      await DataService.copyDefaultTemplates(user.id)
      
      // Recharger les items utilisateur
      const items = await DataService.getUserChecklistItems(user.id)
      setUserChecklistItems(items)
      
      return true
    } catch (err) {
      console.error('❌ Erreur copie templates:', err)
      setError(err)
      throw err
    }
  }
  
  // Sauvegarder une session de checklist
  const saveChecklistSession = async (sessionData) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Sauvegarde session checklist...')
      const saved = await DataService.saveChecklistSession(user.id, sessionData)
      
      // Ajouter à l'état local avec les arrays de trades vides
      setChecklistSessions(prev => [{
        ...saved,
        entry_trades: [],
        exit_trades: []
      }, ...prev])
      
      return saved
    } catch (err) {
      console.error('❌ Erreur sauvegarde session:', err)
      setError(err)
      throw err
    }
  }

  const deleteChecklistSession = async (sessionId) => {
    if (!user?.id) return
    
    try {
      console.log('🗑️ Suppression session checklist...')
      await DataService.deleteChecklistSession(user.id, sessionId)
      
      // Retirer de l'état local
      setChecklistSessions(prev => prev.filter(s => s.id !== sessionId))
      
      return true
    } catch (err) {
      console.error('❌ Erreur suppression session:', err)
      setError(err)
      throw err
    }
  }
  
  const deleteAllChecklistSessions = async () => {
    if (!user?.id) return
    
    try {
      console.log('🗑️ Suppression de toutes les sessions checklist...')
      await DataService.deleteAllChecklistSessions(user.id)
      
      // Vider l'état local
      setChecklistSessions([])
      setActiveTrade(null)
      
      return true
    } catch (err) {
      console.error('❌ Erreur suppression globale sessions:', err)
      setError(err)
      throw err
    }
  }
  
  // === ACTIVE TRADE FUNCTIONS ===
  
  // Créer un trade actif
  const createActiveTrade = async (tradeData) => {
    if (!user?.id) return
    
    try {
      console.log('💾 Création trade actif...')
      const created = await DataService.createActiveTrade(user.id, tradeData)
      
      // Mettre à jour l'état local
      setActiveTrade(created)
      
      return created
    } catch (err) {
      console.error('❌ Erreur création trade:', err)
      setError(err)
      throw err
    }
  }
  
  // Fermer le trade actif
  const closeActiveTrade = async (exitSessionId, tradeResult, exitScore) => {
    if (!activeTrade) {
      console.error('Aucun trade actif à fermer')
      return null
    }
    
    try {
      const closed = await DataService.closeActiveTrade(user.id, activeTrade.id, exitSessionId, tradeResult, exitScore)
      
      // Mettre à jour l'état du trade actif
      setActiveTrade(null)
      
      // Ajouter le trade fermé aux trades complétés
      setCompletedTrades(prev => [closed, ...prev])
      
      return closed
    } catch (error) {
      setError(error)
      throw error
    }
  }
  
  // Supprimer un trade complété
  const deleteCompletedTrade = async (tradeId) => {
    if (!user?.id) return
    
    try {
      console.log('🗑️ Suppression trade complété...')
      await DataService.deleteCompletedTrade(user.id, tradeId)
      
      // Retirer de l'état local
      setCompletedTrades(prev => prev.filter(t => t.id !== tradeId))
      
      return true
    } catch (err) {
      console.error('❌ Erreur suppression trade:', err)
      setError(err)
      throw err
    }
  }
  
  // Supprimer tous les trades complétés
  const deleteAllCompletedTrades = async () => {
    if (!user?.id) return
    
    try {
      console.log('🗑️ Suppression de tous les trades complétés...')
      await DataService.deleteAllCompletedTrades(user.id)
      
      // Vider l'état local
      setCompletedTrades([])
      
      return true
    } catch (err) {
      console.error('❌ Erreur suppression globale trades:', err)
      setError(err)
      throw err
    }
  }

  // Effet pour charger les données quand l'utilisateur change
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserData().then(() => {
        migrateLocalData()
      })
    } else {
      // Reset des données si pas connecté
      setUserSettings(null)
      setTradingJournal({})
      setMigrationCompleted(false)
      setLoading(false)
    }
  }, [user?.id, isAuthenticated])

  return {
    // États
    loading,
    error,
    userSettings,
    tradingJournal,
    migrationCompleted,
    checklistTemplates,
    userChecklistItems,
    checklistSessions,
    activeTrade,
    completedTrades,
    
    // Actions
    loadUserData,
    saveSettings,
    saveJournalEntry,
    deleteJournalEntry,
    deleteAllJournalEntries,
    saveAIAnalysis,
    savePositionCalculation,
    
    // Checklist Actions
    saveUserChecklistItem,
    updateUserChecklistItem,
    deleteUserChecklistItem,
    copyDefaultTemplates,
    saveChecklistSession,
    deleteChecklistSession,
    deleteAllChecklistSessions,
    
    // Active Trade Actions
    createActiveTrade,
    closeActiveTrade,
    deleteCompletedTrade,
    deleteAllCompletedTrades,
    
    // Helpers
    clearError: () => setError(null),
    isDataLoaded: !loading && userSettings !== null
  }
} 