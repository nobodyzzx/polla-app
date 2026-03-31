/**
 * En beta mode, desplaza "ahora" al inicio del Mundial (11 jun 2026)
 * manteniendo el tiempo fluyendo a la misma velocidad.
 * Así los partidos de la fase de grupos aparecen como si fueran hoy.
 */

const TOURNAMENT_START_MS = new Date('2026-06-11T18:00:00Z').getTime();

// Fecha de referencia: cuando se activó el beta (31 mar 2026)
const BETA_REFERENCE_MS = new Date('2026-03-31T00:00:00Z').getTime();

// Cuántos ms hay que sumar a Date.now() para simular el inicio del mundial
export const BETA_OFFSET_MS =
  import.meta.env.PUBLIC_BETA === 'true'
    ? TOURNAMENT_START_MS - BETA_REFERENCE_MS
    : 0;

/** Timestamp "ahora" (simulado en beta, real en producción) */
export function betaNowMs(): number {
  return Date.now() + BETA_OFFSET_MS;
}

/** Date "ahora" */
export function betaNow(): Date {
  return new Date(betaNowMs());
}
