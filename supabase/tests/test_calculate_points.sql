-- ============================================================
-- TEST: Puntos + Jornada Incompleta + Tarjeta Roja
-- Polla Mundial 2026
--
-- Valida:
--   1. Puntuación correcta (marcador exacto, ganador, etc.)
--   2. Reglamento: jornada incompleta → 0 pts en toda la jornada
--   3. Reglamento: tarjeta roja → 0 pts en toda la jornada
--
-- Cómo usar: ejecutar en DataGrip, paso a paso.
-- IDs de prueba usan prefijo d0000000-... para limpieza segura.
-- ============================================================

-- ── PASO 0: Limpiar test anterior ───────────────────────────
DELETE FROM sanctions
  WHERE user_id IN (
    SELECT user_id FROM predictions WHERE match_id::text LIKE 'd0000000%'
  );
DELETE FROM predictions WHERE match_id::text LIKE 'd0000000%';
DELETE FROM matches     WHERE id::text LIKE 'd0000000%';

-- ── PASO 1: Ver usuarios disponibles ────────────────────────
-- Identifica qué usuarios existen. El DO del PASO 3 toma los
-- primeros 3 no-réferi por orden de creación.
SELECT id, username, es_referi FROM profiles ORDER BY es_referi DESC, created_at LIMIT 8;

-- ── PASO 2: Insertar 3 partidos de la misma jornada ─────────
-- Fechas en el pasado para saltarse la validación de 2h del INSERT.
INSERT INTO matches (id, home_team, away_team, match_date, stage, group_name, jornada, is_finished)
VALUES
  ('d0000000-0000-0000-0000-000000000001'::uuid,
   'Bolivia',  'Argentina', NOW() - INTERVAL '5 hours', 'group', 'T', 'Jornada Test', FALSE),
  ('d0000000-0000-0000-0000-000000000002'::uuid,
   'Brasil',   'Uruguay',   NOW() - INTERVAL '3 hours', 'group', 'T', 'Jornada Test', FALSE),
  ('d0000000-0000-0000-0000-000000000003'::uuid,
   'Chile',    'Peru',      NOW() - INTERVAL '1 hour',  'group', 'T', 'Jornada Test', FALSE);

SELECT id, home_team, away_team, jornada FROM matches WHERE id::text LIKE 'd0000000%';

-- ── PASO 3: Insertar pronósticos de 3 usuarios ──────────────
-- A (completo)  : pronostica los 3 partidos → debe ganar puntos
-- B (incompleto): pronostica solo 2 de 3     → jornada incompleta → 0 pts
-- C (tarjeta🟥) : pronostica los 3 pero roja → 0 pts
DO $$
DECLARE
  u_a    UUID;   -- completo
  u_b    UUID;   -- incompleto
  u_c    UUID;   -- tarjeta roja
  referi UUID;
BEGIN
  SELECT id INTO u_a    FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1 OFFSET 0;
  SELECT id INTO u_b    FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1 OFFSET 1;
  SELECT id INTO u_c    FROM profiles WHERE es_referi = FALSE ORDER BY created_at LIMIT 1 OFFSET 2;
  SELECT id INTO referi FROM profiles WHERE es_referi = TRUE  LIMIT 1;

  RAISE NOTICE '--- Usuarios seleccionados ---';
  RAISE NOTICE 'A (completo)   : %', u_a;
  RAISE NOTICE 'B (incompleto) : %', u_b;
  RAISE NOTICE 'C (roja)       : %', u_c;
  RAISE NOTICE 'Réferi         : %', referi;

  -- A: pronostica los 3 partidos
  INSERT INTO predictions (user_id, match_id, user_home, user_away) VALUES
    (u_a, 'd0000000-0000-0000-0000-000000000001', 2, 1),  -- Bolivia gana  (ERRADO → 0 pts)
    (u_a, 'd0000000-0000-0000-0000-000000000002', 2, 2),  -- Empate        (CORRECTO + EXACTO → 3 pts)
    (u_a, 'd0000000-0000-0000-0000-000000000003', 1, 0);  -- Chile gana    (CORRECTO + EXACTO → 3 pts)
  -- Esperado A: 0 + 3 + 3 = 6 pts

  -- B: solo pronostica 2 de 3 (falta partido 3)
  INSERT INTO predictions (user_id, match_id, user_home, user_away) VALUES
    (u_b, 'd0000000-0000-0000-0000-000000000001', 0, 2),  -- Argentina gana (CORRECTO + EXACTO)
    (u_b, 'd0000000-0000-0000-0000-000000000002', 1, 1);  -- Empate         (CORRECTO, no exacto)
  -- ⚠ NO pronostica partido 3 → JORNADA INCOMPLETA → todo queda en 0
  -- Esperado B: 0 pts

  -- C: pronostica los 3 (perfectos) pero tiene tarjeta roja
  INSERT INTO predictions (user_id, match_id, user_home, user_away) VALUES
    (u_c, 'd0000000-0000-0000-0000-000000000001', 0, 2),  -- Argentina gana (CORRECTO + EXACTO → 3)
    (u_c, 'd0000000-0000-0000-0000-000000000002', 2, 2),  -- Empate         (CORRECTO + EXACTO → 3)
    (u_c, 'd0000000-0000-0000-0000-000000000003', 1, 0);  -- Chile gana     (CORRECTO + EXACTO → 3)
  -- ⚠ Tarjeta roja → todo queda en 0
  -- Esperado C: 0 pts

  -- Emitir tarjeta roja para C (ahora, dentro de la ventana de la jornada)
  INSERT INTO sanctions (user_id, type, reason, created_by, active)
  VALUES (u_c, 'red', 'Test tarjeta roja', referi, TRUE);

  RAISE NOTICE '--- Datos insertados OK ---';
END $$;

-- Verificar pronósticos antes de calcular
SELECT
  pf.username,
  m.home_team || ' vs ' || m.away_team AS partido,
  p.user_home || '-' || p.user_away    AS prono,
  p.points_earned                      AS pts_antes
FROM predictions p
JOIN profiles pf ON pf.id = p.user_id
JOIN matches  m  ON m.id  = p.match_id
WHERE p.match_id::text LIKE 'd0000000%'
ORDER BY pf.username, m.match_date;

-- ── PASO 4: Cargar resultados reales ────────────────────────
-- Bolivia 0-2 Argentina  → Argentina gana
-- Brasil  2-2 Uruguay    → Empate
-- Chile   1-0 Peru       → Chile gana
UPDATE matches SET home_score=0, away_score=2, is_finished=TRUE
  WHERE id='d0000000-0000-0000-0000-000000000001';
UPDATE matches SET home_score=2, away_score=2, is_finished=TRUE
  WHERE id='d0000000-0000-0000-0000-000000000002';
UPDATE matches SET home_score=1, away_score=0, is_finished=TRUE
  WHERE id='d0000000-0000-0000-0000-000000000003';

-- ── PASO 5: Calcular puntos ──────────────────────────────────
SELECT calculate_match_points('d0000000-0000-0000-0000-000000000001'::uuid);
SELECT calculate_match_points('d0000000-0000-0000-0000-000000000002'::uuid);
SELECT calculate_match_points('d0000000-0000-0000-0000-000000000003'::uuid);

-- ── PASO 6: Verificar resultado final ───────────────────────
SELECT
  pf.username,
  m.home_team || ' vs ' || m.away_team AS partido,
  p.user_home || '-' || p.user_away    AS prono,
  m.home_score || '-' || m.away_score  AS real,
  p.points_earned                      AS pts
FROM predictions p
JOIN profiles pf ON pf.id = p.user_id
JOIN matches  m  ON m.id  = p.match_id
WHERE p.match_id::text LIKE 'd0000000%'
ORDER BY pf.username, m.match_date;

-- Totales por usuario
SELECT
  pf.username,
  SUM(p.points_earned)    AS pts_jornada,
  COUNT(p.id)             AS partidos_pronosticados
FROM predictions p
JOIN profiles pf ON pf.id = p.user_id
WHERE p.match_id::text LIKE 'd0000000%'
GROUP BY pf.username
ORDER BY pts_jornada DESC;

-- ── RESULTADO ESPERADO ───────────────────────────────────────
-- Usuario A (completo)  : 0 + 3 + 3 = 6 pts  ✅
-- Usuario B (incompleto): 0 + 0     = 0 pts  ✅  (jornada incompleta)
-- Usuario C (roja)      : 0 + 0 + 0 = 0 pts  ✅  (tarjeta roja)

-- ── PASO 7: Limpiar al terminar ──────────────────────────────
-- DELETE FROM sanctions
--   WHERE user_id IN (
--     SELECT user_id FROM predictions WHERE match_id::text LIKE 'd0000000%'
--   );
-- DELETE FROM predictions WHERE match_id::text LIKE 'd0000000%';
-- DELETE FROM matches     WHERE id::text LIKE 'd0000000%';
