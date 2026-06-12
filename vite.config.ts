import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const token = env.WC26_TOKEN || env.VITE_WC26_TOKEN || '';

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/wc26': {
          target: 'https://worldcup26.ir',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/wc26/, ''),
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      },
    },
  };
});
