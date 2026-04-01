import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  const next = url.searchParams.get('next') ?? '/dashboard';

  // Flujo con token_hash (magic link moderno de Supabase)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'email' | 'magiclink' | 'recovery',
    });

    if (error || !data.session) {
      return redirect(`/login?error=${encodeURIComponent(error?.message ?? 'Link inválido')}`);
    }

    // Recovery → página de nueva contraseña
    const dest = type === 'recovery' ? '/nueva-contrasena' : next;
    return setSessionAndRedirect(data.session, data.user, cookies, redirect, supabase, dest);
  }

  // Flujo con code (PKCE)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session) {
      return redirect(`/login?error=${encodeURIComponent(error?.message ?? 'Link inválido')}`);
    }

    return setSessionAndRedirect(data.session, data.user, cookies, redirect, supabase, next);
  }

  return redirect(`/login?error=${encodeURIComponent('Link inválido o expirado')}`);
};

async function setSessionAndRedirect(
  session: any,
  user: any,
  cookies: any,
  redirect: any,
  supabase: any,
  dest: string = '/dashboard'
) {
  const maxAge = 60 * 60 * 24 * 7; // 7 días

  cookies.set('sb-access-token', session.access_token, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });
  cookies.set('sb-refresh-token', session.refresh_token, {
    path: '/',
    maxAge,
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
  });

  // Crear perfil si es primer login
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    const adminEmail = import.meta.env.ADMIN_EMAIL?.toLowerCase().trim();
    const isAdmin = !!adminEmail && user.email?.toLowerCase().trim() === adminEmail;
    const username = user.email?.split('@')[0] ?? `user_${Date.now()}`;
    await supabase.from('profiles').insert({
      id: user.id,
      username,
      es_referi: isAdmin,
    });
  }

  return redirect(dest);
}
