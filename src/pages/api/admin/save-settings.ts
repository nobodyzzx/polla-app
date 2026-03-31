import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return redirect('/login');

  const { data: { user } } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
  if (!user) return redirect('/login');

  const { data: profile } = await supabaseAdmin.from('profiles').select('es_referi').eq('id', user.id).single();
  if (!profile?.es_referi) return redirect('/dashboard');

  const form = await request.formData();
  const deadline70 = form.get('pagos_deadline_70')?.toString().trim() ?? '';
  const deadline50 = form.get('pagos_deadline_50')?.toString().trim() ?? '';

  const rows = [
    { key: 'pagos_deadline_70', value: deadline70 || null, updated_at: new Date().toISOString() },
    { key: 'pagos_deadline_50', value: deadline50 || null, updated_at: new Date().toISOString() },
  ];

  const { error } = await supabaseAdmin.from('settings').upsert(rows);
  if (error) return redirect(`/admin?err=${encodeURIComponent('Error guardando configuración: ' + error.message)}`);

  return redirect('/admin?msg=Configuraci%C3%B3n+guardada');
};
