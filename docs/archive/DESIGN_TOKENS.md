# Forka — Design Tokens (Phase 1 · refined in Phase 2A from board review)

> **Status.** Token **values** are taken verbatim from the code's de-facto inline literals (exact — Phase 1
> frequency analysis). A **zoomed-out board image** was reviewed in Phase 2A and **confirms the design uses this
> same system** (green CTAs, mint bg, white cards, amber Pro card, red allergen card, star rating, etc.).
>
> **Board fidelity caveat:** the reviewed image is the full flow board (~40 screens on one canvas, each ≈40px
> wide), not per-screen hi-res crops. It is enough to confirm **structure, flow, palette, and button shape**, but
> **not** to measure fine pixel details (exact focus-ring color, input error styling, tab-bar icon glyphs). Those
> stay `ESTIMATED` and fall back to the code's values + convention; they are low-risk token/class edits if hi-res
> crops surface later.
>
> **Board-confirmed in Phase 2A (changes from Phase 1):**
> - ✅ **Buttons are rounded rectangles (~16px), NOT full pills.** Reverses the Phase-1 pill assumption →
>   `button.radius = radius-lg (16px)`. See §4 / §5.
> - ✅ **Auth flow includes** `Forgot password → Enter 4-digit code → Reset password → Password changed` + a
>   `Turn on weekly reminders` permission screen and a **2–3 slide onboarding carousel** — all net-new builds.
> - ✅ Palette confirmed: primary green, mint bg, white surfaces, **amber Pro card**, **red allergen card**, blue
>   Facebook button, nutrition pills, star rating.
> - ✅ **Tab bar = 4 destinations + a center action button** (AI Suggestions), per product decision (see §5).

---

## 1. Color Palette

### Brand / core (high confidence — verbatim in code)

| Token | Hex | Role / usage |
|---|---|---|
| `color.primary` | `#1F8F63` | **Primary green** — CTAs, active nav, links, step numbers, "Continue"/"Send"/"Add to Cart" |
| `color.primary.hover` | `#197350` | Primary hover *(`rgba(25,115,80,1)`)* |
| `color.primary.active` | `#19734F` `ESTIMATED` | Pressed state *(code varies: `#1A7850`/`#25995B`)* — pick one |
| `color.primary.tint` | `#E8FBF3` | Faint green fill (increment btn, protein pill bg) |
| `color.primary.tint10` | `rgba(31,143,99,0.1)` | Active nav-item background |
| `color.secondaryGreen` | `#33995B` | Progress bar fill, auth gradient stop, "FREE" badge |
| `color.brightGreen` | `#40BF72` `ESTIMATED` | Occasional accent green |
| `color.bg` | `#F2F8F5` | **App background** (mint tint) |
| `color.surface` | `#FFFFFF` | Cards, inputs, sheets, sidebar |
| `color.surfaceAlt` | `#F5F7FA` | Ingredient thumb bg / tab-switcher track |
| `color.surfaceOffwhite` | `#FAFAFA` | Button label off-white / subtle fills |

### Text (high confidence)

| Token | Hex | Role |
|---|---|---|
| `color.text.primary` | `#1A1A1A` | Body / headings on light (auth, onboarding, home, settings) |
| `color.text.heading.alt` | `#0A2533` | Dark heading on recipe **detail/instructions** screens |
| `color.text.muted` | `#666666` | Secondary text |
| `color.text.muted.alt` | `#748189` | Muted blue-grey on detail screens *(second muted grey — consolidate)* |
| `color.text.disabled` | `#999999` | Disabled labels / captions |
| `color.text.onPrimary` | `#FAFAFA`/`#FFFFFF` | Text on green buttons |

### Borders / dividers (high confidence)

| Token | Hex | Role |
|---|---|---|
| `color.border.input` | `#CCCCCC` | Default input/border |
| `color.border.subtle` | `#E6E6E6` | Dividers, disabled bg, sidebar border |
| `color.border.selected` | `#AEDC90` `ESTIMATED` | Selected-chip border (light green) |

### Semantic — warning / allergen (RED) — matches Tailwind red scale

| Token | Hex | Role |
|---|---|---|
| `color.danger.bg` | `#FEE2E2` | Allergen/error card **background** (red-100) |
| `color.danger.border` | `#FCA5A5` | Allergen/error card **border** (red-300) |
| `color.danger.text` | `#B91C1C` | Allergen/error **text** (red-700); `#991B1B` also used (red-800) |
| `color.danger.icon` | `#EF4444` `ESTIMATED` | Warning icon (red-500) — **no allergen card exists in code yet; confirm exact red from Figma** |

### Semantic — Pro / upgrade (AMBER/GOLD)

| Token | Hex | Role |
|---|---|---|
| `color.pro.bg` | `#FFE4C2` | **Pro upgrade card** background (amber); also selected-chip fill |
| `color.pro.bg.soft` | `#FFF1CE` `ESTIMATED` | Softer amber variant seen in code |
| `color.pro.accent` | `#FFA773` | Orange/amber accent *(currently mis-used as the Sign Up/Login form accent)* |
| `color.pro.text` | `#0A2533` `ESTIMATED` | Text on amber — confirm |

### Semantic — success

| Token | Hex | Role |
|---|---|---|
| `color.success` | `#1F8F63` | Success = primary green (reset-link confirmation text). If the design uses a **distinct** success green, capture it — `ESTIMATED` it differs. |

### Accent (non-brand, from detail-screen nutrition pills)

| Token | Hex | Role |
|---|---|---|
| `color.nutri.carb` | `#4B6BFF` / bg `#EEF3FF` | Carbs pill |
| `color.nutri.protein` | `#1F8F63` / bg `#E8FBF3` | Protein pill |
| `color.nutri.calorie` | `#FF8C2A` / bg `#FFF5EA` | Calories pill |
| `color.nutri.fat` | `#FF4E4E` / bg `#FFF0F0` | Fat pill |

> **Known conflict to resolve in the design:** Sign Up & Login currently use **orange `#FFA773`** as their primary
> form accent, while the rest of the app is **green `#1F8F63`**. Confirm which the Figma intends (almost certainly
> green for consistency; orange reserved for Pro).

---

## 2. Typography Scale

**Families:** `Poppins` (headings, labels, buttons — weights 300–700) and `DM Sans` (body/secondary). Headings are
**bold (700) and tight** (negative letter-spacing), noticeably heavier than body — consistent with your note.

| Role | Size | Weight | Line-height | Letter-spacing | Family |
|---|---|---|---|---|---|
| Screen title (H1) | **32px** | 700 | 38.4px (1.2) | **−1.6px** | Poppins |
| Section header (H2) | **24px** | 700 | 1.2–1.3 | −0.5px `ESTIMATED` | Poppins |
| Card / screen sub-title | **20px** | 700 | 25.2px | 0 | Poppins |
| Field label / emphasis | **18px** | 700 | 25.2px | 0 | Poppins |
| Body | **16–18px** | 400 | 1.55–1.6 | 0 | DM Sans (Poppins in some auth screens) |
| Button label | **18px** | 700 | 25.2px | 0 | Poppins |
| Caption / meta | **13–14px** | 400–600 | 1.4–1.5 | 0 | DM Sans |
| Micro (badges "Pro"/"FREE") | **11–12px** | 700 | 1 | 0 | DM Sans |

*Scale (px), most-used first:* `32, 24, 20, 18, 16, 15, 14, 13, 12, 11` (+ `40px` clamp on the home hero).
Recommend normalizing to a token ramp: `xs 12 / sm 14 / base 16 / md 18 / lg 20 / xl 24 / 2xl 32 / 3xl 40`.

---

## 3. Spacing Scale

Screens hardcode px but cluster on a **4px base grid** (matching the unused `--spacing-*` block in `index.css`):

| Token | px | Typical use |
|---|---|---|
| `space.1` | 4 | icon gaps, tiny insets |
| `space.2` | 8 | label→field gap |
| `space.3` | 12 | intra-group gaps, chip padding-y |
| `space.4` | 14–16 | **field-to-field gap**, card padding-y |
| `space.5` | 20 | input padding-x, form gaps |
| `space.6` | 24 | **card padding**, section gap, screen edge padding (detail/settings) |
| `space.7` | 28 | card padding (detail sheet), header top pad |
| `space.8` | 32 | section spacing, title→content |
| `space.10` | 40–48 | screen vertical padding, empty-state top pad |

- **Screen edge padding:** `16px` on onboarding/mobile-frame screens; `24–32px` on detail/settings; `48px` on desktop auth. **Standardize** (design is mobile → likely `16–20px`, confirm).
- **Gap between cards / list rows:** `12–16px`. **Gap between form fields:** `14px`. **Section vertical rhythm:** `24–32px`.

---

## 4. Border Radius Scale

| Token | px | Usage |
|---|---|---|
| `radius.sm` | 6 | checkbox, tiny steppers, small chips |
| `radius.md` | 10–12 | icon buttons, dropdowns, secondary buttons, list rows |
| `radius.lg` | **16** | **inputs, primary buttons, cards** (dominant radius) |
| `radius.xl` | 20 | large cards, recipe thumbs, bottom sheets |
| `radius.2xl` | 24 | detail hero sheet top corners |
| `radius.pill` | 30–50 / `100px` | progress bar, badges, nutrition pills, "fully rounded" chips |

> **Board review (Phase 2A):** the green CTAs read as **rounded rectangles (~16px), not stadium pills.**
> Decision: **`button.radius = radius-lg (16px)`** — matches the code's current value; the Phase-1 "pill"
> assumption is dropped. `radius-pill` is still defined for badges/chips/progress bars. (Confirm against a hi-res
> button crop if the corners look tighter/looser.)

---

## 5. Component Specs

> Specs below combine **what the design calls for** (your brief) with **the closest current implementation**.
> Where the two differ, the design intent wins and the delta is called out.

### Buttons
- **Primary:** full-width, height **57–61px**, bg `color.primary`, label Poppins 18/700 `#FAFAFA`, radius **`radius-lg` (16px)** *(board-confirmed rounded-rect, not pill)*. Hover → `primary.hover`; active → `scale(0.98)` + `primary.active`; disabled → bg `#E6E6E6`, text `#999999`. Optional hover shadow `shadow-primary`.
- **Secondary / outline:** bg `surface`, `1px` border (`primary` or `#CCCCCC`), text `#1A1A1A`, same height/radius. (Used for social login, "Add New.")
- **Text button:** no bg/border, `#1A1A1A` (or `primary`), 14–16px; underline on hover (e.g. "Forgot Password?", "Login/Sign Up").

### Text input
- Height **57px**, padding `0 20px`, bg `surface`, radius **16px**, Poppins 18.
- **Default** border `#CCCCCC`. **Focused** `ESTIMATED` → `primary` border + subtle ring (not implemented today; add). **Filled** = default + `#1A1A1A` text. **Error** `ESTIMATED` → `danger.border` + helper text `danger.text` (not implemented).
- ⚠️ Current auth inputs use **orange `#FFA773`** borders — align to spec.

### Cards
- **Recipe card (rail/grid):** image `150×150` (rail) or `1:1` (grid), radius **20px**, `1px #CCCCCC` border, floating circular "+"/favorite button top-right (`white`, `shadow 0 6px 12px rgba(0,0,0,0.25)`), title Poppins 14/700 clamped 3 lines. `Pro` badge = pill `#D9F2E3` bg / `#1A4D2E` text.
- **List-row card:** `surface`, radius **16px**, `1px #F0F0F0`, shadow `0 2px 8px rgba(6,51,54,0.06)`, padding `14–16px`, leading `48px` thumb (`radius 10`, `#F5F7FA`), trailing control.
- **Warning / allergen card `ESTIMATED`:** bg `danger.bg` `#FEE2E2`, `1px danger.border`, radius 16, warning icon + `danger.text` copy. **Does not exist in code — net-new.**
- **Upsell / Pro card:** bg `color.pro.bg` `#FFE4C2`, radius **20px**, padding `28px`, H2 24/700 + body DM Sans 16 `#666666`, green pill CTA. **Exists but `display:none` — enable.**

### Bottom tab bar (net-new; replaces the desktop sidebar)
- **4 destinations + 1 center action:** **Meal Plan · Favorites · [center: AI Suggestions] · Groceries · Settings.**
  Board-confirmed 4 destinations; the **center action button is a deliberate deviation** to preserve the existing
  AI Suggestions feature (which had a dedicated sidebar entry with no home in a 4-tab bar). **Log in
  `REMAINING_WORK.md`.** The center button opens the AI Suggestions bottom sheet (`MealSuggestionsPanel`).
- **Icons:** reuse the design's **own exported nav SVGs** already referenced in `App.tsx` `SIDEBAR_NAV`
  (Meal Plan / Favorites / Groceries / Settings) so glyphs match the source; center = a distinct "✨/AI" mark.
- Active: icon+label `color.primary`, label 700; inactive: `muted-foreground` / `disabled`, 500. Surface
  `#FFFFFF`, top border `border` `#E6E6E6`. Center action = elevated circular green button (`shadow-primary`).
- **Safe area:** bottom padding uses `env(safe-area-inset-bottom)` (Capacitor target). Icon glyph exactness
  still `ESTIMATED` pending a hi-res tab-bar crop.

### Top app bar
- Left back affordance (24px arrow icon button), centered or left title (Poppins 20/700), optional right action (menu/search 24px). On detail screens the header is **overlaid on the hero** with `40px` white rounded-square icon buttons (`radius 10`, `shadow 0 2px 16px rgba(6,51,54,0.18)`).

### Chips / tags
- **Selectable (onboarding):** full-width or inline pill, padding `16px 24px`, radius **16px**, Poppins 18/700. Unselected `surface` + `#CCCCCC`; selected `#FFE4C2` bg + `#AEDC90` border. (Dietary **display tags on recipes** are **not in code** — net-new if the design shows them.)

### Modals & bottom sheets
- **Bottom sheet:** white panel pinned to bottom, top corners **radius 20px**, backdrop `rgba(25,25,25,0.2)` + `backdrop-filter: blur(9px)`, slide-up 0.3s, optional drag-handle (`134×5`, `black/0.1`, pill). (See RecipeGuide onboarding sheet.)
- **Dialog:** centered card, white, radius 20, shadow `0 4px 20px rgba(0,0,0,0.1)` (QuitConfirmDialog).

### Checkbox / toggle
- **Checkbox:** `20×20`, radius **6px**, `1px` border; checked = fill + inner `10×10` white square. (Terms checkbox currently fills **orange** — retoken to brand.)
- **Toggle / switch:** ⚠️ **none exists** — net-new primitive if the design uses switches (e.g. settings/preferences).

### Star rating
- Row of **5 stars**, ~`33px`, gap ~`16px`; filled = full opacity + `scale(1.1)`, empty = `opacity 0.4`; hover `scale(1.2)`. Currently **image-based** in `RecipeFeedback` — extract into a reusable control (consider an SVG star tinted with tokens instead of remote PNGs).

---

## 6. Elevation / Shadow

Soft, low-spread, greenish-tinted shadows (not neutral black):

| Token | Value | Usage |
|---|---|---|
| `shadow.card` | `0 1px 6px rgba(10,37,51,0.06)` / `0 2px 8px rgba(6,51,54,0.06)` | Cards, list rows |
| `shadow.raised` | `0 4px 10px rgba(0,0,0,0.2)` | Floating circular buttons on images |
| `shadow.icon` | `0 2px 16px rgba(6,51,54,0.18)` | Overlay icon buttons on hero |
| `shadow.primary` | `0 4px 16px rgba(31,143,99,0.3)` (hover `0 8px 20px …0.4`) | Primary CTA lift |
| `shadow.sheetTop` | `0 -10px 16px rgba(67,61,55,0.06)` | Bottom action bars / sheets |
| `shadow.dropdown` | `0 4px 16px rgba(10,37,51,0.12)` | Menus/popovers |

---

## 7. Recommended token delivery (for Phase 2)

Replace the greyscale shadcn block in [src/index.css](../src/index.css) with these as CSS custom properties (and/or a
typed `theme.ts`), then refactor screens to consume them via shared `Button/Input/Card/Chip` primitives. This
turns the ~450 scattered literals into a single source of truth and makes the reskin a token edit rather than a
450-site find-and-replace.

**Board review (Phase 2A) resolved:** button shape (16px rounded-rect), palette confirmation, auth-flow screen
set, tab-bar destination count (4 + center action). **Still `ESTIMATED`, pending hi-res per-screen crops:** exact
input focus-ring & error styling, the precise allergen-red vs success-green distinction, and the tab-bar icon
glyphs. These are low-risk (code + convention cover them) and are cheap token/class edits once crops arrive.
