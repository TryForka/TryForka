# Forka build plan

Written 2026-10-15 before starting the "finish the build" prompt. The prompt is the source of truth for product and design; this file records what exists, what gets kept or torn out, and which files each phase touches.

## Step 0: what's in the repo today

### Leftovers from the earlier UI-overhaul attempt (checkpoint 2B)

| Item | State | Decision |
|---|---|---|
| `src/components/shell/` (AppFrame, router `BottomTabBar`, TopAppBar), `src/preview/`, `?preview=1` gate | Already deleted in `b308927` when the overhaul was halted. Nothing left. | Nothing to do. |
| `src/components/ui/*` (14 primitives: button, input, card, chip, checkbox, switch, star-rating, skeleton, empty-state, error-state, badge, modal, bottom-sheet, spinner) | Dormant. Not imported anywhere, so not in the bundle. Built on the old tokens: DM Sans/Poppins, 16px radius on everything, green-tinted shadows, mint background, 56px pill buttons. | **Tear out.** They encode the old look (one radius, shadows on cards) that the new spec forbids. Adapting them would mean rewriting every class string anyway, and keeping them invites mixing the two systems. Rebuilt clean in `src/components/ds/`. |
| `src/index.css` `@theme` block (old tokens: `#1f8f63` primary, `#f2f8f5` mint background, nutrition colors, amber "pro" scale, 7 shadows) | Live, but only `bg-background`, `text-foreground` and `border-border` are used (in the base layer). Components use inline `style={{}}` with hardcoded rgba values. | **Replace** with the new token set only (ink, ink-muted, line, canvas, surface, basil, basil-soft, yolk, alert; radii by role; the 4/8/12/16/24/32/48 spacing scale; Bricolage Grotesque + Figtree). No old token survives. |
| `docs/DESIGN_TOKENS.md`, `docs/UI_AUDIT.md` | Describe the old direction (and Spoonacular). | **Move to `docs/archive/`** with a superseded note. Not deleted, so the history stays readable. |
| `src/components/generated/BottomTabBar.tsx` | Not from 2B. Built in the bug-fix pass on the old look (inline styles, a sparkle center button, 64px). | **Rebuild** to the spec: 4 items, 56px, lucide icons, safe-area padding. |
| `src/hooks/use-mobile.ts`, `src/settings/theme.ts` | Generator scaffolding (shadcn, magicpath). `use-mobile` is unused. | Remove `use-mobile`. Inline the light theme and drop `settings/`. |
| Sidebar nav icons and logo | Loaded from `storage.magicpath.ai`. | Nav icons become lucide. The logo image and wordmark stay visually unchanged, but the PNG moves into `public/` so the app doesn't depend on a third-party bucket. |
| Unused npm deps (three, @react-three/*, recharts, @dnd-kit/*, @headless-tree/*, cmdk, vaul, embla, input-otp, react-day-picker, react-resizable-panels, radix-ui, next-themes, sonner, react-hook-form, zod, @hookform/resolvers, uuid, date-fns, framer-motion, tailwindcss-animate, tw-animate-css, class-variance-authority) | None are used once the old primitives go (framer-motion is only used by `main.tsx`'s animation flag). | Remove. |

**Bottom line:** one design system, built fresh against this prompt. Nothing from the old token file or primitives is merged in.

### Codebase map

- **Navigation:** `currentScreen` state machine in `src/App.tsx` (22 screens). The shared layout is the sidebar plus `<main>` in `App.tsx`, and the bottom tab bar below 768px. The suggestions panel is an overlay outside the state machine. This is kept, as the prompt specifies.
- **Screens** (`src/components/generated/`):
  - Auth: SignUpForm, LoginForm, AppSplashScreen.
  - Onboarding: DietSelector, AllergySelector, DislikesSelector, ServingsSelector (this one asks for cooking time).
  - Main tabs:
    - MealPlanGenerator (Meal plan, with WeekPlanDays).
    - RecipeGuidePopover (Build a meal plan).
    - FavoritesMealPlan.
    - GroceryListScreen.
    - UserSettings and ProfileSettings.
  - Recipe: IngredientScanner (detail, Ingredients tab), StepByStepInstructions (Steps tab plus the `...` menu).
  - Cooking: RecipeStepCard, CookingTimer, QuitConfirmDialog.
  - Recipe extras: NoteEditor, RecipeFeedback, SaveToCollections, CreateCollection.
  - Overlay: MealSuggestionsPanel.
  - Unused: CookingStepInstructions, RecipeStepGuide, ComingSoon.
- **Recipe data:** `src/lib/recipeGeneration.ts` calls TheMealDB **from the browser** with test key `1` hardcoded in `MEALDB_BASE_URL`. It uses search, lookup, filter, the per-letter index and categories, all cached in localStorage. `mealFilters.ts` does diet and allergen filtering in the client. `groceries.ts` builds the list from the letter index.
- **Claude calls:** only the `ai-suggestions` Edge Function, which uses Haiku 4.5 (`claude-haiku-4-5-20251001`) with structured outputs and a per-user rate limit (`claim_ai_request`). `src/lib/ai.ts` calls it with the user's JWT.
- **Keys:**
  - `ANTHROPIC_API_KEY` and `ANTHROPIC_WORKSPACE_ID` are Supabase function secrets.
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` are public by design.
  - There is no Anthropic key in client code or in any `VITE_` variable.
  - The TheMealDB key `1` is hardcoded in the client.
- **Spoonacular:** no code left. It's only mentioned in `docs/UI_AUDIT.md`, which is being archived.
- **Build:** `npm run build` passes (593 kB JS). `eslint src` reports 3 existing `no-explicit-any` errors (QuitConfirmDialog, StepByStepInstructions). The dev server runs.
- **Supabase (live):**
  - Tables: users, user_preferences, favorites, collections, collection_recipes, notes, feedback, week_plans, grocery_lists, ai_requests, waitlist.
  - **No storage buckets**, so the profile-photo upload in ProfileSettings currently fails.
  - Google and Facebook providers are **not enabled** (no client IDs).
  - `pg_cron`, `pg_net` and `pg_trgm` are available but not installed.
  - Site URL is `http://localhost:5173` only.
- **TheMealDB:**
  - 790 meals, 992 ingredients.
  - Categories: Dessert 167, Vegetarian 100, Beef 95, Seafood 84, Side 84, Chicken 80, Pork 60, Lamb 33, Miscellaneous 33, Breakfast 19, Starter 14, Pasta 12, Vegan 7, Goat 2.
  - **Terms:** "You can scrape, copy and modify any content returned from the API, as long as you use the official end points." A permanent local copy is allowed, so the tables are a real catalog, not a 7-day cache. Two conditions:
    - Credit TheMealDB as the data source.
    - A paid key is required to publish to an app store. The test key is for development only.

## Phase 1: security, data layer, auth

Migrations: one preview, then **pause for you to run `supabase db push`**.

1. `supabase/migrations/20261015000000_recipe_catalog.sql`
   - `recipes` (TheMealDB fields plus derived columns):
     - `meal_role`, `allergens[]`, `diets[]` (vegetarian / vegan / pescatarian).
     - `display_name`, `subtitle`, `total_minutes` (a Claude estimate, shown as "About N min").
     - Parsed `steps` with timers; `ingredients` with US and metric measures.
     - `ingredient_names[]` for skip-matching.
   - `ingredient_meta` (name → US name, aisle).
   - Both are readable by everyone, including the signed-out auth preview. Only the service role can write.
   - `safe_recipes()`: an RLS-style SQL function that applies the caller's allergies, diet and skipped ingredients as a **hard SQL filter**. Every list (browse, plan, suggestions, photo results) goes through it.
2. `20261015000001_settings_and_features.sql`
   - `user_preferences` gains `diet`, `skip_ingredients[]`, `plan_breakfast/lunch/dinner`, `max_weeknight_minutes` and `units`. Existing rows are backfilled from the onboarding fields (allergy chips normalized to the 9 keys; "kiwi"-style custom allergies kept as skipped ingredients).
   - New tables, all with RLS:
     - `recipe_ratings` (unique per user and recipe; existing `feedback` rows copied in).
     - `cooked_recipes`.
     - `dish_lookups`.
   - `grocery_lists.custom_items`.
   - `ai_requests.kind`, plus `claim_request(kind, per_min, per_day)` so suggestions (5/min, 50/day) and photo lookups (20/day) have separate limits.
   - `avatars` storage bucket with own-folder policies.
   - `delete_my_account` is handled by the `delete-account` function rather than SQL.
3. `20261015000002_sync_schedule.sql`: `pg_cron` plus `pg_net`, running `sync-recipes` weekly. It reads its secret from Vault, so no secret goes in git.

Code:
- `supabase/functions/_shared/catalog/`: pure TypeScript, unit-tested in Node.
  - `units.ts`: quantity parsing; g/ml/°C/gas mark/cm to US units with sensible rounding.
  - `names.ts`: British-to-US ingredient map.
  - `steps.ts`: instruction splitting plus duration parsing with context labels ("Soak 30 min").
  - `allergens.ts`: the maintained ingredient → allergen map, moved from `src/lib/mealFilters.ts`.
- `supabase/functions/sync-recipes/`:
  - Fetches TheMealDB via `MEALDB_API_KEY` (default `1`), derives everything deterministic, then upserts.
  - Then classifies only rows with no `meal_role`, plus new ingredients for `ingredient_meta`, using Haiku in batches. A recipe is never classified twice.
- `supabase/functions/ai-suggestions/`: rewritten to query the catalog. Claude picks real recipe IDs from the user's safe list, with no client-side TheMealDB calls. Modes: suggestions, week, swap.
- `supabase/functions/analyze-dish/` (Phase 4) and `supabase/functions/delete-account/`.
- `src/lib/catalog.ts` replaces `recipeGeneration.ts`, `mealFilters.ts` and the letter index. The client no longer calls TheMealDB at all; images still load from TheMealDB's CDN.
- Auth: verify email sign-up, sign-in, sign-out and reload persistence end to end. Google and Facebook need credentials from you, listed in the report.
- `.gitignore`: add the explicit `node_modules/`, `.env`, `.env.local` and `.DS_Store` lines.

## Phase 2: design system

- `src/index.css`: new `@theme` tokens, fonts (Bricolage Grotesque, Figtree; Poppins 700 subset only for the unchanged wordmark), base styles, and reduced-motion handling.
- `src/components/ds/`:
  - Containers: PageContainer (960px, left aligned, header row with back button and H1), BottomBar (sticky, 52px buttons), Sheet (20px top corners, the only shadow besides the timer tray).
  - Buttons: Button, IconButton.
  - Form controls: Input, Textarea, Checkbox, Stepper, ToggleChip.
  - Display: Tag, ListRow, SegmentedControl, Tabs, RecipeTile, Progress.
- `src/screens/Styleguide.tsx`: dev-only, at `/styleguide`.
- Shell in `src/App.tsx`:
  - Sidebar with Meal plan, Groceries, Favorites, Settings (lucide icons; the sidebar suggestions button is removed).
  - `BottomTabBar` with the same four items, 56px.
- Remove `src/components/ui/`, the old tokens and unused deps; archive the old design docs.

## Phase 3: screens

One file per screen in `src/screens/`. The old `src/components/generated/*` files are deleted as each one is replaced.

| Screen | New file | Notes |
|---|---|---|
| Sign up, Log in | `Auth.tsx` | Form on the left; on the right, a basil panel with a static week preview from the catalog. Outlined Google and Facebook buttons. Link to the terms page (`Terms.tsx`). |
| Onboarding | `Onboarding.tsx` | Same fields as Settings: diet, allergies, skipped ingredients, planning. |
| Meal plan (home) | `MealPlan.tsx` | Week strip, Tonight hero, breakfast and lunch rows, rest of the week. Swap opens Suggestions scoped to the slot. |
| Suggestions | `SuggestionsPanel.tsx` | Prompt input, photo option, "Plan my whole week", starter chips. |
| Build a meal plan | `BrowseRecipes.tsx` | Filter chips, search, camera, tile grid, "+" adds to the week, allergen filter note. |
| Recipe detail | `RecipeDetail.tsx` | One component: hero, Ingredients/Steps toggle, 1x/2x/3x scaling, allergen flags, timer chips, bottom bar. |
| Cooking mode | `CookingMode.tsx` | "Step 3 of 7", 28/24px text, keyboard controls, Wake Lock, Done → cooked → rate. |
| Notes, Rate, Collections | `Notes.tsx`, `RateRecipe.tsx`, `Collections.tsx` | PageContainer layout, autosaved notes, `recipe_ratings`. |
| Favorites | `Favorites.tsx` | Favorites and Collections tabs. |
| Groceries | `Groceries.tsx` plus `src/lib/groceries.ts` rewrite | Unit merge fixes with unit tests, per-unit lines, "Got it" and "Probably have it" sections, add item, Instacart placeholder. |
| Settings | `Settings.tsx` | Household, allergies, diet, skipped ingredients, planning, units, account (photo, sign out, delete). Autosaves; ProfileSettings removed. |

## Phase 4: features

- Timers:
  - `src/lib/timers.ts`: multiple timers, end timestamps, localStorage, sound, vibration, notification.
  - `src/components/TimerTray.tsx`, shown on every screen.
  - Step timer chips come from the parsed `steps[].timers`.
- Photo search:
  - `src/components/PhotoSearch.tsx`: resize, HEIC handling, context box, skeleton, results grid.
  - `analyze-dish` Edge Function: Haiku vision with tool-use structured output, catalog scoring, `dish_lookups`, 20 per day.

## Phase 5: verify

Build and lint; greps for emoji, AI wording, Spoonacular, em dashes and keys in `dist/`; unit tests for units and grocery merging; headless-Chrome click-through at 1440 and 390x844 with screenshots in `docs/screens/after/`; the scripted scenarios from the prompt; a fresh-account run; then `docs/BUILD_REPORT.md`.
