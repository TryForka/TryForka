-- Public profile row per auth user. The live table already existed (created
-- outside migrations, with an "own profile" ALL policy), so this is written to
-- be idempotent against it, and adds the household columns ProfileSettings uses.
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS household_name TEXT    NOT NULL DEFAULT '';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS household_size INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Users can manage own profile'
  ) THEN
    CREATE POLICY "Users can manage own profile" ON public.users
      FOR ALL USING (auth.uid() = id);
  END IF;
END $$;
