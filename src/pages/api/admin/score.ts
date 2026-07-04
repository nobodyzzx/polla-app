import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { sanitizeError, getAdminUser } from '@/lib/auth-helpers';
import { logEvent } from '@/lib/system-log';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const admin = await getAdminUser(cookies, supabase, supabaseAdmin);
  if (!admin) return redirect('/login');

  const ct = request.headers.get('content-type') ?? '';
  let matchId: string | undefined;
  let homeScore: number, awayScore: number;
  let homePen: number | null = null, awayPen: number | null = null;

  if (ct.includes('application/json')) {
    const body = await request.json();
    matchId   = body.matchId;
    homeScore = parseInt(body.homeScore ?? '');
    awayScore = parseInt(body.awayScore ?? '');
    const penHs = body.homePen?.toString() ?? '';
    const penAs = body.awayPen?.toString() ?? '';
    homePen = penHs !== '' ? parseInt(penHs) : null;
    awayPen = penAs !== '' ? parseInt(penAs) : null;
  } else {
    const form = await request.formData();
    matchId   = form.get('matchId')?.toString();
    homeScore = parseInt(form.get('homeScore')?.toString() ?? '');
    awayScore = parseInt(form.get('awayScore')?.toString() ?? '');
    const penHomeStr = form.get('homePen')?.toString() ?? '';
    const penAwayStr = form.get('awayPen')?.toString() ?? '';
    homePen = penHomeStr !== '' ? parseInt(penHomeStr) : null;
    awayPen = penAwayStr !== '' ? parseInt(penAwayStr) : null;
  }

  const isJson = ct.includes('application/json');
  const errJson = (msg: string) => new Response(JSON.stringify({ error: msg }), { status: 400 });

  if (!matchId || isNaN(homeScore) || isNaN(awayScore)) {
    return isJson ? errJson('Datos incompletos') : redirect('/admin?err=Datos+incompletos');
  }

  if (homeScore < 0 || awayScore < 0) {
    return isJson ? errJson('Marcador no puede ser negativo') : redirect('/admin?err=El+marcador+no+puede+ser+negativo');
  }
  if (homeScore > 25 || awayScore > 25) {
    return isJson ? errJson('Marcador inválido (máximo 25)') : redirect('/admin?err=Marcador+inválido+(máximo+25+goles)');
  }

  if ((homePen !== null || awayPen !== null) && homeScore !== awayScore) {
    return isJson ? errJson('Penales solo si hubo empate') : redirect('/admin?err=Los+penales+solo+aplican+si+hubo+empate+en+120+minutos');
  }

  if (homePen !== null || awayPen !== null) {
    if (homePen === null || awayPen === null) {
      return isJson ? errJson('Ambos scores de penales requeridos') : redirect('/admin?err=Debes+ingresar+ambos+scores+de+penales');
    }
    if (homePen === awayPen) {
      return isJson ? errJson('Penales no pueden empatar') : redirect('/admin?err=El+score+de+penales+no+puede+ser+empate');
    }
  }

  const { data: existing } = await supabaseAdmin
    .from('matches')
    .select('is_finished, home_team, away_team')
    .eq('id', matchId)
    .single();

  if (existing?.is_finished) {
    return isJson ? errJson('Partido ya tiene resultado') : redirect('/admin?err=Este+partido+ya+tiene+resultado+cargado');
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
    const msg = encodeURIComponent(sanitizeError(matchError));
    return isJson ? errJson(sanitizeError(matchError)) : redirect('/admin?err=' + msg);
  }

  const { error: calcError } = await supabaseAdmin.rpc('calculate_match_points_safe', {
    p_match_id: matchId,
  });

  if (calcError) {
    return isJson ? errJson('Puntos no calculados') : redirect('/admin?err=Resultado+guardado+pero+error+al+calcular+puntos');
  }

  const penTxt = winnerPenalties ? ` (pen ${homePen}-${awayPen})` : '';
  await logEvent({
    category: 'marcador',
    event: 'manual',
    actor: admin.username,
    summary: `${existing?.home_team ?? '?'} ${homeScore}-${awayScore} ${existing?.away_team ?? '?'}${penTxt} · carga manual`,
  });

  if (isJson) {
    return new Response(JSON.stringify({ ok: true, homeScore, awayScore }), { status: 200 });
  }
  return redirect('/admin?msg=Resultado+cargado+y+puntos+calculados+correctamente');
};
