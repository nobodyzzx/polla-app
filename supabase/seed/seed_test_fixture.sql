-- ============================================================
-- Fixture de prueba — Polla Mundial 2026
-- Ejecutar en DataGrip para poblar la BD con datos de test.
-- Borra TODO lo existente (predicciones incluidas).
-- ============================================================

TRUNCATE matches CASCADE;  -- borra matches + predictions en cascada

-- ── FASE DE GRUPOS ───────────────────────────────────────────
-- 4 grupos × 2 equipos cada uno = 4 partidos de grupos
-- Día 1 — Jornada 1 (2026-03-23, hora Bolivia UTC-4)
--   16:00 BO = 20:00 UTC  |  19:00 BO = 23:00 UTC

INSERT INTO matches (home_team, away_team, match_date, stage, group_name, jornada) VALUES
('México',    'Ecuador',   '2026-03-23 20:00:00+00', 'group', 'A', 'Jornada 1'),
('Argentina', 'Bolivia',   '2026-03-23 23:00:00+00', 'group', 'B', 'Jornada 1');

-- Día 2 — Jornada 2 (2026-03-24)
INSERT INTO matches (home_team, away_team, match_date, stage, group_name, jornada) VALUES
('Brasil',    'Colombia',  '2026-03-24 20:00:00+00', 'group', 'C', 'Jornada 2'),
('Uruguay',   'Chile',     '2026-03-24 23:00:00+00', 'group', 'D', 'Jornada 2');

-- ── CUARTOS DE FINAL ─────────────────────────────────────────
-- (2026-03-25) — 2 partidos, misma jornada
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('México',    'Colombia',  '2026-03-25 20:00:00+00', 'knockout', 'Cuartos', 'Cuartos'),
('Argentina', 'Brasil',    '2026-03-25 23:00:00+00', 'knockout', 'Cuartos', 'Cuartos');

-- ── SEMIFINALES ──────────────────────────────────────────────
-- (2026-03-26) — 2 partidos
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('Ecuador',   'Uruguay',   '2026-03-26 20:00:00+00', 'knockout', 'Semifinal', 'Semifinal'),
('Bolivia',   'Chile',     '2026-03-26 23:00:00+00', 'knockout', 'Semifinal', 'Semifinal');

-- ── TERCER PUESTO ────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('Colombia',  'Uruguay',   '2026-03-27 20:00:00+00', 'knockout', 'Tercer Puesto', 'Tercer Puesto');

-- ── FINAL ────────────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('México',    'Argentina', '2026-03-28 23:00:00+00', 'knockout', 'Final', 'Final');

-- ── VERIFICAR ────────────────────────────────────────────────
SELECT
  jornada,
  stage,
  round,
  home_team || ' vs ' || away_team AS partido,
  to_char(match_date AT TIME ZONE 'America/La_Paz', 'DD Mon HH24:MI') AS hora_bo
FROM matches
ORDER BY match_date;
