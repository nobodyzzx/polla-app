/**
 * GET /api/cron/wa-ping?secret=CRON_SECRET[&msg=texto]
 *
 * Prueba de extremo a extremo del gateway de WhatsApp: manda un mensaje al grupo
 * por el proveedor activo (WA_PROVIDER: green | waha) y devuelve el resultado real
 * (ok/detail). Útil para validar un cutover de proveedor o diagnosticar la entrega.
 * NO es idempotente ni programado; se invoca a mano.
 */
import type { APIRoute } from 'astro';
import { checkCronSecret, json } from '@/lib/cron';
import { sendWhatsApp } from '@/lib/whatsapp';

export const GET: APIRoute = async ({ request, url }) => {
  if (!(await checkCronSecret(url, request))) return json({ error: 'Unauthorized' }, 401);

  const msg = url.searchParams.get('msg')
    ?? '🧪 Ping del bot (prueba de conexión del gateway). Ignorar.';

  const res = await sendWhatsApp(msg, 'wa-ping');
  return json({
    ok: res.ok,
    configured: res.configured,
    provider: import.meta.env.WA_PROVIDER ?? 'green',
    detail: res.detail.slice(0, 300),
  });
};
