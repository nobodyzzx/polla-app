-- ============================================================
-- Polla Mundial 2026 — Campo expulsado en profiles
-- Doble roja = usuario oculto de standings permanentemente
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS expulsado BOOLEAN NOT NULL DEFAULT FALSE;

-- RLS: nadie puede ponerse expulsado a sí mismo
-- (ya cubierto porque solo service_role/admin puede UPDATE profiles.expulsado)
