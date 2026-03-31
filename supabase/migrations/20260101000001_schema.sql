-- ============================================================
-- Polla Mundial 2026 — Schema Principal
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
CREATE TABLE profiles (
    id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username         TEXT NOT NULL UNIQUE,
    pago_70          BOOLEAN NOT NULL DEFAULT FALSE,  -- pagó los 70 Bs (primeros)
    pago_50          BOOLEAN NOT NULL DEFAULT FALSE,  -- pagó los 50 Bs (restantes)
    es_referi        BOOLEAN NOT NULL DEFAULT FALSE,
    puntos_totales   INTEGER NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MATCHES ─────────────────────────────────────────────────
CREATE TABLE matches (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    home_team         TEXT NOT NULL,
    away_team         TEXT NOT NULL,
    match_date        TIMESTAMPTZ NOT NULL,
    stage             TEXT NOT NULL CHECK (stage IN ('group', 'knockout')),
    group_name        TEXT,                       -- 'A'..'L' | NULL en knockout
    round             TEXT,                       -- 'R32','R16','QF','SF','3RD','F'
    home_score        INTEGER,                    -- NULL hasta que finalice
    away_score        INTEGER,                    -- NULL hasta que finalice
    home_penalties    INTEGER,                    -- NULL si no hubo penales
    away_penalties    INTEGER,                    -- NULL si no hubo penales
    winner_penalties  TEXT CHECK (winner_penalties IN ('home', 'away', NULL)),
    is_finished       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── PREDICTIONS ─────────────────────────────────────────────
-- Tolerancia Cero: NO se borra ni edita. Solo INSERT.
CREATE TABLE predictions (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                UUID NOT NULL REFERENCES profiles(id),
    match_id               UUID NOT NULL REFERENCES matches(id),
    user_home              INTEGER NOT NULL CHECK (user_home >= 0),
    user_away              INTEGER NOT NULL CHECK (user_away >= 0),
    user_winner_penalties  TEXT CHECK (user_winner_penalties IN ('home', 'away', NULL)),
    points_earned          INTEGER,               -- NULL hasta calcular
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, match_id)                    -- Un pronóstico por usuario por partido
);

-- ── SANCTIONS (VAR) ─────────────────────────────────────────
CREATE TABLE sanctions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES profiles(id),
    match_id    UUID REFERENCES matches(id),      -- Partido de la jornada afectada
    type        TEXT NOT NULL CHECK (type IN ('yellow', 'red', 'double_red')),
    reason      TEXT,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_by  UUID NOT NULL REFERENCES profiles(id),  -- Siempre el réferi
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── ÍNDICES ─────────────────────────────────────────────────
CREATE INDEX idx_predictions_user_id  ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_matches_date         ON matches(match_date);
CREATE INDEX idx_sanctions_user_id    ON sanctions(user_id);

-- ── SEGURIDAD: Prohibir UPDATE/DELETE en predictions ────────
CREATE RULE no_update_predictions AS ON UPDATE TO predictions DO INSTEAD NOTHING;
CREATE RULE no_delete_predictions AS ON DELETE TO predictions DO INSTEAD NOTHING;

-- ── RLS (Row Level Security) ────────────────────────────────
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sanctions   ENABLE ROW LEVEL SECURITY;

-- Profiles: todos leen, cada uno edita el suyo
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Matches: todos leen, solo réferi escribe
CREATE POLICY "matches_select" ON matches FOR SELECT USING (TRUE);
CREATE POLICY "matches_write"  ON matches FOR ALL
    USING ((SELECT es_referi FROM profiles WHERE id = auth.uid()));

-- Predictions: el usuario solo ve y crea las suyas
CREATE POLICY "predictions_select" ON predictions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "predictions_insert" ON predictions FOR INSERT WITH CHECK (
    user_id = auth.uid()
    -- Bloqueo: no puede predecir si faltan menos de 2 horas
    AND (SELECT match_date FROM matches WHERE id = match_id) > NOW() + INTERVAL '2 hours'
    -- Bloqueo: partido no finalizado
    AND NOT (SELECT is_finished FROM matches WHERE id = match_id)
);

-- Sanctions: todos leen las activas, solo réferi escribe
CREATE POLICY "sanctions_select" ON sanctions FOR SELECT USING (active = TRUE);
CREATE POLICY "sanctions_write"  ON sanctions FOR ALL
    USING ((SELECT es_referi FROM profiles WHERE id = auth.uid()));
