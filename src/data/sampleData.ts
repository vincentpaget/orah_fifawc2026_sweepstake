import type { SweepData, Team, Person, Group, Match, Flag, FlagKind, Highlights } from '../types';
import { PARTICIPANTS, USE_SAMPLE_ASSIGNMENTS } from './assignments';

// ---- seeded RNG (deterministic) ----
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260611);
const rint = (n: number) => Math.floor(rng() * n);

const f = (kind: FlagKind, ...colors: string[]): Flag => ({ kind, colors });

const NATIONS: [string, string, Flag][] = [
  ['Argentina',      'ARG', f('h',      '#75AADB', '#ffffff', '#75AADB')],
  ['France',         'FRA', f('v',      '#0055A4', '#ffffff', '#EF4135')],
  ['Spain',          'ESP', f('h',      '#AA151B', '#F1BF00', '#AA151B')],
  ['England',        'ENG', f('cross',  '#ffffff', '#CF142B')],
  ['Brazil',         'BRA', f('diag',   '#009C3B', '#FFDF00')],
  ['Portugal',       'POR', f('v2',     '#006600', '#FF0000')],
  ['Netherlands',    'NED', f('h',      '#AE1C28', '#ffffff', '#21468B')],
  ['Belgium',        'BEL', f('v',      '#1A1A1A', '#FAE042', '#ED2939')],
  ['Croatia',        'CRO', f('h',      '#FF0000', '#ffffff', '#171796')],
  ['Italy',          'ITA', f('v',      '#008C45', '#ffffff', '#CD212A')],
  ['Germany',        'GER', f('h',      '#1A1A1A', '#DD0000', '#FFCE00')],
  ['Uruguay',        'URU', f('h2',     '#0038A8', '#ffffff')],
  ['Colombia',       'COL', f('h',      '#FCD116', '#003893', '#CE1126')],
  ['Morocco',        'MAR', f('disc',   '#C1272D', '#006233')],
  ['USA',            'USA', f('canton', '#B22234', '#3C3B6E', '#ffffff')],
  ['Mexico',         'MEX', f('v',      '#006847', '#ffffff', '#CE1126')],
  ['Japan',          'JPN', f('disc',   '#ffffff', '#BC002D')],
  ['Senegal',        'SEN', f('v',      '#00853F', '#FDEF42', '#E31B23')],
  ['Switzerland',    'SUI', f('cross',  '#FF0000', '#ffffff')],
  ['Denmark',        'DEN', f('cross',  '#C60C30', '#ffffff')],
  ['Korea Republic', 'KOR', f('disc',   '#ffffff', '#003478')],
  ['Iran',           'IRN', f('h',      '#239F40', '#ffffff', '#DA0000')],
  ['Australia',      'AUS', f('solid',  '#00247D')],
  ['Serbia',         'SRB', f('h',      '#C6363C', '#0C4076', '#ffffff')],
  ['Poland',         'POL', f('h2',     '#ffffff', '#DC143C')],
  ['Ecuador',        'ECU', f('h',      '#FFDD00', '#034EA2', '#ED1C24')],
  ['Ukraine',        'UKR', f('h2',     '#0057B7', '#FFDD00')],
  ['Austria',        'AUT', f('h',      '#ED2939', '#ffffff', '#ED2939')],
  ['Hungary',        'HUN', f('h',      '#CD2A3E', '#ffffff', '#436F4D')],
  ['Norway',         'NOR', f('cross',  '#BA0C2F', '#00205B')],
  ['Egypt',          'EGY', f('h',      '#CE1126', '#ffffff', '#1A1A1A')],
  ['Nigeria',        'NGA', f('v',      '#008751', '#ffffff', '#008751')],
  ["Côte d'Ivoire",  'CIV', f('v',      '#FF8200', '#ffffff', '#009A44')],
  ['Cameroon',       'CMR', f('v',      '#007A5E', '#CE1126', '#FCD116')],
  ['Ghana',          'GHA', f('h',      '#CE1126', '#FCD116', '#006B3F')],
  ['Tunisia',        'TUN', f('disc',   '#E70013', '#ffffff')],
  ['Algeria',        'ALG', f('v2',     '#006233', '#ffffff')],
  ['Saudi Arabia',   'KSA', f('solid',  '#006C35')],
  ['Qatar',          'QAT', f('v2',     '#ffffff', '#8A1538')],
  ['Costa Rica',     'CRC', f('h',      '#002B7F', '#ffffff', '#CE1126')],
  ['Panama',         'PAN', f('canton', '#D21034', '#005293', '#ffffff')],
  ['Paraguay',       'PAR', f('h',      '#D52B1E', '#ffffff', '#0038A8')],
  ['Peru',           'PER', f('v',      '#D91023', '#ffffff', '#D91023')],
  ['Chile',          'CHI', f('canton', '#ffffff', '#0039A6', '#D52B1E')],
  ['Wales',          'WAL', f('h2',     '#ffffff', '#00AB39')],
  ['Scotland',       'SCO', f('cross',  '#005EB8', '#ffffff')],
  ['Türkiye',        'TUR', f('disc',   '#E30A17', '#ffffff')],
  ['Greece',         'GRC', f('h2',     '#0D5EAF', '#ffffff')],
];

function strength(t: Team) { return 2000 - t.rank * 9; }

function playMatch(a: Team, b: Team): [number, number] {
  const ea = 1 / (1 + Math.pow(10, (strength(b) - strength(a)) / 380));
  const r = rng();
  const baseA = 0.6 + ea * 2.2, baseB = 0.6 + (1 - ea) * 2.2;
  let sa = Math.min(5, Math.round(baseA + (rng() - 0.5) * 1.6 + (r < ea ? 0.5 : -0.2)));
  let sb = Math.min(5, Math.round(baseB + (rng() - 0.5) * 1.6 + (r < ea ? -0.2 : 0.5)));
  sa = Math.max(0, sa); sb = Math.max(0, sb);
  return [sa, sb];
}

function seedOrder(n: number): number[] {
  let r = [1, 2];
  while (r.length < n) {
    const m = r.length * 2 + 1;
    const nr: number[] = [];
    for (const x of r) { nr.push(x); nr.push(m - x); }
    r = nr;
  }
  return r;
}

const LETTERS = 'ABCDEFGHIJKL'.split('');
// Group matchday dates: MD1 / MD2 / MD3 per group letter index
const GRP_MD: [string, string, string][] = [
  ['Jun 11','Jun 16','Jun 21'],['Jun 11','Jun 16','Jun 22'],
  ['Jun 12','Jun 17','Jun 22'],['Jun 12','Jun 17','Jun 23'],
  ['Jun 13','Jun 18','Jun 23'],['Jun 13','Jun 18','Jun 24'],
  ['Jun 14','Jun 19','Jun 24'],['Jun 14','Jun 19','Jun 25'],
  ['Jun 15','Jun 20','Jun 25'],['Jun 15','Jun 20','Jun 25'],
  ['Jun 16','Jun 21','Jun 25'],['Jun 16','Jun 21','Jun 25'],
];
const DATES = {
  R32:   ['Jun 28', 'Jun 29', 'Jun 30', 'Jul 1',  'Jul 2',  'Jul 3'],
  R16:   ['Jul 4',  'Jul 5',  'Jul 6',  'Jul 7'],
  QF:    ['Jul 9',  'Jul 10', 'Jul 11', 'Jul 11'],
  SF:    ['Jul 14', 'Jul 15'],
  TP:    ['Jul 18'],
  FINAL: ['Jul 19'],
};
const KICKOFFS = ['3:00 PM', '6:00 PM', '9:00 PM', '12:00 PM'];
const STAGE_RANK: Record<string, number> = {
  'Out · Group': 0, 'Out · Round of 32': 1,
  'Round of 16': 2, 'Quarter-final': 3, 'Semi-final': 4, 'Final': 5,
};

export function buildSampleData(): SweepData {
  const teams: Team[] = NATIONS.map((n, i) => ({
    id: i, name: n[0], code: n[1], rank: i + 1, flag: n[2],
    group: '', groupStats: { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, pos: 0 },
    alive: true, exitRound: null, stage: '', ownerId: 0, nextGame: null,
  }));

  // ---- group draw (snake by pots) ----
  const pots = [0, 1, 2, 3].map(p => teams.slice(p * 12, p * 12 + 12));
  pots.forEach(pot => {
    for (let i = pot.length - 1; i > 0; i--) {
      const j = rint(i + 1); [pot[i], pot[j]] = [pot[j], pot[i]];
    }
  });
  const groups: Group[] = LETTERS.map(L => ({ letter: L, teamIds: [] }));
  pots.forEach(pot => pot.forEach((t, g) => { t.group = LETTERS[g]; groups[g].teamIds.push(t.id); }));

  // ---- simulate group stage ----
  const groupFixtures: Match[] = [];
  groups.forEach(grp => {
    const ids = grp.teamIds;
    const li = LETTERS.indexOf(grp.letter);
    const [d1, d2, d3] = GRP_MD[li] ?? ['Jun 11', 'Jun 16', 'Jun 21'];
    let mIdx = 0;
    // Pairs in matchday order: MD1=(0v1,2v3), MD2=(0v2,1v3), MD3=(0v3,1v2)
    const pairs: [number, number, string][] = [
      [0,1,d1],[2,3,d1],[0,2,d2],[1,3,d2],[0,3,d3],[1,2,d3],
    ];
    pairs.forEach(([ai, bi, day]) => {
      const A = teams[ids[ai]], B = teams[ids[bi]];
      const [sa, sb] = playMatch(A, B);
      A.groupStats.gf += sa; A.groupStats.ga += sb;
      B.groupStats.gf += sb; B.groupStats.ga += sa;
      A.groupStats.p++; B.groupStats.p++;
      if (sa > sb) { A.groupStats.w++; B.groupStats.l++; A.groupStats.pts += 3; }
      else if (sb > sa) { B.groupStats.w++; A.groupStats.l++; B.groupStats.pts += 3; }
      else { A.groupStats.d++; B.groupStats.d++; A.groupStats.pts++; B.groupStats.pts++; }
      groupFixtures.push({
        id: `G${grp.letter}-${mIdx++}`, round: `Group ${grp.letter}`,
        aId: ids[ai], bId: ids[bi], sa, sb,
        winnerId: sa > sb ? ids[ai] : sb > sa ? ids[bi] : null,
        played: true, pens: null,
        date: day + ' · ' + KICKOFFS[mIdx % 4],
      });
    });
    grp.teamIds.forEach(id => { const s = teams[id].groupStats; s.gd = s.gf - s.ga; });
    grp.teamIds.sort((x, y) => {
      const a = teams[x].groupStats, b = teams[y].groupStats;
      return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || teams[x].rank - teams[y].rank;
    });
    grp.teamIds.forEach((id, idx) => { teams[id].groupStats.pos = idx + 1; });
  });

  // ---- advance 32 to knockout ----
  const winners: number[] = [], runners: number[] = [], thirds: number[] = [];
  groups.forEach(g => { winners.push(g.teamIds[0]); runners.push(g.teamIds[1]); thirds.push(g.teamIds[2]); });
  const byPerf = (a: number, b: number) => {
    const x = teams[a].groupStats, y = teams[b].groupStats;
    return y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || teams[a].rank - teams[b].rank;
  };
  winners.sort(byPerf); runners.sort(byPerf); thirds.sort(byPerf);
  const bestThirds = thirds.slice(0, 8);
  const qualified = [...winners, ...runners, ...bestThirds];

  teams.forEach(t => {
    if (!qualified.includes(t.id)) { t.alive = false; t.exitRound = 'Group'; t.stage = 'Out · Group'; }
  });

  // ---- build knockout ----
  const order = seedOrder(32);
  const slots = order.map(seed => qualified[seed - 1]);

  const knockout = { R32: [] as Match[], R16: [] as Match[], QF: [] as Match[], SF: [] as Match[], TP: [] as Match[], FINAL: [] as Match[] };

  for (let i = 0; i < 16; i++) {
    const aId = slots[i * 2], bId = slots[i * 2 + 1];
    const [sa, sb] = playMatch(teams[aId], teams[bId]);
    let ssa = sa, ssb = sb;
    if (sa === sb) {
      if (strength(teams[aId]) + (rng() - 0.5) * 200 >= strength(teams[bId])) ssa = sa + 0.5; else ssb = sb + 0.5;
    }
    const winnerId = ssa > ssb ? aId : bId;
    const loserId = winnerId === aId ? bId : aId;
    teams[loserId].alive = false; teams[loserId].exitRound = 'R32'; teams[loserId].stage = 'Out · Round of 32';
    knockout.R32.push({
      id: 'R32-' + i, round: 'R32', aId, bId, sa, sb, winnerId, played: true,
      pens: sa === sb ? 'pens' : null,
      date: DATES.R32[i % 6] + ' · ' + KICKOFFS[i % 4],
    });
  }

  for (let i = 0; i < 8; i++) {
    const aId = knockout.R32[i * 2].winnerId!, bId = knockout.R32[i * 2 + 1].winnerId!;
    knockout.R16.push({
      id: 'R16-' + i, round: 'R16', aId, bId,
      aFrom: 'R32-' + (i * 2), bFrom: 'R32-' + (i * 2 + 1),
      sa: null, sb: null, winnerId: null, played: false,
      date: DATES.R16[i % 4] + ' · ' + KICKOFFS[i % 4],
    });
  }

  for (let i = 0; i < 4; i++) {
    knockout.QF.push({ id: 'QF-' + i, round: 'QF', aId: null, bId: null, aFrom: 'R16-' + (i * 2), bFrom: 'R16-' + (i * 2 + 1), sa: null, sb: null, winnerId: null, played: false, date: DATES.QF[i] + ' · ' + KICKOFFS[i % 4] });
  }
  for (let i = 0; i < 2; i++) {
    knockout.SF.push({ id: 'SF-' + i, round: 'SF', aId: null, bId: null, aFrom: 'QF-' + (i * 2), bFrom: 'QF-' + (i * 2 + 1), sa: null, sb: null, winnerId: null, played: false, date: DATES.SF[i] + ' · 8:00 PM' });
  }
  knockout.TP.push({ id: 'TP-0', round: 'TP', aId: null, bId: null, aFrom: 'SF-0', bFrom: 'SF-1', sa: null, sb: null, winnerId: null, played: false, date: DATES.TP[0] + ' · 5:00 PM', label: 'Third-place playoff' });
  knockout.FINAL.push({ id: 'F-0', round: 'FINAL', aId: null, bId: null, aFrom: 'SF-0', bFrom: 'SF-1', sa: null, sb: null, winnerId: null, played: false, date: DATES.FINAL[0] + ' · 3:00 PM', label: 'Final' });

  knockout.R16.forEach(m => {
    ([[m.aId, m.bId], [m.bId, m.aId]] as [number, number][]).forEach(([id, opp]) => {
      teams[id].alive = true; teams[id].stage = 'Round of 16';
      teams[id].nextGame = { opponentId: opp, round: 'Round of 16', date: m.date };
    });
  });

  // ---- assign owners ----
  const participants = PARTICIPANTS;
  let people: Person[];

  if (USE_SAMPLE_ASSIGNMENTS) {
    // auto-deal: shuffle all 48 teams and deal to 40 people round-robin
    const dealOrder = teams.map(t => t.id);
    for (let i = dealOrder.length - 1; i > 0; i--) {
      const j = rint(i + 1); [dealOrder[i], dealOrder[j]] = [dealOrder[j], dealOrder[i]];
    }
    people = participants.map(p => ({ ...p, teamIds: [], alive: false, aliveCount: 0, bestStage: 'Out', score: 0 }));
    dealOrder.forEach((teamId, k) => {
      const pid = k % people.length;
      teams[teamId].ownerId = pid;
      people[pid].teamIds.push(teamId);
    });
  } else {
    // use explicit assignments from assignments.ts
    people = participants.map(p => ({ ...p, teamIds: [], alive: false, aliveCount: 0, bestStage: 'Out', score: 0 }));
    participants.forEach(p => {
      p.teams.forEach(code => {
        const team = teams.find(t => t.code === code);
        if (team) { team.ownerId = p.id; people[p.id].teamIds.push(team.id); }
      });
    });
  }

  // ---- people aggregates ----
  people.forEach(p => {
    p.aliveCount = p.teamIds.filter(id => teams[id].alive).length;
    p.alive = p.aliveCount > 0;
    let best = -1, bestLabel = 'Out';
    p.teamIds.forEach(id => {
      const t = teams[id];
      const sr = STAGE_RANK[t.stage] ?? 0;
      if (sr > best) { best = sr; bestLabel = t.stage; }
    });
    p.bestStage = bestLabel;
    p.score = p.teamIds.reduce((acc, id) => {
      const t = teams[id];
      return acc + (t.alive ? 100 + t.groupStats.pts : t.exitRound === 'R32' ? 30 + t.groupStats.pts : t.groupStats.pts);
    }, 0);
  });

  // ---- prizes ----
  const groupCasualties = teams.filter(t => t.exitRound === 'Group');
  const worstTeam = groupCasualties.reduce((a, b) => (b.rank > a.rank ? b : a), groupCasualties[0]);
  const aliveByStrength = teams.filter(t => t.alive).sort((a, b) => a.rank - b.rank);

  // ---- highlights ----
  const knockoutTeams = teams.filter(t => t.exitRound !== 'Group');
  const underdogTeam = knockoutTeams.reduce((a, b) => (b.rank > a.rank ? b : a), knockoutTeams[0]);
  const highlights: Highlights = {
    underdogTeamId: underdogTeam?.id ?? null,
    championTeamId: knockout.FINAL[0]?.winnerId ?? null,
    thirdTeamId: knockout.TP[0]?.winnerId ?? null,
  };

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    meta: {
      name: 'World Cup 2026 Sweepstake',
      today: todayStr,
      hostLine: 'USA · Canada · Mexico',
      stageNow: 'Round of 16',
      phase: 'knockout',
      potText: '£10 buy-in · £400 pot',
      payoutText: '1st £240 · 3rd £100 · Worst £60',
    },
    teams,
    people,
    groups,
    knockout,
    fixtures: [...groupFixtures, ...knockout.R32, ...knockout.R16, ...knockout.QF, ...knockout.SF, ...knockout.TP, ...knockout.FINAL],
    highlights,
    prizes: {
      first: {
        title: '1st Place', sub: 'Owner of the champion', status: 'Open',
        note: '16 teams remain · decided ' + DATES.FINAL[0],
        favouriteTeamId: aliveByStrength[0].id,
      },
      third: {
        title: '3rd Place', sub: 'Owner of the bronze-medal team', status: 'Open',
        note: 'Decided at the 3rd-place playoff · ' + DATES.TP[0],
        favouriteTeamId: aliveByStrength[1].id,
      },
      worst: {
        title: 'Worst Team', sub: 'Lowest-ranked team out in the groups', status: 'Locked',
        note: 'Wooden spoon — already decided',
        teamId: worstTeam.id, ownerId: worstTeam.ownerId,
      },
    },
  };
}
