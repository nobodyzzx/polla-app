import { createClient } from '@supabase/supabase-js';
const sb = createClient('https://kbhwnpaipthejnpxkyed.supabase.co','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHducGFpcHRoZWpucHhreWVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE0OTY5NSwiZXhwIjoyMDg5NzI1Njk1fQ.LrhNFH-4zcMRa_4c4nbfXwyj3QucJ5lM46Ns48UKC1E');
const { data } = await sb.from('matches').select('id,home_team,away_team').eq('is_finished',true);
for (const m of data ?? []) {
  const { error } = await sb.rpc('calculate_match_points_safe', { p_match_id: m.id });
  console.log(m.home_team, 'vs', m.away_team, '-', error?.message ?? 'ok');
}
