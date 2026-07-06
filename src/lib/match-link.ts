/**
 * Empareja partidos del proveedor (ApiMatch) con filas de la BD.
 * Estrategia:
 *   1. Por EQUIPOS, dentro de una ventana de tolerancia de hora. Las horas sembradas
 *      (de football-data) a veces difieren de las de ESPN por husos/errores de siembra
 *      (visto: 1h en partidos nocturnos de Bolivia). Como un mismo par de selecciones se
 *      enfrenta a lo sumo una vez, emparejar por equipos dentro de una ventana es seguro
 *      y evita que un desfase de hora deje el marcador sin escribir.
 *   2. Fallback por PLACEHOLDER de bracket ("2A", "W74"…), solo con hora EXACTA: los
 *      nombres aún no son comparables, la hora es la única señal.
 */
import type { ApiMatch } from './match-types';

export interface DbMatchRow {
  id: string;
  match_date: string;
  home_team: string;
  away_team: string;
  stage?: string | null;
}

// Nombres difieren entre proveedores; se mapean a una forma canónica.
const ALIAS: Record<string, string> = {
  usa: 'unitedstates',
  unitedstatesofamerica: 'unitedstates',
  czechrepublic: 'czechia',
  korearepublic: 'southkorea',
  korea: 'southkorea',
  cotedivoire: 'ivorycoast',
  capeverdeislands: 'capeverde',
  drcongo: 'congodr',
  democraticrepublicofcongo: 'congodr',
  turkiye: 'turkey',
  bosniaandherzegovina: 'bosniaherzegovina',
};

export function normTeam(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z]/g, '');         // deja solo letras
  return ALIAS[base] ?? base;
}

export function teamKey(home: string, away: string): string {
  return [normTeam(home), normTeam(away)].sort().join('|');
}

/** Placeholder de bracket (ej. "2A", "W74", "3ABCDF", "TBD"): no tiene minúsculas. */
export function isPlaceholderName(name: string): boolean {
  return !/[a-z]/.test(name);
}

function epochMinute(iso: string): number {
  return Math.floor(Date.parse(iso) / 60000);
}

/**
 * Ventana de tolerancia (minutos) para el emparejamiento por EQUIPOS. Cubre desfases de
 * siembra (football-data vs ESPN) sin arriesgar un mislink: un mismo par de selecciones no
 * juega dos veces en <3h. El fallback por placeholder NO usa tolerancia (exige hora exacta).
 */
const TOLERANCIA_MIN = 180;

/** Devuelve Map<ApiMatch, dbMatchId> con los emparejamientos resueltos. */
export function linkMatches(
  apiMatches: ApiMatch[],
  dbMatches: DbMatchRow[],
): Map<ApiMatch, string> {
  const out = new Map<ApiMatch, string>();
  const usados = new Set<string>(); // una fila db no se asigna a dos partidos del proveedor
  // Índice por minuto exacto: solo para el fallback por placeholder.
  const byMinute = new Map<number, DbMatchRow[]>();
  for (const db of dbMatches) {
    const m = epochMinute(db.match_date);
    const arr = byMinute.get(m) ?? [];
    arr.push(db);
    byMinute.set(m, arr);
  }
  for (const am of apiMatches) {
    const amMin = epochMinute(am.utcDate);
    const target = teamKey(am.homeTeam.name, am.awayTeam.name);
    // 1. Por equipos, dentro de la ventana de tolerancia (elige el más cercano en hora).
    let hit: DbMatchRow | undefined = dbMatches
      .filter((c) =>
        !usados.has(c.id) &&
        teamKey(c.home_team, c.away_team) === target &&
        Math.abs(epochMinute(c.match_date) - amMin) <= TOLERANCIA_MIN)
      .sort((a, b) =>
        Math.abs(epochMinute(a.match_date) - amMin) -
        Math.abs(epochMinute(b.match_date) - amMin))[0];
    // 2. Fallback por placeholder de bracket: solo con hora exacta.
    if (!hit) {
      const cands = byMinute.get(amMin) ?? [];
      hit = cands.find((c) => !usados.has(c.id) && (isPlaceholderName(c.home_team) || isPlaceholderName(c.away_team)));
    }
    if (hit) {
      out.set(am, hit.id);
      usados.add(hit.id);
    }
  }
  return out;
}
