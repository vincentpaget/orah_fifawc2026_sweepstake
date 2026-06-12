// Transforms api-football.com fixtures + standings into SweepData.
// League 1 (World Cup), Season 2026.
// Round names expected:
//   Group stage:  "Group Stage - 1" … "Group Stage - 3"
//   Knockout:     "Round of 32", "Round of 16", "Quarter-finals",
//                 "Semi-finals", "3rd Place Final", "Final"

import type { SweepData, Team, Person, Group, Match, Knockout, Flag, FlagKind } from '../types';
import { PARTICIPANTS, USE_SAMPLE_ASSIGNMENTS } from '../data/assignments';
import { fetchStandings, fetchFixtures } from './footballApi';

// ---------------------------------------------------------------------------
// Flag data keyed by the 3-letter code we use internally.
// Add any new 2026 qualifiers here if needed.
// ---------------------------------------------------------------------------
const f = (kind: FlagKind, ...colors: string[]): Flag => ({ kind, colors });

const FLAG_BY_CODE: Record<string, Flag> = {
  ARG: f('h', '#75AADB', '#ffffff', '#75AADB'),
  FRA: f('v', '#0055A4', '#ffffff', '#EF4135'),
  ESP: f('h', '#AA151B', '#F1BF00', '#AA151B'),
  ENG: f('cross', '#ffffff', '#CF142B'),
  BRA: f('diag', '#009C3B', '#FFDF00'),
  POR: f('v2', '#006600', '#FF0000'),
  NED: f('h', '#AE1C28', '#ffffff', '#21468B'),
  BEL: f('v', '#1A1A1A', '#FAE042', '#ED2939'),
  CRO: f('h', '#FF0000', '#ffffff', '#171796'),
  ITA: f('v', '#008C45', '#ffffff', '#CD212A'),
  GER: f('h', '#1A1A1A', '#DD0000', '#FFCE00'),
  URU: f('h2', '#0038A8', '#ffffff'),
  COL: f('h', '#FCD116', '#003893', '#CE1126'),
  MAR: f('disc', '#C1272D', '#006233'),
  USA: f('canton', '#B22234', '#3C3B6E', '#ffffff'),
  MEX: f('v', '#006847', '#ffffff', '#CE1126'),
  JPN: f('disc', '#ffffff', '#BC002D'),
  SEN: f('v', '#00853F', '#FDEF42', '#E31B23'),
  SUI: f('cross', '#FF0000', '#ffffff'),
  DEN: f('cross', '#C60C30', '#ffffff'),
  KOR: f('disc', '#ffffff', '#003478'),
  IRN: f('h', '#239F40', '#ffffff', '#DA0000'),
  AUS: f('solid', '#00247D'),
  SRB: f('h', '#C6363C', '#0C4076', '#ffffff'),
  POL: f('h2', '#ffffff', '#DC143C'),
  ECU: f('h', '#FFDD00', '#034EA2', '#ED1C24'),
  UKR: f('h2', '#0057B7', '#FFDD00'),
  AUT: f('h', '#ED2939', '#ffffff', '#ED2939'),
  HUN: f('h', '#CD2A3E', '#ffffff', '#436F4D'),
  NOR: f('cross', '#BA0C2F', '#00205B'),
  EGY: f('h', '#CE1126', '#ffffff', '#1A1A1A'),
  NGA: f('v', '#008751', '#ffffff', '#008751'),
  CIV: f('v', '#FF8200', '#ffffff', '#009A44'),
  CMR: f('v', '#007A5E', '#CE1126', '#FCD116'),
  GHA: f('h', '#CE1126', '#FCD116', '#006B3F'),
  TUN: f('disc', '#E70013', '#ffffff'),
  ALG: f('v2', '#006233', '#ffffff'),
  KSA: f('solid', '#006C35'),
  QAT: f('v2', '#ffffff', '#8A1538'),
  CRC: f('h', '#002B7F', '#ffffff', '#CE1126'),
  PAN: f('canton', '#D21034', '#005293', '#ffffff'),
  PAR: f('h', '#D52B1E', '#ffffff', '#0038A8'),
  PER: f('v', '#D91023', '#ffffff', '#D91023'),
  CHI: f('canton', '#ffffff', '#0039A6', '#D52B1E'),
  WAL: f('h2', '#ffffff', '#00AB39'),
  SCO: f('cross', '#005EB8', '#ffffff'),
  TUR: f('disc', '#E30A17', '#ffffff'),
  GRC: f('h2', '#0D5EAF', '#ffffff'),
  // 2026 additions (CONCACAF)
  CAN: f('solid', '#FF0000'),
  JAM: f('diag', '#000000', '#FED100'),
  HON: f('h', '#0073CF', '#ffffff', '#0073CF'),
  SLV: f('h', '#0F47AF', '#ffffff', '#0F47AF'),
  // 2026 Asia additions
  IRQ: f('h', '#000000', '#ffffff', '#CE1126'),
  JOR: f('v', '#007A3D', '#ffffff', '#CE1126'),
  UZB: f('h', '#1EB53A', '#ffffff', '#CE1126'),
  // 2026 Europe additions
  ROM: f('v', '#002B7F', '#FCD116', '#CE1126'),
  CZE: f('v', '#D7141A', '#ffffff', '#11457E'),
  SVK: f('h', '#ffffff', '#0B4EA2', '#EE1C25'),
  ALB: f('solid', '#E41E20'),
  SVN: f('h', '#003DA5', '#ffffff', '#003DA5'),
  GEO: f('cross', '#ffffff', '#FF0000'),
  // Fallback
  DEFAULT: f('solid', '#9E9E9E'),
};

// Map from API team name → internal code. Handles common variations.
const NAME_TO_CODE: Record<string, string> = {
  'Argentina': 'ARG', 'France': 'FRA', 'Spain': 'ESP', 'England': 'ENG',
  'Brazil': 'BRA', 'Portugal': 'POR', 'Netherlands': 'NED', 'Belgium': 'BEL',
  'Croatia': 'CRO', 'Italy': 'ITA', 'Germany': 'GER', 'Uruguay': 'URU',
  'Colombia': 'COL', 'Morocco': 'MAR', 'United States': 'USA', 'USA': 'USA',
  'Mexico': 'MEX', 'Japan': 'JPN', 'Senegal': 'SEN', 'Switzerland': 'SUI',
  'Denmark': 'DEN', 'Korea Republic': 'KOR', 'South Korea': 'KOR', 'Iran': 'IRN',
  'Australia': 'AUS', 'Serbia': 'SRB', 'Poland': 'POL', 'Ecuador': 'ECU',
  'Ukraine': 'UKR', 'Austria': 'AUT', 'Hungary': 'HUN', 'Norway': 'NOR',
  'Egypt': 'EGY', 'Nigeria': 'NGA', "Côte d'Ivoire": 'CIV', 'Ivory Coast': 'CIV',
  'Cameroon': 'CMR', 'Ghana': 'GHA', 'Tunisia': 'TUN', 'Algeria': 'ALG',
  'Saudi Arabia': 'KSA', 'Qatar': 'QAT', 'Costa Rica': 'CRC', 'Panama': 'PAN',
  'Paraguay': 'PAR', 'Peru': 'PER', 'Chile': 'CHI', 'Wales': 'WAL',
  'Scotland': 'SCO', 'Turkey': 'TUR', 'Türkiye': 'TUR', 'Greece': 'GRC',
  'Canada': 'CAN', 'Jamaica': 'JAM', 'Honduras': 'HON', 'El Salvador': 'SLV',
  'Iraq': 'IRQ', 'Jordan': 'JOR', 'Uzbekistan': 'UZB',
  'Romania': 'ROM', 'Czech Republic': 'CZE', 'Czechia': 'CZE',
  'Slovakia': 'SVK', 'Albania': 'ALB', 'Slovenia': 'SVN', 'Georgia': 'GEO',
};

// FIFA ranking approximation (lower = better). Used for "worst team" prize logic.
const FIFA_RANK_BY_CODE: Record<string, number> = {
  ARG: 1, FRA: 2, ESP: 3, ENG: 4, BRA: 5, POR: 6, NED: 7, BEL: 8,
  CRO: 9, ITA: 10, GER: 11, URU: 12, COL: 13, MAR: 14, USA: 15, MEX: 16,
  JPN: 17, SEN: 18, SUI: 19, DEN: 20, KOR: 21, IRN: 22, AUS: 23, SRB: 24,
  POL: 25, ECU: 26, UKR: 27, AUT: 28, HUN: 29, NOR: 30, EGY: 31, NGA: 32,
  CIV: 33, CMR: 34, GHA: 35, TUN: 36, ALG: 37, KSA: 38, QAT: 39, CRC: 40,
  PAN: 41, PAR: 42, PER: 43, CHI: 44, WAL: 45, SCO: 46, TUR: 47, GRC: 48,
  CAN: 49, JAM: 50, HON: 51, SLV: 52, IRQ: 53, JOR: 54, UZB: 55, ROM: 56,
  CZE: 57, SVK: 58, ALB: 59, SVN: 60, GEO: 61,
};

function codeFor(apiName: string): string {
  return NAME_TO_CODE[apiName] ?? apiName.slice(0, 3).toUpperCase();
}

function flagFor(code: string): Flag {
  return FLAG_BY_CODE[code] ?? FLAG_BY_CODE.DEFAULT;
}

// ---------------------------------------------------------------------------
// API response types (minimal — only what we need)
// ---------------------------------------------------------------------------
interface ApiTeam { id: number; name: string; logo: string; winner?: boolean | null; }
interface ApiStandingEntry {
  rank: number;
  team: ApiTeam;
  points: number;
  goalsDiff: number;
  group: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}
interface ApiFixture {
  fixture: { id: number; date: string; status: { short: string; elapsed: number | null } };
  league: { round: string };
  teams: { home: ApiTeam; away: ApiTeam };
  goals: { home: number | null; away: number | null };
  score: { penalty: { home: number | null; away: number | null } };
}

// ---------------------------------------------------------------------------
// Round classification
// ---------------------------------------------------------------------------
const ROUND_KEY: Record<string, keyof Knockout> = {
  'Round of 32': 'R32',
  'Round of 16': 'R16',
  'Quarter-finals': 'QF',
  'Semi-finals': 'SF',
  '3rd Place Final': 'TP',
  'Final': 'FINAL',
};
const ROUND_LABEL: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-finals',
  SF: 'Semi-finals', TP: '3rd place playoff', FINAL: 'Final',
};

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------
export async function buildFromApi(apiKey: string): Promise<SweepData> {
  const [standingsRes, fixturesRes] = await Promise.all([
    fetchStandings(apiKey),
    fetchFixtures(apiKey),
  ]);

  const allGroups: ApiStandingEntry[][] = standingsRes.response?.[0]?.league?.standings ?? [];
  const allFixtures: ApiFixture[] = fixturesRes.response ?? [];

  if (allGroups.length === 0 && allFixtures.length === 0) {
    throw new Error('API returned no data — check your plan or season parameters.');
  }

  // ---- Build internal team list from standings ----
  const teamsByApiId = new Map<number, Team>();
  let teamIndex = 0;

  allGroups.forEach((groupRows) => {
    // group name = "Group A" → letter = "A"
    const groupLetter = (groupRows[0]?.group ?? 'A').replace('Group ', '');
    groupRows.forEach((row) => {
      const code = codeFor(row.team.name);
      const team: Team = {
        id: teamIndex++,
        name: row.team.name,
        code,
        rank: FIFA_RANK_BY_CODE[code] ?? 99,
        flag: flagFor(code),
        group: groupLetter,
        groupStats: {
          p: row.all.played,
          w: row.all.win,
          d: row.all.draw,
          l: row.all.lose,
          gf: row.all.goals.for,
          ga: row.all.goals.against,
          gd: row.goalsDiff,
          pts: row.points,
          pos: row.rank,
        },
        alive: true, // will be updated below
        exitRound: null,
        stage: '',
        ownerId: 0,
        nextGame: null,
      };
      teamsByApiId.set(row.team.id, team);
    });
  });

  // If standings unavailable, build teams from fixtures
  if (teamsByApiId.size === 0) {
    allFixtures.forEach((fx) => {
      [fx.teams.home, fx.teams.away].forEach((apiT) => {
        if (!teamsByApiId.has(apiT.id)) {
          const code = codeFor(apiT.name);
          teamsByApiId.set(apiT.id, {
            id: teamIndex++,
            name: apiT.name,
            code,
            rank: FIFA_RANK_BY_CODE[code] ?? 99,
            flag: flagFor(code),
            group: '?',
            groupStats: { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, pos: 0 },
            alive: true, exitRound: null, stage: '', ownerId: 0, nextGame: null,
          });
        }
      });
    });
  }

  const teams = Array.from(teamsByApiId.values());

  // ---- Groups in standings order ----
  const groupMap = new Map<string, number[]>();
  teams.forEach((t) => {
    if (!groupMap.has(t.group)) groupMap.set(t.group, []);
    groupMap.get(t.group)!.push(t.id);
  });
  const groups: Group[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, teamIds]) => ({ letter, teamIds }));

  // ---- Classify fixtures ----
  const groupFixtures = allFixtures.filter((f) => f.league.round.startsWith('Group Stage'));
  const knockoutFixtures = allFixtures.filter((f) => !f.league.round.startsWith('Group Stage'));

  // ---- Build group-stage elimination list ----
  // Teams that advanced are those that appear in any knockout fixture
  const appearedInKnockout = new Set<number>();
  knockoutFixtures.forEach((fx) => {
    const home = teams.find(t => t.name === fx.teams.home.name);
    const away = teams.find(t => t.name === fx.teams.away.name);
    if (home) appearedInKnockout.add(home.id);
    if (away) appearedInKnockout.add(away.id);
  });

  const groupStageComplete = groupFixtures.some((f) => f.fixture.status.short === 'FT');
  if (groupStageComplete) {
    teams.forEach((t) => {
      if (!appearedInKnockout.has(t.id)) {
        t.alive = false;
        t.exitRound = 'Group';
        t.stage = 'Out · Group';
      }
    });
  }

  // ---- Build knockout bracket ----
  const knockout: Knockout = { R32: [], R16: [], QF: [], SF: [], TP: [], FINAL: [] };

  // Group knockout fixtures by round, then sort by date
  const knockoutByRound = new Map<string, ApiFixture[]>();
  knockoutFixtures.forEach((fx) => {
    const rnd = fx.league.round;
    if (!knockoutByRound.has(rnd)) knockoutByRound.set(rnd, []);
    knockoutByRound.get(rnd)!.push(fx);
  });
  knockoutByRound.forEach((fxs) => fxs.sort((a, b) => a.fixture.date.localeCompare(b.fixture.date)));

  knockoutByRound.forEach((fxs, roundName) => {
    const key = ROUND_KEY[roundName];
    if (!key) return;

    fxs.forEach((fx, idx) => {
      const homeTeam = teams.find(t => t.name === fx.teams.home.name) ?? null;
      const awayTeam = teams.find(t => t.name === fx.teams.away.name) ?? null;
      const played = fx.fixture.status.short === 'FT' || fx.fixture.status.short === 'AET' || fx.fixture.status.short === 'PEN';
      const sa = fx.goals.home;
      const sb = fx.goals.away;
      const pens = (fx.score.penalty.home !== null || fx.score.penalty.away !== null) ? 'pens' : null;
      const winnerId = played
        ? (fx.teams.home.winner ? homeTeam?.id ?? null : awayTeam?.id ?? null)
        : null;
      const loserId = played && winnerId !== null
        ? (winnerId === homeTeam?.id ? awayTeam?.id : homeTeam?.id) ?? null
        : null;

      // Mark loser as eliminated
      if (loserId !== null) {
        const loser = teams.find(t => t.id === loserId);
        if (loser && loser.alive) {
          loser.alive = false;
          loser.exitRound = key as Team['exitRound'];
          loser.stage = 'Out · ' + ROUND_LABEL[key];
        }
      }

      const dateStr = formatDate(fx.fixture.date);

      knockout[key].push({
        id: `${key}-${idx}`,
        round: key,
        aId: homeTeam?.id ?? null,
        bId: awayTeam?.id ?? null,
        sa: played ? sa : null,
        sb: played ? sb : null,
        winnerId,
        played,
        pens,
        date: dateStr,
        label: key === 'FINAL' ? 'Final' : key === 'TP' ? 'Third-place playoff' : undefined,
      });
    });
  });

  // ---- Set stage labels for surviving teams ----
  const STAGE_FROM_KEY: Record<string, string> = {
    R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-final',
    SF: 'Semi-final', TP: 'Semi-final', FINAL: 'Final',
  };
  // Highest round each team appeared in
  knockoutFixtures.forEach((fx) => {
    const key = ROUND_KEY[fx.league.round];
    if (!key) return;
    [fx.teams.home, fx.teams.away].forEach((apiT) => {
      const t = teams.find(t => t.name === apiT.name);
      if (!t) return;
      // Only update if this round is further along
      const stageRank = ['R32', 'R16', 'QF', 'SF', 'TP', 'FINAL'].indexOf(key);
      const currentRank = ['R32', 'R16', 'QF', 'SF', 'TP', 'FINAL'].indexOf(
        t.stage.replace('Out · ', '').replace('Round of 32', 'R32').replace('Round of 16', 'R16')
          .replace('Quarter-final', 'QF').replace('Semi-final', 'SF').replace('Final', 'FINAL')
      );
      if (stageRank > currentRank) {
        if (t.alive) t.stage = STAGE_FROM_KEY[key] ?? key;
      }
    });
  });

  // Set next game for alive teams
  const upcomingKnockout = knockoutFixtures.filter(f => f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD');
  upcomingKnockout.forEach((fx) => {
    const home = teams.find(t => t.name === fx.teams.home.name);
    const away = teams.find(t => t.name === fx.teams.away.name);
    const dateStr = formatDate(fx.fixture.date);
    const key = ROUND_KEY[fx.league.round] ?? 'R32';
    if (home && home.alive && !home.nextGame) {
      home.nextGame = { opponentId: away?.id ?? 0, round: ROUND_LABEL[key] ?? key, date: dateStr };
    }
    if (away && away.alive && !away.nextGame) {
      away.nextGame = { opponentId: home?.id ?? 0, round: ROUND_LABEL[key] ?? key, date: dateStr };
    }
  });

  // Upcoming group fixtures → next game for group-stage teams
  const upcomingGroup = groupFixtures.filter(f => f.fixture.status.short === 'NS' || f.fixture.status.short === 'TBD');
  upcomingGroup.forEach((fx) => {
    const home = teams.find(t => t.name === fx.teams.home.name);
    const away = teams.find(t => t.name === fx.teams.away.name);
    const dateStr = formatDate(fx.fixture.date);
    if (home && !home.nextGame) home.nextGame = { opponentId: away?.id ?? 0, round: 'Group Stage', date: dateStr };
    if (away && !away.nextGame) away.nextGame = { opponentId: home?.id ?? 0, round: 'Group Stage', date: dateStr };
  });

  // ---- Current stage label ----
  let stageNow = 'Group Stage';
  if (knockout.FINAL.some(m => m.played)) stageNow = 'Finished';
  else if (knockout.SF.some(m => m.played || knockout.SF.some(m => !m.played && m.aId))) stageNow = 'Semi-finals';
  else if (knockout.QF.some(m => m.played)) stageNow = 'Quarter-finals';
  else if (knockout.R16.some(m => m.played)) stageNow = 'Round of 16';
  else if (knockout.R32.some(m => m.played)) stageNow = 'Round of 32';
  else if (groupStageComplete) stageNow = 'Knockout';

  // ---- Assign owners ----
  const participants = PARTICIPANTS;
  const people: Person[] = participants.map(p => ({
    ...p, teamIds: [], alive: false, aliveCount: 0, bestStage: 'Out', score: 0,
  }));

  if (USE_SAMPLE_ASSIGNMENTS || participants.every(p => p.teams.length === 0)) {
    // Auto-deal teams round-robin
    const shuffled = [...teams].sort((a, b) => a.name.localeCompare(b.name));
    shuffled.forEach((t, k) => {
      const pid = k % people.length;
      t.ownerId = pid;
      people[pid].teamIds.push(t.id);
    });
  } else {
    participants.forEach(p => {
      p.teams.forEach(code => {
        const team = teams.find(t => t.code === code);
        if (team) { team.ownerId = p.id; people[p.id].teamIds.push(team.id); }
      });
    });
  }

  // ---- People aggregates ----
  const STAGE_RANK: Record<string, number> = {
    'Out · Group': 0, 'Out · Round of 32': 1, 'Out · Round of 16': 2,
    'Out · Quarter-final': 3, 'Out · Semi-final': 4,
    'Round of 32': 1, 'Round of 16': 2, 'Quarter-final': 3, 'Semi-final': 4, 'Final': 5,
  };
  people.forEach(p => {
    p.aliveCount = p.teamIds.filter(id => teams[id]?.alive).length;
    p.alive = p.aliveCount > 0;
    let best = -1, bestLabel = 'Out';
    p.teamIds.forEach(id => {
      const t = teams[id];
      if (!t) return;
      const sr = STAGE_RANK[t.stage] ?? 0;
      if (sr > best) { best = sr; bestLabel = t.stage; }
    });
    p.bestStage = bestLabel;
    p.score = p.teamIds.reduce((acc, id) => {
      const t = teams[id];
      if (!t) return acc;
      return acc + (t.alive ? 100 + t.groupStats.pts : t.exitRound === 'R32' ? 40 : t.exitRound === 'Group' ? t.groupStats.pts : 60);
    }, 0);
  });

  // ---- Prizes ----
  const groupCasualties = teams.filter(t => t.exitRound === 'Group');
  const worstTeam = groupCasualties.length > 0
    ? groupCasualties.reduce((a, b) => (b.rank > a.rank ? b : a))
    : teams[teams.length - 1];
  const aliveByRank = teams.filter(t => t.alive).sort((a, b) => a.rank - b.rank);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Find FINAL date
  const finalDate = knockout.FINAL[0]?.date ?? '—';
  const tpDate = knockout.TP[0]?.date ?? '—';

  return {
    meta: {
      name: 'World Cup 2026 Sweepstake',
      today: todayStr,
      hostLine: 'USA · Canada · Mexico',
      stageNow,
      potText: '£10 buy-in · £400 pot',
      payoutText: '1st £240 · 3rd £100 · Worst £60',
    },
    teams,
    people,
    groups,
    knockout,
    prizes: {
      first: {
        title: '1st Place', sub: 'Owner of the champion', status: 'Open',
        note: `${aliveByRank.length} teams remain · decided ${finalDate}`,
        favouriteTeamId: aliveByRank[0]?.id ?? teams[0].id,
      },
      third: {
        title: '3rd Place', sub: 'Owner of the bronze-medal team', status: 'Open',
        note: `Decided at the 3rd-place playoff · ${tpDate}`,
        favouriteTeamId: aliveByRank[1]?.id ?? teams[1].id,
      },
      worst: {
        title: 'Worst Team', sub: 'Lowest-ranked team out in the groups',
        status: groupCasualties.length > 0 ? 'Locked' : 'Open',
        note: groupCasualties.length > 0 ? 'Wooden spoon — already decided' : 'Decided when group stage ends',
        teamId: worstTeam.id,
        ownerId: worstTeam.ownerId,
      },
    },
  };
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
