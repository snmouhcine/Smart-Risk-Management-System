# 🚀 Installation Supabase - Smart Risk Management System

Ce guide vous accompagne dans la configuration complète de Supabase pour votre application de gestion des risques de trading.

## 📋 Prérequis

- Compte Supabase créé sur [supabase.com](https://supabase.com)
- Node.js installé sur votre machine
- Git configuré

## 🛠️ Configuration Supabase

### 1. Créer un nouveau projet

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Cliquez sur "New Project"
3. Choisissez votre organisation
4. Donnez un nom à votre projet (ex: `smart-risk-management`)
5. Créez un mot de passe fort pour la base de données
6. Sélectionnez une région proche de vous
7. Cliquez sur "Create new project"

### 2. Configurer les variables d'environnement

1. Dans votre projet Supabase, allez dans **Settings** > **API**
2. Copiez l'URL de votre projet et la clé publique (anon key)
3. Dans votre projet local, créez un fichier `.env.local` :

```bash
cp .env.example .env.local
```

4. Éditez `.env.local` avec vos vraies clés :

```env
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Créer le schéma de base de données

1. Dans Supabase, allez dans **SQL Editor**
2. Copiez le contenu du fichier `supabase-schema.sql` de ce projet
3. Collez-le dans l'éditeur SQL et exécutez-le
4. Vérifiez que toutes les tables ont été créées dans **Table Editor**

## 🔒 Configuration de l'authentification

### 1. Activer les providers d'authentification

Dans Supabase, allez dans **Authentication** > **Providers** :

1. **Email** : Activé par défaut ✅
2. Configurez l'URL de confirmation si nécessaire

### 2. Configurer les redirections

Dans **Authentication** > **URL Configuration** :

- **Site URL** : `http://localhost:5173` (pour le développement)
- **Redirect URLs** : `http://localhost:5173/**`

## 🛡️ Sécurité RLS (Row Level Security)

Le schéma SQL active automatiquement RLS sur toutes les tables. Vérifiez dans **Authentication** > **Policies** que les politiques sont actives :

- ✅ `user_profiles` : Politiques pour CRUD personnel
- ✅ `user_settings` : Accès aux paramètres personnels uniquement
- ✅ `trading_journal` : Journal isolé par utilisateur
- ✅ `ai_analyses` : Analyses IA privées
- ✅ `position_calculations` : Calculs personnels

## 📦 Installation locale

### 1. Installer les dépendances

```bash
npm install
```

### 2. Vérifier la configuration

```bash
npm run dev
```

Ouvrez `http://localhost:5173` et vérifiez :

1. ✅ La page de connexion s'affiche
2. ✅ Vous pouvez créer un compte
3. ✅ La connexion fonctionne
4. ✅ Les données se sauvegardent automatiquement

## 🧪 Test de l'installation

### 1. Créer un compte de test

1. Ouvrez l'application
2. Cliquez sur "Créer un compte"
3. Utilisez un email de test valide
4. Confirmez votre email (vérifiez vos spams)
5. Connectez-vous

### 2. Tester les fonctionnalités

1. **Paramètres** : Modifiez le capital initial → Vérifiez la sauvegarde
2. **Journal** : Ajoutez une entrée de trading → Vérifiez la persistance
3. **IA** : Testez avec une clé API → Vérifiez l'historique
4. **Calculateur** : Testez les calculs → Vérifiez les sauvegardes

### 3. Vérifier l'isolation des données

1. Créez un second compte utilisateur
2. Vérifiez que les données sont complètement séparées
3. Testez la déconnexion et reconnexion

## 🔧 Dépannage

### Erreur de connexion Supabase

```
❌ Erreur connexion Supabase: Invalid API key
```

**Solutions :**
1. Vérifiez vos variables d'environnement dans `.env.local`
2. Redémarrez le serveur de développement
3. Vérifiez que l'URL et la clé sont correctes dans Supabase

### Erreur RLS (Row Level Security)

```
❌ new row violates row-level security policy
```

**Solutions :**
1. Vérifiez que le schéma SQL a été exécuté complètement
2. Vérifiez les politiques dans **Authentication** > **Policies**
3. Assurez-vous que l'utilisateur est bien authentifié

### Erreur de migration localStorage

```
❌ Erreur migration: PGRST116
```

**Solution :**
Cette erreur est normale pour les nouveaux utilisateurs (aucune donnée à migrer).

### Tables manquantes

Si certaines tables n'existent pas :

1. Allez dans **SQL Editor**
2. Ré-exécutez le fichier `supabase-schema.sql`
3. Vérifiez dans **Table Editor** que toutes les tables sont présentes

## 🚀 Déploiement en production

### 1. Mettre à jour les URLs

Dans Supabase **Authentication** > **URL Configuration** :

- **Site URL** : `https://votre-domaine.com`
- **Redirect URLs** : `https://votre-domaine.com/**`

### 2. Variables d'environnement production

Configurez les mêmes variables dans votre plateforme de déploiement :

```env
VITE_SUPABASE_URL=https://votre-projet-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Sécurité supplémentaire

1. Activez **Email confirmations** en production
2. Configurez des **Email templates** personnalisés
3. Activez **CAPTCHA** si nécessaire
4. Surveillez les **logs** d'authentification

## 📈 Monitoring et maintenance

### 1. Tableaux de bord Supabase

Surveillez régulièrement :

- **Usage** : Requêtes et stockage
- **Auth** : Nouvelles inscriptions et connexions
- **Logs** : Erreurs et performances

### 2. Sauvegarde

Supabase sauvegarde automatiquement, mais considérez :

- Exports réguliers pour les données critiques
- Tests de restauration périodiques

## 💡 Bonnes pratiques

### Sécurité

- ✅ Gardez les clés API secrètes
- ✅ Utilisez HTTPS en production
- ✅ Surveillez les tentatives de connexion
- ✅ Mettez à jour régulièrement les dépendances

### Performance

- ✅ Utilisez les index fournis dans le schéma
- ✅ Surveillez les requêtes lentes
- ✅ Optimisez les appels API IA

### Utilisateurs

- ✅ Fournissez des messages d'erreur clairs
- ✅ Implémentez la récupération de mot de passe
- ✅ Gérez les cas de déconnexion réseau

## 🆘 Support

En cas de problème :

1. Consultez les [docs Supabase](https://supabase.com/docs)
2. Vérifiez les logs dans Supabase Dashboard
3. Testez avec `console.log` pour débugger
4. Utilisez les outils de développement du navigateur

## ✅ Checklist finale

- [ ] Projet Supabase créé
- [ ] Variables d'environnement configurées
- [ ] Schéma SQL exécuté
- [ ] Authentification testée
- [ ] Policies RLS vérifiées
- [ ] Isolation des données confirmée
- [ ] Sauvegarde automatique testée
- [ ] Migration localStorage fonctionnelle
- [ ] Interface multi-utilisateurs validée

**🎉 Félicitations ! Votre Smart Risk Management System est maintenant multi-utilisateurs avec Supabase !** 