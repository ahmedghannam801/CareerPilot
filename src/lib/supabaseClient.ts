import { createClient, SupabaseClient, Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { CareerProfile, Opportunity, Application } from '../types/index.js';

// ─── Supabase client singleton ───────────────────────────────────────────────
const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://klpntsftqcflxaoadifk.supabase.co';
const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_0jryI7zGJPknN1kJkVmkVQ_WVm7nTdj';

// CRITICAL: always use the current page origin so OAuth redirects back to
// whichever domain the app is deployed on (not a baked-in localhost env var).
function getOAuthRedirectUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return 'https://careerpilot-dic.pages.dev';
}

let _client: SupabaseClient | null = null;

export function getClientSupabase(): SupabaseClient | null {
  if (_client) return _client;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[SupabaseAuth] Missing credentials – running in offline mode');
    return null;
  }
  try {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'careerpilot_auth_token',
      },
    });
  } catch (e) {
    console.warn('[SupabaseAuth] Init error:', e);
  }
  return _client;
}

// ─── Parse OAuth error from the URL hash/search (after a failed redirect) ────
// Supabase puts errors in the URL as #error=... or ?error=...
export function getOAuthErrorFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = new URLSearchParams(window.location.hash.replace('#', ''));
  const search = new URLSearchParams(window.location.search);
  const error = hash.get('error_description') || search.get('error_description') ||
                hash.get('error') || search.get('error');
  if (error) {
    // Clear it from the URL so it doesn't persist on refresh
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return error ? decodeURIComponent(error.replace(/\+/g, ' ')) : null;
}

// ─── Session helpers ──────────────────────────────────────────────────────────

export async function getCurrentSession(): Promise<Session | null> {
  const client = getClientSupabase();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCurrentSession();
  return session?.user ?? null;
}

/**
 * Subscribe to Supabase auth state changes.
 * The callback receives both the event type and the user/session so the caller
 * can distinguish INITIAL_SESSION, SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
 */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, user: User | null, session: Session | null) => void
) {
  const client = getClientSupabase();
  if (!client) {
    // No Supabase client — immediately signal "no session" so the app doesn't
    // hang in the 'checking' state forever.
    setTimeout(() => callback('INITIAL_SESSION', null, null), 0);
    return { data: { subscription: { unsubscribe: () => {} } } };
  }
  return client.auth.onAuthStateChange((event, session) => {
    callback(event, session?.user ?? null, session);
  });
}

// ─── Email / Password Auth ────────────────────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<{ user: User | null; error: string | null }> {
  const client = getClientSupabase();
  if (!client) return { user: null, error: 'Supabase not initialised' };
  try {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || email.split('@')[0] },
        emailRedirectTo: getOAuthRedirectUrl(),
      },
    });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (e: unknown) {
    return { user: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> {
  const client = getClientSupabase();
  if (!client) return { user: null, error: 'Supabase not initialised' };
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: null };
  } catch (e: unknown) {
    return { user: null, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  const client = getClientSupabase();
  if (!client) return { error: 'Supabase not initialised' };
  try {
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${getOAuthRedirectUrl()}/reset-password`,
    });
    return { error: error ? error.message : null };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ─── OAuth (Google & LinkedIn) ────────────────────────────────────────────────

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const client = getClientSupabase();
  if (!client) return { error: 'Supabase not initialised' };
  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getOAuthRedirectUrl(),
        // select_account: shows account chooser even if the user has an active
        // Google session, letting them pick which Google account to use.
        queryParams: { prompt: 'select_account' },
      },
    });
    return { error: error ? error.message : null };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function signInWithLinkedIn(): Promise<{ error: string | null }> {
  const client = getClientSupabase();
  if (!client) return { error: 'Supabase not initialised' };
  try {
    // linkedin_oidc = "Sign in with LinkedIn using OpenID Connect" (the current
    // product supported by Supabase). Requires the LinkedIn app to have
    // "Sign In with LinkedIn using OpenID Connect" product enabled in the
    // LinkedIn Developer Portal.
    const { error } = await client.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: getOAuthRedirectUrl(),
        scopes: 'openid profile email',
      },
    });
    return { error: error ? error.message : null };
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function signOut(): Promise<void> {
  const client = getClientSupabase();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch (e) {
    console.warn('[SupabaseAuth] Sign out error:', e);
  }
}

// ─── Database health check ────────────────────────────────────────────────────

export async function checkCloudDatabase(): Promise<{ connected: boolean; message: string }> {
  const client = getClientSupabase();
  if (!client) return { connected: false, message: 'Supabase credentials not configured' };
  try {
    const { error } = await client.from('profiles').select('id').limit(1);
    if (error) return { connected: false, message: error.message };
    return { connected: true, message: 'Supabase Cloud connected ✓' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { connected: false, message: msg };
  }
}

// ─── User-scoped profile sync ─────────────────────────────────────────────────
// RLS on the database ensures each user can only read/write their own rows.
// We still pass user.id explicitly for clarity and as a safety double-check.

export async function syncProfileToCloud(profile: CareerProfile): Promise<boolean> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user) return false;
  try {
    const { error } = await client.from('profiles').upsert({
      id: user.id,
      full_name: profile.fullName,
      email: profile.email || user.email,
      headline: profile.headline,
      location: profile.location,
      career_status: profile.careerStatus,
      target_role: profile.targetRole,
      target_salary: profile.targetSalary,
      target_industries: profile.targetIndustries,
      skills: profile.skills,
      experience: profile.experience,
      education: profile.education,
      dna: profile.dna,
      readiness: profile.readiness,
      next_best_action: profile.nextBestAction,
      onboarding_completed: profile.onboardingCompleted ?? false,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.warn('[Supabase] Profile sync warning:', error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[Supabase] Profile sync error:', e);
    return false;
  }
}

export async function loadProfileFromCloud(): Promise<CareerProfile | null> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user) return null;
  try {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      fullName: data.full_name || user.user_metadata?.full_name || '',
      email: data.email || user.email || '',
      headline: data.headline || '',
      location: data.location || '',
      careerStatus: data.career_status || 'fresh_graduate',
      targetRole: data.target_role || '',
      targetSalary: data.target_salary || '',
      targetIndustries: data.target_industries || [],
      education: data.education || [],
      experience: data.experience || [],
      skills: data.skills || [],
      dna: data.dna && Object.keys(data.dna).length > 0 ? data.dna : undefined,
      readiness: data.readiness && Object.keys(data.readiness).length > 0 ? data.readiness : undefined,
      nextBestAction: data.next_best_action && Object.keys(data.next_best_action).length > 0 ? data.next_best_action : undefined,
      onboardingCompleted: data.onboarding_completed ?? false,
    };
  } catch {
    return null;
  }
}

export async function syncOpportunityToCloud(opp: Opportunity): Promise<boolean> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user || !opp) return false;
  try {
    const { error } = await client.from('opportunities').upsert({
      id: opp.id,
      user_id: user.id,
      title: opp.title,
      company: opp.company,
      location: opp.location,
      work_model: opp.workModel,
      employment_type: opp.employmentType,
      salary: opp.salary,
      description: opp.description,
      requirements: opp.requirements,
      preferred_skills: opp.preferredSkills,
      match_score: opp.matchScore,
      source_platform: opp.sourcePlatform || 'Direct',
      is_manual: opp.isManual ?? false,
      created_at: opp.createdAt || new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function syncApplicationToCloud(app: Application): Promise<boolean> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user || !app) return false;
  try {
    const { error } = await client.from('applications').upsert({
      id: app.id,
      user_id: user.id,
      opportunity_id: app.opportunityId,
      job_title: app.jobTitle,
      company: app.company,
      status: app.status,
      applied_date: app.appliedDate,
      tailored_resume_id: app.tailoredResumeId,
      cover_letter: app.coverLetter,
      answers: app.answers,
      quality_score: app.qualityScore,
      quality_feedback: app.qualityFeedback,
      notes: app.notes,
      events: app.events,
      created_at: app.createdAt || new Date().toISOString(),
      updated_at: app.updatedAt || new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function loadOpportunitiesFromCloud(): Promise<Opportunity[] | null> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user) return null;
  try {
    const { data, error } = await client
      .from('opportunities')
      .select('*')
      .eq('user_id', user.id);
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      company: d.company,
      location: d.location,
      workModel: d.work_model,
      employmentType: d.employment_type,
      salary: d.salary,
      description: d.description,
      requirements: d.requirements || [],
      preferredSkills: d.preferred_skills || [],
      matchScore: d.match_score,
      sourcePlatform: d.source_platform || 'Direct',
      isManual: d.is_manual ?? false,
      createdAt: d.created_at,
    }));
  } catch {
    return null;
  }
}

export async function loadApplicationsFromCloud(): Promise<Application[] | null> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user) return null;
  try {
    const { data, error } = await client
      .from('applications')
      .select('*')
      .eq('user_id', user.id);
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      opportunityId: d.opportunity_id,
      jobTitle: d.job_title,
      company: d.company,
      status: d.status,
      appliedDate: d.applied_date,
      tailoredResumeId: d.tailored_resume_id,
      coverLetter: d.cover_letter,
      answers: d.answers || [],
      qualityScore: d.quality_score,
      qualityFeedback: d.quality_feedback,
      notes: d.notes,
      events: d.events || [],
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch {
    return null;
  }
}

// ─── Resume cloud sync ─────────────────────────────────────────────────────────

export async function syncResumeToCloud(resume: import('../types/index.js').ResumeVersion): Promise<boolean> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user) return false;
  try {
    const { error } = await client.from('resumes').upsert({
      id: resume.id,
      user_id: user.id,
      title: resume.title,
      is_master: resume.isMaster ?? false,
      summary: resume.summary,
      experience: resume.experience,
      education: resume.education,
      skills: resume.skills,
      target_role: resume.targetRole,
      ats_score: resume.atsScore,
      created_at: resume.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

export async function loadResumesFromCloud(): Promise<import('../types/index.js').ResumeVersion[] | null> {
  const client = getClientSupabase();
  const user = await getCurrentUser();
  if (!client || !user) return null;
  try {
    const { data, error } = await client
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (error || !data) return null;
    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      isMaster: d.is_master ?? false,
      summary: d.summary || '',
      experience: d.experience || [],
      education: d.education || [],
      skills: d.skills || [],
      certifications: d.certifications || [],
      targetRole: d.target_role,
      atsScore: d.ats_score,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  } catch {
    return null;
  }
}
