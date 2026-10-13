import {
  ResumeVersion,
  CareerProfile,
  Opportunity,
  ATSAnalysis,
  ATSFindingItem,
  JobMatchAnalysis,
} from '../types/index.js';

// Action verbs dictionary for ATS analysis
const STRONG_ACTION_VERBS = [
  'architected',
  'engineered',
  'developed',
  'implemented',
  'designed',
  'spearheaded',
  'optimized',
  'refactored',
  'automated',
  'delivered',
  'scaled',
  'built',
  'created',
  'orchestrated',
  'established',
  'resolved',
  'accelerated',
  'boosted',
  'reduced',
  'increased',
  'deployed',
  'migrated',
  'integrated',
  'mentored',
  'led',
];

const WEAK_PASSIVE_PHRASES = [
  'responsible for',
  'worked on',
  'assisted in',
  'helped with',
  'participated in',
  'duties included',
  'handled',
  'tasked with',
];

// ─── 1. Secure CV File Validator ─────────────────────────────────────────────

export interface CVFileValidationResult {
  valid: boolean;
  error?: string;
  fileType?: 'pdf' | 'docx' | 'txt';
  fileName: string;
  fileSizeBytes: number;
}

export function validateCVFile(file: File): CVFileValidationResult {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const fileName = file.name || 'unnamed-resume';
  const fileSizeBytes = file.size || 0;

  if (fileSizeBytes <= 0) {
    return {
      valid: false,
      error: 'File appears to be empty (0 bytes). Please upload a valid document.',
      fileName,
      fileSizeBytes,
    };
  }

  if (fileSizeBytes > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB limit. Please upload a smaller document.',
      fileName,
      fileSizeBytes,
    };
  }

  const ext = fileName.split('.').pop()?.toLowerCase();
  const validExtensions = ['pdf', 'docx', 'doc', 'txt'];

  if (!ext || !validExtensions.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension .${ext || 'unknown'}. Please upload a PDF, DOCX, or TXT file.`,
      fileName,
      fileSizeBytes,
    };
  }

  const normalizedType = ext === 'doc' ? 'docx' : (ext as 'pdf' | 'docx' | 'txt');
  return {
    valid: true,
    fileType: normalizedType,
    fileName,
    fileSizeBytes,
  };
}

// ─── 2. Client-side Candidate Extractor (Deterministic + Regex) ──────────────

export function extractCandidateInfoFromText(text: string): {
  fullName?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  candidateRole?: string;
} {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract Email
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : undefined;

  // Extract Phone
  const phoneRegex = /(\+?\d{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch.find((p) => p.replace(/\D/g, '').length >= 8) : undefined;

  // Extract Skills
  const knownKeywords = [
    'Python',
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Express',
    'SQL',
    'PostgreSQL',
    'MongoDB',
    'Docker',
    'Kubernetes',
    'AWS',
    'Git',
    'HTML',
    'CSS',
    'Tailwind CSS',
    'FastAPI',
    'Power BI',
    'Excel',
    'Figma',
    'Next.js',
    'REST APIs',
    'GraphQL',
    'C++',
    'Java',
    'Linux',
  ];

  const matchedSkills: string[] = [];
  const lowerText = text.toLowerCase();
  for (const kw of knownKeywords) {
    if (lowerText.includes(kw.toLowerCase())) {
      matchedSkills.push(kw);
    }
  }

  // Name heuristic: usually the first non-empty line with 2-4 words
  let fullName: string | undefined;
  for (const line of lines.slice(0, 5)) {
    if (
      !line.includes('@') &&
      !line.includes('http') &&
      !line.includes('+') &&
      line.length > 3 &&
      line.length < 40 &&
      line.split(' ').length >= 2 &&
      line.split(' ').length <= 4
    ) {
      fullName = line;
      break;
    }
  }

  return {
    fullName,
    email,
    phone,
    skills: matchedSkills,
    summary: lines.find((l) => l.length > 60 && !l.includes('@')),
  };
}

// ─── 3. Transparent 5-Pillar CV Quality Evaluation ────────────────────────────

export function evaluateResumeQuality(resume: ResumeVersion): ATSAnalysis {
  const findings: ATSFindingItem[] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];
  const missingKeywords: string[] = [];

  // Pillar 1: Structure & Parseability (15%)
  let structureScore = 15;
  if (!resume.title || resume.title.trim().length < 3) {
    structureScore -= 5;
    findings.push({
      id: 'fnd-struct-title',
      section: 'header',
      issue: 'Missing explicit target job title header',
      location: 'Document Header',
      importance: 'Important',
      whyItMatters: 'ATS parsers look for an exact target title to map candidate candidacy.',
      recommendation: 'Add a clear target title like "Senior Full-Stack Engineer" directly under your name.',
      exampleBefore: 'John Doe',
      exampleAfter: 'John Doe | Senior Full-Stack Engineer',
    });
  }

  // Pillar 2: Professional Summary Quality (20%)
  let contentScore = 20;
  if (!resume.summary || resume.summary.trim().length < 30) {
    contentScore -= 15;
    weaknesses.push('Professional summary is missing or too brief.');
    recommendations.push('Write a concise 3-4 line professional summary with your top tech stack and value.');
    findings.push({
      id: 'fnd-summ-missing',
      section: 'summary',
      issue: 'Professional summary is absent or under 30 characters',
      location: 'Professional Summary',
      importance: 'Critical',
      whyItMatters: 'Recruiters and ATS prioritize candidates with a distinct value proposition.',
      recommendation: 'Include a 3-sentence summary highlighting experience level, core stack, and measurable impact.',
      exampleBefore: 'Looking for a good software engineering job.',
      exampleAfter:
        'Results-driven Full-Stack Engineer with 3+ years architecting event-driven Node.js microservices and React web applications delivering high reliability at scale.',
    });
  } else if (resume.summary.length > 500) {
    contentScore -= 4;
    findings.push({
      id: 'fnd-summ-long',
      section: 'summary',
      issue: 'Summary exceeds 500 characters',
      location: 'Professional Summary',
      importance: 'Optional',
      whyItMatters: 'Overly long paragraphs decrease recruiter readability.',
      recommendation: 'Condense your summary into 3 focused, punchy sentences.',
    });
  } else {
    strengths.push('Professional summary clearly articulates career focus and competencies.');
  }

  // Pillar 3: Action Verbs & Experience Depth (25%)
  let actionVerbsScore = 25;
  const allAchievements = resume.experience.flatMap((e) => e.achievements || []);
  let strongVerbCount = 0;
  let passivePhraseCount = 0;

  for (const bullet of allAchievements) {
    const lower = bullet.toLowerCase().trim();
    const firstWord = lower.split(' ')[0] || '';
    if (STRONG_ACTION_VERBS.some((v) => lower.startsWith(v) || firstWord.includes(v))) {
      strongVerbCount++;
    }
    if (WEAK_PASSIVE_PHRASES.some((p) => lower.includes(p))) {
      passivePhraseCount++;
    }
  }

  if (allAchievements.length === 0) {
    actionVerbsScore = 5;
    weaknesses.push('No detailed experience bullet points found.');
    recommendations.push('Add at least 3 bullet points per role demonstrating technical responsibilities.');
    findings.push({
      id: 'fnd-exp-empty',
      section: 'experience',
      issue: 'Experience section lacks bulleted accomplishments',
      location: 'Work History',
      importance: 'Critical',
      whyItMatters: 'ATS score depends heavily on indexing experience bullet content.',
      recommendation: 'Break down each role into 3-5 achievement bullets.',
    });
  } else {
    if (strongVerbCount < Math.ceil(allAchievements.length * 0.5)) {
      actionVerbsScore -= 8;
      findings.push({
        id: 'fnd-exp-verbs',
        section: 'experience',
        issue: 'Bullet points do not consistently start with strong action verbs',
        location: 'Experience Bullets',
        importance: 'Important',
        whyItMatters: 'Action verbs project leadership and active contribution rather than passive participation.',
        recommendation: 'Begin every bullet point with verbs like Engineered, Architected, Spearheaded, or Optimized.',
        exampleBefore: 'Responsible for building APIs and fixing database bugs.',
        exampleAfter: 'Engineered high-concurrency RESTful APIs in Node.js and resolved database latency bottlenecks.',
      });
    } else {
      strengths.push('Experience bullets feature strong, assertive technical action verbs.');
    }

    if (passivePhraseCount > 0) {
      actionVerbsScore -= 4;
      findings.push({
        id: 'fnd-exp-passive',
        section: 'experience',
        issue: `Detected ${passivePhraseCount} passive phrases ("responsible for", "assisted with")`,
        location: 'Experience Bullets',
        importance: 'Important',
        whyItMatters: 'Passive phrases dilute candidate ownership and impact.',
        recommendation: 'Replace passive phrases with direct ownership verbs.',
      });
    }
  }

  // Pillar 4: Quantified Impact & Metrics (25%)
  let metricsScore = 25;
  const metricRegex = /(\d+%\b|\$\d+|\b\d+x\b|\b\d+ms\b|\b\d+\s*(users|clients|requests|million|thousand|k|m|gb|tb|team|engineers|projects)\b)/gi;
  let quantifiedCount = 0;

  for (const bullet of allAchievements) {
    if (metricRegex.test(bullet)) {
      quantifiedCount++;
    }
  }

  if (allAchievements.length > 0 && quantifiedCount === 0) {
    metricsScore -= 18;
    weaknesses.push('Work history lacks quantified business or performance metrics.');
    recommendations.push('Include metrics like % improvement, latency reduction, throughput, or user scale.');
    findings.push({
      id: 'fnd-metrics-zero',
      section: 'experience',
      issue: 'Zero quantifiable metrics (numbers, %, $, scale) detected in bullet points',
      location: 'Experience Bullets',
      importance: 'Critical',
      whyItMatters: 'Quantified metrics increase interview callback rates by up to 3x.',
      recommendation: 'Quantify your contributions using measurable results.',
      exampleBefore: 'Improved database performance and query speed.',
      exampleAfter: 'Decreased p95 database query latency by 42% through strategic index refactoring.',
    });
  } else if (allAchievements.length > 0 && quantifiedCount < Math.ceil(allAchievements.length * 0.4)) {
    metricsScore -= 8;
    findings.push({
      id: 'fnd-metrics-low',
      section: 'experience',
      issue: 'Only a few bullets have quantifiable metrics',
      location: 'Experience Bullets',
      importance: 'Important',
      whyItMatters: 'Consistent metrics demonstrate measurable credibility.',
      recommendation: 'Target having metrics in at least 50% of your experience bullet points.',
    });
  } else if (quantifiedCount > 0) {
    strengths.push('Solid evidence of measurable outcomes and quantified performance indicators.');
  }

  // Pillar 5: Technical Skills Density (15%)
  let skillsScore = 15;
  if (!resume.skills || resume.skills.length === 0) {
    skillsScore = 0;
    weaknesses.push('Skills section is empty.');
    recommendations.push('Add categorized core technical skills and tools.');
    findings.push({
      id: 'fnd-sk-empty',
      section: 'skills',
      issue: 'No skills found in resume',
      location: 'Skills Section',
      importance: 'Critical',
      whyItMatters: 'ATS keyword scrapers require an explicit skills taxonomy.',
      recommendation: 'Include at least 6-10 modern technical competencies.',
    });
  } else if (resume.skills.length < 5) {
    skillsScore -= 6;
    findings.push({
      id: 'fnd-sk-low',
      section: 'skills',
      issue: `Only ${resume.skills.length} skills listed (fewer than 5)`,
      location: 'Skills Section',
      importance: 'Important',
      whyItMatters: 'Insufficient keywords lower matching ranking in ATS algorithms.',
      recommendation: 'Add relevant tools, frameworks, and database technologies you have worked with.',
    });
  } else {
    strengths.push(`Good technical skills coverage with ${resume.skills.length} verified technologies.`);
  }

  // Ensure non-negative bounds
  structureScore = Math.max(0, Math.min(15, structureScore));
  contentScore = Math.max(0, Math.min(20, contentScore));
  actionVerbsScore = Math.max(0, Math.min(25, actionVerbsScore));
  metricsScore = Math.max(0, Math.min(25, metricsScore));
  skillsScore = Math.max(0, Math.min(15, skillsScore));

  const overallScore = structureScore + contentScore + actionVerbsScore + metricsScore + skillsScore;

  return {
    overallScore,
    structureScore,
    contentScore,
    actionVerbsScore,
    metricsScore,
    skillsScore,
    strengths: strengths.length > 0 ? strengths : ['Valid document structure recognized.'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No critical defects found.'],
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain current resume structure.'],
    missingKeywords,
    formattingScore: Math.round(structureScore * (100 / 15)),
    relevanceScore: Math.round(skillsScore * (100 / 15)),
    impactScore: Math.round((actionVerbsScore + metricsScore) * 2),
    detailedFindings: findings,
    rubricVersion: '2026.2-deterministic',
    evaluatedAt: new Date().toISOString(),
  };
}

// ─── 4. Transparent Job Matching & Skill Gap Analysis ─────────────────────────

export function evaluateJobMatch(
  resume: ResumeVersion,
  opportunity: Opportunity | { title: string; company?: string; requirements: string[]; description?: string }
): JobMatchAnalysis {
  const resumeSkillsLower = (resume.skills || []).map((s) => s.toLowerCase());
  const resumeTextLower = [
    resume.summary,
    ...resume.skills,
    ...resume.experience.flatMap((e) => [e.role, ...(e.achievements || [])]),
  ]
    .join(' ')
    .toLowerCase();

  const requirements = opportunity.requirements || [];
  let matchedCount = 0;
  let partialCount = 0;

  const skillGaps = requirements.map((req) => {
    const reqLower = req.toLowerCase().trim();
    // Direct match check
    const exactMatch = resumeSkillsLower.some(
      (s) => s === reqLower || s.includes(reqLower) || reqLower.includes(s)
    );

    if (exactMatch) {
      matchedCount++;
      return {
        skill: req,
        status: 'MATCHED' as const,
        importance: 'Critical' as const,
        action: 'Verified in candidate resume skills.',
      };
    }

    // Partial match in resume body
    if (resumeTextLower.includes(reqLower)) {
      partialCount++;
      return {
        skill: req,
        status: 'PARTIAL' as const,
        importance: 'Preferred' as const,
        action: 'Mentioned in work experience; recommend highlighting in skills taxonomy.',
      };
    }

    // Missing
    return {
      skill: req,
      status: 'MISSING' as const,
      importance: 'Critical' as const,
      action: `Requirement ${req} not evidenced in current CV.`,
    };
  });

  const totalReqs = Math.max(1, requirements.length);
  const skillMatch = Math.round(((matchedCount + partialCount * 0.5) / totalReqs) * 100);

  // Experience title & seniority alignment
  const targetTitleLower = (opportunity.title || '').toLowerCase();
  const resumeTitleLower = (resume.targetRole || resume.title || '').toLowerCase();
  let titleMatch = 60;
  if (targetTitleLower && resumeTitleLower) {
    if (targetTitleLower === resumeTitleLower || resumeTitleLower.includes(targetTitleLower)) {
      titleMatch = 95;
    } else {
      const words = targetTitleLower.split(' ');
      const matchWords = words.filter((w) => w.length > 3 && resumeTitleLower.includes(w));
      titleMatch = Math.min(90, 50 + matchWords.length * 20);
    }
  }

  const expMatch = resume.experience.length >= 2 ? 90 : resume.experience.length === 1 ? 75 : 40;
  const eduMatch = resume.education && resume.education.length > 0 ? 85 : 55;

  // Weighted overall calculation: Skills 50%, Title 20%, Experience 20%, Education 10%
  const overallMatch = Math.round(
    skillMatch * 0.5 + titleMatch * 0.2 + expMatch * 0.2 + eduMatch * 0.1
  );

  const recommendation = overallMatch >= 65 ? 'APPLY' : 'DON_T_APPLY_YET';
  const recommendationReason =
    recommendation === 'APPLY'
      ? `Strong alignment (${overallMatch}% match score) with ${opportunity.company || 'target role'}. Key required technical skills are represented.`
      : `High qualification delta (${overallMatch}% match score). Several required skills (${skillGaps
          .filter((g) => g.status === 'MISSING')
          .map((g) => g.skill)
          .slice(0, 3)
          .join(', ')}) are not currently evidenced.`;

  const improvementPath = skillGaps
    .filter((g) => g.status === 'MISSING')
    .map((g) => `Add practical evidence or project demonstrating ${g.skill}`);

  return {
    opportunityId: (opportunity as any).id || `opp-custom-${Date.now()}`,
    overallMatch,
    skillMatch,
    experienceMatch: expMatch,
    educationMatch: eduMatch,
    recommendation,
    recommendationReason,
    skillGaps,
    improvementPath,
  };
}

// ─── 5. Job-Specific Tailoring Generator (Pure Deterministic Transformation) ─

export function generateTailoredCV(
  masterResume: ResumeVersion,
  opportunity: Opportunity | { title: string; company?: string; requirements: string[]; description?: string }
): ResumeVersion {
  const targetRole = opportunity.title || masterResume.targetRole || 'Software Professional';
  const targetCompany = opportunity.company || 'Target Organization';

  // 1. Re-order skills: matching skills first
  const reqsLower = (opportunity.requirements || []).map((r) => r.toLowerCase());
  const prioritizedSkills: string[] = [];
  const remainingSkills: string[] = [];

  for (const skill of masterResume.skills) {
    const sLower = skill.toLowerCase();
    if (reqsLower.some((r) => r.includes(sLower) || sLower.includes(r))) {
      prioritizedSkills.push(skill);
    } else {
      remainingSkills.push(skill);
    }
  }

  const tailoredSkills = [...prioritizedSkills, ...remainingSkills];

  // 2. Tailor summary to emphasize the target role and employer
  let tailoredSummary = masterResume.summary;
  if (!tailoredSummary || tailoredSummary.length < 20) {
    tailoredSummary = `Results-driven ${targetRole} with proven engineering foundations in ${tailoredSkills.slice(0, 4).join(', ')}. Delivering scalable, production-ready solutions tailored to ${targetCompany}'s goals.`;
  } else {
    // Inject target positioning if not already present
    if (!tailoredSummary.toLowerCase().includes(targetRole.toLowerCase())) {
      tailoredSummary = `${targetRole} — ${tailoredSummary}`;
    }
  }

  // 3. Tailor experience bullets (strengthen verbs without inventing facts)
  const tailoredExperience = masterResume.experience.map((exp) => ({
    ...exp,
    achievements: (exp.achievements || []).map((bullet) => {
      let b = bullet.trim();
      // Replace weak passive openings with strong action verbs
      for (const weak of WEAK_PASSIVE_PHRASES) {
        if (b.toLowerCase().startsWith(weak)) {
          b = 'Spearheaded development and ' + b.slice(weak.length).trim();
        }
      }
      return b;
    }),
  }));

  const tailoredId = `res-tailored-${Date.now()}`;
  const tailoredVersion: ResumeVersion = {
    ...masterResume,
    id: tailoredId,
    title: `Tailored: ${targetRole} (${targetCompany})`,
    isMaster: false,
    isTailored: true,
    targetRole,
    companyName: targetCompany,
    opportunityId: (opportunity as any).id,
    summary: tailoredSummary,
    skills: tailoredSkills,
    experience: tailoredExperience,
    templateVersion: 'google_doc_ats_v1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const qualityScore = evaluateResumeQuality(tailoredVersion);
  tailoredVersion.atsScore = qualityScore.overallScore;

  return tailoredVersion;
}

// ─── 6. Clean Microsoft Word / DOCX Exporter ──────────────────────────────────

export function exportResumeToWordDoc(resume: ResumeVersion, profile?: CareerProfile | null): void {
  const fullName = profile?.fullName || resume.title || 'Candidate';
  const email = profile?.email || '';
  const location = profile?.location || '';
  const targetRole = resume.targetRole || resume.title || 'Full-Stack Software Engineer';

  // Construct Word-compliant HTML with official Google Doc ATS styling (#1f3864, Carlito/Calibri)
  const docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${fullName} - Resume</title>
      <style>
        @page { size: A4; margin: 1.5cm 2cm; }
        body { font-family: 'Calibri', 'Carlito', Arial, sans-serif; font-size: 10pt; line-height: 1.2; color: #222; }
        .name { font-size: 20pt; font-weight: bold; color: #1f3864; text-align: center; margin: 0; }
        .tagline { font-size: 11pt; font-weight: bold; color: #333; text-align: center; margin: 3px 0; }
        .contact { font-size: 9pt; color: #555; text-align: center; margin-bottom: 12px; }
        .sec-title { font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #1f3864; border-bottom: 1.5pt solid #1f3864; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px; }
        .summary { font-size: 9.5pt; text-align: justify; margin-bottom: 8px; }
        .skills-line { font-size: 9.5pt; line-height: 1.4; margin-bottom: 6px; }
        .exp-item { margin-bottom: 8px; }
        .row-sb { display: flex; justify-content: space-between; font-weight: bold; }
        .sub-row { font-style: italic; color: #444; font-size: 9pt; margin-bottom: 3px; }
        ul { margin-top: 3px; margin-bottom: 6px; padding-left: 18px; }
        li { font-size: 9pt; margin-bottom: 2px; }
      </style>
    </head>
    <body>
      <div class="name">${fullName}</div>
      <div class="tagline">${targetRole}</div>
      <div class="contact">${[location, email].filter(Boolean).join(' | ')}</div>

      <div class="sec-title">Professional Summary</div>
      <div class="summary">${resume.summary}</div>

      <div class="sec-title">Core Skills</div>
      <div class="skills-line"><strong>Technical Skills:</strong> ${resume.skills.join(' • ')}</div>

      <div class="sec-title">Professional Experience</div>
      ${resume.experience
        .map(
          (e) => `
        <div class="exp-item">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="font-weight: bold; font-size: 10pt; text-align: left;">${e.role}</td>
              <td style="font-size: 9pt; text-align: right; color: #555;">${e.startDate} – ${e.current ? 'Present' : e.endDate}</td>
            </tr>
            <tr>
              <td colspan="2" style="font-style: italic; font-size: 9pt; color: #444;">${e.company}${e.location ? `, ${e.location}` : ''}</td>
            </tr>
          </table>
          <ul>
            ${e.achievements.map((a) => `<li>${a}</li>`).join('')}
          </ul>
        </div>
      `
        )
        .join('')}

      ${
        resume.education && resume.education.length > 0
          ? `
        <div class="sec-title">Education</div>
        ${resume.education
          .map(
            (ed) => `
          <div class="exp-item">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="font-weight: bold; font-size: 9.5pt; text-align: left;">${ed.degree} in ${ed.field}</td>
                <td style="font-size: 9pt; text-align: right; color: #555;">${ed.startDate} – ${ed.current ? 'Present' : ed.endDate}</td>
              </tr>
              <tr>
                <td colspan="2" style="font-size: 9pt; color: #444;">${ed.institution} ${ed.gpa ? `(GPA: ${ed.gpa})` : ''}</td>
              </tr>
            </table>
          </div>
        `
          )
          .join('')}
      `
          : ''
      }

      ${
        resume.certifications && resume.certifications.length > 0
          ? `
        <div class="sec-title">Certifications & Courses</div>
        <ul>
          ${resume.certifications.map((c) => `<li>${c}</li>`).join('')}
        </ul>
      `
          : ''
      }
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (fullName || 'Resume').toLowerCase().replace(/\s+/g, '_');
  a.download = `${safeName}_ats_resume.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
