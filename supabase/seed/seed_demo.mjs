/**
 * seed_demo.mjs — Crea usuarios de prueba con pronósticos
 * Uso: node supabase/seed/seed_demo.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kbhwnpaipthejnpxkyed.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHducGFpcHRoZWpucHhreWVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0OTY5NSwiZXhwIjoyMDg5NzI1Njk1fQ.LrhNFH-4zcMRa_4c4nbfXwyj3QucJ5lM46Ns48UKC1E';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Usuarios de prueba ──────────────────────────────────────
const USERS = [
  { email: 'carlos@polla.test',   username: 'Carlos',   pago_70: true,  pago_50: true  },
  { email: 'maria@polla.test',    username: 'María',    pago_70: true,  pago_50: true  },
  { email: 'pedro@polla.test',    username: 'Pedro',    pago_70: true,  pago_50: false },
  { email: 'lucia@polla.test',    username: 'Lucía',    pago_70: true,  pago_50: false },
  { email: 'jorge@polla.test',    username: 'Jorge',    pago_70: false, pago_50: false },
  { email: 'ana@polla.test',      username: 'Ana',      pago_70: true,  pago_50: true  },
  { email: 'roberto@polla.test',  username: 'Roberto',  pago_70: true,  pago_50: true  },
  { email: 'claudia@polla.test',  username: 'Claudia',  pago_70: false, pago_50: false },
];

const PASSWORD = 'Polla2026!';

function rnd(n) { return Math.floor(Math.random() * (n + 1)); }

// Genera un marcador aleatorio realista (tendencia a resultados bajos)
function marcador() {
  const scores = [
    [0,0],[1,0],[0,1],[1,1],[2,0],[0,2],[2,1],[1,2],[2,2],[3,0],[0,3],[3,1],[1,3],[3,2],[2,3]
  ];
  return scores[Math.floor(Math.random() * scores.length)];
}

async function main() {
  console.log('🔄 Obteniendo partidos de grupo...');

  const { data: matches, error: matchErr } = await supabase
    .from('matches')
    .select('id, home_team, away_team, match_date, stage')
    .eq('stage', 'group')
    .order('match_date', { ascending: true });

  if (matchErr || !matches?.length) {
    console.error('❌ No se pudieron obtener partidos:', matchErr?.message);
    process.exit(1);
  }

  console.log(`✅ ${matches.length} partidos encontrados`);

  const createdUsers = [];

  for (const u of USERS) {
    process.stdout.write(`👤 Creando ${u.username}... `);

    // Crear usuario en Auth (si ya existe lo saltamos)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
    });

    if (authErr) {
      if (authErr.message.includes('already been registered')) {
        // Buscar el usuario existente
        const { data: list } = await supabase.auth.admin.listUsers();
        const existing = list?.users?.find(x => x.email === u.email);
        if (existing) {
          createdUsers.push({ ...u, id: existing.id });
          console.log('ya existía, usando id existente');
          continue;
        }
      }
      console.log(`❌ ${authErr.message}`);
      continue;
    }

    const userId = authData.user.id;

    // Crear perfil (service role bypasea RLS)
    const { error: profErr } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        username: u.username,
        pago_70: u.pago_70,
        pago_50: u.pago_50,
        es_referi: false,
        puntos_totales: 0,
      }, { onConflict: 'id' });

    if (profErr) {
      console.log(`❌ perfil: ${profErr.message}`);
      continue;
    }

    createdUsers.push({ ...u, id: userId });
    console.log(`✅ ${userId.slice(0, 8)}...`);
  }

  console.log(`\n🔄 Insertando pronósticos para ${createdUsers.length} usuarios...`);

  let totalPreds = 0;
  let errors = 0;

  for (const u of createdUsers) {
    const predictions = [];

    for (const m of matches) {
      // Cada usuario pronostica el 85% de los partidos (simula alguno que olvida)
      if (Math.random() > 0.85) continue;

      const [home, away] = marcador();
      predictions.push({
        user_id: u.id,
        match_id: m.id,
        user_home: home,
        user_away: away,
        user_winner_penalties: null,
        points_earned: null,
      });
    }

    // Insertar en lotes usando service role (bypasea RLS y restricción 2h)
    const { error } = await supabase
      .from('predictions')
      .upsert(predictions, { onConflict: 'user_id,match_id', ignoreDuplicates: true });

    if (error) {
      console.log(`  ❌ ${u.username}: ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅ ${u.username}: ${predictions.length} pronósticos`);
      totalPreds += predictions.length;
    }
  }

  // ── Simular algunos partidos ya finalizados ──────────────
  console.log('\n🔄 Finalizando los primeros 12 partidos (Grupos A y B)...');

  const { data: gruposAB } = await supabase
    .from('matches')
    .select('id, home_team, away_team, group_name')
    .eq('stage', 'group')
    .in('group_name', ['A', 'B'])
    .order('match_date', { ascending: true })
    .limit(12);

  for (const m of (gruposAB ?? [])) {
    const hs = rnd(3);
    const as_ = rnd(3);

    const { error } = await supabase
      .from('matches')
      .update({ home_score: hs, away_score: as_, is_finished: true })
      .eq('id', m.id);

    if (!error) {
      // Calcular puntos
      await supabase.rpc('calculate_match_points_safe', { p_match_id: m.id });
      console.log(`  ✅ ${m.home_team} ${hs}–${as_} ${m.away_team}`);
    }
  }

  console.log(`
════════════════════════════════════
✅ Seed completado
   Usuarios creados: ${createdUsers.length}
   Pronósticos:      ${totalPreds}
   Errores:          ${errors}

   Credenciales de prueba:
   Email:    [nombre]@polla.test
   Password: ${PASSWORD}
════════════════════════════════════`);
}

main().catch(console.error);
