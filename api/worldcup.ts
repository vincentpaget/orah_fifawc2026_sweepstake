// Vercel serverless function — calls worldcup26.ir server-side so the
// WC26_TOKEN never reaches the browser and CORS is bypassed.
export default async function handler(req: any, res: any) {
  const token = process.env.WC26_TOKEN;
  if (!token) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'WC26_TOKEN not configured on this server' }));
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [tr, gr, mr] = await Promise.all([
      fetch('https://worldcup26.ir/get/teams',  { headers }),
      fetch('https://worldcup26.ir/get/groups', { headers }),
      fetch('https://worldcup26.ir/get/games',  { headers }),
    ]);

    if (!tr.ok || !gr.ok || !mr.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({
        error: `worldcup26.ir failed — teams:${tr.status} groups:${gr.status} games:${mr.status}`,
      }));
      return;
    }

    const [teamsBody, groupsBody, gamesBody] = await Promise.all([
      tr.json(),
      gr.json(),
      mr.json(),
    ]);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.end(JSON.stringify({
      teams:  teamsBody.teams  ?? teamsBody,
      groups: groupsBody.groups ?? groupsBody,
      games:  gamesBody.games   ?? gamesBody,
    }));
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(err) }));
  }
}
