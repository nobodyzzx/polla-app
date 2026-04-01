import type { APIRoute } from 'astro';
import { supabase } from '@/lib/supabase';

export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const email = form.get('email')?.toString()?.trim().toLowerCase();

  if (!email) return redirect('/olvidaste?error=El+correo+es+obligatorio');

  const origin = new URL(request.url).origin;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/callback?next=/nueva-contrasena`,
  });

  // Siempre mostrar el mismo mensaje (no revelar si el correo existe)
  if (error) {
    return redirect('/olvidaste?error=' + encodeURIComponent('Error al enviar el correo. Intentá de nuevo.'));
  }

  return redirect('/olvidaste?message=' + encodeURIComponent('¡Revisá tu correo! Te enviamos el link para restablecer tu contraseña.'));
};
