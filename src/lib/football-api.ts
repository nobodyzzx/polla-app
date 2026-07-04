/**
 * Facade de datos de partidos. Enruta entre proveedores según MATCH_PROVIDER.
 *   - 'espn' (por defecto): ESPN API pública (sin key ni cuota).
 *   - 'api-football': API-Football / api-sports.io.
 *
 * Ambos devuelven ApiMatch (forma normalizada en lib/match-types). El resto de la
 * app (sync, import-fixture, scoring) no sabe qué proveedor está activo.
 */
import type { ApiMatch } from './match-types';
import * as apiFootball from './providers/api-football';
import * as espn from './providers/espn';

export type { ApiMatch };

const PROVIDER = (import.meta.env.MATCH_PROVIDER ?? 'espn').toLowerCase();

export function getLiveMatches(): Promise<ApiMatch[]> {
  if (PROVIDER === 'espn') return espn.getLiveMatches();
  return apiFootball.getLiveMatches();
}

// ── API pública (enruta por proveedor) ───────────────────────────
export async function getFixtures(): Promise<ApiMatch[]> {
  if (PROVIDER === 'espn') return espn.getFixtures();
  return apiFootball.getFixtures();
}

export async function getFinishedMatches(): Promise<ApiMatch[]> {
  if (PROVIDER === 'espn') return espn.getFinishedMatches();
  return apiFootball.getFinishedMatches();
}

export async function getFixturesRange(fromOffset: number, toOffset: number): Promise<ApiMatch[]> {
  if (PROVIDER === 'espn') return espn.getFixturesRange(fromOffset, toOffset);
  return apiFootball.getFixturesRange(fromOffset, toOffset);
}

export async function getAllFixtures(): Promise<ApiMatch[]> {
  if (PROVIDER === 'espn') return espn.getAllFixtures();
  return apiFootball.getFixtures();
}

// ── Mapeo al esquema de la app (común a ambos proveedores) ────────
// Stages que se tratan como "fase de grupos" (antes del cuadro eliminatorio)
const GROUP_STAGES = new Set(['GROUP_STAGE', 'LEAGUE_STAGE', 'LEAGUE_PHASE']);

export function mapStage(stage: string): 'group' | 'knockout' {
  return GROUP_STAGES.has(stage) ? 'group' : 'knockout';
}

export function mapGroupName(group: string | null): string | null {
  if (!group) return null;
  // "GROUP_A" → "A"
  return group.replace(/^GROUP_/i, '').trim() || null;
}

const ROUND_MAP: Record<string, string> = {
  LAST_32:         'R32',
  LAST_16:         'R16',
  QUARTER_FINALS:  'Cuartos',
  SEMI_FINALS:     'Semifinal',
  THIRD_PLACE:     'Tercer Puesto',
  FINAL:           'Final',
  PLAYOFFS:        'Playoffs',
  PLAYOFF_ROUND_1: 'Playoffs',
  PLAYOFF_ROUND_2: 'Playoffs',
};

export function mapRound(stage: string): string | null {
  return ROUND_MAP[stage] ?? stage;
}

export function mapJornada(stage: string, matchday: number | null): string | null {
  if (GROUP_STAGES.has(stage)) return `Jornada ${matchday ?? 1}`;
  return mapRound(stage);
}

export function deriveWinnerPenalties(
  score: ApiMatch['score'],
): 'home' | 'away' | null {
  // Se deriva del MARCADOR de la tanda, no del string de duración del proveedor.
  // ESPN solo expone shootoutScore en eliminatorias con penales, así que su mera
  // presencia ya identifica la tanda; depender de que el estado diga "PEN"/"SHOOTOUT"
  // era frágil (si ESPN no lo nombra así, winner_penalties quedaba null y el knockout
  // no podía puntuar). El campo duration sirve de pista pero no es requisito.
  const home = score.penalties?.home ?? null;
  const away = score.penalties?.away ?? null;
  if (home === null || away === null) return null;
  if (home === away) return null; // sin definición; esperar dato completo
  return home > away ? 'home' : 'away';
}
