# Website link report (2026-10-16)

tryforka.com and the Forka app are now one product. People log in or sign up on the
website and land in the app at `tryforka.com/app/`, already signed in. Signing out of the
app takes them back to tryforka.com.

It works because the website and the app share one origin. Supabase stores the session in
the browser's `localStorage`, which is per origin. So the app is served from
`tryforka.com/app/`: the website's Vercel project proxies `/app` to the app's Vercel
project, and the browser never leaves tryforka.com.

Nothing is pushed, deployed or merged. Both repos have the work on a local branch
named `website-link`.

## Your checklist

### 1. Supabase → Authentication → URL Configuration

- **Site URL:** `https://tryforka.com`
- **Redirect URLs** (add each one):
  - `https://tryforka.com/app/**`
  - `https://tryforka.com/reset-password.html`
  - `http://localhost:5173/**` (local dev, see `docs/LOCAL_DEV.md`)
  - Vercel previews of the website: `https://*-<your-vercel-team-slug>.vercel.app/**`.
    Your team slug is in the Vercel dashboard URL (`vercel.com/<team-slug>`). This only
    matters if you test log in on preview deployments.

### 2. Google sign-in (Supabase → Authentication → Sign In / Providers → Google)

Google is switched off right now. Until you turn it on, the Google button on the website
lands on a Supabase error page. Either finish these steps before launch or ask me to hide
the button.

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

Nothing changes in the code for this. Both the website and the app already send people
back to `https://tryforka.com/app/` after Google.

### 3. The app's Vercel URL (I couldn't find it)

The Vercel account connected here has one project, `greek-bond` (greekbond.org), which
isn't Forka. Neither the website nor the app is in that account, so I couldn't look the
URL up, and I didn't guess.

In the **website** repo, open `vercel.json` and replace `REPLACE-WITH-APP-PROJECT` in both
lines with the app's Vercel project name. For example, a project at
`https://forka-app.vercel.app` gives:

```json
{ "source": "/app", "destination": "https://forka-app.vercel.app/app/" },
{ "source": "/app/:path*", "destination": "https://forka-app.vercel.app/app/:path*" }
```

Use the project's production `.vercel.app` domain, not the URL of a single deployment
(those change every deploy).

### 4. Deploy order

1. **The app first.**
   - In the app's Vercel project, check the environment variables `VITE_SUPABASE_URL` and
     `VITE_SUPABASE_ANON_KEY`. Use the same values as `.env.local`.
   - The app repo's `vercel.json` sets the output directory to `dist`. The build puts the
     app in `dist/app/`.
   - Deploy, then open `https://<app-project>.vercel.app/app/`. It should load and send
     you to `/login.html`.
   - That page is a 404 on the app's own domain, which is expected. The login page only
     exists on tryforka.com.
2. **Then the website**, with the `vercel.json` host filled in (step 3).
   - Open `https://tryforka.com/app/`. It should send you to `https://tryforka.com/login.html`.
   - Log in, and you should land in the app.
3. Test log in only on `tryforka.com`. Logging in on the app's `.vercel.app` domain can't
   work, because that domain is a different origin.

### 5. Getting the website changes into your real `TryForka` repo

The website folder in this workspace (`TryForka-mainWebsite/`) had no git history. So I
started a repo there:

- Commit `54b0cc0` is the files exactly as I found them, on branch `main`.
- Commit `06c3d97` is my changes, on branch `website-link`.

If your GitHub `TryForka` repo has the same files, the simplest way across is to copy over
the files from the list below. If you want, I can make that commit in a clone of the real
repo instead.

The app repo now git-ignores `TryForka-mainWebsite/`, so the website can't be committed
into the app by accident.

### 6. Other things that block a public launch

- **Email confirmation is still off** (from earlier testing). Turn it on: Authentication →
  Sign In / Providers → Email → Confirm email.
  - With it on, signup shows "Check your email to confirm your account…".
  - The confirmation link opens `/app/`, signed in, at onboarding. That's why
    `https://tryforka.com/app/**` must be in the redirect URLs.
- **Set up custom SMTP** (Authentication → Emails → SMTP settings) with a sender like
  Resend, Postmark or SES.
  - Supabase's built-in email sender is heavily rate limited.
  - Testing hit it: the second password-reset email within a minute got a `429`.
  - With real users, confirmation and reset emails would fail.
- **Google sign-in** (section 2). Until it's on, the Google button leads to an error page.
- **Website copy vs the app:**
  - The website promises a "2-week free trial", "248+ families", "AI meal plans in under
    10 seconds" and named testimonials.
  - The app shows a "Free plan" and has no trial or billing.
  - I didn't touch any copy beyond what you asked for, but it should match before launch.
- **"Join Waitlist" and "Try Forka Free"** are unchanged, as you asked. "Try Forka Free"
  already goes to `signup.html`, which now creates a real account.
- The QA accounts from the earlier build report are still listed there. The two accounts
  made in this pass were deleted through the app's Delete account (details below).

## What changed

### Website repo (`TryForka`, branch `website-link`, commit `06c3d97`)

| File | Change |
|---|---|
| `js/forka-auth.js` (new) | One shared Supabase client. supabase-js is pinned to `2.103.3`, the app's installed version. It uses the same project URL and anon key as the app, and the default storage key. Also exports `goToApp()` (goes to `/app/`) and `getSession()`. |
| `js/nav-auth.js` (new) | When someone is signed in, the nav "Log in" button (desktop and mobile menu) becomes "Open app", linking to `/app/`. |
| Every `.html` page | One line: `<script type="module" src="js/nav-auth.js">`. No other nav items or CTAs changed. |
| `login.html` | Real `signInWithPassword`, then `/app/`. The error messages are the three you specified, and the button shows "Logging in" while it runs. "Forgot password?" calls `resetPasswordForEmail` with `redirectTo` set to `location.origin + '/reset-password.html'`; with an empty email field it focuses the field and asks for it. Remember me is removed. Google calls `signInWithOAuth` with `redirectTo` set to `/app/`. Apple is commented out. If already signed in, the page goes straight to `/app/`. |
| `signup.html` | Real `signUp`. The name goes in `options.data.full_name`, the key the app and the `on_auth_user_created` trigger read. `emailRedirectTo` is `/app/`. With a session it goes to `/app/` (onboarding); without one it shows the success state with your copy. Duplicate email shows "There's already an account with that email. Log in instead." with a link. Validation messages appear under each field instead of `alert()`. The terms link goes to `terms.html`. Google and Apple are handled as on login. If already signed in, the page goes to `/app/`. |
| `reset-password.html` (new) | Same layout as `login.html`. Takes a new password, calls `updateUser({ password })`, then goes to `/app/`. An expired or used link shows a message linking back to log in. |
| `waitlist.html` | Imports the shared client instead of creating its own unpinned one. |
| `vercel.json` (new) | Rewrites `/app` and `/app/:path*` to the app's Vercel deployment. The host is a placeholder (section 3). |

### App repo (branch `website-link`)

| File | Change |
|---|---|
| `vite.config.ts` | `base: '/app/'`. The build goes to `dist/app/`. A dev-only plugin serves the website's files on the same dev server (`docs/LOCAL_DEV.md`). |
| `vercel.json` (new) | SPA fallback: `/app/:path*` serves `/app/index.html`. `/` redirects to `/app/`. Output directory is `dist`. |
| `src/lib/supabase.ts` | Still uses default options, which keeps the default storage key and `detectSessionInUrl: true`. Adds the website URLs, `signOutToWebsite()` (sign out, then go to `/`), and detection of a password-reset link landing on `/app/`. |
| `src/App.tsx` | With no session, the app redirects to `/login.html` and shows a blank `canvas` screen during the check, so the login page never flashes. A `PASSWORD_RECOVERY` event, or a reset link opened on `/app/`, sends people to `/reset-password.html`. Onboarding's sign out goes to `/`. The `/styleguide` dev page moved to `/app/styleguide`. |
| `src/screens/Settings.tsx` | Sign out and Delete account both finish on `/`, the website home. |
| `src/screens/Auth.tsx` | Kept in the code but no longer reachable. Facebook is removed. |
| `src/components/Shell.tsx`, `src/screens/Auth.tsx`, `src/lib/timers.ts` | `/forka-logo.png` becomes `${BASE_URL}forka-logo.png`, so the logo and the timer notification icon work under `/app/`. |
| `.gitignore` | Ignores the local `TryForka-mainWebsite/` copy. |
| `docs/LOCAL_DEV.md` (new) | How to run both on one origin. |

Things I checked that needed no change:

- **No custom `storageKey` or `auth.storage`.** The app already used the defaults.
- **`forka_onboarding_complete` isn't in the app.** Onboarding is stored in the database
  (`preferences.onboarded_at`), so it works the same on any path.
- **The app's two `localStorage` keys keep working under `/app/`.** These are the running
  timers and the browse hint. `localStorage` is per origin, not per path.
- **Edge functions allow any origin**, so calls from tryforka.com work.

## Local test results

- The website and the app ran on one origin, `http://localhost:5173` (`npm run dev`).
- The tests drove a real browser (Playwright, Chromium).
- Logins used the QA account `forka.qa.build.1792121464616@mailinator.com`.
- Each run made a new account on `signup.html`, then deleted it with the app's Delete account.
- Every check ran at desktop width (1280x800) and at phone width (390x844).
- Screenshots are in `docs/screens/website-link/` (`desktop-*` and `phone-*`).
- Raw results are in `desktop-results.json` and `phone-results.json`.

| # | Check | Desktop | Phone |
|---|---|---|---|
| 1 | Logged out, `/app/` → `/login.html` | Pass | Pass |
| 2 | Log in on `login.html` → meal plan, signed in (`sb-akufkhzzqwjhssmegvof-auth-token` in localStorage) | Pass | Pass |
| 3 | Reload `/app/` → still signed in; a deep link `/app/some/deep/link` also loads the app | Pass | Pass |
| 4 | Signed in: `/login.html` and `/signup.html` → `/app/`; nav on `/` and `/pricing.html` shows "Open app" → `/app/` | Pass | Pass (mobile menu) |
| 5 | Sign up on `signup.html` → onboarding. `user_metadata.full_name` is the typed name, and Settings → Name shows it after onboarding | Pass | Pass |
| 5a | Empty submit → messages under each field, no `alert()`; terms link → `terms.html` | Pass | Pass |
| 5b | Existing email → "There's already an account with that email. Log in instead." | Pass | Pass |
| 6 | Wrong password → "That email and password don't match…", no redirect | Pass | Pass |
| 7 | Forgot password sends `POST /auth/v1/recover` with `redirect_to=http://localhost:5173/reset-password.html` | Pass (200, "Check your email…") | Pass (request sent; Supabase answered 429 rate limit, and the page showed "Couldn't send the reset email…") |
| 7b | Forgot password with an empty email → focuses the field and asks for it | Pass | Pass |
| 7c | `reset-password.html` without a session → "This link has expired or was already used…" | Pass | Pass |
| 7d | `reset-password.html` with a session → `updateUser` → `/app/` | Pass | Pass |
| 8 | Sign out in Settings → `/`, nav shows "Log in", session removed | Pass | Pass |
| 8b | Delete account → `/`, signed out | Pass | Pass |
| 9 | Google button → `GET /auth/v1/authorize?provider=google&redirect_to=http://localhost:5173/app/` (the test intercepted the request) | Pass | Pass |
| 9b | Apple button and Remember me hidden | Pass | Pass |
| 10 | All of the above at 390x844 | n/a | Pass |
| 11 | `npm run build` passes, and the built app serves under `/app/` (`vite preview`: index, JS, logo and a deep link all return 200) | Pass | n/a |
| 11 | Key scan of `src/`, `index.html`, `dist/app/` and the whole website: no `sk-ant-` or `service_role`, and the only JWT found decodes to `role: anon`. The service-role and Anthropic keys appear only in the edge functions, read with `Deno.env.get` | Pass | n/a |

### Not tested end to end

- **Receiving the reset email and following it.** The email wasn't required, and the
  sender was rate limited. The page's code path was tested with a signed-in session (7d).
- **The app's own `PASSWORD_RECOVERY` redirect.** It needs a real recovery link.
- **Google sign-in completing.** The provider is off.
- **The Vercel proxy itself.** Nothing was deployed.

### Accounts created

- `forka.qa.weblink.desktop.1792169856447@mailinator.com`
- `forka.qa.weblink.phone.1792169885680@mailinator.com`

Both were deleted with the app's Delete account. The app only goes to `/` when the delete
function succeeds, and both runs went there. I couldn't double-check in the database: the
Supabase connector here doesn't allow SQL.
