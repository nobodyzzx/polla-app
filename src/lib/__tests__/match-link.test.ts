import type { ApiMatch } from '@/lib/match-types';
import { describe, it, expect } from 'vitest';
import { normTeam, teamKey, isPlaceholderName, linkMatches } from '@/lib/match-link';

function makeApiMatch(overrides: Partial<ApiMatch> & { id: number; utcDate: string; homeTeam: { name: string }; awayTeam: { name: string } }): ApiMatch {
  return {
    status: 'FINISHED',
    stage: 'GROUP_STAGE',
    group: null,
    matchday: null,
    score: { winner: null, duration: 'REGULAR', fullTime: { home: null, away: null } },
    ...overrides,
  };
}

describe('normTeam', () => {
  it('normaliza a lowercase y sin acentos', () => {
    expect(normTeam('Estados Unidos')).toBe('estadosunidos');
  });
  it('aplica ALIAS conocidos', () => {
    expect(normTeam('USA')).toBe('unitedstates');
    expect(normTeam('Korea Republic')).toBe('southkorea');
    expect(normTeam('Côte d\'Ivoire')).toBe('ivorycoast');
  });
  it('quita caracteres no-letra', () => {
    expect(normTeam('Saudi-Arabia')).toBe('saudiarabia');
    expect(normTeam('Congo DR')).toBe('congodr');
  });
  it('retorna el nombre si no tiene alias', () => {
    expect(normTeam('Bolivia')).toBe('bolivia');
  });
});

describe('teamKey', () => {
  it('ordena los equipos alfabéticamente', () => {
    const a = teamKey('Bolivia', 'Argentina');
    const b = teamKey('Argentina', 'Bolivia');
    expect(a).toBe(b);
    expect(a).toContain('argentina');
  });
});

describe('isPlaceholderName', () => {
  it('identifica placeholders de bracket', () => {
    expect(isPlaceholderName('W74')).toBe(true);
    expect(isPlaceholderName('3ABCDF')).toBe(true);
    expect(isPlaceholderName('2A')).toBe(true);
    expect(isPlaceholderName('TBD')).toBe(true);
  });
  it('identifica nombres reales', () => {
    expect(isPlaceholderName('Argentina')).toBe(false);
    expect(isPlaceholderName('Bolivia')).toBe(false);
  });
});

describe('linkMatches', () => {
  it('empareja por hora+equipos (proveedor agnóstico)', () => {
    const apiMatch = makeApiMatch({ id: 10, utcDate: 'x', homeTeam: { name: 'A' }, awayTeam: { name: 'B' } });
    const out = linkMatches(
      [apiMatch],
      [{ id: 'db1', match_date: 'x', home_team: 'A', away_team: 'B' }],
    );
    expect(out.size).toBe(1);
    expect(out.get(apiMatch)).toBe('db1');
  });

  it('empareja por hora+equipos con espn', () => {
    const out = linkMatches(
      [makeApiMatch({ id: 100, utcDate: '2026-06-18T16:00:00Z', homeTeam: { name: 'Bolivia' }, awayTeam: { name: 'Argentina' } })],
      [{ id: 'db1', match_date: '2026-06-18T16:00:00Z', home_team: 'Bolivia', away_team: 'Argentina' }],
    );
    expect(out.size).toBe(1);
  });

  it('empareja por hora usando placeholder (eliminatoria sin bracket definido)', () => {
    const out = linkMatches(
      [makeApiMatch({ id: 100, utcDate: '2026-06-18T16:00:00Z', homeTeam: { name: 'W74' }, awayTeam: { name: 'W75' } })],
      [{ id: 'db1', match_date: '2026-06-18T16:00:00Z', home_team: 'W74', away_team: 'W75' }],
    );
    expect(out.size).toBe(1);
  });

  it('respeta normalización de equipos', () => {
    const out = linkMatches(
      [makeApiMatch({ id: 100, utcDate: '2026-06-18T16:00:00Z', homeTeam: { name: 'USA' }, awayTeam: { name: 'Korea Republic' } })],
      [{ id: 'db1', match_date: '2026-06-18T16:00:00Z', home_team: 'USA', away_team: 'South Korea' }],
    );
    expect(out.size).toBe(1);
  });

  it('empareja por equipos aunque la hora difiera (desfase de siembra, 1h)', () => {
    const out = linkMatches(
      [makeApiMatch({ id: 100, utcDate: '2026-07-06T01:00:00Z', homeTeam: { name: 'Mexico' }, awayTeam: { name: 'England' } })],
      [{ id: 'db1', match_date: '2026-07-06T00:00:00Z', home_team: 'Mexico', away_team: 'England' }],
    );
    expect(out.size).toBe(1);
    expect(out.get([...out.keys()][0])).toBe('db1');
  });

  it('elige el candidato más cercano en hora cuando el par se repite', () => {
    const am = makeApiMatch({ id: 100, utcDate: '2026-07-06T01:00:00Z', homeTeam: { name: 'Mexico' }, awayTeam: { name: 'England' } });
    const out = linkMatches(
      [am],
      [
        { id: 'lejos', match_date: '2026-07-06T03:00:00Z', home_team: 'Mexico', away_team: 'England' },
        { id: 'cerca', match_date: '2026-07-06T00:30:00Z', home_team: 'Mexico', away_team: 'England' },
      ],
    );
    expect(out.get(am)).toBe('cerca');
  });

  it('no empareja por equipos si el desfase supera la tolerancia', () => {
    const out = linkMatches(
      [makeApiMatch({ id: 100, utcDate: '2026-07-06T12:00:00Z', homeTeam: { name: 'Mexico' }, awayTeam: { name: 'England' } })],
      [{ id: 'db1', match_date: '2026-07-06T00:00:00Z', home_team: 'Mexico', away_team: 'England' }],
    );
    expect(out.size).toBe(0);
  });

  it('empareja correctamente con distintos formatos de fecha', () => {
    const out = linkMatches(
      [makeApiMatch({ id: 100, utcDate: '2026-06-18T16:00Z', homeTeam: { name: 'Bolivia' }, awayTeam: { name: 'Argentina' } })],
      [{ id: 'db1', match_date: '2026-06-18T16:00:00+00:00', home_team: 'Bolivia', away_team: 'Argentina' }],
    );
    expect(out.size).toBe(1);
  });
});
