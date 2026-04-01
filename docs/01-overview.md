# Polla Mundial 2026 — Visión General

## ¿Qué es?

Aplicación web para pronosticar resultados del Mundial 2026. Los jugadores ingresan su marcador esperado antes de cada partido y acumulan puntos según la precisión del pronóstico. Al final del torneo, el jugador con más puntos gana.

## URL de producción

**https://mundial.tecnocondor.dev**

## Sistema de puntos

### Fase de grupos

| Acierto | Puntos |
|---|---|
| Marcador exacto | 3 |
| Ganador / empate correcto | 1 |

### Fase eliminatoria — sin penales

| Acierto | Puntos |
|---|---|
| Marcador exacto | 3 |
| Ganador correcto | 1 |
| No acertó ganador | 0 |

### Fase eliminatoria — definición por penales *(empate en 120')*

Si el usuario no pronosticó empate recibe **0 puntos** automáticamente.

| Acierto | Puntos |
|---|---|
| Marcador 90' exacto + marcador penales exacto | **6** |
| Marcador 90' exacto + clasificado correcto | **4** |
| Marcador 90' no exacto + clasificado correcto | **2** |
| Marcador 90' no exacto + clasificado incorrecto | **1** |

### Regla de jornada completa

Si el jugador no pronostica **todos** los partidos de una jornada, sus puntos de esa jornada se anulan.

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
