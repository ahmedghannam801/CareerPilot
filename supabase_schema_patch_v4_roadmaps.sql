-- ==========================================================
-- CareerPilot AI - Schema Patch v4: Interactive Roadmaps & Learning
-- Run in Supabase SQL Editor
-- Creates catalog & user progress tables with full RLS isolation
-- ==========================================================

-- 1. Shared Roadmaps Catalogue
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

-- 2. Roadmap Stages
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

-- 3. Roadmap Nodes (Skill Topics)
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

-- 4. Learning Resources
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

-- 5. User Roadmap Enrollments (Private to authenticated user)
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

-- 6. Weekly Learning Plans (Private to authenticated user)
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

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roadmap_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_learning_plans ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
-- Shared Catalogue is readable by anyone authenticated or anonymous
CREATE POLICY "Public read for published roadmaps"
  ON public.roadmaps FOR SELECT USING (publication_status = 'published');

CREATE POLICY "Public read for roadmap stages"
  ON public.roadmap_stages FOR SELECT USING (true);

CREATE POLICY "Public read for roadmap nodes"
  ON public.roadmap_nodes FOR SELECT USING (true);

CREATE POLICY "Public read for learning resources"
  ON public.learning_resources FOR SELECT USING (true);

-- User enrollments: user can only view, insert, update their own enrollments
CREATE POLICY "Users can manage own enrollments"
  ON public.user_roadmap_enrollments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own weekly plans"
  ON public.weekly_learning_plans FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
