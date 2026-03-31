-- ============================================================
-- Polla Mundial 2026 — Score exacto de penales
-- Permite pronosticar y registrar el marcador del shootout
-- ============================================================

-- Resultado real del partido de penales (ej: local 4 – visitante 2)
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS home_pen INTEGER,
  ADD COLUMN IF NOT EXISTS away_pen INTEGER;

-- Pronóstico del usuario para el marcador de penales
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS user_home_pen INTEGER,
  ADD COLUMN IF NOT EXISTS user_away_pen INTEGER;
