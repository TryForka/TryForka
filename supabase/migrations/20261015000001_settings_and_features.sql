-- Settings, ratings, cooked log, grocery extras, photo lookups, per-kind rate limits,
-- avatar storage, and safe_recipes(): the per-user hard filter every recipe list uses.

-- ── Preferences ─────────────────────────────────────────────────────────────
alter table public.user_preferences
  add column if not exists diet text not null default 'none',
  add column if not exists skip_ingredients text[] not null default '{}',
  add column if not exists plan_breakfast boolean not null default false,
  add column if not exists plan_lunch boolean not null default false,
  add column if not exists plan_dinner boolean not null default true,
  add column if not exists max_weeknight_minutes integer,
  add column if not exists units text not null default 'us',
  add column if not exists onboarded_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_preferences_diet_check') then
    alter table public.user_preferences add constraint user_preferences_diet_check
      check (diet in ('none', 'vegetarian', 'vegan', 'pescatarian'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_preferences_units_check') then
    alter table public.user_preferences add constraint user_preferences_units_check check (units in ('us', 'metric'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'user_preferences_minutes_check') then
    alter table public.user_preferences add constraint user_preferences_minutes_check
      check (max_weeknight_minutes is null or max_weeknight_minutes > 0);
  end if;
end $$;

-- Backfill the new fields from the old onboarding answers (old columns are kept).
-- Allergy chips become the 9 allergen keys; anything else the user wrote as an allergy
-- ("Mustard", "kiwi") is kept as a skipped ingredient, which is also a hard filter.
update public.user_preferences p set
  diet = case
    when exists (select 1 from unnest(p.diets) d where lower(trim(d)) = 'vegan') then 'vegan'
    when exists (select 1 from unnest(p.diets) d where lower(trim(d)) = 'vegetarian') then 'vegetarian'
    when exists (select 1 from unnest(p.diets) d where lower(trim(d)) in ('pescetarian', 'pescatarian')) then 'pescatarian'
    else 'none' end,
  allergies = coalesce((
    select array_agg(distinct k order by k) from (
      select case lower(trim(a))
        when 'gluten' then 'gluten' when 'wheat' then 'gluten'
        when 'peanut' then 'peanut' when 'peanuts' then 'peanut'
        when 'tree nut' then 'tree_nut' when 'tree nuts' then 'tree_nut' when 'tree_nut' then 'tree_nut'
        when 'soy' then 'soy' when 'soya' then 'soy'
        when 'sesame' then 'sesame'
        when 'shellfish' then 'shellfish'
        when 'dairy' then 'dairy' when 'milk' then 'dairy'
        when 'egg' then 'egg' when 'eggs' then 'egg'
        when 'fish' then 'fish'
      end as k
      from unnest(p.allergies) a
    ) x where k is not null), '{}'),
  skip_ingredients = coalesce((
    select array_agg(distinct t order by t) from (
      select case when lower(trim(d)) = 'tomatoe' then 'tomato' else lower(trim(d)) end as t from unnest(p.dislikes) d
      union all
      select lower(trim(a)) from unnest(p.allergies) a
        where lower(trim(a)) not in ('gluten', 'wheat', 'peanut', 'peanuts', 'tree nut', 'tree nuts', 'tree_nut', 'soy', 'soya',
                                     'sesame', 'shellfish', 'dairy', 'milk', 'egg', 'eggs', 'fish')
      union all
      select trim(x) from regexp_split_to_table(lower(p.custom_dislikes || ',' || p.custom_allergies), '\s*(,|;|\mand\M)\s*') x
    ) y where length(t) >= 2), '{}'),
  max_weeknight_minutes = case
    when p.cooking_time ilike '15%' then 30
    when p.cooking_time ilike '30%' then 45
    when p.cooking_time ilike '45%' then 60
    else null end,
  onboarded_at = case when p.cooking_time <> '' then p.updated_at else p.onboarded_at end
where p.onboarded_at is null;

-- ── The per-user recipe filter ──────────────────────────────────────────────
-- Every list in the app (browse, week plans, suggestions, photo results) selects from
-- this function, so allergies, diet and skipped ingredients are always applied in SQL.
-- Signed-out callers (no auth.uid()) get the unfiltered, classified catalog.
create or replace function public.safe_recipes()
returns setof public.recipes
language sql
stable
security invoker
set search_path = public
as $$
  with prefs as (
    select allergies, diet,
           array(select regexp_replace(lower(trim(s)), '(es|s)$', '') from unnest(skip_ingredients) s where length(trim(s)) >= 3) as skips
    from user_preferences where user_id = auth.uid()
  )
  select r.*
  from recipes r
  left join prefs p on true
  where r.meal_role is not null
    and not (r.allergens && coalesce(p.allergies, '{}'))
    and (coalesce(p.diet, 'none') = 'none' or r.diets @> array[p.diet])
    and not exists (
      select 1 from unnest(coalesce(p.skips, '{}')) s
      where lower(r.name) like '%' || s || '%'
         or exists (select 1 from unnest(r.ingredient_names) n where n like '%' || s || '%')
    )
$$;

grant execute on function public.safe_recipes() to anon, authenticated;

-- ── Ratings (replaces "feedback"; TheMealDB recipes have no chef) ───────────
create table if not exists public.recipe_ratings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  integer not null,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

alter table public.recipe_ratings enable row level security;
drop policy if exists "Users can manage own ratings" on public.recipe_ratings;
create policy "Users can manage own ratings" on public.recipe_ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Keep existing feedback as ratings (latest per user and recipe). The feedback table stays.
insert into public.recipe_ratings (user_id, recipe_id, rating, comment, created_at, updated_at)
select distinct on (user_id, recipe_id) user_id, recipe_id, rating, nullif(trim(comment), ''), created_at, created_at
from public.feedback
where recipe_id is not null and rating between 1 and 5
order by user_id, recipe_id, created_at desc
on conflict (user_id, recipe_id) do nothing;

-- ── Cooked log ("Mark as cooked", and "Done" at the end of cooking mode) ────
create table if not exists public.cooked_recipes (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  recipe_id integer not null,
  cooked_at timestamptz not null default now()
);

create index if not exists cooked_recipes_user on public.cooked_recipes (user_id, recipe_id, cooked_at desc);
alter table public.cooked_recipes enable row level security;
drop policy if exists "Users can manage own cooked log" on public.cooked_recipes;
create policy "Users can manage own cooked log" on public.cooked_recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Week plan edits and grocery extras ──────────────────────────────────────
-- updated_at changes on every edit (swap, add); created_at stays "when it was planned".
alter table public.week_plans add column if not exists updated_at timestamptz not null default now();
update public.week_plans set updated_at = created_at where updated_at > created_at;

-- [{ key, name }] items the user added by hand; ticks for them live in `checked` too.
alter table public.grocery_lists add column if not exists custom_items jsonb not null default '[]'::jsonb;
-- updated_at of the plan the list was built from (edits rebuild the list, keeping ticks).
alter table public.grocery_lists add column if not exists plan_updated_at timestamptz;

-- ── Photo lookups ("Find meals like this"). The image itself is never stored. ─
create table if not exists public.dish_lookups (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  dish_name  text not null,
  attributes jsonb not null default '{}'::jsonb,
  context    text,
  created_at timestamptz not null default now()
);

create index if not exists dish_lookups_user on public.dish_lookups (user_id, created_at desc);
alter table public.dish_lookups enable row level security;
drop policy if exists "Users can read own lookups" on public.dish_lookups;
create policy "Users can read own lookups" on public.dish_lookups for select using (auth.uid() = user_id);
drop policy if exists "Users can add own lookups" on public.dish_lookups;
create policy "Users can add own lookups" on public.dish_lookups for insert with check (auth.uid() = user_id);

-- ── Rate limits per kind (suggestions, photo lookups) ───────────────────────
alter table public.ai_requests add column if not exists kind text not null default 'suggestions';
create index if not exists ai_requests_user_kind_time on public.ai_requests (user_id, kind, created_at desc);

-- Returns 0 and records the request if the user is under both limits for this kind;
-- otherwise the seconds until they can try again (nothing recorded); -1 if signed out.
create or replace function public.claim_request(p_kind text, p_per_minute int, p_per_day int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  wait_seconds numeric;
begin
  if uid is null then
    return -1;
  end if;

  perform pg_advisory_xact_lock(hashtext('ai_requests:' || uid::text || ':' || p_kind));

  delete from ai_requests where user_id = uid and created_at < now() - interval '1 day';

  if (select count(*) from ai_requests where user_id = uid and kind = p_kind) >= p_per_day then
    select extract(epoch from min(created_at) + interval '1 day' - now()) into wait_seconds
      from ai_requests where user_id = uid and kind = p_kind;
    return greatest(1, ceil(wait_seconds))::int;
  end if;

  if (select count(*) from ai_requests where user_id = uid and kind = p_kind and created_at > now() - interval '1 minute') >= p_per_minute then
    select extract(epoch from min(created_at) + interval '1 minute' - now()) into wait_seconds
      from ai_requests where user_id = uid and kind = p_kind and created_at > now() - interval '1 minute';
    return greatest(1, ceil(wait_seconds))::int;
  end if;

  insert into ai_requests (user_id, kind) values (uid, p_kind);
  return 0;
end;
$$;

revoke all on function public.claim_request(text, int, int) from public, anon;
grant execute on function public.claim_request(text, int, int) to authenticated;

-- ── Profile photos ──────────────────────────────────────────────────────────
-- Public-read bucket; each user writes only inside their own folder (<user id>/...).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar owners can read" on storage.objects;
create policy "Avatar owners can read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Avatar owners can upload" on storage.objects;
create policy "Avatar owners can upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Avatar owners can update" on storage.objects;
create policy "Avatar owners can update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Avatar owners can delete" on storage.objects;
create policy "Avatar owners can delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
