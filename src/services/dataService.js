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
  
  // Supprimer toutes les entrées du journal d'un utilisateur
  static async deleteAllTradingJournalEntries(userId) {
    try {
      const { error } = await supabase
        .from('trading_journal')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
      
      console.log('✅ Toutes les entrées du journal supprimées')
    } catch (error) {
      console.error('❌ Erreur suppression globale journal:', error)
      throw error
    }
  }
  
  // === CHECKLISTS ===
  
  // Récupérer les templates de checklist par défaut
  static async getChecklistTemplates() {
    try {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('is_default', true)
        .order('type', { ascending: true })
        .order('order_index', { ascending: true })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Erreur récupération templates:', error)
      return []
    }
  }
  
  // Récupérer les checklists personnalisées de l'utilisateur
  static async getUserChecklistItems(userId) {
    try {
      const { data, error } = await supabase
        .from('user_checklist_items')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('order_index', { ascending: true })
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Erreur récupération checklist utilisateur:', error)
      return []
    }
  }
  
  // Sauvegarder un nouvel item de checklist
  static async saveUserChecklistItem(userId, itemData) {
    try {
      const { data, error } = await supabase
        .from('user_checklist_items')
        .insert({
          user_id: userId,
          ...itemData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Item checklist sauvegardé:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur sauvegarde item checklist:', error)
      throw error
    }
  }
  
  // Mettre à jour un item de checklist
  static async updateUserChecklistItem(userId, itemId, updates) {
    try {
      const { data, error } = await supabase
        .from('user_checklist_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Item checklist mis à jour:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur mise à jour item checklist:', error)
      throw error
    }
  }
  
  // Supprimer un item de checklist
  static async deleteUserChecklistItem(userId, itemId) {
    try {
      const { error } = await supabase
        .from('user_checklist_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      console.log('✅ Item checklist supprimé')
    } catch (error) {
      console.error('❌ Erreur suppression item checklist:', error)
      throw error
    }
  }
  
  // Copier les templates par défaut vers les items utilisateur
  static async copyDefaultTemplates(userId) {
    try {
      const { data, error } = await supabase
        .rpc('copy_default_templates_to_user', { p_user_id: userId })
      
      if (error) throw error
      
      console.log('✅ Templates copiés vers checklist utilisateur')
      return true
    } catch (error) {
      console.error('❌ Erreur copie templates:', error)
      throw error
    }
  }
  
  // Sauvegarder une session de checklist
  static async saveChecklistSession(userId, sessionData) {
    try {
      const { data, error } = await supabase
        .from('checklist_sessions')
        .insert({
          user_id: userId,
          ...sessionData,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Session checklist sauvegardée:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur sauvegarde session:', error)
      throw error
    }
  }
  
  // Récupérer les sessions de checklist récentes
  static async getChecklistSessions(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('checklist_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      console.error('Erreur récupération sessions:', error)
      return []
    }
  }
  
  // === TRADES ACTIFS ===
  
  // Récupérer le trade actif
  static async getActiveTrade(userId) {
    try {
      const { data, error } = await supabase
        .from('active_trades')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      
      return data
    } catch (error) {
      console.error('Erreur récupération trade actif:', error)
      return null
    }
  }
  
  // Créer un nouveau trade actif
  static async createActiveTrade(userId, tradeData) {
    try {
      const { data, error } = await supabase
        .from('active_trades')
        .insert({
          user_id: userId,
          ...tradeData,
          status: 'active',
          entry_time: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Trade actif créé:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur création trade actif:', error)
      throw error
    }
  }
  
  // Fermer un trade actif
  static async closeActiveTrade(userId, tradeId, exitSessionId) {
    try {
      const { data, error } = await supabase
        .from('active_trades')
        .update({
          status: 'completed',
          exit_time: new Date().toISOString(),
          exit_session_id: exitSessionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      console.log('✅ Trade fermé:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur fermeture trade:', error)
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