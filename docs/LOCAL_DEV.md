# Local development: website + app on one origin

One repo holds both:

- the app at the root (`src/`, `package.json`, Vite), served at `/app/`
- the marketing website in `website/` (plain HTML), served at `/`

They must share one origin. Supabase keeps the session in `localStorage`, which is per
origin, so the website's login only works for the app on the same origin. Two ports (say
5173 and 8080) are two origins, and the app would never see the website's login.

## Run it

```bash
npm install
npm run dev
```

Open **http://localhost:5173/** for the website, or **http://localhost:5173/app/** for the app.

The dev server serves both:

- `/app/...` is the Vite app (`base: '/app/'` in `vite.config.ts`).
- Everything else is a static file from `website/`, served by the dev-only
  `forka-serve-website` plugin in `vite.config.ts`. `/` serves `website/index.html`.

To serve the website from another folder, set `FORKA_WEBSITE_DIR`, for example
`FORKA_WEBSITE_DIR=../somewhere npm run dev`.

## What to expect

- Logged out, `/app/` sends you to `/login.html`.
- Log in on `/login.html` and you land on `/app/`, signed in.
- Sign out in the app (Settings) and you land on `/`.

Supabase must allow the local redirect URLs: add `http://localhost:5173/**` under
Authentication → URL Configuration → Redirect URLs.

## Production build (what Vercel runs)

```bash
npm run build && cp -R website/. dist/
```

This is the `buildCommand` in `vercel.json`:

- the app builds to `dist/app/`
- the website is copied to the root of `dist/`
- deep links under `/app/` fall back to `/app/index.html`

The public Supabase URL and anon key come from `.env.production`. Vercel environment
variables override them if you set any.
