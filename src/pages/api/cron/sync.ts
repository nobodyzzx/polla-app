/**
 * GET /api/cron/sync?secret=CRON_SECRET
 *
 * Endpoint para automatización externa (cron-job.org, uptime monitors, etc.)
 * No requiere sesión — autenticación por secret en query param.
 * Sincroniza el torneo configurado en TOURNAMENT_CODE / TOURNAMENT_SEASON.
 */
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '@/lib/supabase';
import { getFixtures, getFinishedMatches, deriveWinnerPenalties } from '@/lib/football-api';

export const GET: APIRoute = async ({ url }) => {
  const secret = url.searchParams.get('secret');
  const expected = import.meta.env.CRON_SECRET;

  if (!expected || secret !== expected) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const code   = import.meta.env.TOURNAMENT_CODE;
  const season = parseInt(import.meta.env.TOURNAMENT_SEASON ?? '');

  if (!code || isNaN(season)) {
    return json({ error: 'TOURNAMENT_CODE o TOURNAMENT_SEASON no configurados' }, 500);
  }

  let allFixtures, finished;
  try {
    [allFixtures, finished] = await Promise.all([
      getFixtures(code, season),
      getFinishedMatches(code, season),
    ]);
  } catch (e: any) {
    return json({ error: 'Error API fútbol: ' + e.message }, 502);
  }

  // ── 1. Actualizar nombres TBD en partidos pendientes ────────────
  const pendingIds = allFixtures
    .filter(f => f.status !== 'FINISHED' && f.homeTeam?.name && f.awayTeam?.name
                 && f.homeTeam.name !== 'TBD' && f.awayTeam.name !== 'TBD')
    .map(f => f.id);

  let namesUpdated = 0;
  if (pendingIds.length) {
    const { data: pendingDb } = await supabaseAdmin
      .from('matches')
      .select('id, external_id, home_team, away_team')
      .in('external_id', pendingIds)
      .eq('is_finished', false);

    for (const dbMatch of pendingDb ?? []) {
      const api = allFixtures.find(f => f.id === dbMatch.external_id);
      if (!api) continue;
      const newHome = api.homeTeam?.name;
      const newAway = api.awayTeam?.name;
      if (!newHome || !newAway) continue;
      if (newHome === dbMatch.home_team && newAway === dbMatch.away_team) continue;
      await supabaseAdmin.from('matches').update({ home_team: newHome, away_team: newAway }).eq('id', dbMatch.id);
      namesUpdated++;
    }
  }

  // ── 2. Sincronizar resultados terminados ────────────────────────
  if (!finished.length) {
    return json({ ok: true, namesUpdated, scoresUpdated: 0, message: 'Sin partidos terminados nuevos' });
  }

  const externalIds = finished.map(f => f.id);
  const { data: dbMatches } = await supabaseAdmin
    .from('matches')
    .select('id, external_id')
    .in('external_id', externalIds)
    .eq('is_finished', false);

  const dbMap = new Map((dbMatches ?? []).map(m => [m.external_id, m.id]));

  let scoresUpdated = 0;
  const toCalculate: string[] = [];

  for (const f of finished) {
    const matchId = dbMap.get(f.id);
    if (!matchId) continue;

    const { error } = await supabaseAdmin
      .from('matches')
      .update({
        home_team:        f.homeTeam?.name || undefined,
        away_team:        f.awayTeam?.name || undefined,
        home_score:       f.score.fullTime.home,
        away_score:       f.score.fullTime.away,
        home_pen:         f.score.penalties.home,
        away_pen:         f.score.penalties.away,
        winner_penalties: deriveWinnerPenalties(f.score),
        is_finished:      true,
      })
      .eq('id', matchId);

    if (!error) {
      scoresUpdated++;
      toCalculate.push(matchId);
    }
  }

  for (const matchId of toCalculate) {
    await supabaseAdmin.rpc('calculate_match_points_safe', { p_match_id: matchId });
  }

  return json({ ok: true, namesUpdated, scoresUpdated, message: `${scoresUpdated} partido(s) sincronizado(s)` });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
