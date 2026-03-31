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
  const sanctionId = form.get('sanctionId')?.toString();
  if (!sanctionId) return redirect(`/admin?err=${encodeURIComponent('Sanción no encontrada')}`);

  // Obtener la sanción antes de desactivarla
  const { data: sanction } = await supabaseAdmin
    .from('sanctions')
    .select('id, user_id, type, active')
    .eq('id', sanctionId)
    .single();

  if (!sanction || !sanction.active) {
    return redirect(`/admin?err=${encodeURIComponent('Sanción no encontrada o ya inactiva')}`);
  }

  // Desactivar la sanción
  await supabaseAdmin
    .from('sanctions')
    .update({ active: false })
    .eq('id', sanctionId);

  // Si era doble roja, restaurar expulsado = false
  if (sanction.type === 'double_red') {
    await supabaseAdmin
      .from('profiles')
      .update({ expulsado: false })
      .eq('id', sanction.user_id);
  }

  // Si era roja o doble roja, recalcular puntos de las predicciones zeroed
  // (puntos mínimos reales = 1, así que points_earned = 0 siempre indica sanción)
  if (sanction.type === 'red' || sanction.type === 'double_red') {
    const { data: zeroedPredictions } = await supabaseAdmin
      .from('predictions')
      .select('match_id')
      .eq('user_id', sanction.user_id)
      .eq('points_earned', 0);

    const matchIds = [...new Set((zeroedPredictions ?? []).map(p => p.match_id))];

    for (const matchId of matchIds) {
      await supabaseAdmin.rpc('calculate_match_points_safe', { p_match_id: matchId });
    }

    // Recalcular puntos totales del jugador
    const { data: allPoints } = await supabaseAdmin
      .from('predictions')
      .select('points_earned')
      .eq('user_id', sanction.user_id)
      .not('points_earned', 'is', null);

    const total = allPoints?.reduce((sum, p) => sum + (p.points_earned ?? 0), 0) ?? 0;
    await supabaseAdmin
      .from('profiles')
      .update({ puntos_totales: total })
      .eq('id', sanction.user_id);
  }

  const typeLabel = sanction.type === 'yellow'
    ? 'Amarilla'
    : sanction.type === 'red'
    ? 'Roja'
    : 'Doble Roja (expulsión revertida)';

  return redirect(`/admin?msg=${encodeURIComponent('Sanción revertida: ' + typeLabel)}`);
};
