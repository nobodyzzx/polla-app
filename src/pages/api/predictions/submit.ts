import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return redirect('/login');

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('pago_70, pago_50').eq('id', user.id).single();
  if (import.meta.env.PUBLIC_BETA !== "true" && !(profile?.pago_70 && profile?.pago_50)) return redirect('/predictions');

  const form = await request.formData();
  const matchId = form.get('matchId')?.toString();
  const userHome = parseInt(form.get('userHome')?.toString() ?? '');
  const userAway = parseInt(form.get('userAway')?.toString() ?? '');
  const penHomeStr = form.get('userHomePen')?.toString() ?? '';
  const penAwayStr = form.get('userAwayPen')?.toString() ?? '';
  const userHomePen = penHomeStr !== '' ? parseInt(penHomeStr) : null;
  const userAwayPen = penAwayStr !== '' ? parseInt(penAwayStr) : null;

  // Derivar winner_penalties del score de penales
  let userWinnerPenalties: string | null = null;
  if (userHomePen !== null && userAwayPen !== null) {
    if (userHomePen > userAwayPen) userWinnerPenalties = 'home';
    else if (userAwayPen > userHomePen) userWinnerPenalties = 'away';
  }

  if (!matchId || isNaN(userHome) || isNaN(userAway)) {
    return redirect(`/predictions/${matchId}?error=incompleto`);
  }

  // Doble verificación en servidor: cierre por jornada (2h antes del primer partido).
  const { data: match } = await supabase
    .from('matches')
    .select('match_date, stage, is_finished, jornada')
    .eq('id', matchId)
    .single();

  if (!match) return redirect('/predictions');
  if (match.is_finished) return redirect(`/predictions?error=${encodeURIComponent('El partido ya está cerrado')}`);

  // Busca todos los partidos de la misma jornada para encontrar el primero.
  let jornadaQuery = match.jornada
    ? supabase.from('matches').select('match_date').eq('jornada', match.jornada)
    : (() => {
        const shifted = new Date(new Date(match.match_date).getTime() - 4 * 3600 * 1000);
        const start = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) + 4 * 3600 * 1000);
        return supabase.from('matches').select('match_date')
          .gte('match_date', start.toISOString())
          .lt('match_date', new Date(start.getTime() + 24 * 3600 * 1000).toISOString());
      })();

  const { data: jornadaMatches } = await jornadaQuery;
  const firstMatchTime = Math.min(...(jornadaMatches ?? []).map(m => new Date(m.match_date).getTime()));
  const isClosed = firstMatchTime - Date.now() < 2 * 3600 * 1000;
  if (isClosed) return redirect(`/predictions?error=${encodeURIComponent('La jornada ya está cerrada')}`);

  // Validar: en knockout con empate, debe seleccionar ganador de penales
  if (match.stage === 'knockout' && userHome === userAway && (userHomePen === null || userAwayPen === null || userHomePen === userAwayPen)) {
    return redirect(`/predictions/${matchId}?error=Debes+completar+el+score+de+penales+%28sin+empate%29`);
  }

  const { error } = await supabase.from('predictions').insert({
    user_id: user.id,
    match_id: matchId,
    user_home: userHome,
    user_away: userAway,
    user_home_pen: userHomePen,
    user_away_pen: userAwayPen,
    user_winner_penalties: userWinnerPenalties,
  });

  if (error) {
    if (error.code === '23505') {
      return redirect('/predictions?info=ya_pronosticado');
    }
    return redirect(`/predictions/${matchId}?error=${encodeURIComponent(error.message)}`);
  }

  return redirect('/predictions?ok=1');
};
