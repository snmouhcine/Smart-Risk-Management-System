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
      
      return data
    } catch (error) {
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
      
      return data
    } catch (error) {
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
      
    } catch (error) {
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
      
    } catch (error) {
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
      
      return data
    } catch (error) {
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
      
      return data
    } catch (error) {
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
      
    } catch (error) {
      throw error
    }
  }
  
  // Copier les templates par défaut vers les items utilisateur
  static async copyDefaultTemplates(userId) {
    try {
      const { data, error } = await supabase
        .rpc('copy_default_templates_to_user', { p_user_id: userId })
      
      if (error) throw error
      
      return true
    } catch (error) {
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
      
      return data
    } catch (error) {
      throw error
    }
  }
  
  // Récupérer les sessions de checklist récentes
  static async getChecklistSessions(userId, limit = 50) {
    try {
      // Récupérer d'abord les sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('checklist_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (sessionsError) throw sessionsError
      
      if (!sessions || sessions.length === 0) return []
      
      // Récupérer les trades associés séparément
      const sessionIds = sessions.map(s => s.id)
      const { data: trades, error: tradesError } = await supabase
        .from('active_trades')
        .select('*')
        .eq('user_id', userId)
        .or(`entry_session_id.in.(${sessionIds.join(',')}),exit_session_id.in.(${sessionIds.join(',')})`)
      
      if (tradesError) {
        // Silent error for trades
      }
      
      // Associer les trades aux sessions
      const sessionsWithTrades = sessions.map(session => {
        const entryTrades = trades?.filter(t => t.entry_session_id === session.id) || []
        const exitTrades = trades?.filter(t => t.exit_session_id === session.id) || []
        
        return {
          ...session,
          entry_trades: entryTrades,
          exit_trades: exitTrades
        }
      })
      
      return sessionsWithTrades
    } catch (error) {
      return []
    }
  }

  static async deleteChecklistSession(userId, sessionId) {
    try {
      const { error } = await supabase
        .from('checklist_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      return true
    } catch (error) {
      throw error
    }
  }
  
  static async deleteAllChecklistSessions(userId) {
    try {
      // Supprimer d'abord tous les trades associés
      const { error: tradesError } = await supabase
        .from('active_trades')
        .delete()
        .eq('user_id', userId)
      
      if (tradesError) {
        // Silent error for trades
      }
      
      // Puis supprimer toutes les sessions
      const { error } = await supabase
        .from('checklist_sessions')
        .delete()
        .eq('user_id', userId)
      
      if (error) throw error
      
      return true
    } catch (error) {
      throw error
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
      return null
    }
  }
  
  // Récupérer les trades complétés
  static async getCompletedTrades(userId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('active_trades')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('exit_time', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return data || []
    } catch (error) {
      return []
    }
  }
  
  // Supprimer un trade complété
  static async deleteCompletedTrade(userId, tradeId) {
    try {
      const { error } = await supabase
        .from('active_trades')
        .delete()
        .eq('id', tradeId)
        .eq('user_id', userId)
      
      if (error) throw error
      
      return true
    } catch (error) {
      throw error
    }
  }
  
  // Supprimer tous les trades complétés
  static async deleteAllCompletedTrades(userId) {
    try {
      const { error } = await supabase
        .from('active_trades')
        .delete()
        .eq('user_id', userId)
        .eq('status', 'completed')
      
      if (error) throw error
      
      return true
    } catch (error) {
      throw error
    }
  }
  
  // Créer un nouveau trade actif
  static async createActiveTrade(userId, tradeData) {
    try {
      const { data, error } = await supabase
        .from('active_trades')
        .insert({
          user_id: userId,
          entry_session_id: tradeData.entry_session_id,
          entry_score: tradeData.entry_score,
          symbol: tradeData.symbol,
          status: 'active',
          entry_time: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      return data
    } catch (error) {
      throw error
    }
  }
  
  // Fermer un trade actif
  static async closeActiveTrade(userId, tradeId, exitSessionId, tradeResult, exitScore) {
    try {
      // D'abord récupérer le trade actif pour calculer la durée
      const { data: trade, error: fetchError } = await supabase
        .from('active_trades')
        .select('*')
        .eq('id', tradeId)
        .eq('user_id', userId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Calculer la durée en secondes
      const entryTime = new Date(trade.entry_time)
      const exitTime = new Date()
      const durationSeconds = Math.floor((exitTime - entryTime) / 1000)
      
      // Mettre à jour le trade avec les informations de sortie
      const { data, error } = await supabase
        .from('active_trades')
        .update({
          status: 'completed',
          exit_time: exitTime.toISOString(),
          exit_session_id: exitSessionId,
          exit_score: exitScore,
          duration_seconds: durationSeconds,
          trade_result: tradeResult,
          updated_at: new Date().toISOString()
        })
        .eq('id', tradeId)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) throw error
      
      return data
    } catch (error) {
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
      
      return data
    } catch (error) {
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
      
      return data
    } catch (error) {
      throw error
    }
  }
  
  // === MIGRATION DEPUIS LOCALSTORAGE ===
  
  // Migrer les données localStorage vers Supabase
  static async migrateFromLocalStorage(userId) {
    try {
      // Récupérer les données localStorage
      const localData = this.getLocalStorageData()
      
      if (Object.keys(localData).length === 0) {
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
      
      // Optionnel : nettoyer localStorage après migration
      // this.clearLocalStorage()
      
    } catch (error) {
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
  }
}