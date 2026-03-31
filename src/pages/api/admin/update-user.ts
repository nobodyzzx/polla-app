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
  const username  = form.get('username')?.toString()?.trim();
  const email     = form.get('email')?.toString()?.trim().toLowerCase();
  const password  = form.get('password')?.toString()?.trim();
  const esReferi  = form.get('es_referi') === 'on';
  const participa = form.get('participa') === 'on';

  if (!targetId || !username || !email) {
    return redirect('/admin/usuarios?err=Datos+incompletos');
  }

  // Actualizar Auth (email + password opcional)
  const authUpdate: any = { email };
  if (password) authUpdate.password = password;

  const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(targetId, authUpdate);
  if (authErr) return redirect(`/admin/usuarios?err=${encodeURIComponent('Error auth: ' + authErr.message)}`);

  // No permitir quitarse el rol de réferi a uno mismo
  const finalEsReferi = targetId === user.id ? true : esReferi;

  // Actualizar perfil
  // Solo el réferi editándose a sí mismo puede cambiar 'participa'
  // Para jugadores normales siempre es true
  const finalParticipa = finalEsReferi ? participa : true;

  const { error: profileErr } = await supabaseAdmin
    .from('profiles')
    .update({ username, es_referi: finalEsReferi, participa: finalParticipa })
    .eq('id', targetId);

  if (profileErr) return redirect(`/admin/usuarios?err=${encodeURIComponent('Error perfil: ' + profileErr.message)}`);

  return redirect(`/admin/usuarios?msg=${encodeURIComponent(`"${username}" actualizado`)}`);
};
