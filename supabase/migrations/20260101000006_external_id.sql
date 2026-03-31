-- Agrega external_id a matches para linkear con la API de fútbol.
ALTER TABLE matches ADD COLUMN IF NOT EXISTS external_id INTEGER UNIQUE;

-- Índice para búsquedas rápidas por external_id en sync de scores.
CREATE INDEX IF NOT EXISTS idx_matches_external_id ON matches(external_id);
