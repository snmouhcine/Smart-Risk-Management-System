// Data management utility for easy migration to Supabase
// This centralizes all data operations for future database integration

export const dataManager = {
  // Export all localStorage data
  exportAllData: () => {
    const data = {};
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('methodealpha_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch (e) {
          data[key] = localStorage.getItem(key);
        }
      }
    });
    
    return data;
  },

  // Import data (useful for restoring backups)
  importData: (data) => {
    Object.entries(data).forEach(([key, value]) => {
      if (key.startsWith('methodealpha_')) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
  },

  // Download data as JSON file
  downloadBackup: () => {
    const data = dataManager.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `methodealpha_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Clear all app data
  clearAllData: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('methodealpha_')) {
        localStorage.removeItem(key);
      }
    });
  },
  
  // Reset specific keys
  resetModelSelection: () => {
    localStorage.removeItem('methodealpha_selectedModel');
  },

  // Future Supabase migration helpers
  // These functions will be implemented when you integrate Supabase
  supabase: {
    // Migrate localStorage to Supabase
    migrateToSupabase: async (supabaseClient) => {
      const data = dataManager.exportAllData();
      
      // TODO: Implement Supabase migration logic
      // Example structure:
      // - Create user profile if not exists
      // - Insert/update calculator settings
      // - Insert trading journal entries
      // - Insert AI analysis history
      // etc.
      
      console.log('Ready to migrate to Supabase:', data);
      return data;
    },

    // Sync local changes to Supabase
    syncToSupabase: async (supabaseClient, key, value) => {
      // TODO: Implement real-time sync
      console.log('Ready to sync to Supabase:', { key, value });
    }
  }
};

// Helper to format data for display
export const formatDataForExport = (data) => {
  const formatted = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    settings: {
      capital: data.methodealpha_capital || '',
      initialCapital: data.methodealpha_initialCapital || '',
      riskPerTrade: data.methodealpha_riskPerTrade || 1,
      dailyLossMax: data.methodealpha_dailyLossMax || 3,
      weeklyTarget: data.methodealpha_weeklyTarget || 2,
      monthlyTarget: data.methodealpha_monthlyTarget || 8,
      anthropicApiKey: data.methodealpha_anthropicApiKey || ''
    },
    tradingJournal: data.methodealpha_tradingJournal || {},
    calculations: {
      results: data.methodealpha_results || null,
      recommendations: data.methodealpha_recommendations || null,
      aiAnalysis: data.methodealpha_aiAnalysis || null,
      drawdownProtection: data.methodealpha_drawdownProtection || null
    },
    ui: {
      activeTab: data.methodealpha_activeTab || 'dashboard',
      sidebarOpen: data.methodealpha_sidebarOpen ?? true,
      secureMode: data.methodealpha_secureMode || false
    }
  };
  
  return formatted;
};