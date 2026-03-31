-- ============================================================
-- Insertar pronósticos reales J3 (recibidos por WhatsApp)
-- Ejecutar en DataGrip conectado como postgres (superuser)
-- ============================================================
-- Orden de partidos J3 (por match_date asc):
--   1. Argentina   vs Polonia       (d+6h)
--   2. Bolivia     vs Mexico        (d+6.5h)
--   3. Brasil      vs Uruguay       (d+7h)
--   4. Colombia    vs Peru          (d+7.5h)
--   5. Francia     vs Espana        (d+8h)
--   6. Alemania    vs Portugal      (d+8.5h)
--   7. Inglaterra  vs Marruecos     (d+9h)
--   8. Estados Unidos vs Iran       (d+9.5h)
-- ============================================================

DO $$
DECLARE
  -- Match IDs (resueltos por home_team + jornada)
  m1  uuid; m2  uuid; m3  uuid; m4  uuid;
  m5  uuid; m6  uuid; m7  uuid; m8  uuid;

  -- User IDs (resueltos por username)
  u_rodrigo  uuid;
  u_bolillo  uuid;
  u_kini     uuid;
  u_lalo     uuid;
  u_dimi     uuid;
  u_harold   uuid;
  u_negro    uuid;

BEGIN
  -- ── Resolver match IDs ────────────────────────────────────
  SELECT id INTO m1 FROM matches WHERE jornada='Jornada 3' AND home_team='Argentina';
  SELECT id INTO m2 FROM matches WHERE jornada='Jornada 3' AND home_team='Bolivia';
  SELECT id INTO m3 FROM matches WHERE jornada='Jornada 3' AND home_team='Brasil';
  SELECT id INTO m4 FROM matches WHERE jornada='Jornada 3' AND home_team='Colombia';
  SELECT id INTO m5 FROM matches WHERE jornada='Jornada 3' AND home_team='Francia';
  SELECT id INTO m6 FROM matches WHERE jornada='Jornada 3' AND home_team='Alemania';
  SELECT id INTO m7 FROM matches WHERE jornada='Jornada 3' AND home_team='Inglaterra';
  SELECT id INTO m8 FROM matches WHERE jornada='Jornada 3' AND home_team='Estados Unidos';

  -- ── Resolver user IDs ─────────────────────────────────────
  SELECT id INTO u_rodrigo FROM profiles WHERE username='Rodrigo';
  SELECT id INTO u_bolillo FROM profiles WHERE username='Bolillo';
  SELECT id INTO u_kini    FROM profiles WHERE username='Kini';
  SELECT id INTO u_lalo    FROM profiles WHERE username='Lalo';
  SELECT id INTO u_dimi    FROM profiles WHERE username='Dimi';
  SELECT id INTO u_harold  FROM profiles WHERE username='harold.nb';
  SELECT id INTO u_negro   FROM profiles WHERE username='Negro';

  -- Validar que se encontraron todos
  IF m1 IS NULL OR m2 IS NULL OR m3 IS NULL OR m4 IS NULL OR
     m5 IS NULL OR m6 IS NULL OR m7 IS NULL OR m8 IS NULL THEN
    RAISE EXCEPTION 'No se encontraron todos los partidos de J3. Verificar home_team y jornada.';
  END IF;

  -- ── Borrar pronósticos existentes de J3 para estos usuarios
  -- (necesario por la RULE no_update_predictions que bloquea UPDATE)
  DELETE FROM predictions
  WHERE match_id IN (m1,m2,m3,m4,m5,m6,m7,m8)
    AND user_id IN (
      u_rodrigo, u_bolillo, u_kini, u_lalo, u_dimi, u_harold, u_negro
    );

  -- ── Insertar pronósticos ──────────────────────────────────
  -- Rodrigo: 2-1, 0-0, 1-2, 3-0, 1-1, 2-1, 2-2, 2-0
  IF u_rodrigo IS NOT NULL THEN
    INSERT INTO predictions (user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, user_winner_penalties) VALUES
      (u_rodrigo, m1, 2, 1, null, null, null),
      (u_rodrigo, m2, 0, 0, null, null, null),
      (u_rodrigo, m3, 1, 2, null, null, null),
      (u_rodrigo, m4, 3, 0, null, null, null),
      (u_rodrigo, m5, 1, 1, null, null, null),
      (u_rodrigo, m6, 2, 1, null, null, null),
      (u_rodrigo, m7, 2, 2, null, null, null),
      (u_rodrigo, m8, 2, 0, null, null, null);
    RAISE NOTICE 'Rodrigo: 8 pronósticos insertados';
  ELSE
    RAISE WARNING 'Usuario Rodrigo no encontrado — omitido';
  END IF;

  -- Bolillo: 1-0, 0-3, 5-1, 1-0, 6-0, 9-1, 0-0, 1-1
  IF u_bolillo IS NOT NULL THEN
    INSERT INTO predictions (user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, user_winner_penalties) VALUES
      (u_bolillo, m1, 1, 0, null, null, null),
      (u_bolillo, m2, 0, 3, null, null, null),
      (u_bolillo, m3, 5, 1, null, null, null),
      (u_bolillo, m4, 1, 0, null, null, null),
      (u_bolillo, m5, 6, 0, null, null, null),
      (u_bolillo, m6, 9, 1, null, null, null),
      (u_bolillo, m7, 0, 0, null, null, null),
      (u_bolillo, m8, 1, 1, null, null, null);
    RAISE NOTICE 'Bolillo: 8 pronósticos insertados';
  ELSE
    RAISE WARNING 'Usuario Bolillo no encontrado — omitido';
  END IF;

  -- Kini: 2-0, 1-0, 2-2, 0-2, 0-1, 3-0, 0-2, 2-0
  IF u_kini IS NOT NULL THEN
    INSERT INTO predictions (user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, user_winner_penalties) VALUES
      (u_kini, m1, 2, 0, null, null, null),
      (u_kini, m2, 1, 0, null, null, null),
      (u_kini, m3, 2, 2, null, null, null),
      (u_kini, m4, 0, 2, null, null, null),
      (u_kini, m5, 0, 1, null, null, null),
      (u_kini, m6, 3, 0, null, null, null),
      (u_kini, m7, 0, 2, null, null, null),
      (u_kini, m8, 2, 0, null, null, null);
    RAISE NOTICE 'Kini: 8 pronósticos insertados';
  ELSE
    RAISE WARNING 'Usuario Kini no encontrado — omitido';
  END IF;

  -- Lalo: 2-0, 0-2, 1-1, 3-0, 2-1, 1-1, 2-1, 0-0
  IF u_lalo IS NOT NULL THEN
    INSERT INTO predictions (user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, user_winner_penalties) VALUES
      (u_lalo, m1, 2, 0, null, null, null),
      (u_lalo, m2, 0, 2, null, null, null),
      (u_lalo, m3, 1, 1, null, null, null),
      (u_lalo, m4, 3, 0, null, null, null),
      (u_lalo, m5, 2, 1, null, null, null),
      (u_lalo, m6, 1, 1, null, null, null),
      (u_lalo, m7, 2, 1, null, null, null),
      (u_lalo, m8, 0, 0, null, null, null);
    RAISE NOTICE 'Lalo: 8 pronósticos insertados';
  ELSE
    RAISE WARNING 'Usuario Lalo no encontrado — omitido';
  END IF;

  -- Dimi: 2-2, 1-2, 3-2, 2-1, 3-2, 3-2, 3-2, 1-0
  IF u_dimi IS NOT NULL THEN
    INSERT INTO predictions (user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, user_winner_penalties) VALUES
      (u_dimi, m1, 2, 2, null, null, null),
      (u_dimi, m2, 1, 2, null, null, null),
      (u_dimi, m3, 3, 2, null, null, null),
      (u_dimi, m4, 2, 1, null, null, null),
      (u_dimi, m5, 3, 2, null, null, null),
      (u_dimi, m6, 3, 2, null, null, null),
      (u_dimi, m7, 3, 2, null, null, null),
      (u_dimi, m8, 1, 0, null, null, null);
    RAISE NOTICE 'Dimi: 8 pronósticos insertados';
  ELSE
    RAISE WARNING 'Usuario Dimi no encontrado — omitido';
  END IF;

  -- harold.nb: 1-0, 2-0, 3-0, 4-0, 5-0, 6-6, 1-1, 2-2
  IF u_harold IS NOT NULL THEN
    INSERT INTO predictions (user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, user_winner_penalties) VALUES
      (u_harold, m1, 1, 0, null, null, null),
      (u_harold, m2, 2, 0, null, null, null),
      (u_harold, m3, 3, 0, null, null, null),
      (u_harold, m4, 4, 0, null, null, null),
      (u_harold, m5, 5, 0, null, null, null),
      (u_harold, m6, 6, 6, null, null, null),
      (u_harold, m7, 1, 1, null, null, null),
      (u_harold, m8, 2, 2, null, null, null);
    RAISE NOTICE 'harold.nb: 8 pronósticos insertados';
  ELSE
    RAISE WARNING 'Usuario harold.nb no encontrado — omitido';
  END IF;

  -- Negro: 0-0, 1-0, 0-2, 5-0, 0-0, 0-2, 0-1, 1-1
  IF u_negro IS NOT NULL THEN
    INSERT INTO predictions (user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, user_winner_penalties) VALUES
      (u_negro, m1, 0, 0, null, null, null),
      (u_negro, m2, 1, 0, null, null, null),
      (u_negro, m3, 0, 2, null, null, null),
      (u_negro, m4, 5, 0, null, null, null),
      (u_negro, m5, 0, 0, null, null, null),
      (u_negro, m6, 0, 2, null, null, null),
      (u_negro, m7, 0, 1, null, null, null),
      (u_negro, m8, 1, 1, null, null, null);
    RAISE NOTICE 'Negro: 8 pronósticos insertados';
  ELSE
    RAISE WARNING 'Usuario Negro no encontrado — omitido';
  END IF;

  RAISE NOTICE 'Script completado. Verificar con: SELECT p.username, m.home_team, m.away_team, pr.user_home, pr.user_away FROM predictions pr JOIN profiles p ON p.id=pr.user_id JOIN matches m ON m.id=pr.match_id WHERE m.jornada=''Jornada 3'' ORDER BY p.username, m.match_date;';
END;
$$;
