import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth-helpers';
import { logEvent } from '@/lib/system-log';
import { sendWhatsApp } from '@/lib/whatsapp';
import { spanishName } from '@/lib/isoFlags';

export const POST: APIRoute = async ({ request, cookies }) => {
  const admin = await getAdminUser(cookies, supabase, supabaseAdmin);
  if (!admin) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const body = await request.json();
  const { match_id, player_names } = body;
  if (!match_id || !Array.isArray(player_names) || !player_names.length) {
    return new Response(JSON.stringify({ error: 'Faltan datos' }), { status: 400 });
  }

  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('home_team, away_team, match_date')
    .eq('id', match_id)
    .single();

  if (!match) return new Response(JSON.stringify({ error: 'Partido no encontrado' }), { status: 404 });

  const names = player_names.slice(0, 30);
  const lista = names.map(n => `• ${n}`).join('\n');
  const hora = new Date(match.match_date).toLocaleTimeString('es-BO', {
    timeZone: 'America/La_Paz', hour: '2-digit', minute: '2-digit', hour12: false,
  });
  const fecha = new Date(match.match_date).toLocaleDateString('es-BO', {
    timeZone: 'America/La_Paz', day: 'numeric', month: 'long',
  });

  const message = [
    `⏰ *RECORDATORIO · ${spanishName(match.home_team)} vs ${spanishName(match.away_team)}*`,
    '',
    `${fecha} — ${hora} Bolivia`,
    '',
    'Aún no registraron su pronóstico:',
    lista,
    '',
    '⏳ El plazo cierra 2 horas antes del partido.',
    '👉 mundial.tecnocondor.dev',
    '',
    '_Mensaje automático del réferi_',
  ].join('\n');

  const res = await sendWhatsApp(message, 'reminder');
  if (!res.configured) {
    return new Response(JSON.stringify({ error: 'WhatsApp no configurado' }), { status: 500 });
  }

  await logEvent({
    category: 'whatsapp',
    event: 'reminder',
    actor: admin.username,
    summary: `${admin.username} recordó a ${names.length} jugadores para ${spanishName(match.home_team)} vs ${spanishName(match.away_team)}`,
  });

  return new Response(JSON.stringify({ ok: true, sent: true }), { status: 200 });
};
