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
  const pago70 = form.get('pago70')?.toString() === 'true';
  const pago50 = form.get('pago50')?.toString() === 'true';

  if (!userId) return redirect('/admin?err=Usuario+no+encontrado');

  // Validación progresiva: no se puede cobrar 50 Bs sin haber cobrado 70 Bs
  if (pago50 && !pago70) {
    return redirect('/admin?err=No+puedes+registrar+el+pago+de+50Bs+sin+el+de+70Bs');
  }

  await supabaseAdmin
    .from('profiles')
    .update({ pago_70: pago70, pago_50: pago50 })
    .eq('id', userId);

  return redirect('/admin?msg=Estado+de+pago+actualizado');
};
