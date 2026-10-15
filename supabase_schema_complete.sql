-- ============================================================================
-- CareerPilot AI - Complete Supabase Database Schema
-- Generated: 2026-10-15
-- Version: 2.0 (Post E2E Fixes)
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- AUTHENTICATION & USER PROFILES
-- ============================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  headline TEXT,
  location TEXT,
  career_status TEXT CHECK (career_status IN ('student', 'fresh_graduate', 'experienced_professional', 'career_changer')),
  target_role TEXT,
  target_industries TEXT[] DEFAULT '{}',
  target_salary TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_career_status ON profiles(career_status);

-- ============================================================================
-- SKILLS & EVIDENCE MANAGEMENT
-- ============================================================================

-- User Skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  canonical_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('Technical', 'Soft', 'Domain', 'Tool')),
  level TEXT CHECK (level IN ('Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert')),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  evidence_count INTEGER DEFAULT 0,
  last_assessed TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, canonical_name)
);

-- Skill Evidence table
CREATE TABLE IF NOT EXISTS skill_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id UUID NOT NULL REFERENCES user_skills(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  evidence_type TEXT CHECK (evidence_type IN ('project', 'assessment', 'certification', 'experience', 'interview', 'course', 'user_verification')),
  title TEXT NOT NULL,
  score INTEGER,
  url TEXT,
  evidence_date TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_skill_id ON skill_evidence(skill_id);

-- ============================================================================
-- EDUCATION & EXPERIENCE
-- ============================================================================

-- Education table
CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  gpa TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experience table
CREATE TABLE IF NOT EXISTS experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  location TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  responsibilities TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_education_user_id ON education(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_user_id ON experience(user_id);

-- ============================================================================
-- CAREER DNA & READINESS
-- ============================================================================

-- Career DNA table (one per user)
CREATE TABLE IF NOT EXISTS career_dna (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  current_level TEXT,
  primary_direction TEXT,
  secondary_directions TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  weaknesses TEXT[] DEFAULT '{}',
  key_competencies TEXT[] DEFAULT '{}',
  work_model TEXT CHECK (work_model IN ('Remote', 'Hybrid', 'On-site', 'Flexible')),
  team_style TEXT CHECK (team_style IN ('Collaborative', 'Independent', 'Mixed')),
  pace TEXT CHECK (pace IN ('High-growth', 'Balanced', 'Structured')),
  summary TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Readiness table
CREATE TABLE IF NOT EXISTS career_readiness (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  skills_score INTEGER DEFAULT 0,
  cv_score INTEGER DEFAULT 0,
  experience_score INTEGER DEFAULT 0,
  projects_score INTEGER DEFAULT 0,
  education_score INTEGER DEFAULT 0,
  interview_readiness_score INTEGER DEFAULT 0,
  branding_score INTEGER DEFAULT 0,
  application_readiness_score INTEGER DEFAULT 0,
  summary TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Improvement Actions table
CREATE TABLE IF NOT EXISTS improvement_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  readiness_id UUID NOT NULL REFERENCES career_readiness(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  impact TEXT CHECK (impact IN ('High', 'Medium', 'Low')),
  estimated_hours INTEGER,
  category TEXT,
  completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Next Best Action table
CREATE TABLE IF NOT EXISTS next_best_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  evidence_needed TEXT,
  expected_impact TEXT,
  estimated_effort TEXT,
  target_url TEXT,
  action_type TEXT CHECK (action_type IN ('build_project', 'tailor_cv', 'apply', 'practice_interview', 'learn_skill', 'review_email')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CV / RESUME MANAGEMENT
-- ============================================================================

-- Resume Versions table
CREATE TABLE IF NOT EXISTS resume_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_master BOOLEAN DEFAULT FALSE,
  target_role TEXT,
  summary TEXT,
  skills TEXT[] DEFAULT '{}',
  certifications TEXT[] DEFAULT '{}',
  ats_score INTEGER,
  opportunity_id UUID,
  company_name TEXT,
  template_version TEXT,
  original_file_name TEXT,
  is_tailored BOOLEAN DEFAULT FALSE,
  source_resume_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,

  -- JSONB fields for complex data
  experience_data JSONB DEFAULT '[]',
  education_data JSONB DEFAULT '[]',
  projects_data JSONB DEFAULT '[]', -- NEW: Projects section
  analysis_details JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATS Analysis Findings table
CREATE TABLE IF NOT EXISTS ats_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resume_versions(id) ON DELETE CASCADE,
  section TEXT CHECK (section IN ('header', 'summary', 'experience', 'skills', 'education', 'formatting')),
  issue TEXT NOT NULL,
  location TEXT,
  importance TEXT CHECK (importance IN ('Critical', 'Important', 'Optional')),
  why_it_matters TEXT,
  recommendation TEXT,
  example_before TEXT,
  example_after TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_is_master ON resume_versions(is_master);
CREATE INDEX IF NOT EXISTS idx_ats_findings_resume_id ON ats_findings(resume_id);

-- ============================================================================
-- JOB OPPORTUNITIES & APPLICATIONS
-- ============================================================================

-- Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  work_model TEXT CHECK (work_model IN ('Remote', 'Hybrid', 'On-site')),
  employment_type TEXT CHECK (employment_type IN ('Full-time', 'Contract', 'Internship', 'Part-time')),
  salary TEXT,
  description TEXT,
  requirements TEXT[] DEFAULT '{}',
  preferred_skills TEXT[] DEFAULT '{}',
  deadline TIMESTAMPTZ,
  source_url TEXT,
  source_platform TEXT CHECK (source_platform IN ('LinkedIn', 'RemoteOK', 'Wuzzuf', 'Direct', 'Indeed')),
  match_score INTEGER,
  is_manual BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job Match Analysis table
CREATE TABLE IF NOT EXISTS job_match_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL UNIQUE REFERENCES opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  overall_match INTEGER CHECK (overall_match >= 0 AND overall_match <= 100),
  skill_match INTEGER,
  experience_match INTEGER,
  education_match INTEGER,
  recommendation TEXT CHECK (recommendation IN ('APPLY', 'DON_T_APPLY_YET')),
  recommendation_reason TEXT,
  skill_gaps JSONB DEFAULT '[]',
  improvement_path TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  status TEXT CHECK (status IN ('Saved', 'Preparing', 'Applied', 'Screening', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn')) DEFAULT 'Saved',
  applied_date TIMESTAMPTZ,
  tailored_resume_id UUID REFERENCES resume_versions(id) ON DELETE SET NULL,
  cover_letter TEXT,
  answers JSONB DEFAULT '[]',
  quality_score INTEGER,
  quality_feedback TEXT[] DEFAULT '{}',
  notes TEXT,
  attachments JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Application Events table
CREATE TABLE IF NOT EXISTS application_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON opportunities(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_application_events_application_id ON application_events(application_id);

-- ============================================================================
-- MICRO-PROJECTS & SKILLS BUILDING
-- ============================================================================

-- Micro Projects table
CREATE TABLE IF NOT EXISTS micro_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_skill TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  duration TEXT,
  scenario TEXT,
  objective TEXT,
  status TEXT CHECK (status IN ('available', 'in_progress', 'submitted', 'evaluated')) DEFAULT 'available',

  -- JSONB for nested structures
  tasks JSONB DEFAULT '[]',
  submission JSONB,
  evaluation JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_micro_projects_user_id ON micro_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_micro_projects_status ON micro_projects(status);

-- ============================================================================
-- INTERVIEW PREPARATION
-- ============================================================================

-- Interview Sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  job_role TEXT NOT NULL,
  track_id TEXT,
  interview_type TEXT CHECK (interview_type IN ('HR', 'Behavioral', 'Technical', 'Mixed')),
  language TEXT CHECK (language IN ('ar', 'en')) DEFAULT 'en',
  current_question_index INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  overall_score INTEGER,
  summary_feedback TEXT,

  -- JSONB for questions array
  questions JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);

-- ============================================================================
-- EMAIL INTELLIGENCE
-- ============================================================================

-- Email Events table
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  sender TEXT NOT NULL,
  email_date TIMESTAMPTZ NOT NULL,
  snippet TEXT,
  category TEXT CHECK (category IN ('application_confirmation', 'application_update', 'interview_invitation', 'assessment', 'recruiter_message', 'job_opportunity', 'offer', 'rejection', 'other')),
  detected_action TEXT,
  related_company TEXT,
  related_job_title TEXT,
  priority TEXT CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
  processed BOOLEAN DEFAULT FALSE,
  is_read BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_user_id ON email_events(user_id);
CREATE INDEX IF NOT EXISTS idx_email_events_processed ON email_events(processed);

-- ============================================================================
-- LEARNING & COURSES
-- ============================================================================

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  instructor TEXT,
  domain TEXT,
  target_role TEXT,
  level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced', 'All Levels')),
  duration TEXT,
  rating NUMERIC(3, 2),
  reviews_count INTEGER,
  url TEXT NOT NULL,
  description TEXT,
  skills_gained TEXT[] DEFAULT '{}',
  relevance_reason TEXT,
  cost TEXT CHECK (cost IN ('Free', 'Paid', 'Free with Paid Cert')),
  certificate_available BOOLEAN DEFAULT FALSE,
  enrollment_status TEXT CHECK (enrollment_status IN ('not_enrolled', 'in_progress', 'completed')) DEFAULT 'not_enrolled',
  progress_percentage INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  notes TEXT,
  source TEXT CHECK (source IN ('Curated', 'AI_Generated', 'User_Added')),

  -- JSONB for modules
  modules JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_enrollment_status ON courses(enrollment_status);

-- ============================================================================
-- LEARNING ROADMAPS
-- ============================================================================

-- Learning Roadmaps table
CREATE TABLE IF NOT EXISTS learning_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  description TEXT NOT NULL,
  description_ar TEXT NOT NULL,
  category TEXT,
  target_role TEXT,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  language TEXT CHECK (language IN ('Arabic', 'English', 'Both')),
  publication_status TEXT CHECK (publication_status IN ('published', 'draft', 'archived')) DEFAULT 'draft',
  version TEXT DEFAULT '1.0',
  tags TEXT[] DEFAULT '{}',
  estimated_total_hours INTEGER,
  source TEXT CHECK (source IN ('Curated', 'AI_Draft')),

  -- JSONB for complex nested structures
  stages JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roadmap Enrollments table
CREATE TABLE IF NOT EXISTS user_roadmap_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  roadmap_id UUID NOT NULL REFERENCES learning_roadmaps(id) ON DELETE CASCADE,
  target_role TEXT,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  weekly_hours_committed INTEGER,
  current_stage_id TEXT,
  current_node_id TEXT,
  progress_percentage INTEGER DEFAULT 0,

  -- JSONB for progress tracking
  node_progress JSONB DEFAULT '{}',
  saved_resource_ids TEXT[] DEFAULT '{}',

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Weekly Learning Plans table
CREATE TABLE IF NOT EXISTS weekly_learning_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES user_roadmap_enrollments(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  target_hours INTEGER,
  completed_hours INTEGER DEFAULT 0,

  -- JSONB for activities
  activities JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_roadmaps_slug ON learning_roadmaps(slug);
CREATE INDEX IF NOT EXISTS idx_user_roadmap_enrollments_user_id ON user_roadmap_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_learning_plans_user_id ON weekly_learning_plans(user_id);

-- ============================================================================
-- MEMORY & TIMELINE
-- ============================================================================

-- Career Memory Facts table
CREATE TABLE IF NOT EXISTS career_memory_facts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('Career', 'Skills', 'Goals', 'Applications', 'Interviews', 'Preferences')),
  fact TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100) DEFAULT 100,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career Timeline Events table
CREATE TABLE IF NOT EXISTS career_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_date TIMESTAMPTZ NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT CHECK (source IN ('User', 'AI', 'Email', 'Application', 'Project')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_memory_facts_user_id ON career_memory_facts(user_id);
CREATE INDEX IF NOT EXISTS idx_career_timeline_events_user_id ON career_timeline_events(user_id);
CREATE INDEX IF NOT EXISTS idx_career_timeline_events_date ON career_timeline_events(event_date DESC);

-- ============================================================================
-- ONBOARDING DATA
-- ============================================================================

-- Onboarding Answers table (stores complete onboarding responses as JSONB)
CREATE TABLE IF NOT EXISTS onboarding_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Basic Info
  career_status TEXT NOT NULL,
  primary_goal TEXT,
  secondary_goals TEXT[] DEFAULT '{}',
  custom_goal TEXT,

  -- Interests
  interests TEXT[] DEFAULT '{}',
  custom_interests TEXT[] DEFAULT '{}',
  needs_discovery BOOLEAN DEFAULT FALSE,

  -- Target Role
  role_direction_type TEXT,
  target_role TEXT,
  roles_to_compare TEXT[] DEFAULT '{}',
  target_job_description TEXT,

  -- Experience
  experience_level TEXT,
  experience_details TEXT,
  existing_skills TEXT[] DEFAULT '{}',
  tools_used TEXT[] DEFAULT '{}',
  projects_summary TEXT,
  certifications_summary TEXT,
  cv_uploaded BOOLEAN DEFAULT FALSE,
  cv_extracted_data JSONB,

  -- Stage-specific data (JSONB for flexibility)
  stage_specific JSONB DEFAULT '{}',

  -- Time & Learning
  weekly_hours TEXT,
  weekly_hours_number INTEGER,
  learning_formats TEXT[] DEFAULT '{}',
  resource_cost_preference TEXT,
  learning_language TEXT,
  budget_preference TEXT,

  -- Metadata
  completed_at TIMESTAMPTZ,
  matched_roadmap_id UUID REFERENCES learning_roadmaps(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_answers_user_id ON onboarding_answers(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_dna ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_best_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_match_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roadmap_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_memory_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_answers ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Skills policies
CREATE POLICY "Users can view own skills" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own skills" ON user_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own skills" ON user_skills FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own skills" ON user_skills FOR DELETE USING (auth.uid() = user_id);

-- Skill Evidence policies
CREATE POLICY "Users can view own evidence" ON skill_evidence FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_skills WHERE user_skills.id = skill_evidence.skill_id AND user_skills.user_id = auth.uid()));
CREATE POLICY "Users can insert own evidence" ON skill_evidence FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_skills WHERE user_skills.id = skill_evidence.skill_id AND user_skills.user_id = auth.uid()));
CREATE POLICY "Users can update own evidence" ON skill_evidence FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_skills WHERE user_skills.id = skill_evidence.skill_id AND user_skills.user_id = auth.uid()));
CREATE POLICY "Users can delete own evidence" ON skill_evidence FOR DELETE
  USING (EXISTS (SELECT 1 FROM user_skills WHERE user_skills.id = skill_evidence.skill_id AND user_skills.user_id = auth.uid()));

-- Education policies
CREATE POLICY "Users can manage own education" ON education FOR ALL USING (auth.uid() = user_id);

-- Experience policies
CREATE POLICY "Users can manage own experience" ON experience FOR ALL USING (auth.uid() = user_id);

-- Career DNA policies
CREATE POLICY "Users can manage own career DNA" ON career_dna FOR ALL USING (auth.uid() = user_id);

-- Career Readiness policies
CREATE POLICY "Users can manage own readiness" ON career_readiness FOR ALL USING (auth.uid() = user_id);

-- Improvement Actions policies
CREATE POLICY "Users can view own actions" ON improvement_actions FOR SELECT
  USING (EXISTS (SELECT 1 FROM career_readiness WHERE career_readiness.id = improvement_actions.readiness_id AND career_readiness.user_id = auth.uid()));
CREATE POLICY "Users can manage own actions" ON improvement_actions FOR ALL
  USING (EXISTS (SELECT 1 FROM career_readiness WHERE career_readiness.id = improvement_actions.readiness_id AND career_readiness.user_id = auth.uid()));

-- Next Best Actions policies
CREATE POLICY "Users can manage own next actions" ON next_best_actions FOR ALL USING (auth.uid() = user_id);

-- Resume Versions policies
CREATE POLICY "Users can manage own resumes" ON resume_versions FOR ALL USING (auth.uid() = user_id);

-- ATS Findings policies
CREATE POLICY "Users can view own ATS findings" ON ats_findings FOR SELECT
  USING (EXISTS (SELECT 1 FROM resume_versions WHERE resume_versions.id = ats_findings.resume_id AND resume_versions.user_id = auth.uid()));

-- Opportunities policies
CREATE POLICY "Users can manage own opportunities" ON opportunities FOR ALL USING (auth.uid() = user_id);

-- Job Match Analysis policies
CREATE POLICY "Users can manage own job matches" ON job_match_analysis FOR ALL USING (auth.uid() = user_id);

-- Applications policies
CREATE POLICY "Users can manage own applications" ON applications FOR ALL USING (auth.uid() = user_id);

-- Application Events policies
CREATE POLICY "Users can view own application events" ON application_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM applications WHERE applications.id = application_events.application_id AND applications.user_id = auth.uid()));

-- Micro Projects policies
CREATE POLICY "Users can view available projects" ON micro_projects FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can manage own projects" ON micro_projects FOR ALL USING (auth.uid() = user_id);

-- Interview Sessions policies
CREATE POLICY "Users can manage own interview sessions" ON interview_sessions FOR ALL USING (auth.uid() = user_id);

-- Email Events policies
CREATE POLICY "Users can manage own email events" ON email_events FOR ALL USING (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Users can view curated courses" ON courses FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can manage own courses" ON courses FOR ALL USING (auth.uid() = user_id);

-- Learning Roadmaps policies (public read, admin write)
CREATE POLICY "Anyone can view published roadmaps" ON learning_roadmaps FOR SELECT
  USING (publication_status = 'published');

-- User Roadmap Enrollments policies
CREATE POLICY "Users can manage own enrollments" ON user_roadmap_enrollments FOR ALL USING (auth.uid() = user_id);

-- Weekly Learning Plans policies
CREATE POLICY "Users can manage own learning plans" ON weekly_learning_plans FOR ALL USING (auth.uid() = user_id);

-- Career Memory Facts policies
CREATE POLICY "Users can manage own memory facts" ON career_memory_facts FOR ALL USING (auth.uid() = user_id);

-- Career Timeline Events policies
CREATE POLICY "Users can manage own timeline events" ON career_timeline_events FOR ALL USING (auth.uid() = user_id);

-- Onboarding Answers policies
CREATE POLICY "Users can manage own onboarding answers" ON onboarding_answers FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_skills_updated_at BEFORE UPDATE ON user_skills
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_readiness_updated_at BEFORE UPDATE ON career_readiness
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_next_best_actions_updated_at BEFORE UPDATE ON next_best_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resume_versions_updated_at BEFORE UPDATE ON resume_versions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_micro_projects_updated_at BEFORE UPDATE ON micro_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_roadmaps_updated_at BEFORE UPDATE ON learning_roadmaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roadmap_enrollments_updated_at BEFORE UPDATE ON user_roadmap_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_career_memory_facts_updated_at BEFORE UPDATE ON career_memory_facts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_onboarding_answers_updated_at BEFORE UPDATE ON onboarding_answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync evidence count
CREATE OR REPLACE FUNCTION update_skill_evidence_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_skills
  SET evidence_count = (
    SELECT COUNT(*)
    FROM skill_evidence
    WHERE skill_id = NEW.skill_id
  )
  WHERE id = NEW.skill_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_evidence_count_on_insert AFTER INSERT ON skill_evidence
  FOR EACH ROW EXECUTE FUNCTION update_skill_evidence_count();

CREATE TRIGGER sync_evidence_count_on_delete AFTER DELETE ON skill_evidence
  FOR EACH ROW EXECUTE FUNCTION update_skill_evidence_count();

-- ============================================================================
-- SAMPLE DATA VIEWS (Optional - for analytics)
-- ============================================================================

-- View for user dashboard summary
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT
  p.id as user_id,
  p.full_name,
  p.email,
  p.career_status,
  p.target_role,
  cr.overall_score as readiness_score,
  COUNT(DISTINCT rv.id) as total_resumes,
  COUNT(DISTINCT a.id) as total_applications,
  COUNT(DISTINCT mp.id) as total_projects,
  COUNT(DISTINCT c.id) as enrolled_courses
FROM profiles p
LEFT JOIN career_readiness cr ON p.id = cr.user_id
LEFT JOIN resume_versions rv ON p.id = rv.user_id
LEFT JOIN applications a ON p.id = a.user_id
LEFT JOIN micro_projects mp ON p.id = mp.user_id
LEFT JOIN courses c ON p.id = c.user_id AND c.enrollment_status != 'not_enrolled'
GROUP BY p.id, p.full_name, p.email, p.career_status, p.target_role, cr.overall_score;

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_master ON resume_versions(user_id, is_master);
CREATE INDEX IF NOT EXISTS idx_opportunities_user_created ON opportunities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courses_user_enrollment ON courses(user_id, enrollment_status);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_completed ON interview_sessions(user_id, completed);

-- Full-text search indexes (if using PostgreSQL full-text search)
CREATE INDEX IF NOT EXISTS idx_opportunities_description_fts ON opportunities USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_courses_description_fts ON courses USING gin(to_tsvector('english', description));

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE profiles IS 'Core user profiles extending Supabase auth.users';
COMMENT ON TABLE user_skills IS 'User skill inventory with confidence tracking';
COMMENT ON TABLE skill_evidence IS 'Evidence backing each skill claim';
COMMENT ON TABLE resume_versions IS 'Multiple CV versions - master and tailored copies';
COMMENT ON TABLE opportunities IS 'Job opportunities tracked by user';
COMMENT ON TABLE applications IS 'Application tracking with full lifecycle';
COMMENT ON TABLE micro_projects IS 'Skill-building micro projects with AI evaluation';
COMMENT ON TABLE interview_sessions IS 'AI-powered interview practice sessions';
COMMENT ON TABLE learning_roadmaps IS 'Structured learning paths for career roles';
COMMENT ON TABLE career_memory_facts IS 'Explicit AI memory facts controlled by user';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
