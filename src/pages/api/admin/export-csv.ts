import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin, fetchAllRows } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth-helpers';
import { spanishName } from '@/lib/isoFlags';
import { fmtFecha } from '@/lib/fechas';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = await getAdminUser(cookies, supabase, supabaseAdmin);
  if (!admin) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const [{ data: matches }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from('matches').select('id, home_team, away_team, home_score, away_score, stage, match_date, is_finished').order('match_date'),
    supabaseAdmin.from('profiles').select('id, username').eq('participa', true).eq('expulsado', false),
  ]);

  const allMatches = matches ?? [];
  const players = profiles ?? [];
  const matchIds = allMatches.map(m => m.id);

  const preds = matchIds.length
    ? await fetchAllRows<any>((from, to) =>
        supabaseAdmin.from('predictions')
          .select('user_id, match_id, user_home, user_away, user_home_pen, user_away_pen, points_earned')
          .in('match_id', matchIds)
          .range(from, to))
    : [];

  const predMap: Record<string, Record<string, any>> = {};
  for (const p of preds) {
    if (!predMap[p.match_id]) predMap[p.match_id] = {};
    predMap[p.match_id][p.user_id] = p;
  }

  const enc = (s: string) => `"${s.replace(/"/g, '""')}"`;

  let csv = 'Jugador,Partido,Local,Visitante,Marcador Local,Marcador Visitante,Pen Local,Pen Visitante,Puntos,Estado\n';

  for (const pl of players) {
    for (const m of allMatches) {
      const pred = predMap[m.id]?.[pl.id];
      const local = spanishName(m.home_team);
      const visit = spanishName(m.away_team);
      const fecha = fmtFecha(m.match_date, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
      const partido = enc(`${local} vs ${visit} (${fecha})`);
      const hl = pred?.user_home ?? '';
      const al = pred?.user_away ?? '';
      const hp = pred?.user_home_pen ?? '';
      const ap = pred?.user_away_pen ?? '';
      const pts = pred?.points_earned ?? '';
      const estado = m.is_finished ? 'Terminado' : (pred ? 'Pronosticado' : 'Pendiente');
      csv += `${enc(pl.username)},${partido},${enc(local)},${enc(visit)},${hl},${al},${hp},${ap},${pts},${estado}\n`;
    }
  }

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pronosticos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
};
