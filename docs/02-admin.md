# Manual del Réferi (Admin)

## Acceso

Solo usuarios con `es_referi=true` pueden acceder a **/admin**.

---

## Usuarios `/admin/usuarios`

### Activar a un jugador nuevo
1. El jugador se registra en **/register**
2. Ir a `/admin/usuarios`
3. Activar **Participa** en su perfil
4. Marcar **Pago 70%** y/o **Pago 50%** cuando corresponda

> Sin `participa=true` el usuario puede ver la app pero no pronosticar.

### Flags disponibles

| Flag | Descripción |
|---|---|
| `participa` | Es jugador activo del torneo |
| `es_referi` | Tiene acceso al panel admin |
| `pago_70` | Pagó el primer tramo |
| `pago_50` | Pagó el segundo tramo |
| `expulsado` | Sancionado — no puede pronosticar |

---

## Fixture e importación `/admin`

### Importar partidos
1. En la sección **API de Fútbol**, ingresar código `WC` y temporada `2026`
2. Presionar **📥 Importar Fixture**
3. Los partidos se crean o actualizan por `external_id` (no genera duplicados)

> En fase eliminatoria los equipos aparecen como TBD hasta que el cron los actualice.

### Sync manual de scores
Presionar **🔄 Sync Scores** solo si:
- Sospechás que el cron no corrió (verificar en DataGrip)
- Querés forzar actualización inmediata

En operación normal el cron lo hace automático.

---

## Cron automático

- **Schedule**: `*/5 16-23,0-5 * * *` UTC = cada 5 min entre 12:00–01:59 Bolivia
- Cubre todos los horarios de partido del Mundial 2026 (el más tarde empieza a las 23:00 Bolivia)
- Hace 2 llamadas por run a football-data.org
- Se ejecuta vía pg_cron en Supabase → llama a `https://mundial.tecnocondor.dev/api/cron/sync`

### Verificar que el cron corre (DataGrip)
```sql
SELECT r.start_time, r.status, r.return_message
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
WHERE j.jobname = 'polla-sync-scores'
ORDER BY r.start_time DESC
LIMIT 10;
```

---

## Sanciones (VAR) `/admin`

- Aplica a cualquier jugador con `participa=true`, incluyendo réferis-jugadores
- Tipos: **amarilla** (advertencia), **roja** (expulsión del torneo)
- Una sanción activa bloquea el acceso a pronosticar

---

## Configuración de plazos de pago

En la sección **Configuración** del admin se definen las fechas límite para los pagos del 70% y 50%. Pasada la fecha, el botón "Compartir pagos" del dashboard se desactiva automáticamente.

---

## Partidos — marcar como terminado

El cron marca `is_finished=true` automáticamente al sincronizar con la API. Si por algún motivo un partido quedó abierto después de terminar, hacer Sync manual.
