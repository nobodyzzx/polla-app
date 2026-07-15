/**
 * Reconstrucción del historial de posiciones día a día (jornada Bolivia, frontera
 * 03:00 BOT). Sirve para stats retrospectivas del perfil: "días como líder" y el
 * duelo 1v1 entre dos jugadores.
 *
 * Base de verdad: `predictions.points_earned`. Ese valor YA refleja las jornadas
 * anuladas por roja (quedan en 0) y el cero por no pronosticar toda la jornada
 * (lo aplica calculate_match_points). Por eso acumular points_earned por fecha de
 * partido es fiel a lo que pasó, sin recalcular nada aquí.
 *
 * Unidad de tiempo = "jornada" (día de juego con frontera 03:00 BOT), no el día
 * calendario: la tabla solo cambia cuando se juega y puntúa una jornada.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchAllRows } from './supabase';
import { boliviaDayKey } from './jornada';
import { fmtFecha } from './fechas';
import { compareStandings } from './standings';

interface Acum {
  pts: number;
  exactos: number;  // pronósticos de 3+ pts
  aciertos: number; // pronósticos de 1+ pts
}

export interface DiaHist {
  dayMs: number;
  label: string;
  /** Totales ACUMULADOS de cada jugador al cierre de esta jornada. */
  totals: Map<string, Acum>;
  /** Id del jugador en el 1er puesto tras esta jornada (desempate estándar). */
  liderId: string | null;
}

export interface Jugador {
  id: string;
  username: string;
}

export interface Historial {
  dias: DiaHist[];
  jugadores: Jugador[];
}

const emptyAcum = (): Acum => ({ pts: 0, exactos: 0, aciertos: 0 });

/**
 * Construye el historial completo con UNA tanda de consultas. Devuelve las
 * jornadas en orden cronológico y la lista de jugadores (participantes vivos).
 */
export async function construirHistorial(db: SupabaseClient): Promise<Historial> {
  const [jugadoresRaw, matches, preds] = await Promise.all([
    db
      .from('profiles')
      .select('id, username')
      .eq('participa', true)
      .eq('expulsado', false),
    db
      .from('matches')
      .select('id, match_date')
      .eq('is_finished', true),
    fetchAllRows<{ user_id: string; match_id: string; points_earned: number | null }>(
      (from, to) => db
        .from('predictions')
        .select('user_id, match_id, points_earned')
        .not('points_earned', 'is', null)
        .order('id', { ascending: true })
        .range(from, to),
    ),
  ]);

  const jugadores: Jugador[] = (jugadoresRaw.data ?? []).map((p: any) => ({
    id: p.id,
    username: p.username ?? '?',
  }));
  const jugadorIds = new Set(jugadores.map((j) => j.id));

  // Agrupar partidos por jornada (día Bolivia). matchId → dayMs.
  const matchDay = new Map<string, number>();
  const daySet = new Set<number>();
  for (const m of matches.data ?? []) {
    const dayMs = boliviaDayKey(new Date((m as any).match_date).getTime());
    matchDay.set((m as any).id, dayMs);
    daySet.add(dayMs);
  }
  const diasOrden = [...daySet].sort((a, b) => a - b);

  // Puntos de cada jornada por jugador (no acumulados todavía).
  // dayMs → userId → Acum (aporte de ESA jornada).
  const aporte = new Map<number, Map<string, Acum>>();
  for (const d of diasOrden) aporte.set(d, new Map());
  for (const p of preds) {
    if (!jugadorIds.has(p.user_id)) continue;
    const dayMs = matchDay.get(p.match_id);
    if (dayMs === undefined) continue; // partido sin terminar o inexistente
    const pts = p.points_earned ?? 0;
    const porDia = aporte.get(dayMs)!;
    const a = porDia.get(p.user_id) ?? emptyAcum();
    a.pts += pts;
    if (pts >= 3) a.exactos++;
    if (pts > 0) a.aciertos++;
    porDia.set(p.user_id, a);
  }

  // Acumular jornada a jornada y determinar el líder de cada corte.
  const running = new Map<string, Acum>();
  for (const j of jugadores) running.set(j.id, emptyAcum());

  const dias: DiaHist[] = [];
  for (const dayMs of diasOrden) {
    const porDia = aporte.get(dayMs)!;
    for (const [uid, add] of porDia) {
      const r = running.get(uid);
      if (!r) continue;
      r.pts += add.pts;
      r.exactos += add.exactos;
      r.aciertos += add.aciertos;
    }
    // Snapshot inmutable de los totales acumulados a esta altura.
    const snapshot = new Map<string, Acum>();
    for (const [uid, r] of running) snapshot.set(uid, { ...r });

    // Líder tras esta jornada (mismo desempate que la tabla).
    let liderId: string | null = null;
    let mejor: Acum | null = null;
    for (const j of jugadores) {
      const s = snapshot.get(j.id)!;
      if (
        mejor === null ||
        compareStandings(
          { puntos_totales: s.pts, exactos: s.exactos, aciertos: s.aciertos },
          { puntos_totales: mejor.pts, exactos: mejor.exactos, aciertos: mejor.aciertos },
        ) < 0
      ) {
        mejor = s;
        liderId = j.id;
      }
    }

    dias.push({
      dayMs,
      label: fmtFecha(new Date(dayMs), { day: 'numeric', month: 'short' }),
      totals: snapshot,
      liderId,
    });
  }

  return { dias, jugadores };
}

export interface LiderStats {
  diasLider: number;       // jornadas en las que quedó 1.º
  mejorRacha: number;      // racha más larga de jornadas seguidas como líder
  rachaActual: number;     // racha vigente (0 si hoy no es líder)
  totalJornadas: number;   // jornadas jugadas en total
}

/** Stats de liderazgo de un jugador sobre todo el historial. */
export function statsLider(dias: DiaHist[], userId: string): LiderStats {
  let diasLider = 0, mejorRacha = 0, run = 0;
  for (const d of dias) {
    if (d.liderId === userId) {
      diasLider++;
      run++;
      if (run > mejorRacha) mejorRacha = run;
    } else {
      run = 0;
    }
  }
  // Racha actual: jornadas líder consecutivas contando desde la última hacia atrás.
  let rachaActual = 0;
  for (let i = dias.length - 1; i >= 0 && dias[i].liderId === userId; i--) rachaActual++;
  return { diasLider, mejorRacha, rachaActual, totalJornadas: dias.length };
}

export interface DueloDia {
  dayMs: number;
  label: string;
  me: number;
  rival: number;
}

export interface DueloStats {
  diasArriba: number;  // jornadas en las que el usuario estuvo por encima del rival
  diasAbajo: number;
  diasIgual: number;
  maxVentaja: number;  // mayor diferencia a favor (0 si nunca estuvo arriba)
  maxDeficit: number;  // mayor diferencia en contra (0 si nunca estuvo abajo)
  difActual: number;   // diferencia de puntos hoy (me - rival)
  serie: DueloDia[];
}

/** Duelo 1v1 entre dos jugadores a lo largo del torneo. */
export function statsDuelo(dias: DiaHist[], userId: string, rivalId: string): DueloStats {
  let diasArriba = 0, diasAbajo = 0, diasIgual = 0;
  let maxVentaja = 0, maxDeficit = 0, difActual = 0;
  const serie: DueloDia[] = [];

  for (const d of dias) {
    const me = d.totals.get(userId);
    const rv = d.totals.get(rivalId);
    const myPts = me?.pts ?? 0;
    const rvPts = rv?.pts ?? 0;
    const diff = myPts - rvPts;

    // "Arriba/abajo" usa el desempate completo, no solo puntos.
    const cmp = compareStandings(
      { puntos_totales: myPts, exactos: me?.exactos ?? 0, aciertos: me?.aciertos ?? 0 },
      { puntos_totales: rvPts, exactos: rv?.exactos ?? 0, aciertos: rv?.aciertos ?? 0 },
    );
    if (cmp < 0) diasArriba++;
    else if (cmp > 0) diasAbajo++;
    else diasIgual++;

    if (diff > maxVentaja) maxVentaja = diff;
    if (diff < maxDeficit) maxDeficit = diff;
    difActual = diff;

    serie.push({ dayMs: d.dayMs, label: d.label, me: myPts, rival: rvPts });
  }

  return { diasArriba, diasAbajo, diasIgual, maxVentaja, maxDeficit, difActual, serie };
}
