-- ===============================================
-- SCHÉMA SUPABASE - SMART RISK MANAGEMENT SYSTEM
-- ===============================================

-- Activer RLS (Row Level Security) par défaut
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- ===============================================
-- TABLE: user_profiles (Profils utilisateur étendus)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS pour user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile only" ON public.user_profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile only" ON public.user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile only" ON public.user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- ===============================================
-- TABLE: user_settings (Paramètres utilisateur)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  initial_capital DECIMAL(15,2) DEFAULT 0,
  current_balance DECIMAL(15,2) DEFAULT 0,
  risk_per_trade DECIMAL(5,2) DEFAULT 1.0,
  daily_loss_max DECIMAL(5,2) DEFAULT 3.0,
  weekly_target DECIMAL(5,2) DEFAULT 2.0,
  monthly_target DECIMAL(5,2) DEFAULT 8.0,
  secure_mode BOOLEAN DEFAULT false,
  ai_provider TEXT DEFAULT 'anthropic',
  selected_model TEXT DEFAULT 'claude-3-5-sonnet-20241022',
  anthropic_api_key TEXT,
  openai_api_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id)
);

-- RLS pour user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings only" ON public.user_settings
FOR ALL USING (auth.uid() = user_id);

-- ===============================================
-- TABLE: trading_journal (Journal de trading)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.trading_journal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  trade_date DATE NOT NULL,
  pnl DECIMAL(15,2) DEFAULT 0,
  notes TEXT,
  has_traded BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, trade_date)
);

-- RLS pour trading_journal
ALTER TABLE public.trading_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own journal only" ON public.trading_journal
FOR ALL USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_trading_journal_user_date ON public.trading_journal(user_id, trade_date DESC);

-- ===============================================
-- TABLE: ai_analyses (Analyses IA)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  analysis_data JSONB NOT NULL,
  model_used TEXT NOT NULL,
  provider TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS pour ai_analyses
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analyses only" ON public.ai_analyses
FOR ALL USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_ai_analyses_user_created ON public.ai_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_provider ON public.ai_analyses(provider);

-- ===============================================
-- TABLE: position_calculations (Calculs de position)
-- ===============================================
CREATE TABLE IF NOT EXISTS public.position_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  calculation_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS pour position_calculations
ALTER TABLE public.position_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calculations only" ON public.position_calculations
FOR ALL USING (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_position_calculations_user_created ON public.position_calculations(user_id, created_at DESC);

-- ===============================================
-- FONCTIONS ET TRIGGERS
-- ===============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER on_auth_user_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_user_settings_updated
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER on_trading_journal_updated
  BEFORE UPDATE ON public.trading_journal
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ===============================================
-- FONCTION: Créer profil utilisateur automatiquement
-- ===============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement le profil
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ===============================================
-- VUES UTILES (optionnelles)
-- ===============================================

-- Vue pour les statistiques utilisateur
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
  u.id,
  up.full_name,
  us.initial_capital,
  us.current_balance,
  us.monthly_target,
  (
    SELECT COUNT(*) 
    FROM public.trading_journal tj 
    WHERE tj.user_id = u.id 
    AND tj.trade_date >= date_trunc('month', CURRENT_DATE)
  ) as trades_this_month,
  (
    SELECT SUM(tj.pnl) 
    FROM public.trading_journal tj 
    WHERE tj.user_id = u.id 
    AND tj.trade_date >= date_trunc('month', CURRENT_DATE)
  ) as pnl_this_month,
  (
    SELECT COUNT(*) 
    FROM public.ai_analyses aa 
    WHERE aa.user_id = u.id 
    AND aa.created_at >= date_trunc('month', CURRENT_DATE)
  ) as ai_analyses_this_month
FROM auth.users u
JOIN public.user_profiles up ON u.id = up.id
LEFT JOIN public.user_settings us ON u.id = us.user_id;

-- RLS pour la vue
ALTER VIEW public.user_stats SET (security_invoker = true);

-- ===============================================
-- POLITIQUES DE SÉCURITÉ SUPPLÉMENTAIRES
-- ===============================================

-- Empêcher la lecture de clés API d'autres utilisateurs
CREATE POLICY "API keys are private" ON public.user_settings
FOR SELECT USING (
  auth.uid() = user_id AND 
  CASE 
    WHEN auth.uid() = user_id THEN true
    ELSE false
  END
);

-- ===============================================
-- GRANTS ET PERMISSIONS
-- ===============================================

-- Donner accès aux utilisateurs authentifiés
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ===============================================
-- COMMENTS ET DOCUMENTATION
-- ===============================================

COMMENT ON TABLE public.user_profiles IS 'Profils utilisateur étendus avec informations personnelles';
COMMENT ON TABLE public.user_settings IS 'Paramètres de trading et préférences utilisateur';
COMMENT ON TABLE public.trading_journal IS 'Journal des trades quotidiens avec P&L et notes';
COMMENT ON TABLE public.ai_analyses IS 'Historique des analyses générées par IA';
COMMENT ON TABLE public.position_calculations IS 'Historique des calculs de position';

COMMENT ON COLUMN public.user_settings.anthropic_api_key IS 'Clé API Anthropic chiffrée côté client';
COMMENT ON COLUMN public.user_settings.openai_api_key IS 'Clé API OpenAI chiffrée côté client';

-- ===============================================
-- DONNÉES DE TEST (Optionnel - À supprimer en production)
-- ===============================================

-- Vous pouvez ajouter des données de test ici si nécessaire
-- INSERT INTO ... (à utiliser uniquement en développement)

-- ===============================================
-- FIN DU SCHÉMA
-- ===============================================

-- Note: Ce schéma assure:
-- 1. Isolation complète des données par utilisateur (RLS)
-- 2. Sécurité des clés API (chiffrement côté client recommandé)
-- 3. Performance optimisée avec index appropriés
-- 4. Intégrité des données avec contraintes
-- 5. Audit trail avec timestamps automatiques 