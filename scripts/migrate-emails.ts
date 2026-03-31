/**
 * Migra todos los usuarios con @polla2026.bo → @mundial.com
 * y establece contraseña Navia2026*
 *
 * Uso: pnpm exec tsx scripts/migrate-emails.ts
 */
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://kbhwnpaipthejnpxkyed.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHducGFpcHRoZWpucHhreWVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0OTY5NSwiZXhwIjoyMDg5NzI1Njk1fQ.LrhNFH-4zcMRa_4c4nbfXwyj3QucJ5lM46Ns48UKC1E',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const NEW_DOMAIN  = 'mundial.com';
const NEW_PASSWORD = 'Navia2026*';

async function main() {
  // Listar todos los usuarios (max 1000)
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.error('Error listando usuarios:', error.message); process.exit(1); }

  const targets = users.filter(u => u.email?.endsWith('@polla2026.bo'));
  console.log(`Encontrados ${targets.length} usuario(s) con @polla2026.bo\n`);

  for (const u of targets) {
    const oldEmail = u.email!;
    const newEmail = oldEmail.replace('@polla2026.bo', `@${NEW_DOMAIN}`);

    const { error: err } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
      email:    newEmail,
      password: NEW_PASSWORD,
    });

    if (err) {
      console.error(`  ❌ ${oldEmail} → FALLO: ${err.message}`);
    } else {
      console.log(`  ✅ ${oldEmail} → ${newEmail}`);
    }
  }

  console.log('\nListo.');
}

main();
