import {
  CareerProfile,
  ResumeVersion,
  Opportunity,
  MicroProject,
  InterviewSession,
  CareerReadiness,
} from '../types/index.js';

/**
 * Deterministic profile completion calculation (0 - 100%)
 */
export function calculateProfileCompletion(profile?: CareerProfile | null): number {
  if (!profile) return 0;
  let score = 0;
  if (profile.fullName && profile.fullName.trim().length > 0) score += 15;
  if (profile.email && profile.email.trim().length > 0) score += 15;
  if (profile.targetRole && profile.targetRole.trim().length > 0) score += 15;
  if (profile.headline && profile.headline.trim().length > 0) score += 15;
  const skillsCount = profile.skills?.length || 0;
  if (skillsCount >= 5) score += 15;
  else if (skillsCount >= 1) score += 8;
  const hasExp = (profile.experience?.length || 0) > 0;
  const hasEdu = (profile.education?.length || 0) > 0;
  if (hasExp && hasEdu) score += 25;
  else if (hasExp || hasEdu) score += 15;
  return Math.min(100, score);
}

/**
 * Deterministic Career Readiness calculation across 8 defined pillars
 * Interacts dynamically with completed projects, interviews, and resumes
 */
export function calculateDynamicCareerReadiness(
  profile: CareerProfile,
  extraContext?: {
    projects?: MicroProject[];
    interviews?: InterviewSession[];
    resumes?: ResumeVersion[];
  }
): CareerReadiness {
  const skills = profile.skills || [];
  const skillsCount = skills.length;
  const verifiedEvidenceCount = skills.reduce(
    (acc, s) => acc + (s.evidence || []).filter((e) => e.verified).length,
    0
  );

  // 1. Skills score (0-100)
  const skillsScore = skillsCount === 0
    ? 0
    : Math.min(100, Math.round(Math.min(skillsCount * 8, 50) + Math.min(verifiedEvidenceCount * 12, 50)));

  // 2. CV score from actual analyzed resumes if provided, otherwise profile headline
  let cvScore = 0;
  if (extraContext?.resumes && extraContext.resumes.length > 0) {
    const analyzed = extraContext.resumes.filter((r) => typeof r.atsScore === 'number');
    if (analyzed.length > 0) {
      cvScore = Math.max(...analyzed.map((r) => r.atsScore!));
    } else {
      cvScore = 65;
    }
  } else if (profile.headline && profile.headline.trim().length > 0) {
    cvScore = 70;
  }

  // 3. Experience score
  const expCount = profile.experience?.length || 0;
  const experienceScore = Math.min(100, Math.round(expCount * 25));

  // 4. Projects score (evaluated projects + verified evidence)
  let completedProjectsCount = (extraContext?.projects || []).filter(
    (p) => p.status === 'evaluated' || p.status === 'submitted'
  ).length;
  const projectsScore = Math.min(
    100,
    Math.round(completedProjectsCount * 30 + verifiedEvidenceCount * 20 + (expCount > 0 ? 20 : 0))
  );

  // 5. Education score
  const educationScore = (profile.education?.length || 0) > 0 ? 85 : 0;

  // 6. Interview readiness score (based on completed interview sessions)
  let interviewReadinessScore = 0;
  const completedInterviews = (extraContext?.interviews || []).filter((i) => i.completed);
  if (completedInterviews.length > 0) {
    const avgScore =
      completedInterviews.reduce((acc, i) => acc + (i.overallScore || 70), 0) /
      completedInterviews.length;
    interviewReadinessScore = Math.min(100, Math.round(avgScore));
  } else if (verifiedEvidenceCount >= 2) {
    interviewReadinessScore = 65;
  } else if (verifiedEvidenceCount === 1) {
    interviewReadinessScore = 45;
  }

  // 7. Branding score
  const brandingScore =
    profile.headline && (profile.targetIndustries?.length || 0) > 0
      ? 85
      : profile.headline
      ? 55
      : 0;

  // 8. Application readiness score
  const applicationReadinessScore = Math.round(
    skillsScore * 0.35 + experienceScore * 0.35 + educationScore * 0.3
  );

  const isCompletelyEmpty =
    skillsCount === 0 &&
    expCount === 0 &&
    (profile.education?.length || 0) === 0 &&
    (!profile.headline || profile.headline.trim().length === 0);

  const overallScore = isCompletelyEmpty
    ? 0
    : Math.round(
        skillsScore * 0.2 +
          cvScore * 0.15 +
          experienceScore * 0.2 +
          projectsScore * 0.15 +
          educationScore * 0.1 +
          interviewReadinessScore * 0.05 +
          brandingScore * 0.05 +
          applicationReadinessScore * 0.1
      );

  const improvementActions = [];
  if (skillsScore < 70) {
    improvementActions.push({
      id: 'act-skills',
      title: 'Complete a practical micro-project to add verified technical skill evidence',
      impact: 'High' as const,
      estimatedHours: 4,
      category: 'Skill Building',
      completed: false,
    });
  }
  if (cvScore < 80) {
    improvementActions.push({
      id: 'act-cv',
      title: 'Audit and tailor your CV with target role keywords to optimize ATS pass rate',
      impact: 'High' as const,
      estimatedHours: 2,
      category: 'Resume & Setup',
      completed: false,
    });
  }
  if (interviewReadinessScore < 70) {
    improvementActions.push({
      id: 'act-interview',
      title: 'Run a mock interview session to practice behavioral and technical answers',
      impact: 'Medium' as const,
      estimatedHours: 1,
      category: 'Interview Prep',
      completed: false,
    });
  }

  return {
    overallScore,
    breakdown: {
      skillsScore,
      cvScore,
      experienceScore,
      projectsScore,
      educationScore,
      interviewReadinessScore,
      brandingScore,
      applicationReadinessScore,
    },
    summary: `Career Readiness calculated at ${overallScore}% across verified technical evidence, projects, and interviews.`,
    improvementActions,
  };
}
