-- A recipe could be favorited more than once (no uniqueness, plus a client race).
-- Once duplicated, the detail screen's status check (expects at most one row)
-- showed the heart as unfavorited, and every tap inserted another row.
DELETE FROM public.favorites a
USING public.favorites b
WHERE a.user_id = b.user_id
  AND a.recipe_id = b.recipe_id
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_recipe_key
  ON public.favorites (user_id, recipe_id);
