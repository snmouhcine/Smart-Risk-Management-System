// Multi-AI Provider System
// Supports multiple AI models with easy switching

export const AI_PROVIDERS = {
  ANTHROPIC: {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    models: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', maxTokens: 8192 },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', maxTokens: 8192 },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', maxTokens: 4096 },
      { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', maxTokens: 4096 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', maxTokens: 4096 }
    ],
    defaultModel: 'claude-3-5-sonnet-20241022',
    apiKeyPrefix: 'sk-ant-',
    endpoint: '/api/anthropic/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    }),
    formatRequest: (messages, model, maxTokens = 2000) => ({
      model: model,
      max_tokens: maxTokens,
      messages: messages
    }),
    parseResponse: (data) => {
      return data.content[0].text;
    }
  },
  
  OPENAI: {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', maxTokens: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', maxTokens: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 128000 },
      { id: 'gpt-4-turbo-2024-04-09', name: 'GPT-4 Turbo (April 2024)', maxTokens: 128000 },
      { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192 },
      { id: 'gpt-4-0613', name: 'GPT-4 (June 2023)', maxTokens: 8192 },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 16385 },
      { id: 'gpt-3.5-turbo-0125', name: 'GPT-3.5 Turbo (Latest)', maxTokens: 16385 },
      { id: 'gpt-3.5-turbo-1106', name: 'GPT-3.5 Turbo (Nov 2023)', maxTokens: 16385 }
    ],
    defaultModel: 'gpt-3.5-turbo',
    apiKeyPrefix: 'sk-',
    endpoint: '/api/openai/v1/chat/completions',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }),
    formatRequest: (messages, model, maxTokens = 2000) => ({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: 0.7
    }),
    parseResponse: (data) => {
      return data.choices[0].message.content;
    }
  },
  
  GOOGLE: {
    id: 'google',
    name: 'Google (Gemini)',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 32768 },
      { id: 'gemini-pro-vision', name: 'Gemini Pro Vision', maxTokens: 32768 }
    ],
    defaultModel: 'gemini-pro',
    apiKeyPrefix: 'AI',
    endpoint: '/api/google/v1beta/models',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    }),
    formatRequest: (messages, model, maxTokens = 2000) => ({
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.7
      }
    }),
    parseResponse: (data) => {
      return data.candidates[0].content.parts[0].text;
    }
  }
};

// AI Provider Manager Class
export class AIProviderManager {
  constructor() {
    this.currentProvider = null;
    this.apiKeys = {};
  }

  // Set API key for a provider
  setApiKey(providerId, apiKey) {
    this.apiKeys[providerId] = apiKey;
  }

  // Get API key for a provider
  getApiKey(providerId) {
    return this.apiKeys[providerId];
  }

  // Set current provider
  setCurrentProvider(providerId) {
    if (AI_PROVIDERS[providerId]) {
      this.currentProvider = AI_PROVIDERS[providerId];
      return true;
    }
    return false;
  }

  // Get current provider
  getCurrentProvider() {
    return this.currentProvider;
  }

  // Validate API key format
  validateApiKey(providerId, apiKey) {
    const provider = AI_PROVIDERS[providerId];
    if (!provider || !apiKey) return false;
    
    // Basic validation - check if key starts with expected prefix
    if (provider.apiKeyPrefix && !apiKey.startsWith(provider.apiKeyPrefix)) {
      return false;
    }
    
    return true;
  }

  // Make API request to current provider
  async makeRequest(messages, options = {}) {
    if (!this.currentProvider) {
      throw new Error('No AI provider selected');
    }

    const apiKey = this.getApiKey(this.currentProvider.id);
    if (!apiKey) {
      throw new Error(`No API key configured for ${this.currentProvider.name}`);
    }

    const model = options.model || this.currentProvider.defaultModel;
    const maxTokens = options.maxTokens || 2000;
    
    console.log('AI Provider Request:', {
      provider: this.currentProvider.name,
      model: model,
      endpoint: this.currentProvider.endpoint
    });

    try {
      const response = await fetch(this.currentProvider.endpoint, {
        method: 'POST',
        headers: this.currentProvider.headers(apiKey),
        body: JSON.stringify(
          this.currentProvider.formatRequest(messages, model, maxTokens)
        )
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.currentProvider.parseResponse(data);
    } catch (error) {
      console.error(`Error with ${this.currentProvider.name}:`, error);
      throw error;
    }
  }

  // Get all available providers
  getAvailableProviders() {
    return Object.values(AI_PROVIDERS).map(provider => ({
      id: provider.id,
      name: provider.name,
      models: provider.models,
      hasApiKey: !!this.getApiKey(provider.id)
    }));
  }

  // Get models for a provider
  getModelsForProvider(providerId) {
    const provider = AI_PROVIDERS[providerId];
    return provider ? provider.models : [];
  }
}

// Create singleton instance
export const aiProviderManager = new AIProviderManager();

// Helper function to format the financial director prompt
export const formatFinancialDirectorPrompt = (financialData) => {
  return [{
    role: "user",
    content: `Tu es un DIRECTEUR DE RISQUE expert en trading. Ta priorité ABSOLUE est la PRÉSERVATION DU CAPITAL et éviter les pertes. Analyse ces données et fournis des décisions IMMÉDIATES.

## SITUATION ACTUELLE:
${JSON.stringify(financialData, null, 2)}

## RÈGLES CRITIQUES:
1. Si targetAchieved = true → RÉDUIRE LE RISQUE AU MINIMUM (max 0.5%)
2. Si consecutiveLosses >= 2 → RÉDUIRE LE RISQUE DE 50%
3. Si drawdown > 5% → MODE DÉFENSIF IMMÉDIAT
4. Si monthlyReturn > 80% de l'objectif → PROTÉGER LES GAINS
5. TOUJOURS privilégier la protection du capital sur les gains potentiels

## Format de réponse OBLIGATOIRE (JSON):
{
  "executiveSummary": {
    "status": "SAFE/CAUTION/DANGER/CRITICAL",
    "headline": "Décision principale en 1 phrase",
    "priority": "Action IMMÉDIATE à prendre"
  },
  "kpis": {
    "maxLossToday": "$XXX",
    "optimalRiskPerTrade": "$XXX",
    "minDailyGainRequired": "$XXX",
    "drawdownStatus": "OK/WARNING/DANGER/EMERGENCY",
    "tradesLeftBudget": X,
    "daysToTarget": X,
    "winRateRequired": "XX%",
    "capitalAtRisk": "X%"
  },
  "aiRecommendations": [
    "Action 1: PRÉCISE et ACTIONNABLE",
    "Action 2: PRÉCISE et ACTIONNABLE",
    "Action 3: PRÉCISE et ACTIONNABLE"
  ],
  "riskAssessment": {
    "level": "LOW/MEDIUM/HIGH/EXTREME",
    "factors": ["Facteur risque principal", "Facteur risque secondaire"],
    "recommendation": "Décision claire: TRADER ou ATTENDRE"
  },
  "marketStrategy": {
    "approach": "AGGRESSIVE/BALANCED/DEFENSIVE/STOP",
    "reasoning": "Justification en 1 phrase",
    "specificActions": ["FAIRE ceci maintenant", "NE PAS faire cela"]
  }
}

IMPORTANT:
- Si l'objectif mensuel est atteint → Recommande FORTEMENT de réduire/arrêter le trading
- Si pertes consécutives → Recommande une PAUSE
- Calcule optimalRiskPerTrade en fonction de adjustedRiskPercent, PAS originalRiskPercent
- Sois CONSERVATEUR - mieux vaut manquer une opportunité que perdre du capital`
  }];
};