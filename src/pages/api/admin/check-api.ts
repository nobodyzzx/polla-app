import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const GET: APIRoute = async ({ cookies }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) {
    return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
  }

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('es_referi').eq('id', user.id).single();
  if (!profile?.es_referi) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403 });
  }

  const key = import.meta.env.FOOTBALL_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: 'FOOTBALL_API_KEY no configurada' }), { status: 500 });
  }

  const res = await fetch('https://api.football-data.org/v4/competitions', {
    headers: { 'X-Auth-Token': key },
  });
  const data = await res.json();

  if (!res.ok) {
    return new Response(JSON.stringify({ error: `API ${res.status}`, detail: data }), { status: 200 });
  }

  const competitions = (data.competitions ?? []).map((c: any) => ({
    code: c.code,
    name: c.name,
    area: c.area?.name,
    plan: c.plan,
  }));

  return new Response(JSON.stringify({ competitions, count: competitions.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
