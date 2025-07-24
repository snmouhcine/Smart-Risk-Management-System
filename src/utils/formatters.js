// Utilitaires de formatage pour l'application

/**
 * Formate un nombre avec un maximum de 2 décimales
 * @param {number|string} value - La valeur à formater
 * @param {number} decimals - Nombre de décimales (par défaut 2)
 * @returns {string} - Nombre formaté
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  return num.toFixed(decimals);
};

/**
 * Formate un montant en dollars avec 2 décimales
 * @param {number|string} value - La valeur à formater
 * @param {boolean} showSymbol - Afficher le symbole $ (par défaut true)
 * @returns {string} - Montant formaté
 */
export const formatCurrency = (value, showSymbol = true) => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `$${formatted}` : formatted;
};

/**
 * Formate un pourcentage avec 2 décimales
 * @param {number|string} value - La valeur à formater
 * @param {boolean} showSymbol - Afficher le symbole % (par défaut true)
 * @returns {string} - Pourcentage formaté
 */
export const formatPercentage = (value, showSymbol = true) => {
  if (value === null || value === undefined || value === '') return '';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  const formatted = num.toFixed(2);
  return showSymbol ? `${formatted}%` : formatted;
};

/**
 * Parse un input utilisateur pour obtenir un nombre valide
 * @param {string} input - L'input utilisateur
 * @param {number} decimals - Nombre de décimales maximum
 * @returns {string} - Valeur nettoyée
 */
export const parseNumberInput = (input, decimals = 2) => {
  if (!input) return '';
  
  // Remplacer les virgules par des points
  let cleaned = input.toString().replace(',', '.');
  
  // Supprimer tous les caractères non numériques sauf le point
  cleaned = cleaned.replace(/[^0-9.-]/g, '');
  
  // S'assurer qu'il n'y a qu'un seul point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limiter les décimales
  if (parts[1] && parts[1].length > decimals) {
    cleaned = parts[0] + '.' + parts[1].substring(0, decimals);
  }
  
  return cleaned;
};

/**
 * Calcule le montant restant pour atteindre un objectif mensuel
 * @param {number} currentBalance - Solde actuel
 * @param {number} initialCapital - Capital initial
 * @param {number} targetPercent - Objectif en pourcentage
 * @returns {object} - Informations sur l'objectif mensuel
 */
export const calculateMonthlyTargetAmount = (currentBalance, initialCapital, targetPercent) => {
  const currentBalanceNum = parseFloat(currentBalance) || 0;
  const initialCapitalNum = parseFloat(initialCapital) || 0;
  const targetPercentNum = parseFloat(targetPercent) || 0;
  
  if (initialCapitalNum <= 0) {
    return {
      targetAmount: 0,
      remainingAmount: 0,
      currentProgress: 0,
      isAchieved: false,
      currentReturn: 0
    };
  }
  
  const targetAmount = initialCapitalNum * (1 + targetPercentNum / 100);
  const remainingAmount = Math.max(0, targetAmount - currentBalanceNum);
  const currentReturn = ((currentBalanceNum - initialCapitalNum) / initialCapitalNum) * 100;
  const currentProgress = Math.min(100, (currentReturn / targetPercentNum) * 100);
  const isAchieved = currentBalanceNum >= targetAmount;
  
  return {
    targetAmount,
    remainingAmount,
    currentProgress,
    isAchieved,
    currentReturn
  };
};

/**
 * Calcule l'objectif hebdomadaire basé sur la performance de la semaine
 * @param {object} tradingJournal - Journal de trading
 * @param {number} currentBalance - Capital actuel
 * @param {number} weeklyTargetPercent - Objectif hebdomadaire en %
 * @returns {object} - Informations sur l'objectif hebdomadaire
 */
export const calculateWeeklyTargetAmount = (tradingJournal, currentBalance, weeklyTargetPercent) => {
  const currentBalanceNum = parseFloat(currentBalance) || 0;
  const targetPercentNum = parseFloat(weeklyTargetPercent) || 0;
  
  if (currentBalanceNum <= 0) {
    return {
      targetAmount: 0,
      remainingAmount: 0,
      currentProgress: 0,
      isAchieved: false,
      currentWeeklyPnL: 0,
      weekStartBalance: 0,
      daysFromMonday: 0
    };
  }
  
  // Calculer le début de la semaine (lundi)
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  const mondayOfThisWeek = new Date(today);
  mondayOfThisWeek.setDate(today.getDate() - daysFromMonday);
  mondayOfThisWeek.setHours(0, 0, 0, 0);
  
  // Calculer le P&L de la semaine en cours
  const weeklyPnL = Object.entries(tradingJournal || {}).reduce((sum, [dateKey, dayData]) => {
    const tradeDate = new Date(dateKey);
    tradeDate.setHours(0, 0, 0, 0);
    
    if (tradeDate >= mondayOfThisWeek && dayData.hasTraded) {
      return sum + (parseFloat(dayData.pnl) || 0);
    }
    return sum;
  }, 0);
  
  // Capital au début de la semaine
  const weekStartBalance = currentBalanceNum - weeklyPnL;
  
  // Objectif en dollars pour cette semaine
  const targetAmount = weekStartBalance * (targetPercentNum / 100);
  
  // Montant restant à gagner cette semaine
  const remainingAmount = Math.max(0, targetAmount - weeklyPnL);
  
  // Progression actuelle en pourcentage
  const currentProgress = targetAmount > 0 ? Math.min(100, (weeklyPnL / targetAmount) * 100) : 0;
  
  // Objectif atteint ?
  const isAchieved = weeklyPnL >= targetAmount;
  
  return {
    targetAmount,
    remainingAmount,
    currentProgress,
    isAchieved,
    currentWeeklyPnL: weeklyPnL,
    weekStartBalance,
    daysFromMonday: daysFromMonday + 1
  };
}; 