-- Migration pour ajouter les nouveaux champs aux tables existantes

-- Ajouter les nouveaux champs à checklist_sessions s'ils n'existent pas
ALTER TABLE checklist_sessions 
ADD COLUMN IF NOT EXISTS symbol VARCHAR(50);

-- Supprimer les colonnes non nécessaires si elles existent
ALTER TABLE checklist_sessions 
DROP COLUMN IF EXISTS entry_percentage,
DROP COLUMN IF EXISTS entry_price,
DROP COLUMN IF EXISTS exit_price,
DROP COLUMN IF EXISTS position_size;

-- Ajouter les nouveaux champs à active_trades s'ils n'existent pas
ALTER TABLE active_trades
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS trade_result VARCHAR(10) CHECK (trade_result IN ('profit', 'loss', NULL));

-- Supprimer les colonnes non nécessaires
ALTER TABLE active_trades
DROP COLUMN IF EXISTS profit_loss,
DROP COLUMN IF EXISTS profit_loss_percentage;

-- Créer une fonction pour calculer automatiquement la durée lors de la fermeture d'un trade
CREATE OR REPLACE FUNCTION calculate_trade_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND NEW.exit_time IS NOT NULL THEN
        NEW.duration_seconds = EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger si il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'calculate_duration_on_trade_close') THEN
        CREATE TRIGGER calculate_duration_on_trade_close
        BEFORE UPDATE ON active_trades
        FOR EACH ROW
        WHEN (OLD.status = 'active' AND NEW.status = 'completed')
        EXECUTE FUNCTION calculate_trade_duration();
    END IF;
END
$$;

-- Mettre à jour les trades existants qui sont complétés mais n'ont pas de durée
UPDATE active_trades
SET duration_seconds = EXTRACT(EPOCH FROM (exit_time - entry_time))::INTEGER
WHERE status = 'completed' 
AND exit_time IS NOT NULL 
AND duration_seconds IS NULL;