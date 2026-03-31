import { createClient } from '@supabase/supabase-js';

// Cliente público (usa anon key — respeta RLS)
export const supabase = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'implicit',
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

// Cliente admin (usa service role — bypasa RLS, solo para SSR/API routes)
export const supabaseAdmin = createClient(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

// Tipos de la DB
export type Profile = {
  id: string;
  username: string;
  pago_70: boolean;
  pago_50: boolean;
  es_referi: boolean;
  expulsado: boolean;
  puntos_totales: number;
  created_at: string;
};

export type Match = {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  stage: 'group' | 'knockout';
  group_name: string | null;
  round: string | null;
  jornada: string | null;
  home_score: number | null;
  away_score: number | null;
  home_pen: number | null;
  away_pen: number | null;
  winner_penalties: 'home' | 'away' | null;
  is_finished: boolean;
};

export type Prediction = {
  id: string;
  user_id: string;
  match_id: string;
  user_home: number;
  user_away: number;
  user_home_pen: number | null;
  user_away_pen: number | null;
  user_winner_penalties: 'home' | 'away' | null;
  points_earned: number | null;
  created_at: string;
};

export type Sanction = {
  id: string;
  user_id: string;
  match_id: string | null;
  type: 'yellow' | 'red' | 'double_red';
  reason: string | null;
  active: boolean;
  created_by: string;
  created_at: string;
};
