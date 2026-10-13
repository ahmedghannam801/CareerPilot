-- ==========================================================
-- CareerPilot AI - Schema Patch v5: Onboarding & Career Profile Engine
-- Run in Supabase SQL Editor
-- Ensures profiles table has onboarding columns and user-isolated RLS
-- ==========================================================

-- 1. Add onboarding columns to profiles if not present
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS onboarding_answers JSONB DEFAULT '{}'::jsonb;

-- 2. Create index on onboarding_completed for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
  ON public.profiles(onboarding_completed);

-- 3. Ensure Row Level Security is active on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User isolation policy (Self-only read and write)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'profiles_self_only'
  ) THEN
    CREATE POLICY "profiles_self_only" ON public.profiles
      FOR ALL
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;
