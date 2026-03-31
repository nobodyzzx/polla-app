import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return redirect('/login');

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('es_referi')
    .eq('id', user.id)
    .single();

  if (!profile?.es_referi) return redirect('/dashboard');

  const form = await request.formData();
  const userId = form.get('userId')?.toString();
  const field  = form.get('field')?.toString();   // 'pago70' | 'pago50'
  const value  = form.get('value')?.toString() === 'true';

  if (!userId || !field) return redirect('/admin?err=Datos+incompletos');

  if (field === 'pago70') {
    // Al desactivar 70, también desactivar 50
    await supabaseAdmin
      .from('profiles')
      .update({ pago_70: value, ...(value === false ? { pago_50: false } : {}) })
      .eq('id', userId);
  } else if (field === 'pago50') {
    // Verificar que pago_70 esté activo antes de activar pago_50
    if (value) {
      const { data: target } = await supabaseAdmin
        .from('profiles').select('pago_70').eq('id', userId).single();
      if (!target?.pago_70) return redirect('/admin?err=Debe+confirmar+el+pago+de+70+Bs+primero');
    }
    await supabaseAdmin
      .from('profiles')
      .update({ pago_50: value })
      .eq('id', userId);
  } else {
    return redirect('/admin?err=Campo+no+válido');
  }

  return redirect('/admin?msg=Pago+actualizado');
};
