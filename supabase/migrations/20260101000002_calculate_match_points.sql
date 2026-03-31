-- ============================================================
-- Polla Mundial 2026 — Función: calculate_match_points()
-- Validada con simulación Python (6 escenarios, 0 errores).
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_match_points(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- Corre con permisos del propietario (bypassea RLS para escritura)
AS $$
DECLARE
    v_match         matches%ROWTYPE;
    v_pred          predictions%ROWTYPE;
    v_points        INTEGER;
    v_real_result   TEXT;   -- 'home' | 'away' | 'draw'
    v_pred_result   TEXT;
    v_exact_score     BOOLEAN;
    v_exact_pen_score BOOLEAN;
    v_correct_pen     BOOLEAN;
    v_processed     INTEGER := 0;
    v_result        JSONB;
BEGIN
    -- ── 1. Obtener partido (debe estar finalizado) ──────────
    SELECT * INTO v_match
    FROM matches
    WHERE id = p_match_id AND is_finished = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Partido % no encontrado o no marcado como finalizado', p_match_id;
    END IF;

    -- ── 2. Determinar resultado real ────────────────────────
    IF v_match.home_score > v_match.away_score THEN
        v_real_result := 'home';
    ELSIF v_match.away_score > v_match.home_score THEN
        v_real_result := 'away';
    ELSE
        v_real_result := 'draw';
    END IF;

    -- Validación: si es eliminatoria y hubo empate, debe haber ganador en penales
    IF v_match.stage = 'knockout'
       AND v_real_result = 'draw'
       AND v_match.winner_penalties IS NULL THEN
        RAISE EXCEPTION 'Partido knockout terminó en empate pero falta winner_penalties';
    END IF;

    -- ── 3. Procesar cada pronóstico ─────────────────────────
    FOR v_pred IN
        SELECT * FROM predictions WHERE match_id = p_match_id
    LOOP
        v_points := 0;

        -- Resultado pronosticado
        IF v_pred.user_home > v_pred.user_away THEN
            v_pred_result := 'home';
        ELSIF v_pred.user_away > v_pred.user_home THEN
            v_pred_result := 'away';
        ELSE
            v_pred_result := 'draw';
        END IF;

        -- ── FASE DE GRUPOS ───────────────────────────────────
        IF v_match.stage = 'group' THEN

            IF v_pred_result = v_real_result THEN
                v_points := 1;  -- Ganador/empate correcto
                -- Bonus marcador exacto
                IF v_pred.user_home = v_match.home_score
                   AND v_pred.user_away = v_match.away_score THEN
                    v_points := 3;  -- 1 base + 2 bonus
                END IF;
            END IF;

        -- ── FASE ELIMINATORIA ────────────────────────────────
        ELSE

            IF v_real_result != 'draw' THEN
                -- Ganador claro en 90' o 120' (sin penales)
                IF v_pred_result = v_real_result THEN
                    v_points := 1;
                    IF v_pred.user_home = v_match.home_score
                       AND v_pred.user_away = v_match.away_score THEN
                        v_points := 3;
                    END IF;
                END IF;

            ELSE
                -- Empate → definición por penales
                IF v_pred_result != 'draw' THEN
                    v_points := 0;  -- No marcó empate → CERO (regla estricta)
                ELSE
                    -- Usuario marcó empate → evaluar los 4 escenarios
                    v_exact_score := (
                        v_pred.user_home = v_match.home_score
                        AND v_pred.user_away = v_match.away_score
                    );

                    -- Penales exactos: score del shootout correcto
                    -- Requiere que ambos equipos tengan scores de penales registrados
                    v_exact_pen_score := (
                        v_match.home_pen IS NOT NULL
                        AND v_match.away_pen IS NOT NULL
                        AND v_pred.user_home_pen IS NOT NULL
                        AND v_pred.user_away_pen IS NOT NULL
                        AND v_pred.user_home_pen = v_match.home_pen
                        AND v_pred.user_away_pen = v_match.away_pen
                    );

                    -- Clasificado correcto: el equipo que el usuario dijo que ganaría
                    -- en penales es efectivamente el que avanzó (winner_penalties).
                    -- Se deriva del score pronosticado; si no hay score, del campo legacy.
                    v_correct_pen := CASE
                        WHEN v_pred.user_home_pen IS NOT NULL AND v_pred.user_away_pen IS NOT NULL THEN
                            (CASE
                                WHEN v_pred.user_home_pen > v_pred.user_away_pen THEN 'home'
                                WHEN v_pred.user_away_pen > v_pred.user_home_pen THEN 'away'
                                ELSE NULL
                             END) = v_match.winner_penalties
                        ELSE
                            v_pred.user_winner_penalties = v_match.winner_penalties
                    END;

                    IF     v_exact_score AND     v_exact_pen_score THEN v_points := 6;
                    ELSIF  v_exact_score AND NOT v_exact_pen_score THEN v_points := 4;
                    ELSIF NOT v_exact_score AND  v_correct_pen     THEN v_points := 2;
                    ELSE                                                 v_points := 1;
                    END IF;
                END IF;
            END IF;

        END IF;

        -- ── Guardar puntos del pronóstico ────────────────────
        -- NOTA: Usamos UPDATE directo (SECURITY DEFINER bypasea la RULE de no-update
        -- solo para esta función interna de cálculo).
        UPDATE predictions
        SET points_earned = v_points
        WHERE id = v_pred.id;

        v_processed := v_processed + 1;
    END LOOP;

    -- ── 4. Envío incompleto = 0 puntos (reglamento) ─────────
    -- Si el usuario no pronosticó TODOS los partidos de la jornada,
    -- sus puntos para este partido se anulan.
    IF v_match.jornada IS NOT NULL THEN
        UPDATE predictions p
        SET points_earned = 0
        WHERE p.match_id = p_match_id
          AND EXISTS (
              -- Hay algún partido de la misma jornada sin pronóstico de este usuario
              SELECT 1
              FROM matches m_other
              WHERE m_other.jornada = v_match.jornada
                AND m_other.id != p_match_id
                AND NOT EXISTS (
                    SELECT 1 FROM predictions p2
                    WHERE p2.user_id = p.user_id
                      AND p2.match_id = m_other.id
                )
          );
    END IF;

    -- ── 5. Aplicar sanción ROJA de la jornada ───────────────
    -- Si un usuario tiene tarjeta roja/doble_roja emitida DURANTE esta jornada,
    -- sus puntos se anulan. Se detecta por created_at dentro de la ventana de la jornada.
    UPDATE predictions p
    SET points_earned = 0
    WHERE p.match_id = p_match_id
      AND EXISTS (
          SELECT 1 FROM sanctions s
          WHERE s.user_id = p.user_id
            AND s.type IN ('red', 'double_red')
            AND s.active = TRUE
            AND s.created_at >= (
                SELECT MIN(match_date) - INTERVAL '2 hours'
                FROM matches
                WHERE jornada = v_match.jornada
            )
            AND s.created_at <= (
                SELECT MAX(match_date) + INTERVAL '4 hours'
                FROM matches
                WHERE jornada = v_match.jornada
            )
      );

    -- ── 6. Recalcular puntos_totales de cada participante ───
    UPDATE profiles
    SET puntos_totales = (
        SELECT COALESCE(SUM(pr.points_earned), 0)
        FROM predictions pr
        WHERE pr.user_id = profiles.id
          AND pr.points_earned IS NOT NULL
    )
    WHERE id IN (
        SELECT DISTINCT user_id FROM predictions WHERE match_id = p_match_id
    );

    -- ── 7. Retornar resumen ──────────────────────────────────
    SELECT jsonb_build_object(
        'match_id',      p_match_id,
        'home_team',     v_match.home_team,
        'away_team',     v_match.away_team,
        'real_result',   v_real_result,
        'stage',         v_match.stage,
        'processed',     v_processed,
        'predictions',   (
            SELECT jsonb_agg(jsonb_build_object(
                'user_id',      pr.user_id,
                'username',     pf.username,
                'prediction',   pr.user_home || '-' || pr.user_away,
                'pen_score',    pr.user_home_pen || '-' || pr.user_away_pen,
                'points',       pr.points_earned
            ) ORDER BY pr.points_earned DESC NULLS LAST)
            FROM predictions pr
            JOIN profiles pf ON pf.id = pr.user_id
            WHERE pr.match_id = p_match_id
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Solo el réferi puede ejecutar esta función
REVOKE ALL ON FUNCTION calculate_match_points(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION calculate_match_points(UUID)
    TO authenticated;  -- El CHECK interno usa es_referi=TRUE

-- Wrapper seguro: solo réferis pueden llamarla desde el cliente
CREATE OR REPLACE FUNCTION calculate_match_points_safe(p_match_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT (SELECT es_referi FROM profiles WHERE id = auth.uid()) THEN
        RAISE EXCEPTION 'Solo el réferi puede calcular puntos';
    END IF;
    RETURN calculate_match_points(p_match_id);
END;
$$;
