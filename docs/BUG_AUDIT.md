# Forka — Bug Audit (Phase 1, no fixes applied)

Read-only scan of `src/` + `supabase/`. Grouped by feature. Severity: **Critical** (crash / data loss / secret exposure / core flow broken) · **High** (feature broken or silent data failure) · **Medium** (degraded UX / partial) · **Low** (cosmetic / hygiene). Items I'm not fully sure are bugs vs. intent are in [§ Uncertain](#uncertain--needs-a-product-decision).

> **Two environmental blockers (not code bugs, but they gate Phase 2 verification):**
> - The Supabase project `akufkhzzqwjhssmegvof.supabase.co` is **down / deleted (NXDOMAIN)** — every auth/DB call fails at runtime right now.
> - **There is no test suite** (no test script or test files). Phase-2 "run tests" = run the app.

---

## 1. Auth & Onboarding

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 1.1 | **High** | migrations (absent) + `SignUpForm.tsx:59`, `App.tsx:122`, `ProfileSettings.tsx:24,64` | Code reads/writes a **`users` table that has no migration**. Signup & OAuth profile writes silently fail (errors only `console.error`'d); ProfileSettings save throws a visible "Save failed". | No `create table users` migration exists (only user_preferences/favorites/collections/notes/feedback). |
| 1.2 | Medium | `SignUpForm.tsx:112` | No email-format or password-strength validation; only presence + terms checkbox. | Client validation delegated entirely to Supabase; `isFormValid` checks truthiness only. |
| 1.3 | Low | onboarding selectors (`DietSelector`, `AllergySelector`, `DislikesSelector`, `ServingsSelector`) | "Continue" is enabled with **nothing selected** (esp. Diet). | No min-selection guard. |
| 1.4 | Low | `App.tsx` (`onAuthStateChange`) | `// TODO: preserve app state across OAuth redirect` — in-app screen state is lost on OAuth round-trip. | Screen state is component-local, not URL-backed (fixed by the Phase-2B router work). |

## 2. Home / Meal-Plan Browse

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 2.1 | Medium | `RecipeGuidePopover.tsx:190–198` | `isPro` badge branch exists but is never set true — dead branch; all cards render the non-Pro plus button. | `spoonacularToRecipe`/`alterationToRecipe` never set `isPro`. |
| 2.2 | Low | `RecipeGuidePopover.tsx:256` (`onSearch`) | Search icon is wired to a handler that has no search screen. | Feature not built; button is a no-op in `App.tsx`. |

## 3. Recipe Detail (`IngredientScanner.tsx`)

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 3.1 | **High** | `IngredientScanner.tsx:40,132` | **Favorite heart never persists.** `isFavorite` is local `useState`; tapping it writes nothing to the `favorites` table, so `FavoritesMealPlan` is always empty in practice. | No Supabase insert/delete on toggle. |
| 3.2 | **High** | `IngredientScanner.tsx:53` + `recipeGeneration.ts` (`fetchRecipeDetails`, `?includeNutrition=false`) | **Nutrition pills always render "–".** Detail reads `recipe.nutrition.nutrients`, but details are fetched with `includeNutrition=false`, so `nutrients` is always `[]`. | Request param never asks for nutrition. |
| 3.3 | Medium | `IngredientScanner.tsx:70,411,381` | "Add to Cart" / "Add All to Cart" are dead (`handleAddToCart = () => {/* TODO */}`). | Grocery/cart backend doesn't exist. |
| 3.4 | Low | `IngredientScanner.tsx:41,66` | Quantity steppers mutate local state only; never feed a cart or persist. | Expected until cart exists (see §Uncertain). |

## 4. Cooking Mode + Timers (`RecipeStepCard.tsx`, `CookingTimer.tsx`)

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 4.1 | **High** | `RecipeStepCard.tsx:26` | Cooking mode reads only `analyzedInstructions[0].steps` — **drops steps from any later instruction block** (StepByStepInstructions uses `flatMap` over all blocks; these two disagree). | Hard-coded `[0]` index. |
| 4.2 | **High** | `RecipeStepCard.tsx:23,34` + `App.tsx` (cookingstep↔cookingtimer) | **Cooking progress resets.** `stepIndex` is local; each step→timer→step transition remounts `RecipeStepCard`, resetting to step 1. `CookingTimer` `onNext`/`onPrev` both return to `cookingstep`, so the flow is a 2-screen ping-pong with no real progression. | Step state not lifted; nav wiring loops. |
| 4.3 | Medium | `RecipeStepCard.tsx:42–45` | The list button calls `setIsMenuOpen(true)` **and** `onListClick()`, which navigates to `recipedetail` — so the in-component menu overlay (lines 263–325) is dead (screen unmounts first). | Two conflicting actions on one handler. |
| 4.4 | Medium | `CookingTimer.tsx:118–125` | Progress bar is hard-coded `i < 3` of 12 → **fake, static progress** unrelated to actual step. | No step context passed to the timer. |
| 4.5 | Low | `CookingTimer.tsx:26–36` | Interval effect depends on `[isActive, secondsLeft]`, so it tears down/recreates the 1 s interval every tick → possible drift. | Countdown state in the effect's own deps. |
| 4.6 | Low | `CookingTimer.tsx:13,16` | Timer auto-starts (`isActive` default `true`) counting from the **whole recipe time** on mount. | Uses `readyInMinutes` as the initial countdown (see §Uncertain). |

## 5. Recipe Actions — Notes / Feedback / Collections

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 5.1 | Medium | `StepByStepInstructions.tsx:199–201` | Tapping the **Ingredients tab both switches the local tab and navigates away** to the detail screen (`setTimeout(onIngredientsClick, 250)`) — jarring double behavior. | Tab click doubles as cross-screen nav. |
| 5.2 | Medium | `StepByStepInstructions.tsx:76,256` / `NoteEditor.tsx:85,102` / `SaveToCollections.tsx:131` / `RecipeFeedback.tsx:61` | **Fixed `430×932px` frames + absolute positioning** (e.g. NoteEditor menu at `left:390px`) clip/overflow on real viewports and don't match a responsive mobile layout. | Figma-export layouts never made responsive. |
| 5.3 | Low | `NoteEditor.tsx:50` | Empty note can be saved (no trim/empty guard). | Only `!userId`/`saving` guarded. |
| 5.4 | Low | `NoteEditor.tsx:100` | Menu button is dead — `onMenuClick` is never passed by `App.tsx`. | Unwired prop. |
| 5.5 | Low | `StepByStepInstructions.tsx:72` | `menuItems … as any[]` masks types. | Explicit `any`. |

## 6. Favorites (`FavoritesMealPlan.tsx`)
Solid (real query, loading/empty states, optimistic remove). Only issue is upstream: nothing ever **writes** favorites (see 3.1), so the list is always empty. Error path on load is silently swallowed (`FavoritesMealPlan.tsx:30–34`) — **Low**.

## 7. Groceries / Shop-online
Not built — `groceries` route renders `ComingSoon`. The design's grocery list, allergen warning, and shop-online flow have **no code** (net-new, tracked in the UI overhaul). Not a bug; incomplete feature.

## 8. Settings & Pro Paywall (`UserSettings.tsx`)

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 8.1 | Medium | `UserSettings.tsx:188` | **Pro upgrade card is `display:'none'`** — the entire upsell is hidden. | Hard-coded hidden. |
| 8.2 | Medium | `UserSettings.tsx:231` | Menu list is filtered to **only "Profile Settings"**; "Eating Preferences / Your Recipes / Share / Meet Our Team" are defined but dropped. | `.filter(item => item.id === 'profile')`. |
| 8.3 | Low | `UserSettings.tsx:174` | "Switch Account" just calls `onSignOut` (same as Sign Out). | Placeholder behavior. |
| 8.4 | **High** | `ProfileSettings.tsx:24,27,64` | Profile **household load + save target the missing `users` table** (see 1.1). `.single()` on a missing row/table errors; save shows "Save failed" even after the auth name updates. | Missing table + `.single()` instead of `.maybeSingle()`. |
| 8.5 | Low | `ProfileSettings.tsx:205` | `parseInt(v)` without radix. | Missing radix arg. |
| 8.6 | Low | `ProfileSettings.tsx:42–47` | Avatar upload assumes an `avatars` storage bucket exists; no existence/permission handling beyond generic catch. | External dependency unverified. |

## 9. AI Suggestions (`MealSuggestionsPanel.tsx`)

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 9.1 | **High** | `MealSuggestionsPanel.tsx:217–224` | **Full-week plan fires ~21 Spoonacular calls per click** (7 days × 3 meals) → burns the free-tier quota fast; no batching/limit. | Nested per-meal `searchRecipes`. |
| 9.2 | Medium | `App.tsx` (`<MealSuggestionsPanel favorites={[]} …/>`) | `favorites` is **hard-coded `[]`**, so the AI never receives the user's taste profile. | Prop passed empty. |
| 9.3 | Medium | `MealSuggestionsPanel.tsx:173–183` | "+ Plan" writes to `localStorage['forka_meal_plan']`, a key **nothing ever reads** → added items vanish. | Write-only persistence. |
| 9.4 | Medium | `MealSuggestionsPanel.tsx:480–487` (RecipeRow) | Suggested recipes aren't clickable through to the detail screen. | No nav handler on the row. |
| 9.5 | Low | `MealSuggestionsPanel.tsx:200–202,228–230` | Any Spoonacular failure surfaces as "check your API key" — misleading (it's not an Anthropic error). | One catch, one message. |
| 9.6 | Low | `MealSuggestionsPanel.tsx:170` | `showToast` `setTimeout` has no cleanup → setState-after-unmount if panel closes < 2.2 s. | Uncleared timer. |

## 10. Spoonacular / API layer (`lib/recipeGeneration.ts`)

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 10.1 | **High** | `recipeGeneration.ts:3` (+ every `apiKey=` URL) | **Spoonacular API key ships in the client bundle** (`VITE_SPOONACULAR_API_KEY` in query strings) — extractable and abusable. | Direct browser calls, no proxy. |
| 10.2 | Medium | `recipeGeneration.ts` (`complexSearch`, `fetchRecipeDetails`) | No explicit **402/quota or rate-limit handling**; failures are coerced to `[]`/`null` and logged, so the UI just shows empty states with no "limit reached" signal. | Errors swallowed. |
| 10.3 | Low | `MealSuggestionsPanel.tsx:194–197` | Per-suggestion `searchRecipes` runs **sequentially (N+1)**. | `await` in a `for` loop. |

## 11. Data layer / Backend

| # | Sev | File:line | Bug | Root cause |
|---|-----|-----------|-----|------------|
| 11.1 | **Critical** | `lib/ai.ts:3–7` | **Anthropic API key is shipped to the browser** (`dangerouslyAllowBrowser: true`, `VITE_ANTHROPIC_API_KEY`) — a paid secret anyone can extract from the bundle and abuse. | Client-side SDK call instead of an edge function (unlike the OpenAI path). |
| 11.2 | Low | `lib/ai.ts:34` | `JSON.parse(clean)` unguarded — throws on malformed model output (caught upstream, but brittle). | No local try/catch / schema check. |

## 12. Cross-cutting — Dead code, types, hygiene

| # | Sev | File | Bug |
|---|-----|------|-----|
| 12.1 | Low | `CookingStepInstructions.tsx`, `RecipeInstructions.tsx`, `RecipeStepGuide.tsx` | **Orphaned components** — imported by nothing, full of `/* TODO: wire up */` stubs. Delete. |
| 12.2 | Low | top-level `D/`, `SelectAllergies/`, `SelectDislikes/`, `SelectServings/`, `SelectServingsV2/`, `SettingsPage1/` | **Figma/magicpath export dumps** — not part of the build (`index.html` loads only `/src/main.tsx`). Dead weight. |
| 12.3 | Low | `MealPlanGenerator.tsx:53`, `MealSuggestionsPanel.tsx:201,229`, `SignUpForm.tsx:65`, `lib/*` | `console.error` calls left in (error logging, no user surface). |
| 12.4 | Low | `App.tsx` (render body) | `setTheme(theme)` is called as a side-effect during render. |
| 12.5 | Low | `ProfileSettings.tsx:67` | `setSaved` `setTimeout(2000)` with no cleanup → possible setState-after-unmount. |

---

## Uncertain — needs a product decision
- **Cooking timer** auto-starts counting down from the **entire recipe time** on mount (4.6) — intended, or should it be a per-step timer the user starts?
- **Onboarding** lets you continue with **no diet selected** (1.3) — allowed, or require ≥1?
- **"Cooked?" toggle** (`StepByStepInstructions.tsx:47`) is cosmetic-only — should it persist (history/feedback)?
- **Ingredients tab → navigates to detail** (5.1, and `IngredientScanner.tsx:326`) — deliberate cross-nav or a bug?
- **Quantity steppers** (3.4) local-only — expected until a cart exists?
- **Groceries / Pro** are unbuilt features, not bugs — confirm they're out of scope for this bug-fix pass.

## Tally
- **Critical: 1** (11.1 Anthropic key in bundle)
- **High: 7** (1.1, 3.1, 3.2, 4.1, 4.2, 8.4, 9.1, 10.1) — *(8; see note)*
- **Medium: ~11**
- **Low: ~15**

*(Note: 8.4 shares a root cause with 1.1 — the missing `users` table — so the distinct High-severity root causes are: missing `users` migration, favorite non-persistence, nutrition param, cooking `[0]`-slice, cooking state reset, week-plan quota, Spoonacular key exposure.)*
