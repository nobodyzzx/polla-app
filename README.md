# Polla Mundial 2026

Aplicación web de pronósticos para el Mundial 2026. Los jugadores predicen marcadores antes de cada partido y acumulan puntos según la precisión.

**https://mundial.tecnocondor.dev**

## Sistema de puntos

**Fase de grupos**

| Acierto | Puntos |
|---|---|
| Marcador exacto | 3 |
| Ganador / empate correcto | 1 |

**Fase eliminatoria — sin penales**

| Acierto | Puntos |
|---|---|
| Marcador exacto | 3 |
| Ganador correcto | 1 |
| No acertó ganador | 0 |

**Fase eliminatoria — definición por penales** *(empate en 120')*

> Si el usuario no pronosticó empate recibe 0 puntos automáticamente.

| Acierto | Puntos |
|---|---|
| Marcador 90' exacto + marcador penales exacto | 6 |
| Marcador 90' exacto + clasificado correcto | 4 |
| Marcador 90' no exacto + clasificado correcto | 2 |
| Marcador 90' no exacto + clasificado incorrecto | 1 |

**Regla de jornada completa:** si el jugador no pronostica todos los partidos de una jornada, sus puntos de esa jornada se anulan.

## Stack

- [Astro](https://astro.build) + Tailwind CSS
- [Supabase](https://supabase.com) — PostgreSQL, Auth, RLS, pg_cron
- [Vercel](https://vercel.com) — hosting
- [football-data.org](https://www.football-data.org) — API de fixtures y resultados

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Variables de entorno requeridas en `.env`:

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
FOOTBALL_API_KEY=
TOURNAMENT_CODE=WC
TOURNAMENT_SEASON=2026
CRON_SECRET=
PUBLIC_BETA=true
```

## Deploy

Cada push a `main` dispara un deploy automático en Vercel.

## Documentación

Ver carpeta [`docs/`](./docs) para manuales de admin, guía de jugadores y operaciones.
