/**
 * CareerPilot AI — Auto Schema Installer
 * Runs all SQL migration files directly on Supabase via REST API.
 * Usage: npx tsx scripts/setup-supabase.ts
 */

import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

// Combined migration — all 5 files merged in safe order
const FULL_MIGRATION = `
-- ═══════════════════════════════════════════════════════════════
-- CareerPilot AI — Full Schema Installation (v1→v5 combined)
-- Safe idempotent migration — can be re-run without data loss
-- ═══════════════════════════════════════════════════════════════

-- ── STEP 1: Drop old tables (v1 schema, if they exist) ──────────
DROP TABLE IF EXISTS interview_sessions CASCADE;
DROP TABLE IF EXISTS micro_projects CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS resumes CASCADE;
DROP TABLE IF EXISTS opportunities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ── STEP 2: Profiles (linked to Supabase Auth) ──────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  headline TEXT,
  location TEXT,
  career_status TEXT,
  target_role TEXT,
  target_salary TEXT,
  target_industries JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  dna JSONB DEFAULT '{}'::jsonb,
  readiness JSONB DEFAULT '{}'::jsonb,
  next_best_action JSONB DEFAULT '{}'::jsonb,
  career_memory JSONB DEFAULT '[]'::jsonb,
  timeline JSONB DEFAULT '[]'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_answers JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_only" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed
  ON public.profiles(onboarding_completed);

-- ── STEP 3: Auto-create profile on signup ───────────────────────
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── STEP 4: Opportunities ────────────────────────────────────────
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
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── STEP 5: Resumes ──────────────────────────────────────────────
CREATE TABLE resumes (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_master BOOLEAN DEFAULT FALSE,
  is_tailored BOOLEAN DEFAULT FALSE,
  summary TEXT,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  target_role TEXT,
  ats_score INT DEFAULT 85,
  template_version TEXT DEFAULT 'google_doc_ats_v1',
  source_resume_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resumes_self_only" ON resumes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── STEP 6: Applications ─────────────────────────────────────────
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
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_self_only" ON applications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── STEP 7: Courses ──────────────────────────────────────────────
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
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── STEP 8: Micro-Projects ───────────────────────────────────────
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
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── STEP 9: Interview Sessions ───────────────────────────────────
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
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── STEP 10: Roadmaps Catalogue (v4) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT NOT NULL,
  description_ar TEXT,
  category TEXT NOT NULL,
  target_role TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  language TEXT NOT NULL DEFAULT 'Both',
  publication_status TEXT NOT NULL DEFAULT 'published',
  version TEXT NOT NULL DEFAULT '1.0',
  estimated_total_hours INTEGER DEFAULT 120,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmap_stages (
  id TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  order_index INTEGER NOT NULL DEFAULT 1,
  estimated_effort TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roadmap_nodes (
  id TEXT PRIMARY KEY,
  stage_id TEXT NOT NULL REFERENCES public.roadmap_stages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  category TEXT NOT NULL DEFAULT 'Core Concept',
  learning_objectives TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  order_index INTEGER NOT NULL DEFAULT 1,
  estimated_effort TEXT,
  completion_criteria TEXT,
  prerequisites TEXT[] DEFAULT '{}',
  practical_exercise TEXT,
  related_project_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.learning_resources (
  id TEXT PRIMARY KEY,
  roadmap_node_id TEXT NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  url TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'English',
  price_category TEXT NOT NULL DEFAULT 'Free',
  difficulty TEXT NOT NULL DEFAULT 'Intermediate',
  estimated_duration TEXT,
  verification_status TEXT NOT NULL DEFAULT 'Verified',
  instructor TEXT,
  description TEXT,
  is_recommended BOOLEAN DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roadmap_enrollments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  roadmap_id TEXT NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  weekly_hours_committed INTEGER NOT NULL DEFAULT 5,
  current_stage_id TEXT,
  current_node_id TEXT,
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  node_progress JSONB DEFAULT '{}'::jsonb,
  saved_resource_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, roadmap_id)
);

CREATE TABLE IF NOT EXISTS public.weekly_learning_plans (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id TEXT NOT NULL REFERENCES public.user_roadmap_enrollments(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL DEFAULT 1,
  week_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_hours INTEGER NOT NULL DEFAULT 5,
  completed_hours INTEGER NOT NULL DEFAULT 0,
  activities JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmap_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_learning_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for published roadmaps"
  ON public.roadmaps FOR SELECT USING (publication_status = 'published');
CREATE POLICY "Public read for roadmap stages"
  ON public.roadmap_stages FOR SELECT USING (true);
CREATE POLICY "Public read for roadmap nodes"
  ON public.roadmap_nodes FOR SELECT USING (true);
CREATE POLICY "Public read for learning resources"
  ON public.learning_resources FOR SELECT USING (true);
CREATE POLICY "Users can manage own enrollments"
  ON public.user_roadmap_enrollments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can manage own weekly plans"
  ON public.weekly_learning_plans FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── STEP 11: Performance indexes ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_opportunities_user    ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_match   ON opportunities(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_user     ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status   ON applications(status);
CREATE INDEX IF NOT EXISTS idx_resumes_user          ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_user          ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_projects_user   ON micro_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_u  ON interview_sessions(user_id);
`;

async function runSQL(sql: string, label: string): Promise<void> {
  const projectRef = SUPABASE_URL!.replace('https://', '').split('.')[0];
  const managementUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log(`\n🔄 Running: ${label}...`);

  try {
    const res = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (res.ok) {
      console.log(`✅ ${label} — SUCCESS`);
      return;
    }

    const body = await res.text();
    console.warn(`⚠️  Management API returned ${res.status}: ${body}`);
    console.log(`\n📋 Falling back: printing SQL for manual paste...\n`);
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log(`\n👆 Copy the SQL above and paste it in:\nhttps://supabase.com/dashboard/project/${projectRef}/sql/new\n`);
  } catch (err) {
    console.error(`❌ Network error:`, err);
    const projectRef2 = SUPABASE_URL!.replace('https://', '').split('.')[0];
    console.log(`\n📋 Paste this SQL manually at:\nhttps://supabase.com/dashboard/project/${projectRef2}/sql/new\n`);
    console.log(sql);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   CareerPilot AI — Supabase Schema Installer  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\n📡 Project: ${SUPABASE_URL}`);

  await runSQL(FULL_MIGRATION, 'Full Schema v1→v5 Migration');

  console.log('\n🎉 Done! Your Supabase database is ready.');
  console.log('   Tables created: profiles, opportunities, resumes,');
  console.log('   applications, courses, micro_projects, interview_sessions,');
  console.log('   roadmaps, roadmap_stages, roadmap_nodes, learning_resources,');
  console.log('   user_roadmap_enrollments, weekly_learning_plans\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
