# Polla Mundial 2026 — Visión General

## ¿Qué es?

Aplicación web para pronosticar resultados del Mundial 2026. Los jugadores ingresan su marcador esperado antes de cada partido y acumulan puntos según la precisión del pronóstico. Al final del torneo, el jugador con más puntos gana.

## URL de producción

**https://mundial.tecnocondor.dev**

## Sistema de puntos

| Acierto | Puntos |
|---|---|
| Marcador exacto | 3 pts |
| Diferencia de goles correcta (no empate) | 2 pts |
| Ganador correcto | 1 pt |
| Fallo total | 0 pts |

En fases eliminatorias se suman puntos por penales si aplica.

## Roles

| Rol | Acceso |
|---|---|
| **Jugador** (`participa=true`) | Pronosticar, ver resultados, dashboard |
| **Réferi** (`es_referi=true`) | Todo lo anterior + panel de administración |
| Jugador-réferi | Ambos roles activos simultáneamente |

## Restricciones de pronóstico

- **Cierre de jornada**: 2 horas antes del primer partido de la jornada
- **Bloqueo por día anterior**: no se puede pronosticar un día si todavía hay partidos sin terminar del día anterior
- **Bloqueo mismo día**: no se puede pronosticar si ya empezó algún partido del mismo día
- **Una vez enviado no se puede modificar**

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | Astro + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Hosting | Vercel |
| API de fútbol | football-data.org |
| Cron | pg_cron + pg_net (Supabase) |
