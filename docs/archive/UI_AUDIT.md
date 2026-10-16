# Forka — UI Audit (Phase 1)

> **Scope:** Read-only audit of the current codebase in preparation for a full UI overhaul.
> No application code was modified. Compiled from direct reads of every screen, the data layer, and the backend.
>
> ⚠️ **Design image note:** The attached Figma flow **could not be processed** (it exceeds the 2000×2000px
> limit and failed to render), so I could not view the target design directly. Part A below is fully grounded in
> the code. The design-token extraction ([DESIGN_TOKENS.md](./DESIGN_TOKENS.md)) and the Part C gap analysis are
> built from (a) the de-facto values already baked into the code and (b) the semantic descriptions you gave in
> the brief. Every value I could not measure from the image is flagged `ESTIMATED`. Please re-send a resized
> screenshot (or per-screen exports) to finalize both.

---

## Part A — Codebase Audit

### 1. Stack & Structure

| Concern | Choice |
|---|---|
| Framework | **React 19** + **Vite 6** (`vite`, `@vitejs/plugin-react`) |
| Language | **TypeScript ~5.7** (strict via `tsconfig.app.json`) |
| Styling | **Almost entirely inline `style={{…}}` objects with hardcoded values.** Tailwind CSS 4 (`@tailwindcss/vite`) + shadcn "new-york" are installed and configured but **barely used** in screens. |
| Design tokens | A shadcn token block exists in [src/index.css](../src/index.css) (`:root` oklch vars) but it is **neutral/greyscale and effectively unused** — screens ignore it and hardcode `rgba()`/hex. A separate "Figma Design Tokens" block defines only a **spacing scale** (no colors). |
| Routing / nav | **No router library.** A hand-rolled state machine in [src/App.tsx](../src/App.tsx): `const [currentScreen, setCurrentScreen] = useState<Screen>()` where `Screen` is a 22-value string union. Navigation = passing `onX` callbacks that call `setCurrentScreen(...)`. |
| State management | Local `useState` per component + `localStorage` (`forka_onboarding_complete`, `forka_preferences`) + Supabase session. No Redux/Zustand/Context. |
| Backend / data | **Supabase** (auth + Postgres, `@supabase/supabase-js`) and one **Supabase Edge Function** (Deno) for OpenAI. Recipe data from **Spoonacular REST API**. Anthropic SDK also called **directly in the browser**. |
| Fonts | **Poppins** (headings/labels/buttons) and **DM Sans** (body/secondary), both loaded via Google Fonts `@import`. |
| Icons | Remote SVGs on `storage.googleapis.com/storage.magicpath.ai/...` (Figma asset exports), plus `lucide-react` (installed, rarely used) and inline SVG. |
| Theme | **Dark mode is force-disabled** in [src/main.tsx](../src/main.tsx) and [src/lib/utils.ts](../src/lib/utils.ts) (`ensureLightMode`). App is light-only. |

**Where things live**
- Screens **and** reusable components are all under **[src/components/generated/](../src/components/generated/)** — there is no `screens/` vs `components/` separation, and no `src/components/ui/` shadcn primitives folder despite `components.json` pointing there.
- Data/service layer: **[src/lib/](../src/lib/)** — `supabase.ts`, `recipeGeneration.ts` (Spoonacular + orchestration), `userPreferences.ts`, `ai.ts` (Anthropic), `utils.ts` (`cn`, light-mode helpers).
- Hooks: **[src/hooks/use-mobile.ts](../src/hooks/use-mobile.ts)** (`useIsMobile`, unused by screens).
- Theme scaffold: **[src/settings/](../src/settings/)** (`theme.ts` reads injected `%INJECTED_THEME%` placeholders — a magicpath/Figma-export artifact).
- Backend: **[supabase/functions/meal-alterations/](../supabase/functions/meal-alterations/index.ts)** + **[supabase/migrations/](../supabase/migrations/)**.

**Run locally**
```bash
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # eslint .
```
Requires `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SPOONACULAR_API_KEY`, `VITE_ANTHROPIC_API_KEY` (all present). The edge function separately needs `OPENAI_API_KEY` set in the Supabase project.

> **Note on the project name:** `package.json` `name` is `component-forge` (a magicpath.ai scaffold), not "forka". The stray top-level folders `D/`, `SelectAllergies/`, `SelectServings/`, `SelectServingsV2/`, `SettingsPage1/` are **Figma/magicpath export dumps**, not part of the built app (the app only imports from `src/`). They should be ignored or deleted; they are not covered here.

---

### 2. Screen Inventory

Navigation ids come from the `Screen` union in [src/App.tsx](../src/App.tsx). The app boots to **`signup`** (not `splash`). After auth, `AUTH_SCREENS` (splash/signup/login + the 4 onboarding steps) render full-viewport with **no sidebar**; everything else renders inside a persistent **left sidebar shell** (Meal Plan / Favorites / Groceries / Settings + an "AI Suggestions" button).

| # | Screen | File | `Screen` id | Reachable from | Notes |
|---|---|---|---|---|---|
| 1 | Splash | `AppSplashScreen.tsx` | `splash` | Back from Sign Up / Login | Marketing intro; **not** the default screen. Fixed 430px frame. |
| 2 | Sign Up | `SignUpForm.tsx` | `signup` | **default**, Splash, Login footer | Two-column (form + green panel). **Orange** accent (inconsistent). |
| 3 | Login | `LoginForm.tsx` | `login` | Splash, Sign Up footer | Two-column. **Forgot-password is an inline expandable panel** (not its own screen). |
| 4 | Diet Selector | `DietSelector.tsx` | `dietselector` | After Sign Up | Onboarding **1/4**. 4-segment progress bar. |
| 5 | Allergy Selector | `AllergySelector.tsx` | `selectallergies` | After Diet | Onboarding **2/4**. Grid chips + custom textarea. |
| 6 | Dislikes Selector | `DislikesSelector.tsx` | `selectdislikes` | After Allergies | Onboarding **3/4**. |
| 7 | Servings/Time Selector | `ServingsSelector.tsx` | `selectservings` | After Dislikes | Onboarding **4/4** → sets `forka_onboarding_complete`, saves `cooking_time`. |
| 8 | Meal Plan (home) | `MealPlanGenerator.tsx` | `mealplan` | Sidebar, post-onboarding, post-login | Two-column. Single "Build Your First Meal Plan" CTA → runs AI+Spoonacular. |
| 9 | Favorites | `FavoritesMealPlan.tsx` | `favorites` | Sidebar | Real Supabase list, loading + empty states, remove. |
| 10 | Groceries | `ComingSoon.tsx` | `groceries` | Sidebar | **Placeholder** — no grocery feature exists. |
| 11 | Settings | `UserSettings.tsx` | `settings` | Sidebar | Profile card, hidden Pro card, single menu row. |
| 12 | Profile Settings | `ProfileSettings.tsx` | `profilesettings` | Settings | Avatar upload, name/household/servings fields. |
| 13 | Recipe Guide / Browse | `RecipeGuidePopover.tsx` | `recipeguide` | Meal Plan "Generate" | 3 rails (Popular / Recently Created / Recommended) + onboarding bottom-sheet. Skeletons + retry. |
| 14 | Recipe Detail | `IngredientScanner.tsx` | `recipedetail` | Recipe Guide (select) | Hero + nutrition pills + Ingredients/Instructions tabs. **File name is misleading — there is no scanner.** |
| 15 | Recipe Instructions | `StepByStepInstructions.tsx` | `recipeinstructions` | Recipe Detail | Step list + action buttons (notes/feedback/collections/start cooking). Fixed 430×932 frame. |
| 16 | Add Notes | `NoteEditor.tsx` | `addnotes` | Instructions | Writes `notes` table. Fixed frame. |
| 17 | Feedback | `RecipeFeedback.tsx` | `feedback` | Instructions | **5-star rating** (image stars) + comment → `feedback` table. Fixed 430×932 frame, absolute-positioned. |
| 18 | Save to Collections | `SaveToCollections.tsx` | `collections` | Instructions | Lists collections, toggles membership. Fixed frame. |
| 19 | Create Collection | `CreateCollection.tsx` | `addcollection` | Collections | Name + emoji → `collections` table. |
| 20 | Cooking Step | `RecipeStepCard.tsx` | `cookingstep` | Instructions "Start Cooking" | Step-by-step cook card. |
| 21 | Cooking Timer | `CookingTimer.tsx` | `cookingtimer` | Cooking Step | Countdown + **WebAudio beep**. |
| 22 | Confirm Quit | `QuitConfirmDialog.tsx` | `confirmquit` | Cooking | Leave-cooking confirmation dialog. |
| — | AI Suggestions | `MealSuggestionsPanel.tsx` | *(overlay, not a `Screen`)* | Sidebar "✨ AI Suggestions" | Slide-in panel; Anthropic → Spoonacular. |

**Orphaned / dead files (imported by nothing):**
`CookingStepInstructions.tsx`, `RecipeInstructions.tsx`, `RecipeStepGuide.tsx` — earlier iterations of the cook/instructions screens, each full of `const handleX = () => { /* TODO: wire up */ }` stubs. Superseded by #15/#20/#21. **Safe to delete.**

---

### 3. Component Inventory

There are **no shared UI primitives** — no `Button`, `Input`, `Card`, `Modal`, `Chip`, `TabBar`, etc. Every screen re-implements these inline. Sub-components that *do* exist are **local** to one file and not exported/reused:

| Component | File | Role | Reused? | Hardcoded styling? |
|---|---|---|---|---|
| `SkeletonList`, `SectionError`, `RecipeCard`, `Section`, `IconButton` | `RecipeGuidePopover.tsx` | Browse rails, skeletons, retry | Local only | Yes |
| `NutritionPill`, `IngredientCard` | `IngredientScanner.tsx` | Detail pills / ingredient rows | Local only | Yes |
| `MealCard` | `FavoritesMealPlan.tsx` | Favorite grid card | Local only | Yes |
| `DropdownItem`, `MenuRow` | `UserSettings.tsx` | Settings rows | Local only | Yes |
| `LabeledInput` (approx.) | `ProfileSettings.tsx` | Form field | Local only | Yes |
| Sidebar shell + nav | `App.tsx` (inline) | App chrome | n/a | Yes (fully inline) |

**The recurring "components" are copy-pasted patterns, not modules:**
- **Pill/CTA button** — a full-width green (`#1F8F63`) 57–61px pill reimplemented in ~12 files with per-file hover handlers.
- **Text input** — 57px, 16px radius, hardcoded border reimplemented in SignUp/Login/Profile/Create/Note/Feedback.
- **Selectable chip** — DietSelector / AllergySelector / DislikesSelector / ServingsSelector each re-implement the same select-pill.
- **Back-arrow icon button**, **bottom action bar**, **card surface** — all duplicated inline.

> **Implication for the overhaul:** the single highest-leverage move is to extract these into real primitives (`Button`, `Input`, `Chip`, `Card`, `ScreenHeader`, `BottomBar`, `TabBar`) driven by tokens, then reskin screens on top. See gap analysis.

---

### 4. Styling Audit

**Theme/token file?** Two, both weak:
1. [src/index.css](../src/index.css) `:root` — shadcn oklch vars (`--primary`, `--background`, …) that are **greyscale defaults and unused** by screens. `--primary` is `oklch(0.205 0 0)` (near-black), *not* Forka green.
2. [src/index.css](../src/index.css) "Figma Design Tokens" — a **spacing scale only** (`--spacing-0 … --spacing-128`), also unreferenced by screens (they hardcode px).

**So the real design system is implicit in ~450 inline color literals.** Frequency of hardcoded colors across `src/components/generated/*` + `App.tsx`:

| Count | Value | Hex | De-facto role |
|---|---|---|---|
| 82 | `rgba(26,26,26,1)` | `#1A1A1A` | Primary text / near-black |
| 56 | `rgba(31,143,99,1)` | `#1F8F63` | **Primary brand green (CTAs)** |
| 44 | `rgba(255,255,255,1)` | `#FFFFFF` | Card / surface |
| 31 | `rgba(242,248,245,1)` | `#F2F8F5` | App background tint (mint) |
| 30 | `rgba(204,204,204,1)` | `#CCCCCC` | Input border |
| 25 | `rgba(230,230,230,1)` | `#E6E6E6` | Divider / disabled bg |
| 23 | `rgba(102,102,102,1)` | `#666666` | Muted text |
| 17 | `rgba(250,250,250,1)` | `#FAFAFA` | Button label off-white |
| 14 | `#748189` | `#748189` | Muted blue-grey (detail screens) |
| 11 | `rgba(153,153,153,1)` | `#999999` | Disabled text / captions |
| 10 | `rgba(51,153,91,1)` | `#33995B` | Secondary green (progress, gradient) |
| 10 | `#0A2533` | `#0A2533` | Dark heading (detail screens) |
| 12/7 | `#FFA773` / `rgba(255,167,115,1)` | `#FFA773` | **Orange accent — Sign Up / Login only** |
| 6 | `rgba(255,228,194,1)` | `#FFE4C2` | Amber card bg (Pro upsell, selected chip) |
| 5 | `rgba(254,226,226,1)` | `#FEE2E2` | Error bg (red-100) |
| 5 | `rgba(252,165,165,1)` | `#FCA5A5` | Error border (red-300) |
| 5 | `rgba(185,28,28,1)` | `#B91C1C` | Error text (red-700) |
| 5 | `rgba(153,27,27,1)` | `#991B1B` | Error text alt (red-800) |
| 5 | `rgba(174,220,144,1)` | `#AEDC90` | Selected-chip border (light green) |
| 3 | `#40BF72` | `#40BF72` | Bright green (accents) |

*(Full list is long; these are the top ~20 by frequency. Border-radius literals cluster at `10/12/14/16/20/24/50px`; font-sizes at `11/12/13/14/15/16/17/18/20/22/24/32/40px`; spacing at `4/6/8/10/12/14/16/20/24/28/32/48px`.)*

**Styling inconsistencies (same job, different values):**
- **Accent color split:** Sign Up + Login use **orange `#FFA773`** for input borders/checkbox/submit; every other screen uses **green `#1F8F63`**. Even within Login, the submit button is **black `#1A1A1A`** while its inputs are orange.
- **Two heading palettes:** onboarding/auth/home use `#1A1A1A` headings; the recipe-detail/instructions screens use `#0A2533` + `#748189`. Two parallel greys (`#666666` vs `#748189`) for "muted text."
- **Two layout paradigms (structural, see below):** some screens are **fixed 430×932px mobile mockups** (absolute-positioned), others are **responsive desktop** two-column/max-width layouts.
- **Fonts declared per-element** hundreds of times as `fontFamily: '"Poppins", sans-serif'` rather than inherited; a few stray `"DM Sans"`/`"Geist"` references exist with no font actually loaded for Geist.
- **Green has ~5 shades** in the wild (`#1F8F63`, `#33995B`, `#25995B`/`rgba(25,120,83)`, `#40BF72`, `#197350`) used interchangeably for base/hover/active.

**Layout-paradigm scan (which screens are fixed mobile frames vs responsive):**
- **Fixed `430(×932)` mobile frames (absolute positioning):** `AppSplashScreen`, `StepByStepInstructions`, `NoteEditor`, `RecipeFeedback`, `SaveToCollections`, `QuitConfirmDialog`, `RecipeInstructions`*(orphan)*, `RecipeStepGuide`*(orphan)*.
- **Responsive / full-width desktop:** `SignUpForm`, `LoginForm`, `MealPlanGenerator` (two-column), `UserSettings`, `FavoritesMealPlan`, `IngredientScanner`, `RecipeGuidePopover`, the 4 onboarding selectors, `ComingSoon`, `MealSuggestionsPanel` (480px panel), `CookingTimer`, `RecipeStepCard`.

---

### 5. Functional Audit

Legend: ✅ wired to real logic · ⚠️ partial / cosmetic · ❌ dead/stub · — n/a

| Screen | Interactive elements | API / data | Loading | Empty | Error | Validation | Stubs / issues |
|---|---|---|---|---|---|---|---|
| **AppSplashScreen** | Get Started / Login ✅ (nav only) | — | — | — | — | — | Purely presentational. |
| **SignUpForm** | Email/pw signup ✅, Google ✅, Facebook ✅, show-pw ✅, terms ✅ | `supabase.auth.signUp` + insert `users` | ✅ ("Creating…") | — | ✅ inline | ⚠️ presence + terms only; **no email/password format checks** | Inserts into a **`users` table that has no migration** (may 404). |
| **LoginForm** | Password login ✅, Google ✅, Facebook ✅, **Forgot pw ✅** | `signInWithPassword`, `signInWithOAuth`, `resetPasswordForEmail` | ✅ | — | ✅ | ⚠️ presence only | Forgot-pw sends a **magic reset link only** — no code-entry / in-app reset screens (see Auth Flow). `onForgotPassword` prop unused. |
| **DietSelector** | Multi-select chips ✅, Continue ✅ | via `onContinue` → `upsertUserPreferences` | ❌ (has `saving`) | — | ✅ save-error | ⚠️ allows empty selection | — |
| **AllergySelector** | Chips ✅, custom textarea ✅, Continue ✅ | `upsertUserPreferences` | ❌ | — | ✅ | ⚠️ | — |
| **DislikesSelector** | Chips ✅, custom textarea ✅ | `upsertUserPreferences` | ❌ | — | ✅ | ⚠️ | — |
| **ServingsSelector** | Single-select ✅, Continue ✅ | `upsertUserPreferences` (`cooking_time`) | ❌ | — | ✅ | ⚠️ | Field is "cooking time," labeled around servings — naming drift. |
| **MealPlanGenerator** | Generate CTA ✅ | `getMealAlterations` (Edge fn OpenAI → Spoonacular), `fetchUserPreferences` | ✅ ("Generating…") | ❌ | ✅ inline | — | Only entry point that populates the plan. |
| **FavoritesMealPlan** | List ✅, remove ✅ | `favorites` select/delete | ✅ | ✅ ("No favorites yet") | ⚠️ silent | — | **Nothing ever writes favorites** (detail heart is local-only) → list is effectively always empty in practice. |
| **ComingSoon (Groceries)** | Social links ⚠️ | — | — | — | — | — | Placeholder; grocery list feature absent. |
| **UserSettings** | Profile Settings ✅, account dropdown ✅ (Sign Out/Switch both sign out), Upgrade ❌ | reads `user` prop | — | — | — | — | **Pro card is `display:none`**; Upgrade button says "Coming Soon!" and does nothing; **menu filtered to only "Profile Settings"** (4 rows dead). |
| **ProfileSettings** | Avatar upload ✅, save name/household/servings ✅ | `supabase.storage` avatars, `auth.updateUser`, `users` update | ✅ | — | ✅ | ⚠️ | Depends on `avatars` storage bucket + `users` table existing. |
| **RecipeGuidePopover** | 3 rails ✅, retry ✅, cards ✅, search ❌, onboarding sheet ✅ | `fetchPopularRecipes`, `fetchRandomRecipes`, `getMealAlterations` | ✅ skeletons | ⚠️ (renders empty rail) | ✅ per-rail + retry | — | `onSearch` icon wired but no search screen. `isPro` badge exists, never set true. |
| **IngredientScanner (Detail)** | Fav heart ⚠️, qty steppers ⚠️, tabs ✅, Add to Cart ❌, Add All ❌ | reads passed `FullRecipe` | ✅ | ✅ | — | — | **Fav heart = local state, never persisted.** **Nutrition pills always "–"** (details fetched with `includeNutrition=false`). `handleAddToCart` is `/* TODO */`. |
| **StepByStepInstructions** | Ingredients/Instructions toggle ✅, add notes/feedback/collections ✅, Start Cooking ✅ | reads recipe | ✅ | ✅ | ❌ | — | Fixed frame. |
| **NoteEditor** | Type + Save ✅ | `notes` insert/update | ❌ | — | ✅ | ⚠️ (no empty-note guard shown) | — |
| **RecipeFeedback** | 5-star ✅, comment ✅, Send ✅ | `feedback` insert | ❌ (has `saving`) | — | ✅ | ⚠️ no min-rating | Needs `userId`; silently returns if absent. Fixed 430×932 absolute layout. |
| **SaveToCollections** | Toggle membership ✅, Add New ✅, Done ✅ | `collections` + `collection_recipes` R/W | ✅ | ✅ | ✅ | — | Solid. |
| **CreateCollection** | Name ✅, emoji ✅, Create ✅ | `collections` insert | ❌ | — | ✅ | ⚠️ (name presence) | — |
| **RecipeStepCard (Cook)** | Back/List/Next/Quit ✅ (nav) | reads recipe | ❌ | ❌ | ❌ | — | — |
| **CookingTimer** | Start/pause ✅, prev/next ✅, quit ✅ | WebAudio beep | ❌ | — | ⚠️ try/catch on audio | — | — |
| **QuitConfirmDialog** | Continue / Leave ✅ | — | — | — | — | — | — |
| **MealSuggestionsPanel** | Prompt ✅, suggestions ✅, full-week plan ✅ | `getAISuggestions` (Anthropic, browser) → `searchRecipes` | ⚠️ (`isGenerating`, no skeleton) | ✅ | ✅ | — | Anthropic key **exposed in browser** (`dangerouslyAllowBrowser`). Results not clickable through to detail. |

**Global stubs / smells**
- `/* TODO: wire up */` handlers: all of `CookingStepInstructions`, `RecipeStepGuide`, `RecipeInstructions` (orphans) + `IngredientScanner.handleAddToCart`.
- `console.error` logging (no user-facing surface): `MealPlanGenerator`, `MealSuggestionsPanel`, `SignUpForm`, plus `src/lib/*`.
- `App.tsx` carries `// TODO: preserve app state across OAuth redirect — known issue, post-launch fix`.
- **Groceries / "Add to Cart"** is the biggest missing feature — referenced from the detail screen and sidebar but only a `ComingSoon` exists.

**Spoonacular integration specifics** (all in [src/lib/recipeGeneration.ts](../src/lib/recipeGeneration.ts)):
- **Client-side calls with the key in the query string** (`VITE_SPOONACULAR_API_KEY` shipped to the browser).
- Endpoints used: `GET /recipes/complexSearch` (search, popular via `sort=popularity`, "recently created" via `sort=healthiness`) and `GET /recipes/{id}/information?includeNutrition=false`.
- **Caching:** `localStorage` with a 1-hour TTL (`spoonacular_popular_*`, `spoonacular_recent_*`, `spoonacular_detail_*`) — a lightweight rate-limit cushion.
- **Rate-limit / error handling:** minimal — non-OK / `status==='failure'` responses are logged and coerced to `[]`/`null`; **there is no explicit 402-quota handling** and no user-facing "API limit reached" state. `fetchRecipeDetails` swallows errors to `null` → screens show "No ingredients/instructions available."

---

### 6. Auth Flow (traced end-to-end)

Provider: **Supabase Auth** (email/password + Google & Facebook OAuth). Wiring lives in [src/App.tsx](../src/App.tsx) (`onAuthStateChange`, session bootstrap) + the two auth screens.

1. **Sign Up** ([SignUpForm.tsx](../src/components/generated/SignUpForm.tsx)) → `supabase.auth.signUp({ email, password, options.data.full_name })`, then `insert` into `users`. On success → `dietselector` (onboarding). OAuth buttons call `signInWithOAuth({ provider, redirectTo: origin })`.
2. **Login** ([LoginForm.tsx](../src/components/generated/LoginForm.tsx)) → `signInWithPassword`. On success `onLogin` → `mealplan`. OAuth same as above.
3. **Forgot Password** → an **inline expandable panel inside LoginForm** (not a routed screen). Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin })` and shows *"Check your email for a reset link."*
4. **Session bootstrap** ([App.tsx](../src/App.tsx)) → on load `getSession()`; `onAuthStateChange` routes SIGNED_IN users to `mealplan` (if `forka_onboarding_complete`) else `dietselector`; non-email providers upsert a `users` row. SIGNED_OUT → `signup`.

**What exists vs. what the design implies:**
- ✅ Email/password sign-up & login, Google + Facebook OAuth, sign-out, magic-link password reset.
- ❌ **No verification / OTP code-entry screen and no in-app "set new password" screen.** The brief's *forgot password → code entry → reset password* flow is **not implemented** — the app relies entirely on Supabase's emailed reset link. Notably `input-otp` **is installed** but unused, suggesting a code-entry screen was intended and never built.
- ⚠️ **`users` table has no migration** (only `user_preferences`, `favorites`, `collections*`, `notes`, `feedback` do), yet Sign Up / OAuth / ProfileSettings write to `users`. Either it's created out-of-band or these writes silently error.
- ⚠️ OAuth redirect loses in-app screen state (documented TODO).

**Backend summary** ([supabase/](../supabase/)):
- **Edge Function `meal-alterations`** (Deno): server-side **OpenAI `gpt-4o`** call (key server-side ✅), returns 3 meal "alterations." CORS `*`, **no rate limiting/auth check beyond the anon bearer.**
- **Migrations:** `user_preferences`, `favorites`, `collections` + `collection_recipes`, `notes`, `feedback` — all with sensible **RLS** (`auth.uid() = user_id`). `feedback.rating` has a `1..5` CHECK (matches the star control).
- **Client-side AI/keys:** Anthropic (`ai.ts`) and Spoonacular run **in the browser with exposed keys** — a security concern to resolve during the overhaul (move behind edge functions like OpenAI already is).

---

## Part C — Gap Analysis (design ↔ code)

> ⚠️ **Because the Figma image could not be opened, I cannot do a literal screen-by-screen diff of the target.**
> Per your rule ("do not invent a mapping"), the table below maps the **code screens** and the **specific design
> elements you named in the brief** (allergen warning, Pro card, bottom tab bar, star rating, chips, pill buttons,
> input states). Treat "design intent" columns as derived from your description, not a measured comparison —
> I'll tighten this once I can view the flow. Ordered **shared primitives first, then screens that depend on them.**

### Tier 0 — Shared primitives & app shell (do first; everything depends on these)

| Item | In code today | Change needed | Risk |
|---|---|---|---|
| **Design tokens** (color/type/space/radius) | Implicit in ~450 inline literals; token files unused | **Net-new**: real token layer (CSS vars or TS theme) from [DESIGN_TOKENS.md](./DESIGN_TOKENS.md); replace shadcn greyscale `--primary` with brand green | **Medium** |
| **Button / Input / Card / Chip / Modal / Sheet** primitives | None (copy-pasted inline) | **Net-new** reusable components | **Medium** |
| **Bottom tab bar** | ❌ App uses a **desktop left sidebar** (`App.tsx`) | **Structural rebuild** — the design is a mobile app with a bottom tab bar; replace the sidebar shell | **High** |
| **Top app bar** (back / title / actions) | Re-implemented per screen | Consolidate into one `ScreenHeader` | Low |
| **Star rating** | Exists only in `RecipeFeedback` (image stars, not reusable) | Extract → reusable control | Low |
| **Checkbox / toggle** | Ad-hoc (SignUp checkbox; no real toggle/switch anywhere) | **Net-new** toggle/switch primitive | Low |
| **Responsive strategy** | Split between fixed 430px frames and desktop layouts | Standardize on a single mobile-first frame | **High** |

### Tier 1 — Screens (styling ↔ structural ↔ net-new)

| Design area | Code counterpart | Status | Work | Risk |
|---|---|---|---|---|
| Splash / onboarding intro | `AppSplashScreen` | exists | Styling + de-fix the 430px frame | Low |
| Sign Up | `SignUpForm` | exists | **Styling** — reconcile orange→brand, tokenize | Low–Med |
| Login | `LoginForm` | exists | Styling; decide forgot-pw pattern | Low–Med |
| **Forgot pw → code entry → reset** | Inline panel only | **partial/missing** | **Net-new** OTP + reset screens (wire the installed `input-otp`) or confirm link-only is intended | **High** |
| Onboarding: diet/allergies/dislikes/servings | 4 selectors | exists | Styling only (already close to spec) | Low |
| Home / Meal Plan | `MealPlanGenerator` | partial | Likely **structural** — design home probably ≠ single-CTA screen | Med |
| Recipe browse | `RecipeGuidePopover` | exists | Styling; add real search if design has it | Med |
| Recipe detail | `IngredientScanner` | exists | Styling + **add allergen warning card** + fix nutrition + persist favorite | Med |
| **Allergen warning card** | ❌ nowhere in code | **missing** | **Net-new** + logic to cross-check user allergies vs recipe ingredients (**new API/logic**) | **High** |
| Instructions / cook / timer / quit | `StepByStepInstructions`, `RecipeStepCard`, `CookingTimer`, `QuitConfirmDialog` | exists | Styling; de-fix frames | Med |
| Notes / Feedback / Collections | `NoteEditor`, `RecipeFeedback`, `SaveToCollections`, `CreateCollection` | exists | Styling; de-fix absolute layouts | Med |
| Favorites | `FavoritesMealPlan` | exists | Styling + **wire a real "add favorite" path** | Med |
| **Grocery list** | `ComingSoon` only | **missing** | **Net-new** screen + cart/grocery data model & "Add to Cart" wiring (**new backend**) | **High** |
| Settings | `UserSettings` | partial | Styling + **un-hide Pro card**, restore menu rows | Med |
| Pro / upgrade (amber card) | Present but `display:none` | partial | Enable + real upgrade flow (**needs billing**) | **High** |
| Profile settings | `ProfileSettings` | exists | Styling; verify `users`/bucket exist | Low–Med |
| AI Suggestions | `MealSuggestionsPanel` | exists | Styling; make results navigable; **move Anthropic server-side** | Med |

### Biggest cross-cutting risks
1. **Sidebar → bottom-tab / desktop → mobile restructure** touches every screen; not a visual swap. **(High)**
2. **Missing features the design assumes exist** — grocery/cart, allergen warnings, code-entry password reset, real Pro/upgrade — each needs **new logic/backend**, not just UI. **(High)**
3. **No primitive/token layer** — reskinning without first extracting `Button/Input/Card/Chip` + tokens means re-editing ~450 inline literals by hand and re-diverging. **(Medium, but foundational)**

Secondary: exposed client-side API keys (Anthropic/Spoonacular), the unmigrated `users` table, and favorites never being written are correctness issues worth folding into Phase 2.
