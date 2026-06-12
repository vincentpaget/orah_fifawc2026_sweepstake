// api-football.com client
// Activated when VITE_API_FOOTBALL_KEY is set in .env.local
// FIFA World Cup 2026 league ID: 1, season: 2026

const BASE = 'https://v3.football.api-sports.io';
const LEAGUE = 1;
const SEASON = 2026;

async function apiFetch(path: string, key: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': key },
  });
  if (!res.ok) throw new Error(`api-football ${path} → ${res.status}`);
  return res.json();
}

export async function fetchStandings(key: string) {
  return apiFetch(`/standings?league=${LEAGUE}&season=${SEASON}`, key);
}

export async function fetchFixtures(key: string) {
  return apiFetch(`/fixtures?league=${LEAGUE}&season=${SEASON}`, key);
}

export async function fetchTeams(key: string) {
  return apiFetch(`/teams?league=${LEAGUE}&season=${SEASON}`, key);
}
