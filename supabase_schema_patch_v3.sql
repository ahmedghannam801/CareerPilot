-- ==========================================================
-- CareerPilot AI - Schema Patch v3
-- Run in Supabase SQL Editor after v2 migration
-- Adds missing fields to profiles table
-- ==========================================================

-- Add missing columns to profiles table (safe, idempotent)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS target_salary TEXT,
  ADD COLUMN IF NOT EXISTS next_best_action JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS career_memory JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS timeline JSONB DEFAULT '[]'::jsonb;

-- Update handle_new_user trigger to also set headline
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, onboarding_completed, headline)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    FALSE,
    ''
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Add RLS policy for service role (used by server for admin ops)
-- Users can only see/edit their own profile row (already enforced by profiles_self_only)
-- No changes needed to existing policies
