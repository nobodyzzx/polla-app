import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { betaNow } from '@/lib/betaTime';
import { getAdminUser } from '@/lib/auth-helpers';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const admin = await getAdminUser(cookies, supabase, supabaseAdmin);
  if (!admin) return redirect('/login');

  const now = betaNow();
  const d = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

  // ══════════════════════════════════════════════════════════
  //  Solo eliminatorias — para probar el flujo de penales:
  //
  //  Cuartos  (−48h): 2 terminados con penales, 2 sin penales
  //  Semis    (−24h): 1 con penales terminado, 1 sin penales terminado
  //  3er Puesto (+6h): abierto para pronósticos
  //  Final    (+8h): abierto para pronósticos
  // ══════════════════════════════════════════════════════════

  const rows = [
    // ════ CUARTOS ════════════════════════════════════════════
    // Con penales (empate 1-1, penales 4-2)
    {
      home_team: 'Argentina',  away_team: 'Francia',
      match_date: d(-50), stage: 'knockout', group_name: null, round: 'Cuartos', jornada: 'Cuartos',
      home_score: 1, away_score: 1, home_pen: 4, away_pen: 2, winner_penalties: 'home', is_finished: true,
    },
    // Sin penales (ganó directo 2-1)
    {
      home_team: 'Brasil',     away_team: 'Inglaterra',
      match_date: d(-49), stage: 'knockout', group_name: null, round: 'Cuartos', jornada: 'Cuartos',
      home_score: 2, away_score: 1, home_pen: null, away_pen: null, winner_penalties: null, is_finished: true,
    },
    // Con penales (empate 0-0, penales 3-5)
    {
      home_team: 'Alemania',   away_team: 'España',
      match_date: d(-48), stage: 'knockout', group_name: null, round: 'Cuartos', jornada: 'Cuartos',
      home_score: 0, away_score: 0, home_pen: 3, away_pen: 5, winner_penalties: 'away', is_finished: true,
    },
    // Sin penales (ganó directo 1-0)
    {
      home_team: 'Marruecos',  away_team: 'Portugal',
      match_date: d(-47), stage: 'knockout', group_name: null, round: 'Cuartos', jornada: 'Cuartos',
      home_score: 1, away_score: 0, home_pen: null, away_pen: null, winner_penalties: null, is_finished: true,
    },

    // ════ SEMIFINALES ════════════════════════════════════════
    // Con penales (empate 2-2, penales 6-5)
    {
      home_team: 'Argentina',  away_team: 'Brasil',
      match_date: d(-25), stage: 'knockout', group_name: null, round: 'Semifinal', jornada: 'Semifinal',
      home_score: 2, away_score: 2, home_pen: 6, away_pen: 5, winner_penalties: 'home', is_finished: true,
    },
    // Sin penales (ganó directo 2-0)
    {
      home_team: 'España',     away_team: 'Marruecos',
      match_date: d(-24), stage: 'knockout', group_name: null, round: 'Semifinal', jornada: 'Semifinal',
      home_score: 2, away_score: 0, home_pen: null, away_pen: null, winner_penalties: null, is_finished: true,
    },

    // ════ TERCER PUESTO — abierto para pronósticos ═══════════
    {
      home_team: 'Brasil',     away_team: 'Marruecos',
      match_date: d(6), stage: 'knockout', group_name: null, round: 'Tercer Puesto', jornada: 'Tercer Puesto',
      home_score: null, away_score: null, home_pen: null, away_pen: null, winner_penalties: null, is_finished: false,
    },

    // ════ FINAL — abierto para pronósticos ═══════════════════
    {
      home_team: 'Argentina',  away_team: 'España',
      match_date: d(8), stage: 'knockout', group_name: null, round: 'Final', jornada: 'Final',
      home_score: null, away_score: null, home_pen: null, away_pen: null, winner_penalties: null, is_finished: false,
    },
  ];

  const { error } = await supabaseAdmin.from('matches').insert(rows);
  if (error) return redirect(`/admin?err=${encodeURIComponent('Error: ' + error.message)}`);

  return redirect(`/admin?msg=${encodeURIComponent('Fixture knockout · Cuartos+Semis terminados (con/sin penales) · 3er Puesto+Final abiertos')}`);
};
