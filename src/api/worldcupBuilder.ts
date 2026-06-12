import type { SweepData, Team, Person, Group, Match, Knockout, Flag, FlagKind, Highlights } from '../types';
import { PARTICIPANTS, USE_SAMPLE_ASSIGNMENTS } from '../data/assignments';
import { fetchWorldCupData } from './worldcupApi';

const f = (kind: FlagKind, ...colors: string[]): Flag => ({ kind, colors });

const FLAG_BY_CODE: Record<string, Flag> = {
  // Group A
  MEX: f('v', '#006847', '#ffffff', '#CE1126'),
  RSA: f('h', '#007A4D', '#FFB81C', '#007A4D'),
  KOR: f('disc', '#ffffff', '#003478'),
  CZE: f('v', '#D7141A', '#ffffff', '#11457E'),
  // Group B
  CAN: f('solid', '#FF0000'),
  BIH: f('diag', '#003DA5', '#FFCC00'),
  QAT: f('v2', '#ffffff', '#8A1538'),
  SUI: f('cross', '#FF0000', '#ffffff'),
  // Group C
  BRA: f('diag', '#009C3B', '#FFDF00'),
  MAR: f('disc', '#C1272D', '#006233'),
  HAI: f('h2', '#00209F', '#D21034'),
  SCO: f('cross', '#005EB8', '#ffffff'),
  // Group D
  USA: f('canton', '#B22234', '#3C3B6E', '#ffffff'),
  PAR: f('h', '#D52B1E', '#ffffff', '#0038A8'),
  AUS: f('solid', '#00247D'),
  TUR: f('disc', '#E30A17', '#ffffff'),
  // Group E
  GER: f('h', '#1A1A1A', '#DD0000', '#FFCE00'),
  CUW: f('h', '#002B7F', '#F9E814', '#002B7F'),
  CIV: f('v', '#FF8200', '#ffffff', '#009A44'),
  ECU: f('h', '#FFDD00', '#034EA2', '#ED1C24'),
  // Group F
  NED: f('h', '#AE1C28', '#ffffff', '#21468B'),
  JPN: f('disc', '#ffffff', '#BC002D'),
  SWE: f('cross', '#006AA7', '#FECC02'),
  TUN: f('disc', '#E70013', '#ffffff'),
  // Group G
  BEL: f('v', '#1A1A1A', '#FAE042', '#ED2939'),
  EGY: f('h', '#CE1126', '#ffffff', '#1A1A1A'),
  IRN: f('h', '#239F40', '#ffffff', '#DA0000'),
  NZL: f('canton', '#00247D', '#CC142B', '#ffffff'),
  // Group H
  ESP: f('h', '#AA151B', '#F1BF00', '#AA151B'),
  CPV: f('h', '#003893', '#CF2027', '#003893'),
  KSA: f('solid', '#006C35'),
  URU: f('h2', '#0038A8', '#ffffff'),
  // Group I
  FRA: f('v', '#0055A4', '#ffffff', '#EF4135'),
  SEN: f('v', '#00853F', '#FDEF42', '#E31B23'),
  IRQ: f('h', '#000000', '#ffffff', '#CE1126'),
  NOR: f('cross', '#BA0C2F', '#00205B'),
  // Group J
  ARG: f('h', '#75AADB', '#ffffff', '#75AADB'),
  ALG: f('v2', '#006233', '#ffffff'),
  AUT: f('h', '#ED2939', '#ffffff', '#ED2939'),
  JOR: f('v', '#007A3D', '#ffffff', '#CE1126'),
  // Group K
  POR: f('v2', '#006600', '#FF0000'),
  COD: f('diag', '#007FFF', '#F7D618'),
  UZB: f('h', '#1EB53A', '#ffffff', '#CE1126'),
  COL: f('h', '#FCD116', '#003893', '#CE1126'),
  // Group L
  ENG: f('cross', '#ffffff', '#CF142B'),
  CRO: f('h', '#FF0000', '#ffffff', '#171796'),
  GHA: f('h', '#CE1126', '#FCD116', '#006B3F'),
  PAN: f('canton', '#D21034', '#005293', '#ffffff'),
  DEFAULT: f('solid', '#9E9E9E'),
};

const FIFA_RANK_BY_CODE: Record<string, number> = {
  ARG: 1, FRA: 2, ESP: 3, ENG: 4, BRA: 5, POR: 6, NED: 7, BEL: 8,
  CRO: 9, COL: 10, GER: 11, URU: 12, MEX: 13, MAR: 14, USA: 15, JPN: 17,
  SEN: 18, SUI: 19, IRN: 21, KOR: 22, AUS: 23, SWE: 24, ECU: 26,
  AUT: 28, NOR: 30, EGY: 31, CIV: 33, GHA: 35, TUN: 36, ALG: 37,
  KSA: 38, QAT: 39, TUR: 40, PAN: 41, PAR: 42, SCO: 46, CAN: 49,
  IRQ: 53, JOR: 54, UZB: 55, COD: 56, CZE: 57, RSA: 64, BIH: 70,
  NZL: 79, CPV: 83, HAI: 89, CUW: 105,
};

const GAME_TYPE_TO_KEY: Record<string, keyof Knockout | undefined> = {
  r32: 'R32', r16: 'R16', qf: 'QF', sf: 'SF', third: 'TP', final: 'FINAL',
};

const ROUND_LABEL: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarter-final',
  SF: 'Semi-final', TP: '3rd place playoff', FINAL: 'Final',
};

function parseLocalDate(localDate: string): string {
  const [datePart, timePart] = localDate.split(' ');
  const [mo, da, yr] = datePart.split('/');
  const d = new Date(parseInt(yr), parseInt(mo) - 1, parseInt(da),
    parseInt(timePart.split(':')[0]), parseInt(timePart.split(':')[1]));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export async function buildFromWorldCup(): Promise<SweepData> {
  const { teams: apiTeams, groups: apiGroups, games: apiGames } = await fetchWorldCupData();

  // ---- Build team map (API id → Team) ----
  const teamByApiId = new Map<string, Team>();
  let teamIndex = 0;
  apiTeams.forEach(at => {
    const code = at.fifa_code;
    teamByApiId.set(at.id, {
      id: teamIndex++,
      name: at.name_en,
      code,
      rank: FIFA_RANK_BY_CODE[code] ?? 99,
      flag: FLAG_BY_CODE[code] ?? FLAG_BY_CODE.DEFAULT,
      group: at.groups,
      groupStats: { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, pos: 0 },
      alive: true,
      exitRound: null,
      stage: 'Group Stage',
      ownerId: 0,
      nextGame: null,
    });
  });

  // ---- Update group standings ----
  apiGroups.forEach(ag => {
    const sorted = [...ag.teams].sort((a, b) => {
      const pd = parseInt(b.pts) - parseInt(a.pts);
      if (pd !== 0) return pd;
      const gdd = parseInt(b.gd) - parseInt(a.gd);
      if (gdd !== 0) return gdd;
      const gfd = parseInt(b.gf) - parseInt(a.gf);
      if (gfd !== 0) return gfd;
      return parseInt(a.team_id) - parseInt(b.team_id);
    });
    sorted.forEach((entry, pos) => {
      const team = teamByApiId.get(entry.team_id);
      if (!team) return;
      team.groupStats = {
        p: parseInt(entry.mp), w: parseInt(entry.w), d: parseInt(entry.d),
        l: parseInt(entry.l), gf: parseInt(entry.gf), ga: parseInt(entry.ga),
        gd: parseInt(entry.gd), pts: parseInt(entry.pts), pos: pos + 1,
      };
    });
  });

  const teams = Array.from(teamByApiId.values()).sort((a, b) => a.id - b.id);

  // ---- Build groups (sorted A–L) ----
  const groupMap = new Map<string, Team[]>();
  teams.forEach(t => {
    if (!groupMap.has(t.group)) groupMap.set(t.group, []);
    groupMap.get(t.group)!.push(t);
  });
  const groups: Group[] = Array.from(groupMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, gTeams]) => ({
      letter,
      teamIds: [...gTeams].sort((a, b) => a.groupStats.pos - b.groupStats.pos).map(t => t.id),
    }));

  // ---- Classify games ----
  const groupGames = apiGames.filter(g => g.type === 'group');
  const knockoutGames = apiGames.filter(g => g.type !== 'group');

  const groupStageComplete = groupGames.length > 0 && groupGames.every(g => g.finished === 'TRUE');

  // Teams that appear in any knockout slot (team_id ≠ "0")
  const teamsInKnockout = new Set<string>();
  knockoutGames.forEach(g => {
    if (g.home_team_id !== '0') teamsInKnockout.add(g.home_team_id);
    if (g.away_team_id !== '0') teamsInKnockout.add(g.away_team_id);
  });

  if (groupStageComplete) {
    teamByApiId.forEach((team, apiId) => {
      if (!teamsInKnockout.has(apiId)) {
        team.alive = false;
        team.exitRound = 'Group';
        team.stage = 'Out · Group';
      }
    });
  }

  // ---- Build group fixtures ----
  const groupFixtures: Match[] = groupGames
    .sort((a, b) => a.local_date.localeCompare(b.local_date))
    .map(game => {
      const played = game.finished === 'TRUE';
      const homeTeam = teamByApiId.get(game.home_team_id) ?? null;
      const awayTeam = teamByApiId.get(game.away_team_id) ?? null;
      const sa = parseInt(game.home_score);
      const sb = parseInt(game.away_score);
      const winnerId = played && homeTeam && awayTeam
        ? (sa > sb ? homeTeam.id : sb > sa ? awayTeam.id : null)
        : null;
      const groupLetter = homeTeam?.group ?? awayTeam?.group ?? '?';
      return {
        id: `G-${game.id}`,
        round: `Group ${groupLetter}`,
        aId: homeTeam?.id ?? null,
        bId: awayTeam?.id ?? null,
        sa: played ? sa : null,
        sb: played ? sb : null,
        winnerId,
        played,
        pens: null,
        date: parseLocalDate(game.local_date),
      };
    });

  // ---- Build knockout bracket ----
  const knockout: Knockout = { R32: [], R16: [], QF: [], SF: [], TP: [], FINAL: [] };

  const gamesByType = new Map<string, typeof knockoutGames>();
  knockoutGames.forEach(g => {
    if (!gamesByType.has(g.type)) gamesByType.set(g.type, []);
    gamesByType.get(g.type)!.push(g);
  });
  gamesByType.forEach(games => games.sort((a, b) => parseInt(a.id) - parseInt(b.id)));

  gamesByType.forEach((games, type) => {
    const key = GAME_TYPE_TO_KEY[type];
    if (!key) return;

    games.forEach((game, idx) => {
      const played = game.finished === 'TRUE';
      const homeTeam = game.home_team_id !== '0' ? teamByApiId.get(game.home_team_id) ?? null : null;
      const awayTeam = game.away_team_id !== '0' ? teamByApiId.get(game.away_team_id) ?? null : null;
      const sa = parseInt(game.home_score);
      const sb = parseInt(game.away_score);

      let winnerId: number | null = null;
      let loserId: number | null = null;
      if (played && homeTeam && awayTeam) {
        if (sa > sb) { winnerId = homeTeam.id; loserId = awayTeam.id; }
        else if (sb > sa) { winnerId = awayTeam.id; loserId = homeTeam.id; }
        // Equal score after 90min → extra time / pens handled by API updating score
      }

      if (loserId !== null) {
        const loser = teams[loserId];
        if (loser?.alive) {
          loser.alive = false;
          loser.exitRound = key as Team['exitRound'];
          loser.stage = 'Out · ' + ROUND_LABEL[key];
        }
      }
      if (winnerId !== null && teams[winnerId]) {
        teams[winnerId].stage = ROUND_LABEL[key];
      }

      knockout[key].push({
        id: `${key}-${idx}`,
        round: key,
        aId: homeTeam?.id ?? null,
        bId: awayTeam?.id ?? null,
        aFrom: homeTeam ? undefined : game.home_team_label,
        bFrom: awayTeam ? undefined : game.away_team_label,
        sa: played ? sa : null,
        sb: played ? sb : null,
        winnerId,
        played,
        pens: null,
        date: parseLocalDate(game.local_date),
      });
    });
  });

  // ---- Next game for group-stage teams ----
  const upcomingGroup = groupGames
    .filter(g => g.finished === 'FALSE')
    .sort((a, b) => a.local_date.localeCompare(b.local_date));

  upcomingGroup.forEach(g => {
    const home = teamByApiId.get(g.home_team_id);
    const away = teamByApiId.get(g.away_team_id);
    const dateStr = parseLocalDate(g.local_date);
    if (home?.alive && !home.nextGame)
      home.nextGame = { opponentId: away?.id ?? 0, round: 'Group Stage', date: dateStr };
    if (away?.alive && !away.nextGame)
      away.nextGame = { opponentId: home?.id ?? 0, round: 'Group Stage', date: dateStr };
  });

  // ---- Next game for knockout teams ----
  knockoutGames
    .filter(g => g.finished === 'FALSE' && g.home_team_id !== '0')
    .sort((a, b) => parseInt(a.id) - parseInt(b.id))
    .forEach(g => {
      const home = teamByApiId.get(g.home_team_id);
      const away = teamByApiId.get(g.away_team_id);
      const key = GAME_TYPE_TO_KEY[g.type];
      const dateStr = parseLocalDate(g.local_date);
      const label = key ? ROUND_LABEL[key] : 'Knockout';
      if (home?.alive && !home.nextGame)
        home.nextGame = { opponentId: away?.id ?? 0, round: label, date: dateStr };
      if (away?.alive && !away.nextGame)
        away.nextGame = { opponentId: home?.id ?? 0, round: label, date: dateStr };
    });

  // ---- Current stage ----
  let stageNow = 'Group Stage';
  if (knockout.FINAL.some(m => m.played)) stageNow = 'Finished';
  else if (knockout.SF.some(m => m.played)) stageNow = 'Semi-finals';
  else if (knockout.QF.some(m => m.played)) stageNow = 'Quarter-finals';
  else if (knockout.R16.some(m => m.played)) stageNow = 'Round of 16';
  else if (knockout.R32.some(m => m.played)) stageNow = 'Round of 32';
  else if (groupStageComplete) stageNow = 'Knockout';

  // ---- Assign owners ----
  const people: Person[] = PARTICIPANTS.map(p => ({
    ...p, teamIds: [], alive: false, aliveCount: 0, bestStage: 'Out', score: 0,
  }));

  if (USE_SAMPLE_ASSIGNMENTS || PARTICIPANTS.every(p => p.teams.length === 0)) {
    [...teams].sort((a, b) => a.name.localeCompare(b.name)).forEach((t, k) => {
      const pid = k % people.length;
      t.ownerId = pid;
      people[pid].teamIds.push(t.id);
    });
  } else {
    PARTICIPANTS.forEach(p => {
      p.teams.forEach(code => {
        const team = teams.find(t => t.code === code);
        if (team) { team.ownerId = p.id; people[p.id].teamIds.push(team.id); }
      });
    });
  }

  // ---- People aggregates ----
  const STAGE_RANK: Record<string, number> = {
    'Group Stage': 0, 'Out · Group': 0,
    'Round of 32': 1, 'Out · Round of 32': 1,
    'Round of 16': 2, 'Out · Round of 16': 2,
    'Quarter-final': 3, 'Out · Quarter-final': 3,
    'Semi-final': 4, 'Out · Semi-final': 4,
    '3rd place playoff': 5, 'Out · 3rd place playoff': 5,
    'Final': 6,
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
      if (t.alive) return acc + 100 + t.groupStats.pts;
      return acc + (t.exitRound === 'R32' ? 40 : t.exitRound === 'Group' ? t.groupStats.pts : 60);
    }, 0);
  });

  // ---- Highlights ----
  const knockoutTeamSet = new Set(
    [...teamByApiId.entries()]
      .filter(([apiId]) => teamsInKnockout.has(apiId))
      .map(([, t]) => t.id)
  );
  const knockoutTeamsList = teams.filter(t => knockoutTeamSet.has(t.id));
  const underdogTeam = knockoutTeamsList.length > 0
    ? knockoutTeamsList.reduce((a, b) => (b.rank > a.rank ? b : a))
    : null;
  const highlights: Highlights = {
    underdogTeamId: underdogTeam?.id ?? null,
    championTeamId: knockout.FINAL[0]?.winnerId ?? null,
    thirdTeamId: knockout.TP[0]?.winnerId ?? null,
  };

  // ---- Prizes ----
  const groupCasualties = teams.filter(t => t.exitRound === 'Group');
  const worstTeam = groupCasualties.length > 0
    ? groupCasualties.reduce((a, b) => (b.rank > a.rank ? b : a))
    : teams[teams.length - 1];
  const aliveByRank = teams.filter(t => t.alive).sort((a, b) => a.rank - b.rank);

  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const finalDate = knockout.FINAL[0]?.date ?? '—';
  const tpDate = knockout.TP[0]?.date ?? '—';

  return {
    meta: {
      name: 'World Cup 2026 Sweepstake',
      today: todayStr,
      hostLine: 'USA · Canada · Mexico',
      stageNow,
      phase: groupStageComplete ? 'knockout' : 'group',
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
        favouriteTeamId: worstTeam.id,
        note: groupCasualties.length > 0
          ? 'Wooden spoon — already decided'
          : 'Decided when group stage ends',
        teamId: worstTeam.id,
        ownerId: worstTeam.ownerId,
      },
    },
  };
}
