-- Recipe catalog synced from TheMealDB by the sync-recipes Edge Function.
-- TheMealDB's terms allow copying and modifying API content ("You can scrape, copy and
-- modify any content returned from the API, as long as you use the official end points"),
-- so this is a permanent local copy rather than a cache. Credit: TheMealDB.
--
-- Deterministic columns (steps, ingredients, allergens, diets, US/metric text) are
-- recomputed on every sync. Claude-derived columns (meal_role, display_name, subtitle,
-- total_minutes) are written once and never recomputed.

create table if not exists public.recipes (
  id               integer primary key,              -- TheMealDB idMeal
  name             text not null,                     -- strMeal, as published
  display_name     text,                              -- plain US-English name ("Syrian green beans in olive oil")
  subtitle         text,                              -- short plain-English description
  category         text,
  area             text,
  thumb_url        text,
  instructions_raw text,
  -- [{ text_us, text_metric, timers: [{ seconds, maxSeconds, label }] }]
  steps            jsonb not null default '[]'::jsonb,
  -- [{ name, name_us, measure_raw, quantity, quantity_max, unit, note, allergens[] }]
  ingredients      jsonb not null default '[]'::jsonb,
  -- lowercased original + US ingredient names, for "ingredients we skip"
  ingredient_names text[] not null default '{}',
  tags             text[] not null default '{}',
  source_url       text,
  youtube_url      text,
  meal_role        text check (meal_role in ('breakfast', 'main', 'side', 'dessert', 'condiment', 'drink')),
  total_minutes    integer check (total_minutes > 0),  -- Claude's estimate; shown as "About N min"
  allergens        text[] not null default '{}',       -- dairy, egg, gluten, peanut, tree_nut, soy, fish, shellfish, sesame
  diets            text[] not null default '{}',       -- vegetarian, vegan, pescatarian (diets the recipe fits)
  classified_at    timestamptz,
  synced_at        timestamptz not null default now()
);

create index if not exists recipes_meal_role on public.recipes (meal_role);
create index if not exists recipes_category on public.recipes (category);
create index if not exists recipes_allergens on public.recipes using gin (allergens);
create index if not exists recipes_diets on public.recipes using gin (diets);

alter table public.recipes enable row level security;

-- Readable by everyone (the signed-out auth screens show a preview week).
-- No insert/update/delete policies: only the service role (sync-recipes) writes.
drop policy if exists "Catalog is readable" on public.recipes;
create policy "Catalog is readable" on public.recipes for select to anon, authenticated using (true);

-- Grocery aisle (and US name) per ingredient, classified once.
create table if not exists public.ingredient_meta (
  name          text primary key,   -- lowercased TheMealDB ingredient name
  name_us       text not null,
  aisle         text not null check (aisle in ('Produce', 'Meat and seafood', 'Dairy and eggs', 'Bakery', 'Pantry', 'Spices', 'Frozen', 'Other')),
  classified_at timestamptz not null default now()
);

alter table public.ingredient_meta enable row level security;

drop policy if exists "Ingredient aisles are readable" on public.ingredient_meta;
create policy "Ingredient aisles are readable" on public.ingredient_meta for select to anon, authenticated using (true);
