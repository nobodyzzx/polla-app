import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getFixtures, mapStage, mapGroupName, mapRound, mapJornada, deriveWinnerPenalties } from '@/lib/football-api';
import { getAdminUser } from '@/lib/auth-helpers';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const admin = await getAdminUser(cookies, supabase, supabaseAdmin);
  if (!admin) return redirect('/login');

  // ESPN trae el torneo completo por fecha (no necesita código ni temporada).
  let fixtures;
  try {
    fixtures = await getFixtures();
  } catch (e: any) {
    return redirect(`/admin?err=${encodeURIComponent('Error API: ' + e.message)}`);
  }

  if (!fixtures.length) {
    return redirect(`/admin?err=${encodeURIComponent('No se encontraron partidos en el proveedor')}`);
  }

  const rows = fixtures.map(f => {
    const homeTeamName = f.homeTeam?.name || null;
    const awayTeamName = f.awayTeam?.name || null;
    const row: Record<string, unknown> = {
      external_id:      f.id,
      match_date:       f.utcDate,
      stage:            mapStage(f.stage),
      group_name:       mapGroupName(f.group),
      round:            mapRound(f.stage),
      jornada:          mapJornada(f.stage, f.matchday),
      home_score:       f.score?.fullTime?.home ?? null,
      away_score:       f.score?.fullTime?.away ?? null,
      home_pen:         f.score?.penalties?.home ?? null,
      away_pen:         f.score?.penalties?.away ?? null,
      winner_penalties: f.score ? deriveWinnerPenalties(f.score) : null,
      is_finished:      f.status === 'FINISHED',
    };
    // Solo sobreescribir equipos si la API devuelve un nombre real.
    // Así los códigos de posición (ej. "1A", "2B") no se pierden al reimportar.
    if (homeTeamName) row.home_team = homeTeamName;
    if (awayTeamName) row.away_team = awayTeamName;
    return row;
  });

  const { error } = await supabaseAdmin
    .from('matches')
    .upsert(rows, { onConflict: 'external_id' });

  if (error) {
    return redirect(`/admin?err=${encodeURIComponent('Error DB: ' + error.message)}`);
  }

  return redirect(`/admin?msg=${encodeURIComponent(`Fixture importado: ${rows.length} partidos`)}`);
};
