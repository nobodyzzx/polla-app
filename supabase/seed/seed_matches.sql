-- ============================================================
-- Polla Mundial 2026 — Fixture Oficial (104 partidos)
-- FIFA World Cup 2026 · USA / México / Canadá
-- Fuente: FIFA, actualizado diciembre 2025
-- Todos los horarios en UTC. App muestra hora Bolivia (UTC-4).
--
-- JORNADAS:
--   Grupo Jornada 1 → Jun 11-16
--   Grupo Jornada 2 → Jun 17-22
--   Grupo Jornada 3 → Jun 23-28
--   Eliminatorias   → jornada = round (Ronda de 32, Octavos, etc.)
--
-- Equipos playoff por confirmar (repechajes marzo 2026):
--   UEFA-PO-A/B/C/D, PO-Intercont-1/2 (Bolivia si clasifica en I-2)
-- ============================================================

DELETE FROM predictions;
DELETE FROM sanctions;
DELETE FROM matches WHERE id::text NOT LIKE 'a0000000%';

-- ── GRUPO A: México · Corea del Sur · Sudáfrica · UEFA-PO-D ──
INSERT INTO matches (home_team, away_team, match_date, stage, group_name, jornada) VALUES
('México',        'Sudáfrica',      '2026-06-11 20:00:00+00', 'group', 'A', 'Jornada 1'),
('Corea del Sur', 'UEFA-PO-D',      '2026-06-13 02:00:00+00', 'group', 'A', 'Jornada 1'),
('UEFA-PO-D',     'Sudáfrica',      '2026-06-18 16:00:00+00', 'group', 'A', 'Jornada 2'),
('México',        'Corea del Sur',  '2026-06-20 02:00:00+00', 'group', 'A', 'Jornada 2'),
('UEFA-PO-D',     'México',         '2026-06-26 02:00:00+00', 'group', 'A', 'Jornada 3'),
('Sudáfrica',     'Corea del Sur',  '2026-06-26 02:00:00+00', 'group', 'A', 'Jornada 3'),

-- ── GRUPO B: Canadá · Suiza · Catar · UEFA-PO-A ──────────────
('Canadá',        'UEFA-PO-A',      '2026-06-12 19:00:00+00', 'group', 'B', 'Jornada 1'),
('Catar',         'Suiza',          '2026-06-13 19:00:00+00', 'group', 'B', 'Jornada 1'),
('Suiza',         'UEFA-PO-A',      '2026-06-18 20:00:00+00', 'group', 'B', 'Jornada 2'),
('Canadá',        'Catar',          '2026-06-18 23:00:00+00', 'group', 'B', 'Jornada 2'),
('Suiza',         'Canadá',         '2026-06-24 20:00:00+00', 'group', 'B', 'Jornada 3'),
('UEFA-PO-A',     'Catar',          '2026-06-24 20:00:00+00', 'group', 'B', 'Jornada 3'),

-- ── GRUPO C: Brasil · Marruecos · Haití · Escocia ────────────
('Brasil',        'Marruecos',      '2026-06-13 22:00:00+00', 'group', 'C', 'Jornada 1'),
('Haití',         'Escocia',        '2026-06-15 01:00:00+00', 'group', 'C', 'Jornada 1'),
('Escocia',       'Marruecos',      '2026-06-19 22:00:00+00', 'group', 'C', 'Jornada 2'),
('Brasil',        'Haití',          '2026-06-21 01:00:00+00', 'group', 'C', 'Jornada 2'),
('Marruecos',     'Haití',          '2026-06-24 22:00:00+00', 'group', 'C', 'Jornada 3'),
('Escocia',       'Brasil',         '2026-06-24 22:00:00+00', 'group', 'C', 'Jornada 3'),

-- ── GRUPO D: Estados Unidos · Paraguay · Australia · UEFA-PO-C
('Estados Unidos','Paraguay',       '2026-06-14 01:00:00+00', 'group', 'D', 'Jornada 1'),
('Australia',     'UEFA-PO-C',      '2026-06-15 04:00:00+00', 'group', 'D', 'Jornada 1'),
('Estados Unidos','Australia',      '2026-06-19 20:00:00+00', 'group', 'D', 'Jornada 2'),
('UEFA-PO-C',     'Paraguay',       '2026-06-21 04:00:00+00', 'group', 'D', 'Jornada 2'),
('UEFA-PO-C',     'Estados Unidos', '2026-06-27 03:00:00+00', 'group', 'D', 'Jornada 3'),
('Paraguay',      'Australia',      '2026-06-27 03:00:00+00', 'group', 'D', 'Jornada 3'),

-- ── GRUPO E: Alemania · Curazao · Costa de Marfil · Ecuador ──
('Alemania',      'Curazao',        '2026-06-14 18:00:00+00', 'group', 'E', 'Jornada 1'),
('Costa de Marfil','Ecuador',       '2026-06-15 23:00:00+00', 'group', 'E', 'Jornada 1'),
('Alemania',      'Costa de Marfil','2026-06-20 20:00:00+00', 'group', 'E', 'Jornada 2'),
('Ecuador',       'Curazao',        '2026-06-22 00:00:00+00', 'group', 'E', 'Jornada 2'),
('Curazao',       'Costa de Marfil','2026-06-25 20:00:00+00', 'group', 'E', 'Jornada 3'),
('Ecuador',       'Alemania',       '2026-06-25 20:00:00+00', 'group', 'E', 'Jornada 3'),

-- ── GRUPO F: Países Bajos · Japón · Túnez · UEFA-PO-B ────────
('Países Bajos',  'Japón',          '2026-06-14 21:00:00+00', 'group', 'F', 'Jornada 1'),
('UEFA-PO-B',     'Túnez',          '2026-06-16 03:00:00+00', 'group', 'F', 'Jornada 1'),
('Países Bajos',  'UEFA-PO-B',      '2026-06-20 18:00:00+00', 'group', 'F', 'Jornada 2'),
('Túnez',         'Japón',          '2026-06-22 03:00:00+00', 'group', 'F', 'Jornada 2'),
('Japón',         'UEFA-PO-B',      '2026-06-26 23:00:00+00', 'group', 'F', 'Jornada 3'),
('Túnez',         'Países Bajos',   '2026-06-26 23:00:00+00', 'group', 'F', 'Jornada 3'),

-- ── GRUPO G: Bélgica · Egipto · Irán · Nueva Zelanda ─────────
('Bélgica',       'Egipto',         '2026-06-15 20:00:00+00', 'group', 'G', 'Jornada 1'),
('Irán',          'Nueva Zelanda',  '2026-06-17 01:00:00+00', 'group', 'G', 'Jornada 1'),
('Bélgica',       'Irán',           '2026-06-21 20:00:00+00', 'group', 'G', 'Jornada 2'),
('Nueva Zelanda', 'Egipto',         '2026-06-23 02:00:00+00', 'group', 'G', 'Jornada 2'),
('Nueva Zelanda', 'Bélgica',        '2026-06-28 04:00:00+00', 'group', 'G', 'Jornada 3'),
('Egipto',        'Irán',           '2026-06-28 04:00:00+00', 'group', 'G', 'Jornada 3'),

-- ── GRUPO H: España · Cabo Verde · Arabia Saudita · Uruguay ──
('España',        'Cabo Verde',     '2026-06-15 16:00:00+00', 'group', 'H', 'Jornada 1'),
('Arabia Saudita','Uruguay',        '2026-06-15 23:00:00+00', 'group', 'H', 'Jornada 1'),
('España',        'Arabia Saudita', '2026-06-21 16:00:00+00', 'group', 'H', 'Jornada 2'),
('Uruguay',       'Cabo Verde',     '2026-06-21 22:00:00+00', 'group', 'H', 'Jornada 2'),
('Cabo Verde',    'Arabia Saudita', '2026-06-27 00:00:00+00', 'group', 'H', 'Jornada 3'),
('Uruguay',       'España',         '2026-06-27 00:00:00+00', 'group', 'H', 'Jornada 3'),

-- ── GRUPO I: Francia · Senegal · Noruega · PO-Intercont-2 ────
('Francia',       'Senegal',        '2026-06-16 19:00:00+00', 'group', 'I', 'Jornada 1'),
('PO-Intercont-2','Noruega',        '2026-06-16 22:00:00+00', 'group', 'I', 'Jornada 1'),
('Francia',       'PO-Intercont-2', '2026-06-22 21:00:00+00', 'group', 'I', 'Jornada 2'),
('Noruega',       'Senegal',        '2026-06-23 23:00:00+00', 'group', 'I', 'Jornada 2'),
('Noruega',       'Francia',        '2026-06-26 19:00:00+00', 'group', 'I', 'Jornada 3'),
('Senegal',       'PO-Intercont-2', '2026-06-26 19:00:00+00', 'group', 'I', 'Jornada 3'),

-- ── GRUPO J: Argentina · Argelia · Austria · Jordania ────────
('Argentina',     'Argelia',        '2026-06-18 01:00:00+00', 'group', 'J', 'Jornada 1'),
('Austria',       'Jordania',       '2026-06-18 03:00:00+00', 'group', 'J', 'Jornada 1'),
('Argentina',     'Austria',        '2026-06-22 18:00:00+00', 'group', 'J', 'Jornada 2'),
('Jordania',      'Argelia',        '2026-06-24 04:00:00+00', 'group', 'J', 'Jornada 2'),
('Jordania',      'Argentina',      '2026-06-29 03:00:00+00', 'group', 'J', 'Jornada 3'),
('Argelia',       'Austria',        '2026-06-29 03:00:00+00', 'group', 'J', 'Jornada 3'),

-- ── GRUPO K: Portugal · Colombia · Uzbekistán · PO-Intercont-1
('Portugal',      'PO-Intercont-1', '2026-06-17 18:00:00+00', 'group', 'K', 'Jornada 1'),
('Uzbekistán',    'Colombia',       '2026-06-19 02:00:00+00', 'group', 'K', 'Jornada 1'),
('Portugal',      'Uzbekistán',     '2026-06-23 18:00:00+00', 'group', 'K', 'Jornada 2'),
('Colombia',      'PO-Intercont-1', '2026-06-25 02:00:00+00', 'group', 'K', 'Jornada 2'),
('Colombia',      'Portugal',       '2026-06-28 23:30:00+00', 'group', 'K', 'Jornada 3'),
('PO-Intercont-1','Uzbekistán',     '2026-06-28 23:30:00+00', 'group', 'K', 'Jornada 3'),

-- ── GRUPO L: Inglaterra · Croacia · Ghana · Panamá ───────────
('Inglaterra',    'Croacia',        '2026-06-17 21:00:00+00', 'group', 'L', 'Jornada 1'),
('Ghana',         'Panamá',         '2026-06-18 23:00:00+00', 'group', 'L', 'Jornada 1'),
('Inglaterra',    'Ghana',          '2026-06-23 20:00:00+00', 'group', 'L', 'Jornada 2'),
('Panamá',        'Croacia',        '2026-06-24 23:00:00+00', 'group', 'L', 'Jornada 2'),
('Panamá',        'Inglaterra',     '2026-06-27 21:00:00+00', 'group', 'L', 'Jornada 3'),
('Croacia',       'Ghana',          '2026-06-27 21:00:00+00', 'group', 'L', 'Jornada 3');

-- ── RONDA DE 32 ───────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('1A', '2B', '2026-07-01 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1C', '2D', '2026-07-01 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1E', '2F', '2026-07-02 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1G', '2H', '2026-07-02 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1B', '2A', '2026-07-03 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1D', '2C', '2026-07-03 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1F', '2E', '2026-07-04 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1H', '2G', '2026-07-04 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1I', '2J', '2026-07-05 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1K', '2L', '2026-07-05 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1J', '2I', '2026-07-06 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('1L', '2K', '2026-07-06 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('3M', '3N', '2026-07-07 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('3O', '3P', '2026-07-07 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('3Q', '3R', '2026-07-08 19:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32'),
('3S', '3T', '2026-07-08 23:00:00+00', 'knockout', 'Ronda de 32', 'Ronda de 32');

-- ── OCTAVOS ───────────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('W-R32-1',  'W-R32-2',  '2026-07-11 19:00:00+00', 'knockout', 'Octavos', 'Octavos'),
('W-R32-3',  'W-R32-4',  '2026-07-11 23:00:00+00', 'knockout', 'Octavos', 'Octavos'),
('W-R32-5',  'W-R32-6',  '2026-07-12 19:00:00+00', 'knockout', 'Octavos', 'Octavos'),
('W-R32-7',  'W-R32-8',  '2026-07-12 23:00:00+00', 'knockout', 'Octavos', 'Octavos'),
('W-R32-9',  'W-R32-10', '2026-07-13 19:00:00+00', 'knockout', 'Octavos', 'Octavos'),
('W-R32-11', 'W-R32-12', '2026-07-13 23:00:00+00', 'knockout', 'Octavos', 'Octavos'),
('W-R32-13', 'W-R32-14', '2026-07-14 19:00:00+00', 'knockout', 'Octavos', 'Octavos'),
('W-R32-15', 'W-R32-16', '2026-07-14 23:00:00+00', 'knockout', 'Octavos', 'Octavos');

-- ── CUARTOS ───────────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('W-OCT-1', 'W-OCT-2', '2026-07-17 19:00:00+00', 'knockout', 'Cuartos', 'Cuartos'),
('W-OCT-3', 'W-OCT-4', '2026-07-17 23:00:00+00', 'knockout', 'Cuartos', 'Cuartos'),
('W-OCT-5', 'W-OCT-6', '2026-07-18 19:00:00+00', 'knockout', 'Cuartos', 'Cuartos'),
('W-OCT-7', 'W-OCT-8', '2026-07-18 23:00:00+00', 'knockout', 'Cuartos', 'Cuartos');

-- ── SEMIFINALES ───────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('W-QF-1', 'W-QF-2', '2026-07-22 23:00:00+00', 'knockout', 'Semifinal', 'Semifinal'),
('W-QF-3', 'W-QF-4', '2026-07-23 23:00:00+00', 'knockout', 'Semifinal', 'Semifinal');

-- ── TERCER PUESTO ─────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('L-SF-1', 'L-SF-2', '2026-07-25 19:00:00+00', 'knockout', 'Tercer Puesto', 'Tercer Puesto');

-- ── FINAL ─────────────────────────────────────────────────────
INSERT INTO matches (home_team, away_team, match_date, stage, round, jornada) VALUES
('W-SF-1', 'W-SF-2', '2026-07-26 23:00:00+00', 'knockout', 'Final', 'Final');

-- ── PARTIDO DE PRUEBA (NO BORRAR) ────────────────────────────
INSERT INTO matches (
    id, home_team, away_team, match_date, stage, round, jornada,
    home_score, away_score, winner_penalties, is_finished
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Local FC', 'Visitante FC', '2026-07-11 19:00:00+00',
    'knockout', 'Octavos', 'Octavos',
    2, 2, 'home', TRUE
) ON CONFLICT (id) DO NOTHING;
