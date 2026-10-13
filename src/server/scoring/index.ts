import {
  CareerProfile,
  ResumeVersion,
  Opportunity,
  Application,
  JobMatchAnalysis,
  ATSAnalysis,
  CareerReadiness,
} from '../../types/index.js';

/**
 * Deterministic Career Readiness calculation across 8 defined pillars
 */
export function calculateCareerReadiness(profile: CareerProfile): CareerReadiness {
  // 1. Skills score (max 100)
  const skillsCount = profile.skills.length;
  const verifiedEvidenceCount = profile.skills.reduce(
    (acc, s) => acc + s.evidence.filter((e) => e.verified).length,
    0
  );
  const skillsScore = Math.min(
    100,
    Math.round(Math.min(skillsCount * 10, 60) + Math.min(verifiedEvidenceCount * 10, 40))
  );

  // 2. CV score
  const cvScore = profile.headline ? 75 : 40;

  // 3. Experience score
  const expCount = profile.experience.length;
  const experienceScore = Math.min(100, Math.round(expCount * 25));

  // 4. Projects score
  const projectsScore = Math.min(
    100,
    verifiedEvidenceCount > 0 ? 80 : expCount > 0 ? 60 : 30
  );

  // 5. Education score
  const educationScore = profile.education.length > 0 ? 85 : 40;

  // 6. Interview readiness score
  const interviewReadinessScore = verifiedEvidenceCount >= 2 ? 75 : 55;

  // 7. Branding score
  const brandingScore = profile.headline && profile.targetIndustries.length > 0 ? 80 : 50;

  // 8. Application readiness score
  const applicationReadinessScore = Math.round(
    (skillsScore * 0.35 + experienceScore * 0.35 + educationScore * 0.3)
  );

  // Weighted overall calculation
  const overallScore = Math.round(
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
      category: 'Skills & Projects',
      completed: false,
    });
  }
  if (experienceScore < 60) {
    improvementActions.push({
      id: 'act-exp',
      title: 'Add quantitative achievements and measurable impact metrics to work history',
      impact: 'High' as const,
      estimatedHours: 2,
      category: 'Experience',
      completed: false,
    });
  }
  if (brandingScore < 75) {
    improvementActions.push({
      id: 'act-brand',
      title: 'Refine target career role and headline for ATS searchability',
      impact: 'Medium' as const,
      estimatedHours: 1,
      category: 'Branding',
      completed: false,
    });
  }
  if (improvementActions.length === 0) {
    improvementActions.push({
      id: 'act-tailor',
      title: 'Generate role-tailored CVs for your top 3 saved opportunities',
      impact: 'Medium' as const,
      estimatedHours: 2,
      category: 'Applications',
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
    summary:
      overallScore >= 80
        ? 'High readiness: profile and evidence align strongly with competitive market standards.'
        : overallScore >= 60
        ? 'Solid foundation: key skills present, but requires portfolio evidence and tailored positioning.'
        : 'Foundational stage: focus on building core evidence projects and defining target competencies.',
    improvementActions,
  };
}

/**
 * Deterministic ATS CV analysis
 */
export function calculateCVScore(cv: ResumeVersion): ATSAnalysis {
  let score = 50;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  const missingKeywords: string[] = [];

  // Summary validation
  if (cv.summary && cv.summary.length > 50) {
    score += 15;
    strengths.push('Professional summary contains clear role focus and positioning.');
  } else {
    weaknesses.push('Summary is missing or lacks concise value proposition.');
    recommendations.push('Write a 3-sentence summary highlighting your primary target role and top technical competencies.');
  }

  // Experience and achievements
  const totalAchievements = cv.experience.reduce((acc, e) => acc + (e.achievements?.length || 0), 0);
  if (totalAchievements >= 3) {
    score += 15;
    strengths.push('Work experience includes quantifiable achievements.');
  } else {
    weaknesses.push('Low number of bulleted achievements with metrics.');
    recommendations.push('Rewrite experience bullets using the Action Verb + Context + Measurable Outcome formula.');
  }

  // Skills count
  if (cv.skills.length >= 6) {
    score += 10;
    strengths.push('Strong density of categorized hard skills.');
  } else {
    weaknesses.push('Fewer than 6 technical skills explicitly listed.');
    recommendations.push('List core tools, frameworks, and domain competencies in a clean skills section.');
  }

  // Education
  if (cv.education.length > 0) {
    score += 10;
    strengths.push('Verified academic credentials and certifications clearly presented.');
  }

  const finalScore = Math.min(100, Math.max(30, score));

  return {
    overallScore: finalScore,
    strengths,
    weaknesses,
    recommendations,
    missingKeywords,
    formattingScore: 92,
    relevanceScore: Math.round(finalScore * 0.95),
    impactScore: Math.round(finalScore * 0.9),
  };
}

/**
 * Deterministic Opportunity Match & Skill Gap calculation
 */
export function calculateOpportunityMatch(
  profile: CareerProfile,
  opp: Opportunity
): JobMatchAnalysis {
  const userSkillNames = profile.skills.map((s) => s.canonicalName.toLowerCase());
  const requiredSkills = opp.requirements.map((r) => r.toLowerCase());

  let matchedCount = 0;
  let partialCount = 0;

  const gaps = opp.requirements.map((req) => {
    const isDirectMatch = userSkillNames.some((us) => us.includes(req.toLowerCase()) || req.toLowerCase().includes(us));
    if (isDirectMatch) {
      matchedCount++;
      return {
        skill: req,
        status: 'MATCHED' as const,
        importance: 'Critical' as const,
        action: 'Verified in profile credentials.',
      };
    }
    // Partial check
    const isPartial = userSkillNames.some((us) => {
      const words = us.split(' ');
      return words.some((w) => w.length > 3 && req.toLowerCase().includes(w));
    });

    if (isPartial) {
      partialCount++;
      return {
        skill: req,
        status: 'PARTIAL' as const,
        importance: 'Critical' as const,
        action: 'Review practical project to demonstrate full depth.',
      };
    }

    return {
      skill: req,
      status: 'MISSING' as const,
      importance: 'Critical' as const,
      action: `Complete targeted micro-project for ${req}.`,
    };
  });

  const totalReqs = Math.max(1, opp.requirements.length);
  const skillMatch = Math.round(((matchedCount + partialCount * 0.5) / totalReqs) * 100);

  // Experience match
  const expMatch = profile.experience.length > 0 ? 85 : profile.careerStatus === 'student' ? 70 : 50;
  // Education match
  const eduMatch = profile.education.length > 0 ? 90 : 60;

  const overallMatch = Math.round(skillMatch * 0.55 + expMatch * 0.25 + eduMatch * 0.2);

  const recommendation = overallMatch >= 65 ? 'APPLY' : 'DON_T_APPLY_YET';
  const recommendationReason =
    recommendation === 'APPLY'
      ? `Strong alignment (${overallMatch}% match). Core requirements met. Prepare a tailored CV emphasizing your top relevant competencies.`
      : `High skill gap delta (${overallMatch}% match). Target missing prerequisites before applying to maximize recruiter conversion.`;

  const improvementPath = gaps
    .filter((g) => g.status === 'MISSING')
    .map((g) => `Build or verify evidence in: ${g.skill}`);

  return {
    opportunityId: opp.id,
    overallMatch,
    skillMatch,
    experienceMatch: expMatch,
    educationMatch: eduMatch,
    recommendation,
    recommendationReason,
    skillGaps: gaps,
    improvementPath,
  };
}

/**
 * Deterministic Application Quality score
 */
export function calculateApplicationQuality(
  app: Application,
  opp: Opportunity,
  cv?: ResumeVersion
): { score: number; feedback: string[] } {
  let score = 40;
  const feedback: string[] = [];

  if (app.coverLetter && app.coverLetter.length > 200) {
    score += 25;
    feedback.push('Personalized cover letter connects background to role requirements.');
  } else {
    feedback.push('Add an impactful tailored cover letter to improve recruiter engagement.');
  }

  if (app.answers && app.answers.length > 0) {
    const answeredCount = app.answers.filter((a) => a.answer && a.answer.trim().length > 20).length;
    if (answeredCount >= app.answers.length) {
      score += 20;
      feedback.push('All screening application questions answered with sufficient detail.');
    } else {
      score += 10;
      feedback.push('Some screening questions need more substantial context or examples.');
    }
  } else {
    score += 15;
  }

  if (cv && cv.summary) {
    score += 15;
    feedback.push('Tailored CV version attached.');
  } else {
    feedback.push('Attach a tailored CV version customized for this opportunity.');
  }

  return {
    score: Math.min(100, score),
    feedback,
  };
}
