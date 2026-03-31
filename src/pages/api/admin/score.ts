import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return redirect('/login');

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('es_referi')
    .eq('id', user.id)
    .single();

  if (!profile?.es_referi) return redirect('/dashboard');

  const form = await request.formData();
  const matchId   = form.get('matchId')?.toString();
  const homeScore = parseInt(form.get('homeScore')?.toString() ?? '');
  const awayScore = parseInt(form.get('awayScore')?.toString() ?? '');
  const penHomeStr = form.get('homePen')?.toString() ?? '';
  const penAwayStr = form.get('awayPen')?.toString() ?? '';
  const homePen = penHomeStr !== '' ? parseInt(penHomeStr) : null;
  const awayPen = penAwayStr !== '' ? parseInt(penAwayStr) : null;

  if (!matchId || isNaN(homeScore) || isNaN(awayScore)) {
    return redirect('/admin?err=Datos+incompletos');
  }

  // Scores no negativos
  if (homeScore < 0 || awayScore < 0) {
    return redirect('/admin?err=El+marcador+no+puede+ser+negativo');
  }

  // Penales solo válidos si hubo empate
  if ((homePen !== null || awayPen !== null) && homeScore !== awayScore) {
    return redirect('/admin?err=Los+penales+solo+aplican+si+hubo+empate+en+120+minutos');
  }

  // Si se ingresa un score de penales, ambos campos son obligatorios y no puede ser empate
  if (homePen !== null || awayPen !== null) {
    if (homePen === null || awayPen === null) {
      return redirect('/admin?err=Debes+ingresar+ambos+scores+de+penales');
    }
    if (homePen === awayPen) {
      return redirect('/admin?err=El+score+de+penales+no+puede+ser+empate');
    }
  }

  // Verificar que el partido no esté ya finalizado
  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('is_finished')
    .eq('id', matchId)
    .single();

  if (existing?.is_finished) {
    return redirect('/admin?err=Este+partido+ya+tiene+resultado+cargado');
  }

  // Derivar winner_penalties del score de penales
  let winnerPenalties: string | null = null;
  if (homePen !== null && awayPen !== null) {
    winnerPenalties = homePen > awayPen ? 'home' : 'away';
  }

  const { error: matchError } = await supabaseAdmin
    .from('matches')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      home_pen: homePen,
      away_pen: awayPen,
      winner_penalties: winnerPenalties,
      is_finished: true,
    })
    .eq('id', matchId);

  if (matchError) {
    return redirect(`/admin?err=${encodeURIComponent(matchError.message)}`);
  }

  const { error: calcError } = await supabaseAdmin.rpc('calculate_match_points_safe', {
    p_match_id: matchId,
  });

  if (calcError) {
    return redirect(`/admin?err=Resultado+guardado+pero+error+al+calcular:+${encodeURIComponent(calcError.message)}`);
  }

  return redirect('/admin?msg=Resultado+cargado+y+puntos+calculados+correctamente');
};
