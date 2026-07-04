import type { APIRoute } from 'astro';
import { createRequestClient, supabaseAdmin } from '@/lib/supabase';

/**
 * Partidos EN VIVO + puntos provisionales del usuario.
 *
 * Devuelve los partidos en curso (status IN_PLAY/PAUSED, no finalizados) con
 * marcador/minuto y, para el jugador, cuántos puntos lleva ganando "si terminara
 * así" — vía la RPC read-only `provisional_match_points`. La escala de penales no
 * aplica en vivo (aún no hay tanda), así que refleja el marcador de los 120'.
 *
 * Lecturas con SERVICE-ROLE scopeadas por user.id (igual que /predictions y
 * /perfil): el setSession sin auto-refresh puede quedar anónimo para RLS y la
 * RPC (GRANT a authenticated) fallaría. `user` ya se valida abajo.
 */
export const GET: APIRoute = async ({ cookies }) => {
  const empty = () => new Response(JSON.stringify({ matches: [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

  const supabase = createRequestClient(); // sesión aislada por petición (ver lib/supabase)
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return empty();

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return empty();

  const { data: me } = await supabaseAdmin
    .from('profiles')
    .select('participa')
    .eq('id', user.id)
    .single();
  const isPlayer = !me || me.participa !== false;

  const { data: liveMatches } = await supabaseAdmin
    .from('matches')
    .select('id, home_team, away_team, home_score, away_score, home_pen, away_pen, minute, status, stage, round, group_name, match_date')
    .in('status', ['IN_PLAY', 'PAUSED'])
    .eq('is_finished', false)
    .order('match_date', { ascending: true });

  if (!liveMatches?.length) return empty();

  // Puntos provisionales del usuario por partido (solo si participa).
  const matches = await Promise.all(liveMatches.map(async (m: any) => {
    let myPoints: number | null = null;
    let hasPrediction = false;
    if (isPlayer) {
      const { data: prov } = await supabaseAdmin.rpc('provisional_match_points', { p_match_id: m.id });
      const mine = (prov ?? []).find((r: any) => r.user_id === user.id);
      if (mine) { myPoints = mine.points ?? 0; hasPrediction = true; }
    }
    return {
      id: m.id,
      home_team: m.home_team,
      away_team: m.away_team,
      home_score: m.home_score,
      away_score: m.away_score,
      home_pen: m.home_pen,
      away_pen: m.away_pen,
      minute: m.minute,
      status: m.status,
      stage: m.stage,
      round: m.round,
      group_name: m.group_name,
      myPoints,
      hasPrediction,
    };
  }));

  return new Response(JSON.stringify({ matches }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
