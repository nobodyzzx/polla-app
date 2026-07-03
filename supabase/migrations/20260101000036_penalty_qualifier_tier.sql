-- ============================================================
-- Polla Mundial 2026 — Fix escala de penales: separar el tramo de 4 pts
-- según se acierte o no al CLASIFICADO.
-- ============================================================
-- Bug: `prediction_points` daba 4 pts a TODO pronóstico con empate exacto en
-- 120' aunque hubiera errado quién avanzaba en la tanda. El reglamento otorga
-- ese punto extra solo si además se acierta el clasificado. Nueva escala (rama
-- de penales, solo si el usuario pronosticó EMPATE):
--
--   Empate exacto + penales exactos                          → 6
--   Empate exacto + penales incorrectos + clasificado ok     → 4
--   Empate exacto + penales incorrectos + clasificado errado → 3   (antes daba 4)
--   Empate errado + clasificado ok                           → 2
--   Empate errado + clasificado errado                       → 1
--   No pronosticó empate                                     → 0
--
-- Solo cambia la escalar `prediction_points`; calculate_match_points y
-- provisional_match_points la consumen sin cambios. Tras aplicar, hay que
-- recalcular los partidos de eliminatoria ya definidos por penales.
-- ============================================================

CREATE OR REPLACE FUNCTION prediction_points(
    p_stage TEXT,
    p_uh INTEGER, p_ua INTEGER,                 -- pronóstico: marcador
    p_uhp INTEGER, p_uap INTEGER,               -- pronóstico: penales (nullable)
    p_uwp TEXT,                                 -- pronóstico: ganador penales (nullable)
    p_rh INTEGER, p_ra INTEGER,                 -- real: marcador
    p_rhp INTEGER, p_rap INTEGER,               -- real: penales (nullable)
    p_rwp TEXT                                  -- real: ganador penales (nullable)
) RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_points          INTEGER := 0;
    v_real_result     TEXT;
    v_pred_result     TEXT;
    v_exact_score     BOOLEAN;
    v_exact_pen_score BOOLEAN;
    v_correct_pen     BOOLEAN;
BEGIN
    IF p_rh IS NULL OR p_ra IS NULL OR p_uh IS NULL OR p_ua IS NULL THEN
        RETURN 0;
    END IF;

    -- Resultado real
    IF    p_rh > p_ra THEN v_real_result := 'home';
    ELSIF p_ra > p_rh THEN v_real_result := 'away';
    ELSE                   v_real_result := 'draw';
    END IF;

    -- Resultado pronosticado
    IF    p_uh > p_ua THEN v_pred_result := 'home';
    ELSIF p_ua > p_uh THEN v_pred_result := 'away';
    ELSE                   v_pred_result := 'draw';
    END IF;

    -- ── FASE DE GRUPOS ───────────────────────────────────────
    IF p_stage = 'group' THEN
        IF v_pred_result = v_real_result THEN
            v_points := 1;
            IF p_uh = p_rh AND p_ua = p_ra THEN
                v_points := 3;
            END IF;
        END IF;

    -- ── FASE ELIMINATORIA ────────────────────────────────────
    ELSE
        IF v_real_result <> 'draw' THEN
            IF v_pred_result = v_real_result THEN
                v_points := 1;
                IF p_uh = p_rh AND p_ua = p_ra THEN
                    v_points := 3;
                END IF;
            END IF;
        ELSE
            -- Empate → definición por penales
            IF v_pred_result <> 'draw' THEN
                v_points := 0;  -- No marcó empate → CERO (regla estricta)
            ELSE
                v_exact_score := (p_uh = p_rh AND p_ua = p_ra);

                v_exact_pen_score := (
                    p_rhp IS NOT NULL AND p_rap IS NOT NULL
                    AND p_uhp IS NOT NULL AND p_uap IS NOT NULL
                    AND p_uhp = p_rhp AND p_uap = p_rap
                );

                v_correct_pen := CASE
                    WHEN p_uhp IS NOT NULL AND p_uap IS NOT NULL THEN
                        (CASE
                            WHEN p_uhp > p_uap THEN 'home'
                            WHEN p_uap > p_uhp THEN 'away'
                            ELSE NULL
                         END) = p_rwp
                    ELSE
                        p_uwp = p_rwp
                END;

                -- Escala corregida: el 4 exige clasificado correcto; si el empate
                -- exacto acierta pero erra el clasificado, cae a 3.
                -- (penales exactos ⇒ clasificado correcto, así que el 6 es seguro.)
                IF     v_exact_score AND v_exact_pen_score THEN v_points := 6;
                ELSIF  v_exact_score AND v_correct_pen     THEN v_points := 4;
                ELSIF  v_exact_score                       THEN v_points := 3;
                ELSIF  v_correct_pen                       THEN v_points := 2;
                ELSE                                            v_points := 1;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN v_points;
END;
$$;
