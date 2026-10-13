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
  async runInterviewFeedback(
    role: string,
    question: string,
    userAnswer: string
  ) {
    return aiGateway.generateStructured({
      agentName: 'Interview Feedback Agent',
      promptVersion: 'interview_feedback_v1',
      systemInstruction: `You are the Interview Feedback Agent in CareerPilot AI.
Evaluate the candidate's interview answer for structure (STAR method if behavioral), relevance, technical precision, and communication.
Provide an objective score (0-100), key strengths, improvements, and an improved suggested response phrasing.`,
      prompt: `Role: ${role}
Question: ${question}
Candidate's Answer: ${userAnswer}`,
      schema: InterviewFeedbackSchema,
    });
  },

  /**
   * 12. Persistent AI Career Assistant Conversation
   */
  async runAssistantChat(
    message: string,
    profile: CareerProfile,
    conversationHistory: { role: 'user' | 'assistant'; text: string }[]
  ) {
    const systemInstruction = `أنت مساعد CareerPilot AI الذكي والمباشر.
سياق الملف المهني للمستخدم:
- الاسم: ${profile.fullName}
- الحالة: ${profile.careerStatus}
- الدور المستهدف: ${profile.targetRole || 'غير محدد'}
- المهارات: ${profile.skills.map((s) => s.canonicalName).join(', ')}
- الجاهزية: ${profile.readiness?.overallScore ?? 0}/100

تعليمات صارمة جداً للإجابة:
1. أجب فقط وحصرياً على ما طلبه أو سأل عنه المستخدم بالضبط. لا تضف أي نصائح إضافية لم يطلبها، ولا مقدمات مطولة أو خاتمات إنشائية غير مفيدة.
2. ممنوع منعاً باتاً استخدام علامة النجمة (* أو **) نهائياً في أي جزء من الرد. لا تستخدم النجوم للتغميق أو التنسيق أو التنقيط. اكتب نصاً نظيفاً وواضحاً ومريحاً للقراءة.
3. إذا احتجت إلى تعداد نقطي، استخدم الأرقام (1. 2. 3.) أو نقطة عادية (•) وليس نجوماً.
4. الرد بلغة المستخدم: إذا سأل بالعربية أجب بلغة عربية واضحة ومباشرة وسلسة، وإذا سأل بالإنجليزية أجب بالإنجليزية.
5. الوضوح والإيجاز: ركز على الجواب المفيد المباشر بدقة واحترافية.`;

    const formattedHistory = conversationHistory
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
};
