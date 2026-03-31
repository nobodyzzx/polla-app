import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const accessToken = cookies.get('sb-access-token')?.value;
  const refreshToken = cookies.get('sb-refresh-token')?.value;
  if (!accessToken || !refreshToken) return redirect('/login');

  const { data: { user } } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (!user) return redirect('/login');

  const { data: profile } = await supabaseAdmin
    .from('profiles').select('es_referi').eq('id', user.id).single();
  if (!profile?.es_referi) return redirect('/dashboard');

  const now = new Date();
  const d = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

  // ══════════════════════════════════════════════════════════
  //  DISEÑO TEMPORAL — para ver TODAS las vistas de la app:
  //
  //  J1 (−72h): terminada, todos los jugadores pronosticaron
  //  J2 (−48h): terminada, algunos no pronosticaron
  //  J3 (−1.5h): RECIÉN terminada (ventana sanción activa)
  //  J4 (+4h):  ABIERTA para pronósticos (>2h de distancia)
  //  R16 (+1h): CERRADA pero NO terminada (<2h, bloqueo activo)
  //  Cuartos/Semi/Final: futuro lejano
  //
  //  Esto genera en pronósticos:
  //    ✅ Jornada con todos los partidos pronosticados (verde)
  //    ❌ Jornada cerrada con partidos sin pronosticar (rojo)
  //    📝 Jornada abierta con form editable
  //    🔒 Jornada cerrada pre-partido (bloqueada)
  //  Y en el panel admin:
  //    📊 Partidos pendientes de resultado (R16 recién cerrado)
  //    📋 Resumen de jornada activa (J3 recién jugada)
  // ══════════════════════════════════════════════════════════

  const rows = [
    // ════ GRUPO A ═══════════════════════════════════════════
    { home_team:'Argentina',      away_team:'Bolivia',        match_date:d(-72),   stage:'group',   group_name:'A', round:null,         jornada:'Jornada 1', home_score:3,    away_score:0,    is_finished:true  },
    { home_team:'Mexico',         away_team:'Polonia',        match_date:d(-71.5), stage:'group',   group_name:'A', round:null,         jornada:'Jornada 1', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Argentina',      away_team:'Mexico',         match_date:d(-48),   stage:'group',   group_name:'A', round:null,         jornada:'Jornada 2', home_score:2,    away_score:1,    is_finished:true  },
    { home_team:'Bolivia',        away_team:'Polonia',        match_date:d(-47.5), stage:'group',   group_name:'A', round:null,         jornada:'Jornada 2', home_score:0,    away_score:2,    is_finished:true  },
    { home_team:'Argentina',      away_team:'Polonia',        match_date:d(-1.5),  stage:'group',   group_name:'A', round:null,         jornada:'Jornada 3', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Bolivia',        away_team:'Mexico',         match_date:d(-1.3),  stage:'group',   group_name:'A', round:null,         jornada:'Jornada 3', home_score:0,    away_score:3,    is_finished:true  },

    // ════ GRUPO B ═══════════════════════════════════════════
    { home_team:'Brasil',         away_team:'Peru',           match_date:d(-71),   stage:'group',   group_name:'B', round:null,         jornada:'Jornada 1', home_score:2,    away_score:0,    is_finished:true  },
    { home_team:'Colombia',       away_team:'Uruguay',        match_date:d(-70.5), stage:'group',   group_name:'B', round:null,         jornada:'Jornada 1', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Brasil',         away_team:'Colombia',       match_date:d(-47),   stage:'group',   group_name:'B', round:null,         jornada:'Jornada 2', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Uruguay',        away_team:'Peru',           match_date:d(-46.5), stage:'group',   group_name:'B', round:null,         jornada:'Jornada 2', home_score:2,    away_score:0,    is_finished:true  },
    { home_team:'Brasil',         away_team:'Uruguay',        match_date:d(-1.4),  stage:'group',   group_name:'B', round:null,         jornada:'Jornada 3', home_score:2,    away_score:1,    is_finished:true  },
    { home_team:'Colombia',       away_team:'Peru',           match_date:d(-1.2),  stage:'group',   group_name:'B', round:null,         jornada:'Jornada 3', home_score:2,    away_score:0,    is_finished:true  },

    // ════ GRUPO C ═══════════════════════════════════════════
    { home_team:'Francia',        away_team:'Portugal',       match_date:d(-70),   stage:'group',   group_name:'C', round:null,         jornada:'Jornada 1', home_score:2,    away_score:0,    is_finished:true  },
    { home_team:'Alemania',       away_team:'Espana',         match_date:d(-69.5), stage:'group',   group_name:'C', round:null,         jornada:'Jornada 1', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Francia',        away_team:'Alemania',       match_date:d(-46),   stage:'group',   group_name:'C', round:null,         jornada:'Jornada 2', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Espana',         away_team:'Portugal',       match_date:d(-45.5), stage:'group',   group_name:'C', round:null,         jornada:'Jornada 2', home_score:2,    away_score:0,    is_finished:true  },
    { home_team:'Francia',        away_team:'Espana',         match_date:d(-1.3),  stage:'group',   group_name:'C', round:null,         jornada:'Jornada 3', home_score:1,    away_score:0,    is_finished:true  },
    { home_team:'Alemania',       away_team:'Portugal',       match_date:d(-1.1),  stage:'group',   group_name:'C', round:null,         jornada:'Jornada 3', home_score:3,    away_score:1,    is_finished:true  },

    // ════ GRUPO D ═══════════════════════════════════════════
    { home_team:'Inglaterra',     away_team:'Iran',           match_date:d(-69),   stage:'group',   group_name:'D', round:null,         jornada:'Jornada 1', home_score:2,    away_score:0,    is_finished:true  },
    { home_team:'Estados Unidos', away_team:'Marruecos',      match_date:d(-68.5), stage:'group',   group_name:'D', round:null,         jornada:'Jornada 1', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Inglaterra',     away_team:'Estados Unidos', match_date:d(-45),   stage:'group',   group_name:'D', round:null,         jornada:'Jornada 2', home_score:1,    away_score:1,    is_finished:true  },
    { home_team:'Iran',           away_team:'Marruecos',      match_date:d(-44.5), stage:'group',   group_name:'D', round:null,         jornada:'Jornada 2', home_score:0,    away_score:2,    is_finished:true  },
    { home_team:'Inglaterra',     away_team:'Marruecos',      match_date:d(-1.2),  stage:'group',   group_name:'D', round:null,         jornada:'Jornada 3', home_score:2,    away_score:1,    is_finished:true  },
    { home_team:'Estados Unidos', away_team:'Iran',           match_date:d(-1.0),  stage:'group',   group_name:'D', round:null,         jornada:'Jornada 3', home_score:3,    away_score:0,    is_finished:true  },

    // ════ OCTAVOS — CERRADO pero AÚN NO JUGADO (+1h) ════════
    //  Ventana cerrada (<2h): aparece 🔒 en pronósticos
    //  Aparece en panel admin como "pendiente de resultado"
    { home_team:'Argentina',      away_team:'Colombia',       match_date:d(1),     stage:'knockout', group_name:null, round:'R16',       jornada:'R16',        home_score:null, away_score:null, is_finished:false },
    { home_team:'Brasil',         away_team:'Francia',        match_date:d(1.2),   stage:'knockout', group_name:null, round:'R16',       jornada:'R16',        home_score:null, away_score:null, is_finished:false },

    // ════ CUARTOS — ABIERTO para pronósticos (+4h) ══════════
    //  >2h de distancia: aparece el formulario editable
    { home_team:'Inglaterra',     away_team:'Alemania',       match_date:d(4),     stage:'knockout', group_name:null, round:'Cuartos',   jornada:'Cuartos',    home_score:null, away_score:null, is_finished:false },
    { home_team:'Mexico',         away_team:'Espana',         match_date:d(4.5),   stage:'knockout', group_name:null, round:'Cuartos',   jornada:'Cuartos',    home_score:null, away_score:null, is_finished:false },

    // ════ SEMIFINAL / FINAL ══════════════════════════════════
    { home_team:'TBD',            away_team:'TBD',            match_date:d(120),   stage:'knockout', group_name:null, round:'Semifinal', jornada:'Semifinal',  home_score:null, away_score:null, is_finished:false },
    { home_team:'TBD',            away_team:'TBD',            match_date:d(121),   stage:'knockout', group_name:null, round:'Semifinal', jornada:'Semifinal',  home_score:null, away_score:null, is_finished:false },
    { home_team:'TBD',            away_team:'TBD',            match_date:d(168),   stage:'knockout', group_name:null, round:'Tercer Puesto', jornada:'Tercer Puesto', home_score:null, away_score:null, is_finished:false },
    { home_team:'TBD',            away_team:'TBD',            match_date:d(170),   stage:'knockout', group_name:null, round:'Final',     jornada:'Final',      home_score:null, away_score:null, is_finished:false },
  ];

  const { error } = await supabaseAdmin.from('matches').insert(rows);
  if (error) {
    return redirect(`/admin?err=${encodeURIComponent('Error: ' + error.message)}`);
  }

  return redirect(`/admin?msg=${encodeURIComponent('Fixture cargado · J1-J3 terminadas · R16 cerrado (+1h) · Cuartos abierto (+4h) · Semi/Final futuros')}`);
};
