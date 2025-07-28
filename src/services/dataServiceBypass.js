// BYPASS VERSION - No database calls, returns mock data

export class DataService {
  
  // === PARAMÈTRES UTILISATEUR ===
  
  // Récupérer les paramètres utilisateur
  static async getUserSettings(userId) {
    console.log('[DataService BYPASS] Returning default settings for user:', userId)
    return this.getDefaultSettings(userId)
  }
  
  // Sauvegarder les paramètres utilisateur
  static async saveUserSettings(userId, settings) {
    console.log('[DataService BYPASS] Settings saved locally:', settings)
    // Store in localStorage for persistence during bypass mode
    localStorage.setItem('bypass_user_settings', JSON.stringify(settings))
    return settings
  }
  
  // Paramètres par défaut
  static getDefaultSettings(userId) {
    // Check localStorage first
    const saved = localStorage.getItem('bypass_user_settings')
    if (saved) {
      return JSON.parse(saved)
    }
    
    return {
      user_id: userId,
      initial_capital: 10000,
      current_balance: 10000,
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
    console.log('[DataService BYPASS] Returning empty journal')
    const saved = localStorage.getItem('bypass_trading_journal')
    return saved ? JSON.parse(saved) : {}
  }
  
  // Sauvegarder une entrée du journal
  static async saveTradingJournalEntry(userId, date, entryData) {
    console.log('[DataService BYPASS] Journal entry saved:', { date, entryData })
    const journal = JSON.parse(localStorage.getItem('bypass_trading_journal') || '{}')
    journal[date] = entryData
    localStorage.setItem('bypass_trading_journal', JSON.stringify(journal))
    return { trade_date: date, ...entryData }
  }
  
  // Supprimer une entrée du journal
  static async deleteTradingJournalEntry(userId, date) {
    const journal = JSON.parse(localStorage.getItem('bypass_trading_journal') || '{}')
    delete journal[date]
    localStorage.setItem('bypass_trading_journal', JSON.stringify(journal))
  }
  
  // Supprimer toutes les entrées du journal d'un utilisateur
  static async deleteAllTradingJournalEntries(userId) {
    localStorage.setItem('bypass_trading_journal', '{}')
  }
  
  // === CHECKLISTS ===
  
  // Récupérer les templates de checklist par défaut
  static async getChecklistTemplates() {
    console.log('[DataService BYPASS] Returning default checklist templates')
    return [
      {
        id: '1',
        type: 'entry',
        item_text: 'Tendance confirmée sur plusieurs timeframes',
        order_index: 1,
        is_default: true
      },
      {
        id: '2',
        type: 'entry',
        item_text: 'Support/Résistance identifiés',
        order_index: 2,
        is_default: true
      },
      {
        id: '3',
        type: 'exit',
        item_text: 'Objectif atteint',
        order_index: 1,
        is_default: true
      },
      {
        id: '4',
        type: 'exit',
        item_text: 'Signal de retournement',
        order_index: 2,
        is_default: true
      }
    ]
  }
  
  // Récupérer les checklists personnalisées de l'utilisateur
  static async getUserChecklistItems(userId) {
    const saved = localStorage.getItem('bypass_checklist_items')
    if (saved) {
      return JSON.parse(saved)
    }
    // Return default templates as user items
    return this.getChecklistTemplates()
  }
  
  // Sauvegarder un nouvel item de checklist
  static async saveUserChecklistItem(userId, itemData) {
    const items = JSON.parse(localStorage.getItem('bypass_checklist_items') || '[]')
    const newItem = {
      id: Date.now().toString(),
      user_id: userId,
      ...itemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    items.push(newItem)
    localStorage.setItem('bypass_checklist_items', JSON.stringify(items))
    return newItem
  }
  
  // Mettre à jour un item de checklist
  static async updateUserChecklistItem(userId, itemId, updates) {
    const items = JSON.parse(localStorage.getItem('bypass_checklist_items') || '[]')
    const index = items.findIndex(item => item.id === itemId)
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() }
      localStorage.setItem('bypass_checklist_items', JSON.stringify(items))
      return items[index]
    }
    throw new Error('Item not found')
  }
  
  // Supprimer un item de checklist
  static async deleteUserChecklistItem(userId, itemId) {
    const items = JSON.parse(localStorage.getItem('bypass_checklist_items') || '[]')
    const filtered = items.filter(item => item.id !== itemId)
    localStorage.setItem('bypass_checklist_items', JSON.stringify(filtered))
  }
  
  // Copier les templates par défaut vers les items utilisateur
  static async copyDefaultTemplates(userId) {
    const templates = await this.getChecklistTemplates()
    localStorage.setItem('bypass_checklist_items', JSON.stringify(templates))
    return true
  }
  
  // Sauvegarder une session de checklist
  static async saveChecklistSession(userId, sessionData) {
    const sessions = JSON.parse(localStorage.getItem('bypass_checklist_sessions') || '[]')
    const newSession = {
      id: Date.now().toString(),
      user_id: userId,
      ...sessionData,
      created_at: new Date().toISOString()
    }
    sessions.unshift(newSession)
    localStorage.setItem('bypass_checklist_sessions', JSON.stringify(sessions.slice(0, 50)))
    return newSession
  }
  
  // Récupérer les sessions de checklist récentes
  static async getChecklistSessions(userId, limit = 50) {
    const sessions = JSON.parse(localStorage.getItem('bypass_checklist_sessions') || '[]')
    return sessions.slice(0, limit)
  }

  static async deleteChecklistSession(userId, sessionId) {
    const sessions = JSON.parse(localStorage.getItem('bypass_checklist_sessions') || '[]')
    const filtered = sessions.filter(s => s.id !== sessionId)
    localStorage.setItem('bypass_checklist_sessions', JSON.stringify(filtered))
    return true
  }
  
  static async deleteAllChecklistSessions(userId) {
    localStorage.setItem('bypass_checklist_sessions', '[]')
    localStorage.removeItem('bypass_active_trade')
    return true
  }
  
  // === TRADES ACTIFS ===
  
  // Récupérer le trade actif
  static async getActiveTrade(userId) {
    const saved = localStorage.getItem('bypass_active_trade')
    return saved ? JSON.parse(saved) : null
  }
  
  // Récupérer les trades complétés
  static async getCompletedTrades(userId, limit = 50) {
    const trades = JSON.parse(localStorage.getItem('bypass_completed_trades') || '[]')
    return trades.slice(0, limit)
  }
  
  // Supprimer un trade complété
  static async deleteCompletedTrade(userId, tradeId) {
    const trades = JSON.parse(localStorage.getItem('bypass_completed_trades') || '[]')
    const filtered = trades.filter(t => t.id !== tradeId)
    localStorage.setItem('bypass_completed_trades', JSON.stringify(filtered))
    return true
  }
  
  // Supprimer tous les trades complétés
  static async deleteAllCompletedTrades(userId) {
    localStorage.setItem('bypass_completed_trades', '[]')
    return true
  }
  
  // Créer un nouveau trade actif
  static async createActiveTrade(userId, tradeData) {
    const newTrade = {
      id: Date.now().toString(),
      user_id: userId,
      ...tradeData,
      status: 'active',
      entry_time: new Date().toISOString()
    }
    localStorage.setItem('bypass_active_trade', JSON.stringify(newTrade))
    return newTrade
  }
  
  // Fermer un trade actif
  static async closeActiveTrade(userId, tradeId, exitSessionId, tradeResult, exitScore) {
    const trade = JSON.parse(localStorage.getItem('bypass_active_trade') || 'null')
    if (!trade || trade.id !== tradeId) {
      throw new Error('Trade not found')
    }
    
    const entryTime = new Date(trade.entry_time)
    const exitTime = new Date()
    const durationSeconds = Math.floor((exitTime - entryTime) / 1000)
    
    const completedTrade = {
      ...trade,
      status: 'completed',
      exit_time: exitTime.toISOString(),
      exit_session_id: exitSessionId,
      exit_score: exitScore,
      duration_seconds: durationSeconds,
      trade_result: tradeResult,
      updated_at: new Date().toISOString()
    }
    
    // Remove from active
    localStorage.removeItem('bypass_active_trade')
    
    // Add to completed
    const completedTrades = JSON.parse(localStorage.getItem('bypass_completed_trades') || '[]')
    completedTrades.unshift(completedTrade)
    localStorage.setItem('bypass_completed_trades', JSON.stringify(completedTrades.slice(0, 100)))
    
    return completedTrade
  }
  
  // === ANALYSES IA ===
  
  // Sauvegarder une analyse IA
  static async saveAIAnalysis(userId, analysisData, modelUsed, provider) {
    const analyses = JSON.parse(localStorage.getItem('bypass_ai_analyses') || '[]')
    const newAnalysis = {
      id: Date.now().toString(),
      user_id: userId,
      analysis_data: analysisData,
      model_used: modelUsed,
      provider: provider,
      created_at: new Date().toISOString()
    }
    analyses.unshift(newAnalysis)
    localStorage.setItem('bypass_ai_analyses', JSON.stringify(analyses.slice(0, 10)))
    return newAnalysis
  }
  
  // Récupérer les analyses IA récentes
  static async getRecentAIAnalyses(userId, limit = 10) {
    const analyses = JSON.parse(localStorage.getItem('bypass_ai_analyses') || '[]')
    return analyses.slice(0, limit)
  }
  
  // === CALCULS DE POSITION ===
  
  // Sauvegarder un calcul de position
  static async savePositionCalculation(userId, calculationData) {
    const calculations = JSON.parse(localStorage.getItem('bypass_position_calculations') || '[]')
    const newCalc = {
      id: Date.now().toString(),
      user_id: userId,
      calculation_data: calculationData,
      created_at: new Date().toISOString()
    }
    calculations.unshift(newCalc)
    localStorage.setItem('bypass_position_calculations', JSON.stringify(calculations.slice(0, 20)))
    return newCalc
  }
  
  // === MIGRATION DEPUIS LOCALSTORAGE ===
  
  // Migrer les données localStorage vers Supabase
  static async migrateFromLocalStorage(userId) {
    console.log('[DataService BYPASS] Migration skipped in bypass mode')
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
      if (key.startsWith('bypass_')) {
        localStorage.removeItem(key)
      }
    })
  }
}