// Routed through Vite proxy (/api/wc26 → https://worldcup26.ir) to avoid CORS.
const BASE = '/api/wc26';

export interface WcTeam {
  id: string;
  name_en: string;
  flag: string;
  fifa_code: string;
  iso2: string;
  groups: string;
}

export interface WcGroupEntry {
  team_id: string;
  mp: string;
  w: string;
  d: string;
  l: string;
  pts: string;
  gf: string;
  ga: string;
  gd: string;
}

export interface WcGroup {
  name: string;
  teams: WcGroupEntry[];
}

export interface WcGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  group: string;
  matchday: string;
  local_date: string;
  finished: string;
  time_elapsed: string;
  type: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
}

export async function fetchWorldCupData(token: string) {
  const headers = { Authorization: `Bearer ${token}` };
  const [tr, gr, mr] = await Promise.all([
    fetch(`${BASE}/get/teams`, { headers }),
    fetch(`${BASE}/get/groups`, { headers }),
    fetch(`${BASE}/get/games`, { headers }),
  ]);
  if (!tr.ok || !gr.ok || !mr.ok) throw new Error('worldcup26.ir request failed');
  const teams: WcTeam[] = (await tr.json()).teams;
  const groups: WcGroup[] = (await gr.json()).groups;
  const games: WcGame[] = (await mr.json()).games;
  return { teams, groups, games };
}
