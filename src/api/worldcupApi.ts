// In production the browser calls /api/worldcup (Vercel serverless function).
// In dev the Vite configureServer middleware handles /api/worldcup directly.
// Auth token is always injected server-side — the browser never needs it.

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

export async function fetchWorldCupData() {
  const res = await fetch('/api/worldcup');
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(body.error ?? `worldcup26.ir request failed: ${res.status}`);
  }
  const { teams, groups, games }: { teams: WcTeam[]; groups: WcGroup[]; games: WcGame[] } =
    await res.json();
  return { teams, groups, games };
}
