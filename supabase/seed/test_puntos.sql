-- ============================================================
-- test_puntos.sql — Valida todos los escenarios de puntuación
-- Ejecutar en DataGrip. Lee el resumen al final.
-- ============================================================

-- ── Setup: usamos el primer usuario no-réferi existente ──────
-- (No hace falta crear usuario nuevo, evitamos el FK a auth.users)
DO $$
DECLARE v UUID;
BEGIN
  SELECT id INTO v FROM profiles WHERE es_referi = FALSE LIMIT 1;
  IF v IS NULL THEN RAISE EXCEPTION 'No hay usuarios de prueba. Ejecuta seed_demo primero.'; END IF;
END;
$$;

-- ── Limpiar datos de prueba anteriores ───────────────────────
DELETE FROM predictions
WHERE user_id = (SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1)
  AND match_id::text LIKE 'b0000000%';
DELETE FROM matches WHERE id::text LIKE 'b0000000%';

-- ── Crear partidos de prueba ──────────────────────────────────

-- FASE DE GRUPOS (resultado real para cada caso)
INSERT INTO matches (id, home_team, away_team, match_date, stage, group_name, home_score, away_score, is_finished) VALUES
-- G1: Local gana 2-1
('b0000000-0000-0000-0000-000000000101', 'G1-Local', 'G1-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 2, 1, TRUE),
-- G2: Local gana 3-0
('b0000000-0000-0000-0000-000000000102', 'G2-Local', 'G2-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 3, 0, TRUE),
-- G3: Empate 1-1
('b0000000-0000-0000-0000-000000000103', 'G3-Local', 'G3-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 1, 1, TRUE),
-- G4: Empate 2-2
('b0000000-0000-0000-0000-000000000104', 'G4-Local', 'G4-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 2, 2, TRUE),
-- G5: Visitante gana 0-2
('b0000000-0000-0000-0000-000000000105', 'G5-Local', 'G5-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 0, 2, TRUE),
-- G6: Visitante gana 0-3
('b0000000-0000-0000-0000-000000000106', 'G6-Local', 'G6-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 0, 3, TRUE),
-- G7: Visitante gana 0-1 (usuario predijo local)
('b0000000-0000-0000-0000-000000000107', 'G7-Local', 'G7-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 0, 1, TRUE),
-- G8: Local gana 2-0 (usuario predijo empate)
('b0000000-0000-0000-0000-000000000108', 'G8-Local', 'G8-Visit', NOW()-INTERVAL'1h', 'group', 'Z', 2, 0, TRUE);

-- FASE ELIMINATORIA — sin penales
INSERT INTO matches (id, home_team, away_team, match_date, stage, round, home_score, away_score, is_finished) VALUES
-- K1: Local gana 2-1 (exacto)
('b0000000-0000-0000-0000-000000000201', 'K1-Local', 'K1-Visit', NOW()-INTERVAL'1h', 'knockout', 'Octavos', 2, 1, TRUE),
-- K2: Local gana 3-0 (usuario predijo 1-0)
('b0000000-0000-0000-0000-000000000202', 'K2-Local', 'K2-Visit', NOW()-INTERVAL'1h', 'knockout', 'Octavos', 3, 0, TRUE),
-- K3: Visitante gana 0-1 (usuario predijo local)
('b0000000-0000-0000-0000-000000000203', 'K3-Local', 'K3-Visit', NOW()-INTERVAL'1h', 'knockout', 'Octavos', 0, 1, TRUE);

-- FASE ELIMINATORIA — con penales (empate 1-1, local gana penales)
INSERT INTO matches (id, home_team, away_team, match_date, stage, round, home_score, away_score, winner_penalties, is_finished) VALUES
-- P1: Empate exacto + penales correctos → 6 pts
('b0000000-0000-0000-0000-000000000301', 'P1-Local', 'P1-Visit', NOW()-INTERVAL'1h', 'knockout', 'Cuartos', 1, 1, 'home', TRUE),
-- P2: Empate exacto + penales incorrectos → 4 pts
('b0000000-0000-0000-0000-000000000302', 'P2-Local', 'P2-Visit', NOW()-INTERVAL'1h', 'knockout', 'Cuartos', 1, 1, 'home', TRUE),
-- P3: Empate errado (0-0 vs 1-1) + penales correctos → 2 pts
('b0000000-0000-0000-0000-000000000303', 'P3-Local', 'P3-Visit', NOW()-INTERVAL'1h', 'knockout', 'Cuartos', 1, 1, 'home', TRUE),
-- P4: Empate errado + penales incorrectos → 1 pt
('b0000000-0000-0000-0000-000000000304', 'P4-Local', 'P4-Visit', NOW()-INTERVAL'1h', 'knockout', 'Cuartos', 1, 1, 'home', TRUE),
-- P5: Usuario predijo victoria (2-0) pero fue a penales → 0 pts
('b0000000-0000-0000-0000-000000000305', 'P5-Local', 'P5-Visit', NOW()-INTERVAL'1h', 'knockout', 'Cuartos', 1, 1, 'home', TRUE);

-- ── Insertar pronósticos de prueba ────────────────────────────
INSERT INTO predictions (user_id, match_id, user_home, user_away, user_winner_penalties) VALUES
-- Grupos
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000101', 2, 1, NULL), -- G1: exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000102', 1, 0, NULL), -- G2: ganador ok, no exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000103', 1, 1, NULL), -- G3: empate exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000104', 0, 0, NULL), -- G4: empate ok, no exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000105', 0, 2, NULL), -- G5: visitante exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000106', 0, 1, NULL), -- G6: visitante ok, no exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000107', 1, 0, NULL), -- G7: equivocado
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000108', 1, 1, NULL), -- G8: empate pero local ganó
-- Knockout sin penales
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000201', 2, 1, NULL), -- K1: exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000202', 1, 0, NULL), -- K2: ganador ok, no exacto
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000203', 1, 0, NULL), -- K3: equivocado
-- Knockout con penales
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000301', 1, 1, 'home'), -- P1: emp exacto + pen ok
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000302', 1, 1, 'away'), -- P2: emp exacto + pen mal
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000303', 0, 0, 'home'), -- P3: emp errado + pen ok
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000304', 0, 0, 'away'), -- P4: emp errado + pen mal
((SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1), 'b0000000-0000-0000-0000-000000000305', 2, 0, NULL);  -- P5: predijo victoria, fue penales

-- ── Calcular puntos ───────────────────────────────────────────
DO $$
DECLARE v_id UUID;
BEGIN
  FOR v_id IN
    SELECT id FROM matches WHERE id::text LIKE 'b0000000-0000-0000-0000-0000000%'
      AND is_finished = TRUE
  LOOP
    PERFORM calculate_match_points(v_id);
  END LOOP;
END;
$$;

-- ── Resultado: esperado vs real ───────────────────────────────
SELECT
  CASE m.id::text
    WHEN 'b0000000-0000-0000-0000-000000000101' THEN 'G1 Grupo: exacto local (2-1 vs 2-1)'
    WHEN 'b0000000-0000-0000-0000-000000000102' THEN 'G2 Grupo: ganador ok (1-0 vs 3-0)'
    WHEN 'b0000000-0000-0000-0000-000000000103' THEN 'G3 Grupo: empate exacto (1-1 vs 1-1)'
    WHEN 'b0000000-0000-0000-0000-000000000104' THEN 'G4 Grupo: empate ok (0-0 vs 2-2)'
    WHEN 'b0000000-0000-0000-0000-000000000105' THEN 'G5 Grupo: exacto visit (0-2 vs 0-2)'
    WHEN 'b0000000-0000-0000-0000-000000000106' THEN 'G6 Grupo: visit ok (0-1 vs 0-3)'
    WHEN 'b0000000-0000-0000-0000-000000000107' THEN 'G7 Grupo: equivocado'
    WHEN 'b0000000-0000-0000-0000-000000000108' THEN 'G8 Grupo: predijo empate, ganó local'
    WHEN 'b0000000-0000-0000-0000-000000000201' THEN 'K1 Knockout: exacto (2-1 vs 2-1)'
    WHEN 'b0000000-0000-0000-0000-000000000202' THEN 'K2 Knockout: ganador ok (1-0 vs 3-0)'
    WHEN 'b0000000-0000-0000-0000-000000000203' THEN 'K3 Knockout: equivocado'
    WHEN 'b0000000-0000-0000-0000-000000000301' THEN 'P1 Penales: emp exacto + pen ok'
    WHEN 'b0000000-0000-0000-0000-000000000302' THEN 'P2 Penales: emp exacto + pen mal'
    WHEN 'b0000000-0000-0000-0000-000000000303' THEN 'P3 Penales: emp errado + pen ok'
    WHEN 'b0000000-0000-0000-0000-000000000304' THEN 'P4 Penales: emp errado + pen mal'
    WHEN 'b0000000-0000-0000-0000-000000000305' THEN 'P5 Penales: predijo victoria'
  END                                     AS escenario,
  pr.points_earned                        AS pts_real,
  CASE m.id::text
    WHEN 'b0000000-0000-0000-0000-000000000101' THEN 3
    WHEN 'b0000000-0000-0000-0000-000000000102' THEN 1
    WHEN 'b0000000-0000-0000-0000-000000000103' THEN 3
    WHEN 'b0000000-0000-0000-0000-000000000104' THEN 1
    WHEN 'b0000000-0000-0000-0000-000000000105' THEN 3
    WHEN 'b0000000-0000-0000-0000-000000000106' THEN 1
    WHEN 'b0000000-0000-0000-0000-000000000107' THEN 0
    WHEN 'b0000000-0000-0000-0000-000000000108' THEN 0
    WHEN 'b0000000-0000-0000-0000-000000000201' THEN 3
    WHEN 'b0000000-0000-0000-0000-000000000202' THEN 1
    WHEN 'b0000000-0000-0000-0000-000000000203' THEN 0
    WHEN 'b0000000-0000-0000-0000-000000000301' THEN 6
    WHEN 'b0000000-0000-0000-0000-000000000302' THEN 4
    WHEN 'b0000000-0000-0000-0000-000000000303' THEN 2
    WHEN 'b0000000-0000-0000-0000-000000000304' THEN 1
    WHEN 'b0000000-0000-0000-0000-000000000305' THEN 0
  END                                     AS pts_esperado,
  CASE
    WHEN pr.points_earned = (CASE m.id::text
      WHEN 'b0000000-0000-0000-0000-000000000101' THEN 3
      WHEN 'b0000000-0000-0000-0000-000000000102' THEN 1
      WHEN 'b0000000-0000-0000-0000-000000000103' THEN 3
      WHEN 'b0000000-0000-0000-0000-000000000104' THEN 1
      WHEN 'b0000000-0000-0000-0000-000000000105' THEN 3
      WHEN 'b0000000-0000-0000-0000-000000000106' THEN 1
      WHEN 'b0000000-0000-0000-0000-000000000107' THEN 0
      WHEN 'b0000000-0000-0000-0000-000000000108' THEN 0
      WHEN 'b0000000-0000-0000-0000-000000000201' THEN 3
      WHEN 'b0000000-0000-0000-0000-000000000202' THEN 1
      WHEN 'b0000000-0000-0000-0000-000000000203' THEN 0
      WHEN 'b0000000-0000-0000-0000-000000000301' THEN 6
      WHEN 'b0000000-0000-0000-0000-000000000302' THEN 4
      WHEN 'b0000000-0000-0000-0000-000000000303' THEN 2
      WHEN 'b0000000-0000-0000-0000-000000000304' THEN 1
      WHEN 'b0000000-0000-0000-0000-000000000305' THEN 0
    END) THEN '✅ PASS'
    ELSE '❌ FAIL'
  END                                     AS resultado
FROM predictions pr
JOIN matches m ON m.id = pr.match_id
WHERE pr.user_id = (SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1)
  AND m.id::text LIKE 'b0000000-0000-0000-0000-0000000%'
ORDER BY m.id;

-- ── Limpieza (descomenta para borrar datos de prueba) ─────────
-- DELETE FROM predictions WHERE user_id = (SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1);
-- DELETE FROM matches     WHERE id::text LIKE 'b0000000-0000-0000-0000-0000000%';
-- DELETE FROM profiles    WHERE id = (SELECT id FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1);
