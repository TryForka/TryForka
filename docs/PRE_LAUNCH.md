# Forka pre-launch checklist

Tick each item before launch. Steps marked **(you)** need an account login or a decision. The others can be done from this repo.

## 1. Sign-in providers (you)

Google and Facebook are switched off in Supabase. The app's buttons say so until they're turned on. The exact steps are in `docs/BUILD_REPORT.md`, "Actions for you" items 1–3.

- [ ] Google OAuth client created, then enabled in Supabase.
- [ ] Facebook app created and set to Live, then enabled in Supabase.
- [ ] Supabase **URL Configuration**: Site URL is the production domain, and Redirect URLs include the production domain and `http://localhost:5173`.
- [ ] Test each provider: sign up, sign out, sign in, reload.

## 2. Re-enable email confirmation (you)

Auto-confirm is still on from testing, so new accounts skip the confirmation email.

- [ ] Supabase dashboard → **Authentication → Sign In / Providers → Email**, then turn **Confirm email** on.
- [ ] Sign up with a fresh address. You should see "Check your email to confirm your account, then log in", and the email link should sign you in.

## 3. TheMealDB paid key (you)

TheMealDB's test key `1` is for development only, and their terms require a paid key to publish an app. The key is only used by the `sync-recipes` function. The app itself never calls TheMealDB.

- [ ] Get a supporter key at themealdb.com.
- [ ] `supabase secrets set MEALDB_API_KEY=<your key>`
- [ ] Run a sync to check the key works. Use the `curl` command in `docs/FORKA_OVERVIEW.md`, "Recipe catalog".
- [ ] Keep the TheMealDB credit. It's shown on every recipe page and in Settings → About. Their terms ask for it.

## 4. Claude

- [x] Live checks passed on 2026-10-15: suggestions, week plans and photo lookups, including the peanut-allergy test.
- [ ] Review the limits for real usage:
  - Suggestions and week plans: 5 per minute, 50 per day.
  - Photo lookups: 20 per day.
  - Set in `supabase/functions/ai-suggestions/index.ts` and `supabase/functions/analyze-dish/index.ts`.
- [ ] Set a monthly spend limit in the Anthropic console.

## 5. Legal (you)

- [ ] Have the terms page (`src/screens/Terms.tsx`) reviewed. It's a plain-language draft, including the allergy disclaimer and the data section.
- [ ] Decide whether you need a separate privacy policy. Facebook Login requires a privacy policy URL.

## 6. Housekeeping

- [ ] Delete the QA accounts listed in `docs/BUILD_REPORT.md` (all `@mailinator.com`).
- [ ] Turn the weekly recipe sync on or off as you prefer. It runs Mondays at 07:00 UTC; `select cron.unschedule('sync-recipes-weekly')` stops it.
