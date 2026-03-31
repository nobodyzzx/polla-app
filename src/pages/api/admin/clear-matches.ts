import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return redirect('/login');

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('es_referi').eq('id', user.id).single();
  if (!profile?.es_referi) return redirect('/dashboard');

  // Borrar predicciones primero (FK), luego partidos
  const { error: predError } = await supabaseAdmin
    .from('predictions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // condición siempre true

  if (predError) {
    return redirect(`/admin?err=${encodeURIComponent('Error borrando predicciones: ' + predError.message)}`);
  }

  const { error: matchError } = await supabaseAdmin
    .from('matches')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (matchError) {
    return redirect(`/admin?err=${encodeURIComponent('Error borrando partidos: ' + matchError.message)}`);
  }

  // Borrar sanciones
  const { error: sanctionError } = await supabaseAdmin
    .from('sanctions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (sanctionError) {
    return redirect(`/admin?err=${encodeURIComponent('Error borrando sanciones: ' + sanctionError.message)}`);
  }

  // Resetear puntos, expulsado y pagos de todos los jugadores
  const { error: ptsError } = await supabaseAdmin
    .from('profiles')
    .update({ puntos_totales: 0, expulsado: false, pago_70: false, pago_50: false })
    .eq('es_referi', false);

  if (ptsError) {
    return redirect(`/admin?err=${encodeURIComponent('Datos borrados pero error reseteando perfiles: ' + ptsError.message)}`);
  }

  return redirect(`/admin?msg=${encodeURIComponent('Competición limpiada: partidos, pronósticos, sanciones y perfiles reseteados')}`);
};
