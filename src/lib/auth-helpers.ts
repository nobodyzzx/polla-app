import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Crea el perfil de un usuario si no existe.
 * Centraliza la lógica de primer login (antes estaba duplicada en login.ts y callback.ts).
 */
export async function ensureProfile(
  user: { id: string; email?: string },
  supabase: SupabaseClient,
  adminEmail: string | undefined,
): Promise<void> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existing) return;

  const isAdmin = !!adminEmail && user.email?.toLowerCase().trim() === adminEmail.toLowerCase().trim();
  const username = user.email?.split('@')[0] ?? `user_${Date.now()}`;

  await supabase.from('profiles').insert({
    id: user.id,
    username,
    es_referi: isAdmin,
    participa: !isAdmin,
    puntos_totales: 0,
    expulsado: false,
    pago_70: false,
    pago_50: false,
  });
}
