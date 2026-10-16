# Local development: website + app on one origin

The app runs at `/app/` and the website (login, signup, marketing pages) at `/`, on the
same origin. That matters: Supabase keeps the session in `localStorage`, which is per
origin, so the website and the app must share one. Two ports (say 5173 and 8080) are two
origins, and the app would never see the website's login.

## Run it

```bash
npm install
npm run dev
```

Then open **http://localhost:5173/** (the website) or **http://localhost:5173/app/** (the app).

The dev server serves both:

- `/app/...` is the Vite app (`base: '/app/'` in `vite.config.ts`).
- Everything else is a static file from the website folder, served by the dev-only
  `forka-serve-website` plugin in `vite.config.ts`. `/` serves `index.html`.

The website folder defaults to `./TryForka-mainWebsite` (git-ignored here; it is its own
repo). If your checkout of the `TryForka` repo lives somewhere else, point at it:

```bash
FORKA_WEBSITE_DIR=../TryForka npm run dev
```

If the folder isn't found the dev server still starts, logs a warning and serves only `/app/`.

## What to expect

- Logged out, `/app/` sends you to `/login.html`.
- Log in on `/login.html` and you land on `/app/`, signed in.
- Sign out in the app (Settings) and you land on `/`.

Supabase must allow the local redirect URLs: add `http://localhost:5173/**` under
Authentication → URL Configuration → Redirect URLs (see `docs/WEBSITE_LINK_REPORT.md`).

## Production build

```bash
npm run build      # outputs dist/app/ (served at /app/)
npm run preview    # http://localhost:4173/app/ (app only; the website isn't served here)
```

The build goes to `dist/app/` so its files sit under `/app/` on the app's Vercel
deployment. `vercel.json` sends deep links under `/app/` to `/app/index.html`.
