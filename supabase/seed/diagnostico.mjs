import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://kbhwnpaipthejnpxkyed.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHducGFpcHRoZWpucHhreWVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0OTY5NSwiZXhwIjoyMDg5NzI1Njk1fQ.LrhNFH-4zcMRa_4c4nbfXwyj3QucJ5lM46Ns48UKC1E',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1. Perfiles
const { data: profiles } = await sb.from('profiles').select('username, puntos_totales, es_referi');
console.log('\n── PERFILES ──');
profiles?.forEach(p => console.log(` ${p.username.padEnd(12)} pts=${p.puntos_totales} referi=${p.es_referi}`));

// 2. Partidos finalizados
const { data: finished } = await sb.from('matches').select('home_team, away_team, home_score, away_score, is_finished').eq('is_finished', true);
console.log(`\n── PARTIDOS FINALIZADOS: ${finished?.length ?? 0} ──`);
finished?.forEach(m => console.log(` ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}`));

// 3. Pronósticos
const { data: preds, error: predErr } = await sb.from('predictions').select('user_id, match_id, user_home, user_away, points_earned');
console.log(`\n── PRONÓSTICOS: ${preds?.length ?? 0} ──`);
if (predErr) console.log(' ERROR:', predErr.message);

// Muestra los primeros 10
preds?.slice(0, 10).forEach(p => console.log(` user=${p.user_id.slice(0,8)} pts=${p.points_earned} pred=${p.user_home}-${p.user_away}`));

// 4. Cuántos tienen points_earned seteado
const conPuntos = preds?.filter(p => p.points_earned !== null).length ?? 0;
const sinPuntos = preds?.filter(p => p.points_earned === null).length ?? 0;
console.log(`\n  Con points_earned: ${conPuntos}`);
console.log(`  Con points_earned NULL: ${sinPuntos}`);
