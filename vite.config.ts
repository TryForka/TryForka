import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The app lives at tryforka.com/app/, on the same origin as the website, so the Supabase
// session the website's login page creates is the one the app reads.

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
};

/**
 * Dev only: serves the marketing website's static files at the root of the dev server,
 * so the website and the app share one local origin (see docs/LOCAL_DEV.md).
 * Set FORKA_WEBSITE_DIR to point at the website repo; defaults to ./TryForka-mainWebsite.
 */
function serveWebsite(): Plugin {
  const root = path.resolve(__dirname, process.env.FORKA_WEBSITE_DIR || 'TryForka-mainWebsite');
  return {
    name: 'forka-serve-website',
    apply: 'serve',
    configureServer(server) {
      if (!fs.existsSync(root)) {
        server.config.logger.warn(`[forka] website folder not found at ${root}; only /app/ is served.`);
        return;
      }
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '/').split(/[?#]/)[0];
        if (url === '/app') {
          res.statusCode = 302;
          res.setHeader('Location', '/app/' + (req.url || '').slice(4));
          return res.end();
        }
        if (url.startsWith('/app/')) return next();
        const rel = decodeURIComponent(url === '/' ? '/index.html' : url);
        const file = path.join(root, rel);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
        fs.createReadStream(file).pipe(res);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/app/',
  // Built into dist/app/ so the files sit at /app/ on the app's Vercel deployment too.
  build: { outDir: 'dist/app' },
  plugins: [react(), tailwindcss(), serveWebsite()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
