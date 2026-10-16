-- The user's current week plan and the grocery list built from it.
-- One row per user in each table: generating a new week plan replaces both.

CREATE TABLE IF NOT EXISTS week_plans (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- { monday: { breakfast: { id, title, image } | null, lunch: …, dinner: … }, … }
  plan jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE week_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own week plan" ON week_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS grocery_lists (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- [{ key, name, amount, group, meals }], combined across the plan's meals
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- keys of ticked items
  checked text[] NOT NULL DEFAULT '{}',
  -- created_at of the week plan this list was built from
  plan_created_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own grocery list" ON grocery_lists
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
