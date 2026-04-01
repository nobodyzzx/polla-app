# Polla Mundial 2026

Aplicación web de pronósticos para el Mundial 2026. Los jugadores predicen marcadores antes de cada partido y acumulan puntos según la precisión.

**https://mundial.tecnocondor.dev**

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
