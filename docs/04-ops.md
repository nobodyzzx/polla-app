# Operaciones y Mantenimiento

## Infraestructura

| Servicio | Uso | Panel |
|---|---|---|
| **Vercel** | Hosting del frontend | vercel.com |
| **Supabase** | Base de datos, auth, cron | supabase.com → proyecto `kbhwnpaipthejnpxkyed` |
| **football-data.org** | API de fixtures y resultados | football-data.org |
| **GitHub** | Repositorio | github.com/nobodyzzx/polla-app |

---

## Variables de entorno (Vercel)

| Variable | Descripción |
|---|---|
| `PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Anon key pública |
| `SUPABASE_SERVICE_KEY` | Service role key (solo servidor) |
| `FOOTBALL_API_KEY` | API key de football-data.org |
| `TOURNAMENT_CODE` | Código del torneo (`WC`) |
| `TOURNAMENT_SEASON` | Temporada (`2026`) |
| `CRON_SECRET` | Secret para autenticar el cron |
| `PUBLIC_BETA` | `false` en producción |

---

## Deploy

Cada push a `main` en GitHub dispara un deploy automático en Vercel.

```bash
git push origin main
```

---

## Base de datos

### Herramienta recomendada
**DataGrip** — conectar directo a la DB de Supabase (no usar el editor web).

### Migraciones
Las migraciones viven en `supabase/migrations/`. Para aplicar en producción:
```bash
supabase db push
```

Si una migración falla por ya existir:
```bash
supabase migration repair --status applied 20260101XXXXXX
```

---

## Cron de sincronización

- **Job**: `polla-sync-scores`
- **Schedule**: `*/5 16-23,0-5 * * *` UTC
- **Ventana Bolivia**: 12:00 – 01:59
- **Endpoint**: `https://mundial.tecnocondor.dev/api/cron/sync`
- **Auth**: Bearer token con `CRON_SECRET`

### Verificar ejecuciones
```sql
SELECT r.start_time, r.status, r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname = 'polla-sync-scores'
ORDER BY r.start_time DESC
LIMIT 10;
```

### Re-crear el cron (si es necesario)
Ejecutar en DataGrip el archivo `supabase/migrations/20260101000008_cron_sync.sql` con la URL y secret de producción correctos.

---

## Checklist de lanzamiento

- [x] Variables de entorno configuradas en Vercel
- [x] `PUBLIC_BETA=false`
- [x] Migraciones aplicadas en producción
- [x] Fixture del Mundial importado (`WC` / `2026`)
- [x] Cron activo y verificado
- [ ] Jugadores registrados y activados (`participa=true`)
- [ ] Pagos confirmados por jugador

---

## Checklist día de partido

- Verificar que el cron corrió en los últimos 5 minutos (DataGrip)
- Después del partido: confirmar que `is_finished=true` y los scores cargaron
- Si no actualizó: presionar **Sync Scores** desde `/admin`

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| Partido terminado pero sigue abierto | Cron no corrió o API tardó | Sync manual desde admin |
| Jugador no puede pronosticar | `participa=false` o pago pendiente | Activar en `/admin/usuarios` |
| Bandera no aparece | Nombre del equipo no mapeado | Agregar alias en `src/lib/flags.ts` e `isoFlags.ts` |
| Cron falla con 401 | `CRON_SECRET` no coincide | Verificar var en Vercel y en el SQL del cron |
| Cron falla con 502 | football-data.org caído o key inválida | Verificar `FOOTBALL_API_KEY` en Vercel |
