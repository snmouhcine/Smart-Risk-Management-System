// Configuration des modèles disponibles
export const AI_MODELS = {
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)', description: 'Modèle le plus avancé et rapide' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', description: 'Modèle le plus puissant pour tâches complexes' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', description: 'Équilibre entre performance et coût' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', description: 'Modèle rapide et économique' }
  ],
  openai: [
    { id: 'gpt-4-turbo-preview', name: 'GPT-4 Turbo', description: 'Dernière version de GPT-4' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Modèle GPT-4 standard' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Rapide et économique' }
  ]
};

// Fonction pour appeler l'API Anthropic
export async function callAnthropicAPI(apiKey, model, messages, maxTokens = 2000) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true" // Active CORS
      },
      body: JSON.stringify({
        model: model,
        max_tokens: maxTokens,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur Anthropic API (${response.status}): ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erreur lors de l'appel Anthropic:", error);
    throw error;
  }
}

// Fonction pour appeler l'API OpenAI
export async function callOpenAIAPI(apiKey, model, messages, maxTokens = 2000) {
  try {
    // Log pour debug
    console.log("Appel OpenAI avec modèle:", model);
    console.log("Clé API commence par:", apiKey.substring(0, 7) + "...");
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      // Gestion spécifique de l'erreur 429 insufficient_quota
      if (response.status === 429 && errorData.error?.code === 'insufficient_quota') {
        throw new Error(`Quota insuffisant OpenAI. Vérifiez:
1. Votre solde de crédits sur https://platform.openai.com/billing
2. Que vous avez bien ajouté des crédits (pas seulement un abonnement ChatGPT)
3. Essayez de générer une nouvelle clé API
4. Attendez quelques heures si vous venez d'ajouter des crédits
5. Utilisez Anthropic (Claude) en attendant`);
      }
      
      throw new Error(`Erreur OpenAI API (${response.status}): ${errorData.error?.message || errorText}`);
    }

    const data = await response.json();
    
    // Convertir la réponse OpenAI au format Anthropic pour uniformité
    return {
      content: [{
        text: data.choices[0].message.content
      }]
    };
  } catch (error) {
    console.error("Erreur lors de l'appel OpenAI:", error);
    throw error;
  }
}

// Fonction unifiée pour appeler l'API appropriée
export async function callAIAPI(provider, apiKey, model, messages, maxTokens = 2000) {
  if (!apiKey) {
    throw new Error(`Clé API ${provider} non configurée`);
  }

  // Convertir les messages au format approprié si nécessaire
  let formattedMessages = messages;
  
  if (provider === 'openai') {
    // OpenAI utilise un format légèrement différent
    formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : msg.role,
      content: typeof msg.content === 'string' ? msg.content : msg.content[0].text
    }));
    return callOpenAIAPI(apiKey, model, formattedMessages, maxTokens);
  } else {
    return callAnthropicAPI(apiKey, model, messages, maxTokens);
  }
}

// Fonction pour tester la connexion à l'API
export async function testAPIConnection(provider, apiKey) {
  try {
    const testMessage = [{
      role: "user",
      content: provider === 'anthropic' 
        ? "Réponds simplement 'Connexion réussie' si tu reçois ce message."
        : "Reply with 'Connection successful' if you receive this message."
    }];
    
    const defaultModel = provider === 'anthropic' 
      ? 'claude-3-haiku-20240307' 
      : 'gpt-3.5-turbo';
    
    const response = await callAIAPI(provider, apiKey, defaultModel, testMessage, 50);
    return { success: true, message: "Connexion réussie!" };
  } catch (error) {
    return { success: false, message: error.message };
  }
}