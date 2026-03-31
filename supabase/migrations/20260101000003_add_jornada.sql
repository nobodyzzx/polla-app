-- ============================================================
-- Agrega columna jornada a matches.
-- Una jornada agrupa partidos que cierran juntos (aunque se
-- jueguen en días distintos). Ejecutar en DataGrip.
-- ============================================================

ALTER TABLE matches ADD COLUMN IF NOT EXISTS jornada TEXT;

-- Fase eliminatoria: jornada = round (ya existe y es correcto)
UPDATE matches SET jornada = round WHERE stage = 'knockout' AND jornada IS NULL;

-- Fase de grupos: 3 jornadas según rango de fechas del fixture oficial
UPDATE matches SET jornada = 'Jornada 1'
  WHERE stage = 'group'
    AND match_date >= '2026-06-11T00:00:00Z'
    AND match_date <  '2026-06-17T00:00:00Z';

UPDATE matches SET jornada = 'Jornada 2'
  WHERE stage = 'group'
    AND match_date >= '2026-06-17T00:00:00Z'
    AND match_date <  '2026-06-23T00:00:00Z';

UPDATE matches SET jornada = 'Jornada 3'
  WHERE stage = 'group'
    AND match_date >= '2026-06-23T00:00:00Z'
    AND match_date <  '2026-06-30T00:00:00Z';
