# Website link report (2026-10-16)

tryforka.com and the Forka app are now one product. People log in or sign up on the
website and land in the app at `tryforka.com/app/`, already signed in. Signing out of the
app takes them back to tryforka.com.

## How it's set up

One repo (`TryForka/TryForka`) and one Vercel project:

| Path in the repo | Served at | What it is |
|---|---|---|
| `website/` | `tryforka.com/` | The marketing site: home, login, signup, reset password and the other pages. Plain HTML. |
| root (`src/`, `package.json`) | `tryforka.com/app/` | The app (Vite + React). |

`vercel.json` builds the app, copies `website/` to the root of the output, and sends deep
links under `/app/` to the app.

The website and the app share one origin, and that is what makes the login carry over.
Supabase keeps the session in `localStorage`, which is per origin, so the session the
website creates is the session the app reads.

## What happened on `main` today, and the fix

The upload "Commit #5 (first vercel launch)" put the app at the root of the repo.

- **It removed the website pages.** Because `vercel.json` sends `/` to `/app/`, logged-out
  visitors to tryforka.com end up on `/login.html`, which no longer existed: a 404 page.
- **Vercel had no Supabase settings,** so the live app couldn't start.
- **The GitHub web uploader skips hidden files,** so `.gitignore` didn't go up and
  `node_modules` (10,209 files) and `dist` were committed. The good news: `.env.local`
  didn't go up either. No secrets are in the repo.

Branch `website-link` fixes all three:

- The website goes back in, under `website/`, with the login changes below.
- `.env.production` holds the public Supabase URL and anon key. Both are public by
  design; they were already on the website. Vercel environment variables override them
  if you set any.
- `.gitignore` is restored, and `node_modules`, `dist`, `.DS_Store` and `supabase/.temp`
  are no longer tracked.

**To make it live, merge `website-link` into `main`.** On GitHub, open a pull request from
`website-link` and merge it. Vercel deploys `main`.

## Your checklist

### 1. Supabase → Authentication → URL Configuration

- **Site URL:** `https://tryforka.com`
- **Redirect URLs** (add each one):
  - `https://tryforka.com/app/**`
  - `https://tryforka.com/reset-password.html`
  - `http://localhost:5173/**` (local dev, see `docs/LOCAL_DEV.md`)
  - Vercel previews: `https://*-<your-vercel-team-slug>.vercel.app/**`. Your team slug is
    in the Vercel dashboard URL (`vercel.com/<team-slug>`). This only matters if you test
    log in on preview deployments.

### 2. Google sign-in (Supabase → Authentication → Sign In / Providers → Google)

Google is switched off right now. Until you turn it on, the Google button lands on a
Supabase error page. Either finish these steps before launch or ask me to hide the button.

1. In [Google Cloud Console](https://console.cloud.google.com/), create or pick a project.
2. **APIs & Services → OAuth consent screen:**
   - App name `Forka` and your support email.
   - Authorized domains: `tryforka.com` and `akufkhzzqwjhssmegvof.supabase.co`.
   - Scopes: `openid`, `email` and `profile`.
   - Add links to `https://tryforka.com/privacy.html` and `https://tryforka.com/terms.html`.
   - Publish the app, so it isn't left in "Testing".
3. **APIs & Services → Credentials → Create credentials → OAuth client ID:**
   - Type **Web application**.
   - Authorized JavaScript origins: `https://tryforka.com`.
   - **Authorized redirect URI, exactly:** `https://akufkhzzqwjhssmegvof.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client secret into the Supabase Google provider, and turn it on.

### 3. Vercel

- Nothing to fill in. `vercel.json` sets the build command (`npm run build && cp -R website/. dist/`)
  and the output directory (`dist`).
- If the Vercel project's settings override the build command or the output directory,
  clear those overrides so `vercel.json` is used.
- After the merge, check these:
  - `https://tryforka.com/` shows the website.
  - `https://tryforka.com/app/` sends you to the log-in page.
  - Logging in lands in the app.

### 4. Other things that block a public launch

- **Email confirmation is still off** (from earlier testing). Turn it on: Authentication →
  Sign In / Providers → Email → Confirm email.
  - With it on, signup shows "Check your email to confirm your account…".
  - The confirmation link opens `/app/`, signed in, at onboarding. That's why
    `https://tryforka.com/app/**` must be in the redirect URLs.
- **Set up custom SMTP** (Authentication → Emails → SMTP settings) with a sender like
  Resend, Postmark or SES.
  - Supabase's built-in email sender is heavily rate limited.
  - Testing hit it: the second password-reset email within a minute got a `429`.
- **Google sign-in** (section 2).
- **This repo is public.** Anyone can read the app's code, the internal docs, and the QA
  account details in `docs/BUILD_REPORT.md`. Make the repo private (GitHub → Settings →
  General → Danger Zone → Change visibility) unless you want it open. Vercel keeps
  deploying a private repo.
- **Website copy vs the app:**
  - The website promises a "2-week free trial", "248+ families", "AI meal plans in under
    10 seconds" and named testimonials.
  - The app shows a "Free plan" and has no trial or billing.
- **"Join Waitlist" and "Try Forka Free"** are unchanged, as you asked. "Try Forka Free"
  goes to `signup.html`, which now creates a real account.

## What changed

### Website (`website/`)

| File | Change |
|---|---|
| `js/forka-auth.js` (new) | One shared Supabase client. supabase-js is pinned to `2.103.3`, the app's installed version. It uses the same project URL and anon key as the app, and the default storage key. Also exports `goToApp()` (goes to `/app/`) and `getSession()`. |
| `js/nav-auth.js` (new) | When someone is signed in, the nav "Log in" button (desktop and mobile menu) becomes "Open app", linking to `/app/`. |
| Every `.html` page | One line: `<script type="module" src="js/nav-auth.js">`. No other nav items or CTAs changed. |
| `login.html` | Real `signInWithPassword`, then `/app/`. The error messages are the three you specified, and the button shows "Logging in" while it runs. "Forgot password?" calls `resetPasswordForEmail` with `redirectTo` set to `/reset-password.html`; with an empty email field it focuses the field and asks for it. Remember me is removed. Google goes to `/app/`. Apple is commented out. If already signed in, the page goes straight to `/app/`. |
| `signup.html` | Real `signUp`. The name goes in `options.data.full_name`, the key the app reads. `emailRedirectTo` is `/app/`. With a session it goes to `/app/` (onboarding); without one it shows the "check your email" state. Duplicate email shows "There's already an account with that email. Log in instead." with a link. Validation messages appear under each field instead of `alert()`. The terms link goes to `terms.html`. Google and Apple are handled as on login. If already signed in, the page goes to `/app/`. |
| `reset-password.html` (new) | Same layout as `login.html`. Takes a new password, calls `updateUser({ password })`, then goes to `/app/`. An expired or used link shows a message linking back to log in. |
| `waitlist.html` | Imports the shared client instead of creating its own unpinned one. |

### App (repo root)

| File | Change |
|---|---|
| `vite.config.ts` | `base: '/app/'`. The build goes to `dist/app/`. A dev-only plugin serves `website/` on the same dev server (`docs/LOCAL_DEV.md`). |
| `vercel.json` | Builds the app, copies `website/` to the output root, and sends `/app/*` to `/app/index.html`. |
| `.env.production` (new) | The public Supabase URL and anon key for builds. |
| `.gitignore` | Restored. Also ignores `supabase/.temp/`. |
| `src/lib/supabase.ts` | Still uses default options, which keeps the default storage key and `detectSessionInUrl: true`. Adds the website URLs, `signOutToWebsite()`, and detection of a password-reset link landing on `/app/`. |
| `src/App.tsx` | With no session, the app redirects to `/login.html` and shows a blank `canvas` screen during the check. A `PASSWORD_RECOVERY` event sends people to `/reset-password.html`. Onboarding's sign out goes to `/`. The `/styleguide` dev page moved to `/app/styleguide`. |
| `src/screens/Settings.tsx` | Sign out and Delete account both finish on `/`. |
| `src/screens/Auth.tsx` | Kept in the code but no longer reachable. Facebook is removed. |
| `src/components/Shell.tsx`, `src/screens/Auth.tsx`, `src/lib/timers.ts` | Logo paths use `BASE_URL`, so they work under `/app/`. |

Things I checked that needed no change:

- **No custom `storageKey` or `auth.storage`.** The app already used the defaults.
- **`forka_onboarding_complete` isn't in the app.** Onboarding is stored in the database
  (`preferences.onboarded_at`), so it works the same on any path.
- **The app's two `localStorage` keys keep working under `/app/`.** These are the running
  timers and the browse hint. `localStorage` is per origin, not per path.
- **Edge functions allow any origin**, so calls from tryforka.com work.

## Test results

- The tests drove a real browser (Playwright, Chromium) on one origin.
- Logins used the QA account `forka.qa.build.1792121464616@mailinator.com`.
- Each run made a new account on `signup.html`, then deleted it with the app's Delete account.
- Every check ran on the dev server at desktop width (1280x800) and phone width (390x844).
- Every check also ran against the **production build**: `vercel.json`'s build command,
  with the output served the way Vercel serves it, at desktop width. All passed.
- Screenshots are in `docs/screens/website-link/` (`desktop-*` and `phone-*`).

| # | Check | Desktop | Phone | Production build |
|---|---|---|---|---|
| 1 | Logged out, `/app/` → `/login.html` | Pass | Pass | Pass |
| 2 | Log in on `login.html` → meal plan, signed in | Pass | Pass | Pass |
| 3 | Reload `/app/` → still signed in; deep links under `/app/` load the app | Pass | Pass | Pass |
| 4 | Signed in: `/login.html` and `/signup.html` → `/app/`; nav shows "Open app" | Pass | Pass | Pass |
| 5 | Sign up on `signup.html` → onboarding; the typed name shows in Settings | Pass | Pass | Pass |
| 5a | Inline signup errors, no `alert()`; terms link → `terms.html` | Pass | Pass | Pass |
| 5b | Existing email → "There's already an account with that email. Log in instead." | Pass | Pass | Pass |
| 6 | Wrong password → error message, no redirect | Pass | Pass | Pass |
| 7 | Forgot password sends `POST /auth/v1/recover` with `redirect_to=…/reset-password.html` | Pass (200) | Pass (request sent; 429 rate limit, and the page showed "Couldn't send…") | Pass (200) |
| 7b–d | Empty-email prompt; expired-link message; new password saved → `/app/` | Pass | Pass | Pass |
| 8 | Sign out → `/`, nav shows "Log in", session removed | Pass | Pass | Pass |
| 8b | Delete account → `/`, signed out | Pass | Pass | Pass |
| 9 | Google sends `/auth/v1/authorize?provider=google&redirect_to=…/app/` (the test intercepted the request) | Pass | Pass | Pass |
| 9b | Apple and Remember me hidden | Pass | Pass | Pass |
| 11 | `npm run build` passes on a clean `npm ci` | Pass | | Pass |
| 11 | Key scan: no `sk-ant-` or `service_role` in any client file or in the app's git history. The only JWT found is the anon key | Pass | | |

### Not tested end to end

- **Receiving the reset email.** The page's code path was tested with a signed-in session.
- **The app's own `PASSWORD_RECOVERY` redirect.** It needs a real recovery link.
- **Google sign-in completing.** The provider is off.
- **The live Vercel deploy.** It happens when you merge.

### Accounts created

Three test accounts (`forka.qa.weblink.*@mailinator.com`) were created and deleted with
the app's Delete account.
