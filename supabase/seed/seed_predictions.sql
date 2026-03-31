-- ============================================================
-- seed_predictions.sql
-- Genera pronósticos aleatorios para todos los usuarios
-- en todos los partidos de grupo.
-- Ejecutar en DataGrip con la conexión al Session Pooler.
-- ============================================================

-- Limpiar pronósticos anteriores (excepto el partido de prueba)
DELETE FROM predictions
WHERE match_id NOT IN (
  SELECT id FROM matches WHERE home_team = 'Local FC'
);

-- Insertar pronósticos aleatorios para cada usuario × cada partido de grupo
INSERT INTO predictions (user_id, match_id, user_home, user_away, points_earned)
SELECT
  p.id                          AS user_id,
  m.id                          AS match_id,
  floor(random() * 4)::int      AS user_home,
  floor(random() * 4)::int      AS user_away,
  NULL                          AS points_earned
FROM profiles p
CROSS JOIN matches m
WHERE p.es_referi = FALSE
  AND m.stage = 'group'
  -- Simular que ~85% de los usuarios pronostican cada partido
  AND random() < 0.85
ON CONFLICT (user_id, match_id) DO NOTHING;

-- Recalcular puntos de todos los partidos finalizados
DO $$
DECLARE
  v_match_id UUID;
BEGIN
  FOR v_match_id IN
    SELECT id FROM matches WHERE is_finished = TRUE AND stage = 'group'
  LOOP
    PERFORM calculate_match_points(v_match_id);
  END LOOP;
END;
$$;

-- Verificar resultado
SELECT
  p.username,
  p.puntos_totales,
  COUNT(pr.id)                                    AS pronosticos,
  COUNT(pr.id) FILTER (WHERE pr.points_earned > 0) AS con_puntos
FROM profiles p
LEFT JOIN predictions pr ON pr.user_id = p.id
WHERE p.es_referi = FALSE
GROUP BY p.id, p.username, p.puntos_totales
ORDER BY p.puntos_totales DESC;
