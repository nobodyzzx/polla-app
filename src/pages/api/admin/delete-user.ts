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
  const targetId = form.get('user_id')?.toString();
  if (!targetId) return redirect('/admin/usuarios?err=ID+requerido');

  // No permitir borrarse a sí mismo
  if (targetId === user.id) return redirect('/admin/usuarios?err=No+puedes+borrarte+a+ti+mismo');

  // Borrar perfil primero (por si acaso FK no tiene CASCADE)
  await supabaseAdmin.from('predictions').delete().eq('user_id', targetId);
  await supabaseAdmin.from('sanctions').delete().eq('user_id', targetId);
  await supabaseAdmin.from('profiles').delete().eq('id', targetId);

  // Borrar de Auth
  const { error } = await supabaseAdmin.auth.admin.deleteUser(targetId);
  if (error) return redirect(`/admin/usuarios?err=${encodeURIComponent('Error auth: ' + error.message)}`);

  return redirect('/admin/usuarios?msg=Usuario+eliminado');
};
