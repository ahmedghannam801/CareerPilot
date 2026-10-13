-- ==========================================================
-- CareerPilot AI - Complete Supabase PostgreSQL Schema
-- Run this in your Supabase Project -> SQL Editor -> Run
-- ==========================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  career_status TEXT,
  target_role TEXT,
  target_industries JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  dna JSONB DEFAULT '{}'::jsonb,
  readiness JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Opportunities Table (Jobs & Internships from Indeed, LinkedIn, Wuzzuf)
CREATE TABLE IF NOT EXISTS opportunities (
  id TEXT PRIMARY KEY,
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

-- 3. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
  id TEXT PRIMARY KEY,
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

-- 4. Applications Tracker Table
CREATE TABLE IF NOT EXISTS applications (
  id TEXT PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Courses & Learning Tracks Table
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
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

-- 6. Micro-Projects & Skill Evidence Table
CREATE TABLE IF NOT EXISTS micro_projects (
  id TEXT PRIMARY KEY,
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

-- 7. Interview Simulator Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id TEXT PRIMARY KEY,
  job_role TEXT NOT NULL,
  type TEXT DEFAULT 'Technical',
  questions JSONB DEFAULT '[]'::jsonb,
  overall_score INT,
  summary_feedback TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_opportunities_match ON opportunities(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_platform ON opportunities(source_platform);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_courses_domain ON courses(domain);
