import { supabase } from '../lib/supabase'

// Service pour gérer les données utilisateur dans Supabase
export class DataService {
  
  // === PARAMÈTRES UTILISATEUR ===
  
  // Récupérer les paramètres utilisateur
  static async getUserSettings(userId) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
      
      return data || this.getDefaultSettings(userId)
    } catch (error) {
      console.error('Erreur récupération paramètres:', error)
      return this.getDefaultSettings(userId)
    }
  }
  
  // Sauvegarder les paramètres utilisateur
  static async saveUserSettings(userId, settings) {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Paramètres sauvegardés:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur sauvegarde paramètres:', error)
      throw error
    }
  }
  
  // Paramètres par défaut
  static getDefaultSettings(userId) {
    return {
      user_id: userId,
      initial_capital: 0,
      current_balance: 0,
      risk_per_trade: 1,
      daily_loss_max: 3,
      weekly_target: 2,
      monthly_target: 8,
      secure_mode: false,
      ai_provider: 'anthropic',
      selected_model: 'claude-3-5-sonnet-20241022',
      anthropic_api_key: null,
      openai_api_key: null
    }
  }
  
  // === JOURNAL DE TRADING ===
  
  // Récupérer le journal de trading
  static async getTradingJournal(userId) {
    try {
      const { data, error } = await supabase
        .from('trading_journal')
        .select('*')
        .eq('user_id', userId)
        .order('trade_date', { ascending: false })
      
      if (error) throw error
      
      // Convertir en format compatible avec l'app existante
      const journalObject = {}
      data.forEach(entry => {
        journalObject[entry.trade_date] = {
          pnl: entry.pnl.toString(),
          notes: entry.notes || '',
          hasTraded: entry.has_traded
        }
      })
      
      return journalObject
    } catch (error) {
      console.error('Erreur récupération journal:', error)
      return {}
    }
  }
  
  // Sauvegarder une entrée du journal
  static async saveTradingJournalEntry(userId, date, entryData) {
    try {
      const { data, error } = await supabase
        .from('trading_journal')
        .upsert({
          user_id: userId,
          trade_date: date,
          pnl: parseFloat(entryData.pnl) || 0,
          notes: entryData.notes || '',
          has_traded: entryData.hasTraded ?? true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,trade_date'
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Entrée journal sauvegardée:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur sauvegarde journal:', error)
      throw error
    }
  }
  
  // Supprimer une entrée du journal
  static async deleteTradingJournalEntry(userId, date) {
    try {
      const { error } = await supabase
        .from('trading_journal')
        .delete()
        .eq('user_id', userId)
        .eq('trade_date', date)
      
      if (error) throw error
      
      console.log('✅ Entrée journal supprimée:', date)
    } catch (error) {
      console.error('❌ Erreur suppression journal:', error)
      throw error
    }
  }
  
  // === ANALYSES IA ===
  
  // Sauvegarder une analyse IA
  static async saveAIAnalysis(userId, analysisData, modelUsed, provider) {
    try {
      const { data, error } = await supabase
        .from('ai_analyses')
        .insert({
          user_id: userId,
          analysis_data: analysisData,
          model_used: modelUsed,
          provider: provider
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Analyse IA sauvegardée:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur sauvegarde analyse IA:', error)
      throw error
    }
  }
  
  // Récupérer les analyses IA récentes
  static async getRecentAIAnalyses(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Erreur récupération analyses IA:', error)
      return []
    }
  }
  
  // === CALCULS DE POSITION ===
  
  // Sauvegarder un calcul de position
  static async savePositionCalculation(userId, calculationData) {
    try {
      const { data, error } = await supabase
        .from('position_calculations')
        .insert({
          user_id: userId,
          calculation_data: calculationData
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Calcul position sauvegardé:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur sauvegarde calcul:', error)
      throw error
    }
  }
  
  // === MIGRATION DEPUIS LOCALSTORAGE ===
  
  // Migrer les données localStorage vers Supabase
  static async migrateFromLocalStorage(userId) {
    try {
      console.log('🔄 Migration localStorage → Supabase...')
      
      // Récupérer les données localStorage
      const localData = this.getLocalStorageData()
      
      if (Object.keys(localData).length === 0) {
        console.log('ℹ️ Aucune donnée localStorage à migrer')
        return
      }
      
      // Migrer les paramètres
      const settings = {
        initial_capital: parseFloat(localData.initialCapital) || 0,
        current_balance: parseFloat(localData.currentBalance) || 0,
        risk_per_trade: parseFloat(localData.riskPerTrade) || 1,
        daily_loss_max: parseFloat(localData.dailyLossMax) || 3,
        weekly_target: parseFloat(localData.weeklyTarget) || 2,
        monthly_target: parseFloat(localData.monthlyTarget) || 8,
        secure_mode: localData.secureMode || false,
        ai_provider: localData.aiProvider || 'anthropic',
        selected_model: localData.selectedModel || 'claude-3-5-sonnet-20241022',
        anthropic_api_key: localData.anthropicApiKey || null,
        openai_api_key: localData.openaiApiKey || null
      }
      
      await this.saveUserSettings(userId, settings)
      
      // Migrer le journal de trading
      const journal = localData.tradingJournal || {}
      for (const [date, entry] of Object.entries(journal)) {
        await this.saveTradingJournalEntry(userId, date, entry)
      }
      
      console.log('✅ Migration réussie')
      
      // Optionnel : nettoyer localStorage après migration
      // this.clearLocalStorage()
      
    } catch (error) {
      console.error('❌ Erreur migration:', error)
      throw error
    }
  }
  
  // Récupérer les données localStorage
  static getLocalStorageData() {
    const data = {}
    const keys = Object.keys(localStorage)
    
    keys.forEach(key => {
      if (key.startsWith('methodealpha_') || key.startsWith('aiProvider') || key.startsWith('selectedModel') || key.startsWith('anthropicApiKey') || key.startsWith('openaiApiKey')) {
        try {
          data[key.replace('methodealpha_', '')] = JSON.parse(localStorage.getItem(key))
        } catch (e) {
          data[key.replace('methodealpha_', '')] = localStorage.getItem(key)
        }
      }
    })
    
    return data
  }
  
  // Nettoyer localStorage
  static clearLocalStorage() {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('methodealpha_') || key.startsWith('aiProvider') || key.startsWith('selectedModel') || key.startsWith('anthropicApiKey') || key.startsWith('openaiApiKey')) {
        localStorage.removeItem(key)
      }
    })
    console.log('✅ localStorage nettoyé')
  }
} 