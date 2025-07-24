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
    
    // Actions
    loadUserData,
    saveSettings,
    saveJournalEntry,
    deleteJournalEntry,
    saveAIAnalysis,
    savePositionCalculation,
    
    // Helpers
    clearError: () => setError(null),
    isDataLoaded: !loading && userSettings !== null
  }
} 