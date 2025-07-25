-- Checklist Templates (Default templates shared by all users)
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(10) NOT NULL CHECK (type IN ('entry', 'exit')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
    is_mandatory BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL,
    category VARCHAR(100),
    template_name VARCHAR(100) DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Checklist Items (Custom items created by users)
CREATE TABLE IF NOT EXISTS user_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('entry', 'exit')),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    weight INTEGER NOT NULL CHECK (weight >= 0 AND weight <= 100),
    is_mandatory BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist Sessions (Track completed checklists)
CREATE TABLE IF NOT EXISTS checklist_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL CHECK (type IN ('entry', 'exit')),
    checked_items JSONB NOT NULL DEFAULT '[]',
    item_details JSONB NOT NULL DEFAULT '[]', -- Store snapshot of items at time of session
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
    status VARCHAR(20) NOT NULL CHECK (status IN ('completed', 'cancelled', 'saved')),
    trade_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active Trades (Track ongoing trades with timer)
CREATE TABLE IF NOT EXISTS active_trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_session_id UUID REFERENCES checklist_sessions(id),
    exit_session_id UUID REFERENCES checklist_sessions(id),
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    exit_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    instrument VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_checklist_items_user_id ON user_checklist_items(user_id);
CREATE INDEX idx_user_checklist_items_type ON user_checklist_items(type);
CREATE INDEX idx_checklist_sessions_user_id ON checklist_sessions(user_id);
CREATE INDEX idx_checklist_sessions_created_at ON checklist_sessions(created_at DESC);
CREATE INDEX idx_active_trades_user_id ON active_trades(user_id);
CREATE INDEX idx_active_trades_status ON active_trades(status);

-- Row Level Security (RLS)
ALTER TABLE user_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_checklist_items
CREATE POLICY "Users can view their own checklist items" ON user_checklist_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklist items" ON user_checklist_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist items" ON user_checklist_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist items" ON user_checklist_items
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for checklist_sessions
CREATE POLICY "Users can view their own checklist sessions" ON checklist_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checklist sessions" ON checklist_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for active_trades
CREATE POLICY "Users can view their own active trades" ON active_trades
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own active trades" ON active_trades
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own active trades" ON active_trades
    FOR UPDATE USING (auth.uid() = user_id);

-- Everyone can read default templates
CREATE POLICY "Everyone can view default templates" ON checklist_templates
    FOR SELECT USING (is_default = true);

-- Default Entry Checklist Templates (French)
INSERT INTO checklist_templates (type, name, description, weight, is_mandatory, order_index, category, template_name) VALUES
-- Analyse Technique (35%)
('entry', 'Configuration Claire', 'Figure chartiste ou setup technique identifié', 15, true, 1, 'Analyse Technique', 'default'),
('entry', 'Alignement de Tendance', 'Direction alignée avec la tendance supérieure', 10, false, 2, 'Analyse Technique', 'default'),
('entry', 'Niveaux Support/Résistance', 'Niveaux clés identifiés et respectés', 10, false, 3, 'Analyse Technique', 'default'),

-- Gestion du Risque (35%)
('entry', 'Stop Loss Défini', 'Niveau de stop loss clairement identifié', 15, true, 4, 'Gestion du Risque', 'default'),
('entry', 'Risk/Reward > 2:1', 'Ratio risque/récompense minimum 2:1', 10, true, 5, 'Gestion du Risque', 'default'),
('entry', 'Taille Position Calculée', 'Calcul approprié selon le risque du compte', 10, true, 6, 'Gestion du Risque', 'default'),

-- Conditions de Marché (15%)
('entry', 'Volume Confirmé', 'Volume adéquat pour supporter le mouvement', 5, false, 7, 'Conditions de Marché', 'default'),
('entry', 'Pas de News Majeures', 'Aucune news à fort impact dans 2h', 5, false, 8, 'Conditions de Marché', 'default'),
('entry', 'Heures de Trading Optimales', 'Trading pendant les heures liquides', 5, false, 9, 'Conditions de Marché', 'default'),

-- Psychologie (15%)
('entry', 'État Mental Calme', 'Pas de trading émotionnel ou de revanche', 5, true, 10, 'Psychologie', 'default'),
('entry', 'Limite Journalière OK', 'Limite de perte journalière non dépassée', 5, true, 11, 'Psychologie', 'default'),
('entry', 'Plan de Trade Écrit', 'Plan clair pour entrée, gestion et sortie', 5, false, 12, 'Psychologie', 'default');

-- Default Exit Checklist Templates (French)
INSERT INTO checklist_templates (type, name, description, weight, is_mandatory, order_index, category, template_name) VALUES
-- Objectifs de Profit (40%)
('exit', 'Objectif Principal Atteint', 'Prix a atteint l''objectif de profit initial', 25, false, 1, 'Objectifs de Profit', 'default'),
('exit', 'Objectif Étendu Touché', 'Prix a atteint l''objectif de profit étendu', 15, false, 2, 'Objectifs de Profit', 'default'),

-- Gestion du Risque (30%)
('exit', 'Stop Loss Déclenché', 'Prix a touché le stop loss prédéfini', 20, false, 3, 'Gestion du Risque', 'default'),
('exit', 'Trailing Stop Touché', 'Le stop suiveur a été déclenché', 10, false, 4, 'Gestion du Risque', 'default'),

-- Structure de Marché (20%)
('exit', 'Signal de Retournement', 'Figure ou signal de retournement clair', 10, false, 5, 'Structure de Marché', 'default'),
('exit', 'Cassure Support/Résistance', 'Niveau clé cassé contre la position', 10, false, 6, 'Structure de Marché', 'default'),

-- Temps et Événements (10%)
('exit', 'Sortie Temporelle', 'Durée maximale de détention atteinte', 5, false, 7, 'Temps et Événements', 'default'),
('exit', 'News Approchante', 'News à fort impact imminente', 5, false, 8, 'Temps et Événements', 'default');

-- Function to copy default templates to user items
CREATE OR REPLACE FUNCTION copy_default_templates_to_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO user_checklist_items (user_id, type, name, description, weight, is_mandatory, order_index, category)
    SELECT 
        p_user_id,
        type,
        name,
        description,
        weight,
        is_mandatory,
        order_index,
        category
    FROM checklist_templates
    WHERE is_default = true
    AND template_name = 'default'
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;