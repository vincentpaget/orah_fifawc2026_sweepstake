// Vercel serverless proxy — adds the WC26_TOKEN server-side so the browser
// never needs it and worldcup26.ir's CORS restriction is bypassed.
export default async function handler(req: any, res: any) {
  const token = process.env.WC26_TOKEN;
  if (!token) {
    res.status(503).json({ error: 'WC26_TOKEN not configured on this server' });
    return;
  }

  const parts = req.query.path;
  const path = Array.isArray(parts) ? parts.join('/') : (parts ?? '');

  try {
    const upstream = await fetch(`https://worldcup26.ir/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await upstream.text();
    res.statusCode = upstream.status;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.end(body);
  } catch (err) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: String(err) }));
  }
}
