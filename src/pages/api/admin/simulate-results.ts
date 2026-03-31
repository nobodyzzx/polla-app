import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { betaNowMs } from '@/lib/betaTime';

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randScore(r: () => number): number {
  const v = r();
  if (v < 0.30) return 0;
  if (v < 0.60) return 1;
  if (v < 0.85) return 2;
  if (v < 0.95) return 3;
  return 4;
}

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return redirect('/login');

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('es_referi').eq('id', user.id).single();
  if (!profile?.es_referi) return redirect('/dashboard');

  const now = betaNowMs();

  // Partidos sin resultado cuya fecha ya pasó
  const { data: pending } = await supabaseAdmin
    .from('matches')
    .select('id, stage, match_date, home_team, away_team')
    .eq('is_finished', false)
    .lt('match_date', new Date(now).toISOString())
    .order('match_date', { ascending: true });

  if (!pending?.length) {
    return redirect(`/admin?msg=${encodeURIComponent('No hay partidos pendientes de resultado')}`);
  }

  let count = 0;
  for (const m of pending) {
    const rng = makeRng(m.id.charCodeAt(0) * 31 + m.id.charCodeAt(4));
    const hs = randScore(rng);
    const as_ = randScore(rng);

    let homePen: number | null = null;
    let awayPen: number | null = null;
    let winnerPenalties: string | null = null;

    if (m.stage === 'knockout' && hs === as_) {
      homePen = 3 + Math.floor(rng() * 5);
      awayPen = 3 + Math.floor(rng() * 5);
      if (homePen === awayPen) awayPen++;
      winnerPenalties = homePen > awayPen ? 'home' : 'away';
    }

    const { error: upErr } = await supabaseAdmin
      .from('matches')
      .update({ home_score: hs, away_score: as_, home_pen: homePen, away_pen: awayPen, winner_penalties: winnerPenalties, is_finished: true })
      .eq('id', m.id);

    if (upErr) continue;

    await supabaseAdmin.rpc('calculate_match_points_safe', { p_match_id: m.id });
    count++;
  }

  return redirect(`/admin?msg=${encodeURIComponent(`${count} resultado${count !== 1 ? 's' : ''} simulado${count !== 1 ? 's' : ''} y puntos calculados`)}`);
};
