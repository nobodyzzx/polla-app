-- Tabla genérica de configuración clave-valor
CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer
CREATE POLICY "settings_read" ON settings
  FOR SELECT TO authenticated USING (true);

-- Solo service_role puede escribir (desde supabaseAdmin)
CREATE POLICY "settings_write" ON settings
  FOR ALL TO service_role USING (true);
