import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { getAdminUser } from '@/lib/auth-helpers';

export const GET: APIRoute = async ({ cookies }) => {
  const admin = await getAdminUser(cookies, supabase, supabaseAdmin);
  if (!admin) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });

  const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260701');
  const data = await res.json();

  const events = (data.events ?? []).map((e: any) => ({
    id: e.id,
    date: e.date,
    name: e.name,
    status: e.competitions?.[0]?.status?.type?.description,
  }));

  return new Response(JSON.stringify({ provider: 'espn', events, count: events.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
