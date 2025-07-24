# 🚀 Smart Risk Management System - Méthode Alpha AI

Un système intelligent de gestion des risques pour le trading, intégrant l'IA pour optimiser la protection du capital et maximiser les performances.

## 🎯 Fonctionnalités Principales

### 📊 Dashboard Intelligent
- Visualisation en temps réel du capital et des performances
- Alertes de drawdown automatiques
- Recommandations IA adaptatives
- Indicateurs de protection du capital

### 🤖 Directeur Financier IA
- Analyse en temps réel basée sur vos données de trading
- Recommandations personnalisées selon vos objectifs
- Ajustement automatique du risque selon les conditions
- Protection automatique si objectifs atteints

### 🧮 Calculateur de Position Avancé
- Calcul automatique de la taille de position optimale
- Intégration des recommandations du Directeur IA
- Support multi-contrats (MNQ, NQ)
- Visualisation des gains potentiels

### 📅 Journal de Trading Intelligent
- Calendrier interactif avec visualisation P&L
- Détection automatique des patterns dangereux
- Statistiques avancées (Win Rate, Profit Factor)
- Analyse des séries de pertes

### ⚙️ Système de Protection Avancé
- **Protection Drawdown Dynamique**
  - Seuil 1 (1.5%) : Risque réduit à 80%
  - Seuil 2 (3%) : Risque réduit à 60%
  - Seuil 3 (5%) : Risque réduit à 30%
  - Seuil 4 (8%) : MODE SURVIE - Risque à 20%
- **Protection Objectifs Atteints**
  - Objectif mensuel atteint : Risque max 0.2%
  - Objectif hebdomadaire atteint : Mode conservateur

## 🛠️ Technologies Utilisées

- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **IA**: Claude API (Anthropic)
- **State Management**: React Hooks

## 📦 Installation

```bash
# Cloner le repository
git clone https://github.com/snmouhcine/Smart-Risk-Management-System.git

# Installer les dépendances
cd Smart-Risk-Management-System
npm install

# Lancer l'application
npm run dev
```

## 🔧 Configuration

1. **Capital Initial**: Configurez votre capital de départ dans les Paramètres
2. **Objectifs**: Définissez vos objectifs hebdomadaires et mensuels
3. **API Claude** (optionnel): Ajoutez votre clé API Anthropic pour l'analyse IA avancée

## 💡 Workflow Recommandé

1. **Début de journée**
   - Ouvrez l'onglet "Directeur IA"
   - Cliquez sur "ANALYSE TEMPS RÉEL"
   - Obtenez vos KPIs personnalisés pour la journée

2. **Avant chaque trade**
   - Allez dans "Calculateur"
   - Les recommandations IA sont automatiquement appliquées
   - Entrez votre stop loss en ticks
   - Obtenez la taille de position optimale

3. **Après chaque trade**
   - Enregistrez le résultat dans le "Journal"
   - Le système ajustera automatiquement les futures recommandations

## 🛡️ Sécurité & Protection

- Mode Sécurisé : Réduit tous les risques de 50%
- Protection automatique en cas de drawdown
- Arrêt automatique si patterns dangereux détectés
- Mode survie en cas de drawdown critique

## 📈 Architecture Modulaire

```
src/components/
├── MethodeAlpha.jsx          # Composant principal
└── modules/
    ├── Dashboard.jsx         # Module tableau de bord
    ├── Calculator.jsx        # Module calculateur
    ├── Journal.jsx          # Module journal
    ├── DirecteurIA.jsx      # Module IA
    └── Settings.jsx         # Module paramètres
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 License

MIT License - Voir le fichier LICENSE pour plus de détails.

## 👨‍💻 Auteur

**SN Mouhcine**

---

⭐ Si ce projet vous aide dans votre trading, n'hésitez pas à lui donner une étoile !
