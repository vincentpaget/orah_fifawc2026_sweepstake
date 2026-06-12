import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const token = env.WC26_TOKEN || env.VITE_WC26_TOKEN || '';

  return {
    plugins: [
      react(),
      {
        name: 'wc26-dev-api',
        configureServer(server) {
          server.middlewares.use('/api/worldcup', async (_req, res) => {
            if (!token) {
              res.statusCode = 503;
              res.end(JSON.stringify({ error: 'WC26_TOKEN not set in .env.local' }));
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
              const [t, g, m] = await Promise.all([tr.json(), gr.json(), mr.json()]);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                teams:  t.teams  ?? t,
                groups: g.groups ?? g,
                games:  m.games  ?? m,
              }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
        },
      },
    ],
  };
});
