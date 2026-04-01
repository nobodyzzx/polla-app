-- ============================================================
-- Polla Mundial 2026 — Índices de rendimiento
-- ============================================================

-- Consultas de resultados y admin siempre filtran por is_finished + match_date
CREATE INDEX IF NOT EXISTS idx_matches_finished_date
  ON matches(is_finished, match_date);

-- Consultas de pronósticos por usuario (perfil, dashboard)
CREATE INDEX IF NOT EXISTS idx_predictions_user_points
  ON predictions(user_id, points_earned)
  WHERE points_earned IS NOT NULL;
