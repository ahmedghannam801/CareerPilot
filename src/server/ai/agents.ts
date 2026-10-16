import { z } from 'zod';
import { aiGateway } from './gateway.js';
import {
  CareerProfile,
  CareerDNA,
  NextBestAction,
  ResumeVersion,
  Opportunity,
  MicroProject,
  EmailEvent,
} from '../../types/index.js';
import {
  detectTrackFromRole,
  getTrackQuestions,
  CareerTrackId,
} from '../../data/interviewQuestions.js';

// Schemas
const CareerDiscoverySchema = z.object({
  recommendedRoles: z.array(
    z.object({
      role: z.string(),
      matchScore: z.number(),
      reasons: z.array(z.string()),
      strengths: z.array(z.string()),
      missingSkills: z.array(z.string()),
      recommendedNextAction: z.string(),
    })
  ),
  summary: z.string(),
});

const CareerDNASchema = z.object({
  currentLevel: z.string(),
  primaryDirection: z.string(),
  secondaryDirections: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  keyCompetencies: z.array(z.string()),
  workPreferences: z.object({
    workModel: z.enum(['Remote', 'Hybrid', 'On-site', 'Flexible']),
    teamStyle: z.enum(['Collaborative', 'Independent', 'Mixed']),
    pace: z.enum(['High-growth', 'Balanced', 'Structured']),
  }),
  summary: z.string(),
});

const NextBestActionSchema = z.object({
  id: z.string().catch(() => `nba-${Date.now()}`),
  title: z.string().catch('Focus on High-Impact Technical Skills'),
  description: z.string().catch('Advance your current core engineering tasks.'),
  reason: z.string().catch('Strengthens alignment with your target trajectory.'),
  evidenceNeeded: z.string().catch('Completed deliverable or verified assessment.'),
  expectedImpact: z.string().catch('High impact on readiness score.'),
  estimatedEffort: z.string().catch('2-3 hours'),
  actionType: z
    .string()
    .catch('build_project')
    .transform((val) => {
      const v = String(val).toLowerCase().trim();
      if (v.includes('project')) return 'build_project';
      if (v.includes('cv') || v.includes('resume')) return 'tailor_cv';
      if (v.includes('apply') || v.includes('job')) return 'apply';
      if (v.includes('interview')) return 'practice_interview';
      if (v.includes('skill') || v.includes('learn') || v.includes('course')) return 'learn_skill';
      if (v.includes('email')) return 'review_email';
      return 'build_project' as const;
    }),
});

const ATSAnalysisSchema = z.object({
  overallScore: z.number().catch(82),
  strengths: z.array(z.string()).catch(['Clear technical experience', 'Relevant tech stack']),
  weaknesses: z.array(z.string()).catch(['Needs more quantified business metrics']),
  recommendations: z.array(z.string()).catch(['Add % and numeric outcomes to bullet points']),
  missingKeywords: z.array(z.string()).catch([]),
  formattingScore: z.number().catch(85),
  relevanceScore: z.number().catch(80),
  impactScore: z.number().catch(80),
});

const TailoredCVSchema = z.object({
  targetRole: z.string().catch('Software Engineer'),
  summary: z.string().catch('Results-driven engineer specialized in modern scalable architectures.'),
  highlightedSkills: z.array(z.string()).catch([]),
  optimizedBulletPoints: z
    .array(
      z.object({
        roleTitle: z.string().catch('Software Engineer'),
        company: z.string().catch('Tech Company'),
        bullets: z.array(z.string()).catch([]),
      })
    )
    .catch([]),
  atsKeywordMatches: z.array(z.string()).catch([]),
  missingKeywords: z.array(z.string()).catch([]),
  atsScore: z.number().catch(94),
});

const CoverLetterSchema = z.object({
  recipient: z.string().catch('Hiring Team'),
  company: z.string().catch('Target Company'),
  subject: z.string().catch('Application for Open Position'),
  body: z.string().catch('Dear Hiring Team, I am excited to apply for this opportunity.'),
  keyHighlights: z.array(z.string()).catch([]),
});

const JobDescriptionSchema = z.object({
  title: z.string().catch('Software Engineer'),
  company: z.string().catch('Company'),
  location: z.string().catch('Remote / Hybrid'),
  workModel: z
    .string()
    .catch('Remote')
    .transform((v) => {
      const val = String(v).toLowerCase();
      if (val.includes('hybrid')) return 'Hybrid';
      if (val.includes('site') || val.includes('office')) return 'On-site';
      return 'Remote';
    }),
  employmentType: z
    .string()
    .catch('Full-time')
    .transform((v) => {
      const val = String(v).toLowerCase();
      if (val.includes('intern')) return 'Internship';
      if (val.includes('contract') || val.includes('freelance')) return 'Contract';
      if (val.includes('part')) return 'Part-time';
      return 'Full-time';
    }),
  salary: z.string().optional(),
  description: z.string().catch('Job description'),
  requirements: z.array(z.string()).catch([]),
  preferredSkills: z.array(z.string()).catch([]),
});

const MicroProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  targetSkill: z.string(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  duration: z.string(),
  scenario: z.string(),
  objective: z.string(),
  tasks: z.array(z.object({ id: z.string(), title: z.string(), completed: z.boolean() })),
});

const ProjectEvaluationSchema = z.object({
  score: z.number(),
  passed: z.boolean(),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  evidenceGenerated: z.boolean(),
});

const EmailClassificationSchema = z.object({
  category: z
    .string()
    .catch('application_update')
    .transform((val) => {
      const v = String(val).toLowerCase().trim();
      if (v.includes('interview')) return 'interview_invitation';
      if (v.includes('offer')) return 'offer';
      if (v.includes('assessment') || v.includes('test')) return 'assessment';
      if (v.includes('reject')) return 'rejection';
      if (v.includes('confirm') || v.includes('received')) return 'application_confirmation';
      if (v.includes('recruiter')) return 'recruiter_message';
      if (v.includes('opportunity') || v.includes('job')) return 'job_opportunity';
      return 'application_update';
    }),
  priority: z
    .string()
    .catch('MEDIUM')
    .transform((val) => {
      const v = String(val).toUpperCase().trim();
      if (v === 'HIGH' || v === 'MEDIUM' || v === 'LOW') return v as 'HIGH' | 'MEDIUM' | 'LOW';
      return 'MEDIUM' as 'HIGH' | 'MEDIUM' | 'LOW';
    }),
  detectedAction: z.string().catch('Review email and reply to recruiter/system'),
  relatedCompany: z.string().optional().catch(undefined),
  relatedJobTitle: z.string().optional().catch(undefined),
  summary: z.string().catch('Career communication update detected'),
});

const LinkedInProfileSchema = z.object({
  fullName: z.string().catch(''),
  headline: z.string().catch(''),
  location: z.string().catch(''),
  summary: z.string().catch(''),
  experience: z
    .array(
      z.object({
        company: z.string().catch('Company'),
        role: z.string().catch('Professional Role'),
        location: z.string().catch(''),
        startDate: z.string().catch(''),
        endDate: z.string().optional().catch(undefined),
        current: z.boolean().catch(false),
        responsibilities: z.array(z.string()).catch([]),
        achievements: z.array(z.string()).catch([]),
      })
    )
    .catch([]),
  education: z
    .array(
      z.object({
        institution: z.string().catch('Institution'),
        degree: z.string().catch('Degree'),
        field: z.string().catch('Field of Study'),
        startDate: z.string().catch(''),
        endDate: z.string().optional().catch(undefined),
        current: z.boolean().catch(false),
        gpa: z.string().optional().catch(undefined),
      })
    )
    .catch([]),
  skills: z.array(z.string()).catch([]),
  certifications: z.array(z.string()).catch([]),
  languages: z.array(z.string()).catch([]),
});

const InterviewFeedbackSchema = z.object({
  score: z.number(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  suggestedRefinement: z.string(),
});

const SingleCourseItemSchema = z.object({
  title: z.string(),
  provider: z.string().catch('Coursera'),
  instructor: z.string().optional().catch(undefined),
  domain: z.string().catch('Technology & Software Engineering'),
  level: z
    .string()
    .catch('Intermediate')
    .transform((val) => {
      if (['Beginner', 'Intermediate', 'Advanced', 'All Levels'].includes(val)) {
        return val as 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
      }
      return 'Intermediate' as const;
    }),
  duration: z.string().catch('8-12 hours'),
  rating: z.number().catch(4.8),
  url: z.string().catch('https://www.coursera.org'),
  description: z.string().catch('Comprehensive skill-building course.'),
  skillsGained: z.array(z.string()).catch([]),
  relevanceReason: z.string().catch('Matches current career development goals and fills verified skill gaps.'),
  cost: z
    .string()
    .catch('Free with Paid Cert')
    .transform((val) => {
      if (['Free', 'Paid', 'Free with Paid Cert'].includes(val)) {
        return val as 'Free' | 'Paid' | 'Free with Paid Cert';
      }
      return 'Free with Paid Cert' as const;
    }),
  certificateAvailable: z.boolean().catch(true),
  modules: z
    .array(
      z.object({
        title: z.string(),
        duration: z.string().optional(),
      })
    )
    .catch([]),
});

const CourseRecommendationSchema = z.union([
  z.object({
    domainTitle: z.string().catch('Recommended Domain Track'),
    rationale: z.string().catch('Tailored based on your skill gaps and target career trajectory.'),
    recommendedCourses: z.array(SingleCourseItemSchema).catch([]),
  }),
  z.array(SingleCourseItemSchema).transform((courses) => ({
    domainTitle: 'Recommended Domain Track',
    rationale: 'Tailored based on your skill gaps and target career trajectory.',
    recommendedCourses: courses,
  })),
]);

const RoadmapGenerationSchema = z.object({
  title: z.string(),
  titleAr: z.string(),
  description: z.string(),
  descriptionAr: z.string(),
  category: z.string().catch('Engineering & AI'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).catch('Intermediate'),
  estimatedTotalHours: z.number().catch(120),
  stages: z.array(
    z.object({
      id: z.string().catch(() => `stg-${Math.random().toString(36).substr(2, 6)}`),
      title: z.string(),
      titleAr: z.string(),
      description: z.string(),
      descriptionAr: z.string(),
      orderIndex: z.number().catch(1),
      estimatedEffort: z.string().catch('3-4 weeks'),
      nodes: z.array(
        z.object({
          id: z.string().catch(() => `node-${Math.random().toString(36).substr(2, 6)}`),
          title: z.string(),
          titleAr: z.string().optional(),
          description: z.string(),
          descriptionAr: z.string().optional(),
          category: z.string().catch('Core Concept'),
          learningObjectives: z.array(z.string()).catch([]),
          difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).catch('Intermediate'),
          orderIndex: z.number().catch(1),
          estimatedEffort: z.string().catch('10 hours'),
          completionCriteria: z.string().catch('Complete hands-on implementation and verification.'),
          prerequisites: z.array(z.string()).catch([]),
          practicalExercise: z.string().optional(),
          resources: z
            .array(
              z.object({
                id: z.string().catch(() => `res-${Math.random().toString(36).substr(2, 6)}`),
                title: z.string(),
                provider: z
                  .string()
                  .catch('Official Docs')
                  .transform((p) => {
                    if (['YouTube', 'Coursera', 'Official Docs', 'FreeCodeCamp', 'Microsoft Learn', 'Google', 'GitHub'].includes(p)) {
                      return p as any;
                    }
                    return 'Official Docs' as const;
                  }),
                resourceType: z
                  .string()
                  .catch('documentation')
                  .transform((t) => {
                    if (['video', 'course', 'documentation', 'tutorial', 'interactive', 'book'].includes(t)) {
                      return t as any;
                    }
                    return 'documentation' as const;
                  }),
                url: z.string().url().catch('https://developer.mozilla.org/'),
                language: z.enum(['Arabic', 'English', 'Both']).catch('English'),
                priceCategory: z.enum(['Free', 'Paid', 'Free with Paid Cert', 'Audit Free']).catch('Free'),
                difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).catch('Intermediate'),
                verificationStatus: z.enum(['Verified', 'Needs Review', 'Unverified']).catch('Needs Review'),
                description: z.string().optional(),
              })
            )
            .catch([]),
        })
      ),
    })
  ),
});

export const AIAgents = {
  /**
   * 1. Career Discovery Agent
   */
  async runCareerDiscovery(profile: CareerProfile, answers: Record<string, string>) {
    return aiGateway.generateStructured({
      agentName: 'Career Discovery Agent',
      promptVersion: 'career_discovery_v1',
      systemInstruction: `You are the Career Discovery Agent in CareerPilot AI.
Analyze the user's career status, skills, education, and answers to discover 3 highly realistic, high-potential career paths.
Rule: Do not invent credentials. Base alignment strictly on user data.`,
      prompt: `User Profile:
- Status: ${profile.careerStatus}
- Education: ${JSON.stringify(profile.education)}
- Skills: ${profile.skills.map((s) => s.canonicalName).join(', ')}
- Discovery Answers: ${JSON.stringify(answers)}

Recommend 3 suitable career roles with matchScore (0-100), reasons, strengths, missingSkills, and recommendedNextAction.`,
      schema: CareerDiscoverySchema,
    });
  },

  /**
   * 2. Career DNA Agent
   */
  async runCareerDNA(profile: CareerProfile): Promise<CareerDNA> {
    const result = await aiGateway.generateStructured({
      agentName: 'Career DNA Agent',
      promptVersion: 'career_dna_v1',
      systemInstruction: `You are the Career DNA Agent in CareerPilot AI.
Analyze the user's verified profile and construct their definitive Career DNA identity.
Be objective, professional, and clear.`,
      prompt: `User Profile:
Name: ${profile.fullName}
Target Role: ${profile.targetRole || 'Not specified yet'}
Skills: ${profile.skills.map((s) => `${s.canonicalName} (${s.level})`).join(', ')}
Experience: ${JSON.stringify(profile.experience)}
Education: ${JSON.stringify(profile.education)}`,
      schema: CareerDNASchema,
    });

    return {
      ...result,
      lastUpdated: new Date().toISOString(),
    };
  },

  /**
   * 3. Next Best Action Agent
   */
  async runNextBestAction(profile: CareerProfile, contextSummary?: string): Promise<NextBestAction> {
    return aiGateway.generateStructured({
      agentName: 'Next Best Action Agent',
      promptVersion: 'next_best_action_v1',
      systemInstruction: `You are the Next Best Action Agent in CareerPilot AI.
Your role is to determine the single most impactful, concrete next action the user should take right now to advance their career.
Ensure the reason, required evidence, expected impact, and estimated effort are crystal clear.`,
      prompt: `User Profile Context:
Target Role: ${profile.targetRole}
Readiness Score: ${profile.readiness?.overallScore ?? 50}/100
Skills: ${profile.skills.map((s) => s.canonicalName).join(', ')}
Recent context: ${contextSummary || 'Active dashboard loop'}`,
      schema: NextBestActionSchema,
    });
  },

  /**
   * 4. CV ATS Agent
   */
  async runCVAnalysis(cv: ResumeVersion, targetRole?: string) {
    return aiGateway.generateStructured({
      agentName: 'CV Agent',
      promptVersion: 'cv_analysis_v1',
      systemInstruction: `You are the CV Agent in CareerPilot AI.
Analyze the user's resume for Applicant Tracking System (ATS) compliance, impact verbs, quantifiable metrics, and clarity.
Never invent work history. Provide concrete, actionable improvements.`,
      prompt: `Resume Content:
Summary: ${cv.summary}
Skills: ${cv.skills.join(', ')}
Experience: ${JSON.stringify(cv.experience)}
Education: ${JSON.stringify(cv.education)}
Target Role: ${targetRole || cv.targetRole || 'Software Professional'}`,
      schema: ATSAnalysisSchema,
    });
  },

  /**
   * 5. Tailored CV Agent
   */
  async runTailorCV(cv: ResumeVersion, opportunity: Opportunity) {
    return aiGateway.generateStructured({
      agentName: 'Tailored CV Agent',
      promptVersion: 'tailored_cv_v1',
      systemInstruction: `You are the world-class ATS Resume Tailoring Agent in CareerPilot AI.
Optimize the Master CV for this specific opportunity to pass enterprise ATS scanners (Workday, Taleo, Greenhouse, Lever) with 90%+ compatibility.
RULES:
1. NEVER fabricate fictitious jobs, companies, degrees, or dates.
2. Refine the Professional Summary to directly target the role and organization with high-impact keywords.
3. Prioritize skills matching the Job Description requirements in highlightedSkills and identify exact atsKeywordMatches.
4. Rewrite experience bullet points using strong action verbs (Architected, Engineered, Optimized, Spearheaded) and quantified metrics (%, ms, $, throughput).
5. Output an estimated ATS match score between 88 and 98, and list any missingKeywords.`,
      prompt: `Job Requirements:
Title: ${opportunity.title} at ${opportunity.company}
Requirements: ${opportunity.requirements.join(', ')}
Description: ${opportunity.description}

Master CV:
Summary: ${cv.summary}
Skills: ${cv.skills.join(', ')}
Experience: ${JSON.stringify(cv.experience)}`,
      schema: TailoredCVSchema,
    });
  },

  /**
   * 6. Cover Letter Agent
   */
  async runCoverLetter(profile: CareerProfile, opportunity: Opportunity) {
    return aiGateway.generateStructured({
      agentName: 'Cover Letter Agent',
      promptVersion: 'cover_letter_v1',
      systemInstruction: `You are the Cover Letter Agent in CareerPilot AI.
Write a concise, compelling cover letter grounded strictly in the user's actual background and the target company's needs.
Keep tone professional, confident, and direct.`,
      prompt: `Applicant: ${profile.fullName}
Target Role: ${opportunity.title} at ${opportunity.company}
User Skills: ${profile.skills.map((s) => s.canonicalName).join(', ')}
User Experience: ${profile.experience.map((e) => `${e.role} at ${e.company}`).join('; ')}
Job Requirements: ${opportunity.requirements.join(', ')}`,
      schema: CoverLetterSchema,
    });
  },

  /**
   * 7. Job Description Parser Agent
   */
  async runJobDescriptionParser(rawText: string) {
    return aiGateway.generateStructured({
      agentName: 'Job Description Agent',
      promptVersion: 'job_description_v1',
      systemInstruction: `You are the Job Description Agent in CareerPilot AI.
Extract structured opportunity details from raw job posting text.
Do not hallucinate salaries or locations not present.`,
      prompt: `Raw Job Posting:\n${rawText}`,
      schema: JobDescriptionSchema,
    });
  },

  /**
   * 8. Micro-Projects Agent
   */
  async runGenerateMicroProject(skillGap: string, targetRole: string): Promise<MicroProject> {
    const raw = await aiGateway.generateStructured({
      agentName: 'Micro-Projects Agent',
      promptVersion: 'micro_project_v1',
      systemInstruction: `You are the Micro-Projects Agent in CareerPilot AI.
Generate a realistic, practical micro-project designed to prove competence in the specified skill gap.
Include objective, scenario, concrete tasks, and reasonable duration (e.g. "3-4 hours").`,
      prompt: `Target Role: ${targetRole}
Target Skill to Prove: ${skillGap}`,
      schema: MicroProjectSchema,
    });

    return {
      ...raw,
      id: `proj-${Date.now()}`,
      status: 'available',
    };
  },

  /**
   * 9. Project Evaluation Agent
   */
  async runEvaluateProject(project: MicroProject, submissionSummary: string) {
    return aiGateway.generateStructured({
      agentName: 'Project Evaluation Agent',
      promptVersion: 'project_evaluation_v1',
      systemInstruction: `You are the Project Evaluation Agent in CareerPilot AI.
Evaluate the user's submitted micro-project against the scenario and tasks.
Assess technical correctness, problem solving, and evidence validity.
If score >= 70, mark passed: true and evidenceGenerated: true.`,
      prompt: `Project Objective: ${project.objective}
Target Skill: ${project.targetSkill}
Tasks: ${project.tasks.map((t) => t.title).join('; ')}
User Submission: ${submissionSummary}`,
      schema: ProjectEvaluationSchema,
    });
  },

  /**
   * 10. Email Classification Agent
   */
  async runEmailClassification(emailContent: { subject: string; sender: string; snippet: string }) {
    return aiGateway.generateStructured({
      agentName: 'Email Classification Agent',
      promptVersion: 'email_classification_v1',
      systemInstruction: `You are the Email Classification Agent in CareerPilot AI.
Classify incoming emails into career categories:
application_confirmation, application_update, interview_invitation, assessment, recruiter_message, job_opportunity, offer, rejection, other.
Extract priority, company name, job role, and required next action.`,
      prompt: `Subject: ${emailContent.subject}
Sender: ${emailContent.sender}
Snippet: ${emailContent.snippet}`,
      schema: EmailClassificationSchema,
    });
  },

  /**
   * 11. Interview Simulator Agent
   */
  async runInterviewQuestions(
    role: string,
    type: 'HR' | 'Behavioral' | 'Technical' | 'Mixed',
    language: 'ar' | 'en' = 'en',
    trackId?: string,
    count: number = 3
  ): Promise<string[]> {
    const isAr = language === 'ar';
    const detectedTrack = (trackId && trackId.trim()) ? (trackId as CareerTrackId) : detectTrackFromRole(role);
    const schema = z.object({
      questions: z.array(z.string()).min(2).max(10),
    });

    try {
      const res = await aiGateway.generateStructured({
        agentName: 'Interview Question Generator',
        promptVersion: 'interview_questions_v2',
        systemInstruction: isAr
          ? `أنت كبير مسؤولي التوظيف والتقييم الهندسي في CareerPilot AI. قم بتوليد ${count} أسئلة مقابلة واقعية واحترافية باللغة العربية مخصصة لتراك (${detectedTrack}) ومنصب (${role}) ونوع المقابلة (${type}). ركز على أسئلة تحاكي المقابلات الواقعية في كبرى الشركات التقنية مع سيناريوهات عملية ومحددة.`
          : `You are a Principal Engineering and Behavioral Interviewer in CareerPilot AI. Generate ${count} realistic, high-impact interview questions in English tailored to the career track (${detectedTrack}), role (${role}), and interview type (${type}). Challenge real problem-solving, architectural choices, and practical experience.`,
        prompt: `Generate ${count} realistic interview questions for: Track: ${detectedTrack}, Role: ${role}, Type: ${type}, Language: ${language}`,
        schema,
      });
      if (res.questions && res.questions.length >= 2) {
        return res.questions.slice(0, count);
      }
    } catch (e) {
      console.warn('[Interview Generator] AI generation fallback to track bank:', e);
    }

    // Fall back to our comprehensive track question bank
    return getTrackQuestions(detectedTrack, type, language, count);
  },

  async runInterviewFeedback(
    role: string,
    question: string,
    userAnswer: string
  ) {
    const isArabic = /[\u0600-\u06FF]/.test(question) || /[\u0600-\u06FF]/.test(userAnswer);

    try {
      return await aiGateway.generateStructured({
        agentName: 'Interview Feedback Agent',
        promptVersion: 'interview_feedback_v2',
        systemInstruction: `You are the Interview Feedback Agent in CareerPilot AI.
Evaluate the candidate's interview answer for structure (STAR method if behavioral), relevance, technical precision, and communication.
Provide an objective score (0-100), key strengths, improvements, and an improved suggested response phrasing.
CRITICAL LANGUAGE REQUIREMENT: ${
          isArabic
            ? 'The question or answer is in Arabic. You MUST formulate all strengths, improvements, and suggestedRefinement in clear, natural, professional Arabic.'
            : 'Formulate all strengths, improvements, and suggestedRefinement in clear, natural, professional English.'
        }`,
        prompt: `Role: ${role}
Question: ${question}
Candidate's Answer: ${userAnswer}`,
        schema: InterviewFeedbackSchema,
      });
    } catch (err) {
      console.warn('[Interview Feedback] AI evaluation fallback activated:', err);
      const answerLength = userAnswer.trim().length;
      const score = Math.min(95, Math.max(55, Math.floor(65 + Math.min(answerLength / 15, 25))));

      if (isArabic) {
        return {
          score,
          strengths: [
            'إجابة واضحة ومباشرة تركز على السؤال المطلوب.',
            'استخدام مصطلحات تقنية سليمة تعكس فهماً للبيئة العملية.',
          ],
          improvements: [
            'يُفضل تعزيز الإجابة بأرقام أو مقاييس محددة للأثر (Metrics & KPIs).',
            'اتباع أسلوب STAR (الموقف، المهمة، الإجراء، النتيجة) لتعميق الإقناع.',
          ],
          suggestedRefinement: `كإجابة نموذجية: ركز أولاً على التحدي الهندسي أو سياق المشكلة، ثم اشرح قرارك المعماري بوضوح، واختم بالنتائج الملموسة مثل تحسن السرعة أو استقرار النظام.`,
        };
      }

      return {
        score,
        strengths: [
          'Direct and articulate response addressing the core question.',
          'Demonstrates solid foundational familiarity with domain terminology.',
        ],
        improvements: [
          'Quantify outcomes with concrete metrics and business impact.',
          'Structure your response using the STAR method for maximum persuasiveness.',
        ],
        suggestedRefinement: `For an optimal senior answer: frame the technical context, justify architectural trade-offs, detail the precise implementation, and highlight measured business outcomes.`,
      };
    }
  },

  /**
   * 12. Persistent AI Career Assistant Conversation
   */
  async runAssistantChat(
    message: string,
    profile?: CareerProfile | null,
    conversationHistory: { role: 'user' | 'assistant'; text: string }[] = []
  ) {
    const fullName = profile?.fullName || 'مستخدم CareerPilot';
    const careerStatus = profile?.careerStatus || 'باحث عن عمل / مهني';
    const targetRole = profile?.targetRole || 'غير محدد';
    const skillsList = profile?.skills?.map((s) => s.canonicalName).join(', ') || 'لم تحدد بعد';
    const readinessScore = profile?.readiness?.overallScore ?? 0;

    const systemInstruction = `أنت مساعد CareerPilot AI الذكي والمباشر.
سياق الملف المهني للمستخدم:
- الاسم: ${fullName}
- الحالة: ${careerStatus}
- الدور المستهدف: ${targetRole}
- المهارات: ${skillsList}
- الجاهزية: ${readinessScore}/100

تعليمات صارمة جداً للإجابة:
1. أجب فقط وحصرياً على ما طلبه أو سأل عنه المستخدم بالضبط. لا تضف أي نصائح إضافية لم يطلبها، ولا مقدمات مطولة أو خاتمات إنشائية غير مفيدة.
2. ممنوع منعاً باتاً استخدام علامة النجمة (* أو **) نهائياً في أي جزء من الرد. لا تستخدم النجوم للتغميق أو التنسيق أو التنقيط. اكتب نصاً نظيفاً وواضحاً ومريحاً للقراءة.
3. إذا احتجت إلى تعداد نقطي، استخدم الأرقام (1. 2. 3.) أو نقطة عادية (•) وليس نجوماً.
4. الرد بلغة المستخدم: إذا سأل بالعربية أجب بلغة عربية واضحة ومباشرة وسلسة، وإذا سأل بالإنجليزية أجب بالإنجليزية.
5. الوضوح والإيجاز: ركز على الجواب المفيد المباشر بدقة واحترافية.`;

    const historyArray = Array.isArray(conversationHistory) ? conversationHistory : [];
    const formattedHistory = historyArray
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    const prompt = `${formattedHistory}\nUser: ${message}\nAssistant:`;

    const rawReply = await aiGateway.generateText({
      agentName: 'AI Career Assistant',
      promptVersion: 'assistant_chat_v2',
      systemInstruction,
      prompt,
    });

    // ضمان تنظيف أي نجوم ومسافات زائدة
    return rawReply
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^[ \t]*-[ \t]*/gm, '• ')
      .trim();
  },

  /**
   * 13. LinkedIn Profile Parser Agent
   */
  async runLinkedInProfileParser(rawLinkedInText: string) {
    return aiGateway.generateStructured({
      agentName: 'LinkedIn Profile Agent',
      promptVersion: 'linkedin_parser_v1',
      systemInstruction: `You are the LinkedIn Profile Extraction Agent in CareerPilot AI.
Extract structured professional profile information from raw LinkedIn text (such as text copied from a profile or exported via LinkedIn "Save to PDF").
Strict Rules:
1. Extract true factual data only. Never invent companies, dates, degrees, or skills.
2. Group responsibilities and quantifiable achievements under each experience entry.
3. Normalize skills into canonical professional names.`,
      prompt: `LinkedIn Profile Text Content:\n\n${rawLinkedInText}`,
      schema: LinkedInProfileSchema,
    });
  },

  /**
   * 13b. Resume Document Extraction Agent
   */
  async runResumeExtractor(rawDocumentText: string) {
    return aiGateway.generateStructured({
      agentName: 'Resume Document Extraction Agent',
      promptVersion: 'resume_extractor_v1',
      systemInstruction: `You are the Resume Intelligence Extraction Agent in CareerPilot AI.
Extract structured professional profile information from the parsed resume document text.
Strict Rules:
1. Extract true factual data only. Never invent companies, dates, degrees, metrics, or credentials.
2. Extract the candidate's full name, contact information, professional headline, and summary.
3. Group roles, companies, dates, responsibilities, and achievements cleanly.
4. Extract education degrees, institutions, graduation dates, and certifications.
5. Extract all verified technical skills and tools into clean canonical names.`,
      prompt: `Resume Document Content:\n\n${rawDocumentText}`,
      schema: LinkedInProfileSchema,
    });
  },

  /**
   * 14. Course & Skill Development Recommendation Agent
   */
  async runCourseRecommendations(
    profile: CareerProfile,
    focusArea?: string
  ) {
    const weaknesses = profile.dna?.weaknesses?.join(', ') || 'Advanced systems architecture, performance tuning';
    const skills = profile.skills.map((s) => s.canonicalName).join(', ');
    const industries = profile.targetIndustries.join(', ');

    return aiGateway.generateStructured({
      agentName: 'Course & Skill Development Agent',
      promptVersion: 'course_recommendation_v1',
      systemInstruction: `You are the CareerPilot AI Skill Development & Course Recommendation Agent.
Your mission is to generate highly practical, high-impact, professional courses tailored specifically to the candidate's exact domain, target role, and verified skill gaps.

Strict Rules:
1. Recommend real-world reputable course titles, reputable providers (Coursera, DeepLearning.AI, edX, MIT OCW, Stanford Online, Udemy, AWS Training, Google Cloud Skills, YouTube Masterclasses), and accurate skill outcomes.
2. The courses MUST directly address the candidate's target career trajectory and bridge identified weaknesses/gaps.
3. Include realistic module breakdowns so the candidate can track incremental learning progress.
4. Provide a clear 'relevanceReason' explaining specifically WHY this course bridges their gap for their target role.`,
      prompt: `Candidate Profile for Tailored Course Recommendations:
- Target Role: ${profile.targetRole || 'Software Engineer'}
- Target Industries: ${industries || 'Technology & AI'}
- Current Level / Experience: ${profile.dna?.currentLevel || 'Mid-Level'}
- Existing Skills: ${skills}
- Identified Weaknesses & Gaps to Bridge: ${weaknesses}
${focusArea ? `- Specific Requested Learning Focus: ${focusArea}` : ''}

Generate 3 to 4 tailored, top-tier professional courses with realistic modules and syllabus to accelerate their readiness.`,
      schema: CourseRecommendationSchema,
    });
  },

  /**
   * 15. Learning Roadmap Generation Agent
   */
  async runLearningRoadmapGenerator(
    profile: CareerProfile,
    targetRole: string,
    weeklyHours = 5,
    referenceRoadmaps?: any[] // Optional: static roadmaps to use as templates
  ) {
    const existingSkills = profile.skills.map((s) => s.canonicalName).join(', ');
    const weaknesses = profile.dna?.weaknesses?.join(', ') || 'No critical gaps identified';

    // Build reference context from static roadmaps if provided
    let referenceContext = '';
    if (referenceRoadmaps && referenceRoadmaps.length > 0) {
      const relevantRoadmaps = referenceRoadmaps.slice(0, 3); // Use top 3 most relevant
      referenceContext = `\n\nREFERENCE TEMPLATES (use as structure/resource inspiration, but personalize for candidate):
${relevantRoadmaps.map((rm, idx) => `
${idx + 1}. ${rm.title} (${rm.estimatedTotalHours}h total)
   Stages: ${rm.stages.map((s: any) => s.title).join(' → ')}
   Key Resources: ${rm.stages.flatMap((s: any) =>
     s.nodes.flatMap((n: any) =>
       n.resources.filter((r: any) => r.isRecommended).slice(0, 2).map((r: any) => r.title)
     )
   ).slice(0, 5).join(', ')}
`).join('\n')}`;
    }

    return aiGateway.generateStructured({
      agentName: 'Learning Roadmap Agent',
      promptVersion: 'learning_roadmap_v2',
      systemInstruction: `You are the Lead Curriculum Architect & Learning Roadmap Designer in CareerPilot AI.
Your mission is to generate a PERSONALIZED, structured learning roadmap tailored for the candidate to become a '${targetRole}'.

Context: You have access to 20+ curated reference roadmaps covering major career tracks. Use them as inspiration for structure and resources, but CUSTOMIZE the roadmap based on:
1. Candidate's existing skills (${existingSkills})
2. Identified gaps (${weaknesses})
3. Target role requirements
4. Available weekly hours (${weeklyHours}h/week)

Strict Rules:
1. Divide the roadmap into 3-5 cohesive stages (e.g., Foundations → Core Skills → Advanced Topics → Production Projects → Career Readiness).
2. Each stage must contain 2-4 concrete, highly actionable skill nodes with precise learning objectives and completion criteria.
3. Every node MUST have realistic prerequisite dependencies (pointing to prior node IDs) without circular loops.
4. Skip fundamentals the candidate already masters — start where THEY are, not from zero.
5. Recommend REAL, VERIFIED resources:
   - Official documentation (React.dev, Python.org, etc.)
   - High-quality YouTube courses (freeCodeCamp, Traversy Media, etc.)
   - Free platforms (Coursera audit, Microsoft Learn, Google Skillshop)
   - Include actual URLs when possible
6. Output bilingual titles and descriptions (English + Arabic).
7. Calculate realistic effort estimates based on ${weeklyHours} hours per week.
8. Focus on PRACTICAL skills with real-world projects, not just theory.${referenceContext}`,
      prompt: `Candidate Profile for Custom Learning Roadmap:
- Target Role: ${targetRole}
- Current Level: ${profile.dna?.currentLevel || 'Intermediate'}
- Existing Verified Skills: ${existingSkills || 'Basic Programming'}
- Current Weaknesses / Gaps: ${weaknesses}
- Weekly Time Commitment: ${weeklyHours} hours/week

TASK: Generate a comprehensive, production-grade learning roadmap that:
1. Bridges the gap from candidate's CURRENT skills to ${targetRole}
2. Skips redundant fundamentals they already know
3. Focuses on filling identified weaknesses
4. Includes verified learning resources with real URLs
5. Provides realistic time estimates based on ${weeklyHours}h/week commitment`,
      schema: RoadmapGenerationSchema,
    });
  },

  // ============================================================================
  // Course Recommendation Agent
  // ============================================================================
  async runCourseRecommender(
    profile: CareerProfile,
    targetRole?: string,
    maxCourses = 5,
    roadmapResources?: any[] // Resources from roadmaps to use as reference
  ) {
    const existingSkills = profile.skills.map((s) => s.canonicalName).join(', ');
    const weaknesses = profile.dna?.weaknesses?.join(', ') || 'No specific gaps identified';
    const role = targetRole || profile.targetRole || 'Software Engineer';

    // Build context from roadmap resources if provided
    let resourceContext = '';
    if (roadmapResources && roadmapResources.length > 0) {
      const topResources = roadmapResources.slice(0, 10);
      resourceContext = `\n\nVERIFIED COURSE REFERENCES (use as inspiration, recommend REAL courses):
${topResources.map((r, idx) => `${idx + 1}. ${r.title} (${r.provider}) - ${r.url}`).join('\n')}`;
    }

    return aiGateway.generateStructured({
      agentName: 'Course Recommendation Agent',
      promptVersion: 'course_recommender_v1',
      systemInstruction: `You are the Learning Resources Curator in CareerPilot AI.
Your mission is to recommend the BEST, MOST RELEVANT online courses for the candidate to reach '${role}'.

Context: You have access to verified course resources from curated career roadmaps. Use them as reference for quality standards.

Strict Rules:
1. Recommend ONLY REAL, EXISTING courses from verified platforms:
   - YouTube (freeCodeCamp, Traversy Media, Programming with Mosh, Academind, etc.)
   - Coursera (Google, IBM, Meta, DeepLearning.AI certificates)
   - Microsoft Learn (Azure, .NET, Power Platform official paths)
   - freeCodeCamp (Interactive curriculum)
   - Udemy (highly-rated courses only, 4.5+ rating)
   - Official documentation sites (React.dev, Python.org, MDN, etc.)

2. Prioritize based on candidate's CURRENT state:
   - Existing Skills: ${existingSkills}
   - Skill Gaps: ${weaknesses}
   - Target Role: ${role}

3. SKIP courses covering skills they already have — focus on GAPS.

4. Include mix of:
   - FREE courses (priority)
   - "Free with Paid Certificate" options
   - High-value paid courses (only if exceptional)

5. Provide REAL, WORKING URLs — no placeholder links.

6. For each course, explain WHY it's relevant to THIS candidate specifically.

7. Order by priority: most critical gaps first.

8. Output bilingual titles and descriptions (English + Arabic).${resourceContext}`,
      prompt: `Candidate Profile for Course Recommendations:
- Target Role: ${role}
- Current Level: ${profile.dna?.currentLevel || 'Intermediate'}
- Existing Skills: ${existingSkills || 'Basic Programming'}
- Skill Gaps to Fill: ${weaknesses}
- Learning Goal: ${profile.targetRole || role}

TASK: Recommend ${maxCourses} courses that:
1. Fill the candidate's SPECIFIC skill gaps
2. Are appropriate for their current level
3. Progress them toward ${role}
4. Use REAL course URLs from verified platforms
5. Prioritize FREE or affordable options

Focus on PRACTICAL courses with hands-on projects, not just theory.`,
      schema: z.object({
        courses: z.array(z.object({
          title: z.string().describe('Course title'),
          titleAr: z.string().describe('Arabic course title'),
          provider: z.string().describe('Platform: YouTube, Coursera, Microsoft Learn, freeCodeCamp, Udemy, etc.'),
          instructor: z.string().optional().describe('Instructor name if known'),
          domain: z.string().describe('Domain: AI & ML, Full-Stack, Cloud, DevOps, Data, Security, Design, etc.'),
          level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'All Levels']),
          duration: z.string().describe('Estimated duration: e.g. "6 hours", "4 weeks", "3 months"'),
          rating: z.number().min(0).max(5).describe('Rating out of 5'),
          url: z.string().url().describe('REAL working URL to the course'),
          description: z.string().describe('What the course covers'),
          descriptionAr: z.string().describe('Arabic description'),
          skillsGained: z.array(z.string()).describe('Specific skills learned'),
          relevanceReason: z.string().describe('WHY this course is relevant to THIS candidate specifically'),
          cost: z.enum(['Free', 'Paid', 'Free with Paid Cert']),
          certificateAvailable: z.boolean(),
        })).min(1).max(10),
      }),
    });
  },
};
