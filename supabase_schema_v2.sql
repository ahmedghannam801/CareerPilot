-- ==========================================================
-- CareerPilot AI - Supabase Schema v2 (Fixed Migration)
-- Run this in your Supabase Project -> SQL Editor -> Run
-- Handles existing tables gracefully with proper type casts
-- ==========================================================

-- ── Step 1: Drop old tables cleanly (preserves auth.users) ──────────────────
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS micro_projects CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ── Step 2: Recreate profiles with UUID PK (linked to auth.users) ────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  headline TEXT,
  location TEXT,
  career_status TEXT,
  target_role TEXT,
  target_industries JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  dna JSONB DEFAULT '{}'::jsonb,
  readiness JSONB DEFAULT '{}'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_only" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ── Step 3: Opportunities ──────────────────────────────────────────────────
CREATE TABLE opportunities (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  work_model TEXT,
  employment_type TEXT DEFAULT 'Full-time',
  salary TEXT,
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  preferred_skills JSONB DEFAULT '[]'::jsonb,
  match_score INT DEFAULT 85,
  source_url TEXT,
  source_platform TEXT DEFAULT 'Direct',
  is_manual BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "opportunities_self_only" ON opportunities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Step 4: Resumes ────────────────────────────────────────────────────────
CREATE TABLE resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_master BOOLEAN DEFAULT FALSE,
  summary TEXT,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  target_role TEXT,
  ats_score INT DEFAULT 85,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "resumes_self_only" ON resumes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Step 5: Applications ───────────────────────────────────────────────────
CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id TEXT,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT DEFAULT 'Draft',
  applied_date TEXT,
  tailored_resume_id TEXT,
  cover_letter TEXT,
  answers JSONB DEFAULT '[]'::jsonb,
  quality_score INT DEFAULT 80,
  quality_feedback JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_self_only" ON applications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Step 6: Courses ────────────────────────────────────────────────────────
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  instructor TEXT,
  domain TEXT,
  target_role TEXT,
  level TEXT DEFAULT 'Intermediate',
  duration TEXT,
  rating NUMERIC(3,2) DEFAULT 4.8,
  reviews_count INT DEFAULT 1200,
  url TEXT NOT NULL,
  description TEXT,
  skills_gained JSONB DEFAULT '[]'::jsonb,
  relevance_reason TEXT,
  cost TEXT DEFAULT 'Free',
  certificate_available BOOLEAN DEFAULT TRUE,
  enrollment_status TEXT DEFAULT 'not_enrolled',
  progress_percentage INT DEFAULT 0,
  modules JSONB DEFAULT '[]'::jsonb,
  source TEXT DEFAULT 'Curated',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_self_only" ON courses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Step 7: Micro-Projects ─────────────────────────────────────────────────
CREATE TABLE micro_projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_skill TEXT NOT NULL,
  duration TEXT,
  scenario TEXT,
  objective TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  evidence_criteria JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'available',
  evaluation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE micro_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "micro_projects_self_only" ON micro_projects
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Step 8: Interview Sessions ─────────────────────────────────────────────
CREATE TABLE interview_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL,
  type TEXT DEFAULT 'Technical',
  questions JSONB DEFAULT '[]'::jsonb,
  overall_score INT,
  summary_feedback TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interview_sessions_self_only" ON interview_sessions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── Step 9: Performance indexes ────────────────────────────────────────────
CREATE INDEX idx_opportunities_user    ON opportunities(user_id);
CREATE INDEX idx_opportunities_match   ON opportunities(match_score DESC);
CREATE INDEX idx_applications_user     ON applications(user_id);
CREATE INDEX idx_applications_status   ON applications(status);
CREATE INDEX idx_resumes_user          ON resumes(user_id);
CREATE INDEX idx_courses_user          ON courses(user_id);
CREATE INDEX idx_micro_projects_user   ON micro_projects(user_id);
CREATE INDEX idx_interview_sessions_u  ON interview_sessions(user_id);

-- ── Step 10: Auto-create profile on signup ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, onboarding_completed)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
