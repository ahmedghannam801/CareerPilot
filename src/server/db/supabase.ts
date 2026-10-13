import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CareerProfile,
  ResumeVersion,
  Opportunity,
  Application,
  Course,
  MicroProject,
  InterviewSession,
} from '../../types/index.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, key, {
        auth: { persistSession: false },
      });
      console.log('[Supabase] Initialized cloud database connection to:', url);
    } catch (err) {
      console.warn('[Supabase] Initialization warning:', err);
      supabaseClient = null;
    }
  }

  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseClient());
}

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  url?: string;
  tablesStatus?: Record<string, boolean>;
  message: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials (SUPABASE_URL, SUPABASE_ANON_KEY) are not configured yet.',
    };
  }

  try {
    // Try pinging a table or checking auth
    const { error } = await client.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      return {
        connected: false,
        message: `Connected to endpoint, but schema query returned: ${error.message}. Please run supabase_schema.sql.`,
      };
    }

    return {
      connected: true,
      message: 'Successfully connected to Supabase Cloud Database!',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      message: `Connection error: ${msg}`,
    };
  }
}

/**
 * Sync entire local state into Supabase Cloud
 */
export async function syncStateToSupabase(state: {
  profile: CareerProfile;
  resumes: ResumeVersion[];
  opportunities: Opportunity[];
  applications: Application[];
  courses: Course[];
  microProjects: MicroProject[];
  interviews: InterviewSession[];
}): Promise<{ success: boolean; syncedRecords: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, syncedRecords: 0, error: 'Supabase client not configured' };
  }

  let count = 0;
  try {
    // 1. Profile
    if (state.profile) {
      await client.from('profiles').upsert({
        id: state.profile.id || 'default-user',
        full_name: state.profile.fullName,
        email: state.profile.email,
        career_status: state.profile.careerStatus,
        target_role: state.profile.targetRole,
        target_industries: state.profile.targetIndustries,
        skills: state.profile.skills,
        experience: state.profile.experience,
        education: state.profile.education,
        dna: state.profile.dna,
        readiness: state.profile.readiness,
        updated_at: new Date().toISOString(),
      });
      count++;
    }

    // 2. Opportunities
    if (state.opportunities && state.opportunities.length > 0) {
      const oppRecords = state.opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        company: o.company,
        location: o.location,
        work_model: o.workModel,
        employment_type: o.employmentType,
        salary: o.salary,
        description: o.description,
        requirements: o.requirements,
        preferred_skills: o.preferredSkills,
        match_score: o.matchScore,
        source_url: o.sourceUrl,
        source_platform: o.sourcePlatform,
        created_at: o.createdAt,
      }));
      await client.from('opportunities').upsert(oppRecords);
      count += oppRecords.length;
    }

    // 3. Applications
    if (state.applications && state.applications.length > 0) {
      const appRecords = state.applications.map((a) => ({
        id: a.id,
        opportunity_id: a.opportunityId,
        job_title: a.jobTitle,
        company: a.company,
        status: a.status,
        applied_date: a.appliedDate,
        tailored_resume_id: a.tailoredResumeId,
        cover_letter: a.coverLetter,
        answers: a.answers,
        quality_score: a.qualityScore,
        notes: a.notes,
        events: a.events,
      }));
      await client.from('applications').upsert(appRecords);
      count += appRecords.length;
    }

    return { success: true, syncedRecords: count };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, syncedRecords: count, error: msg };
  }
}
