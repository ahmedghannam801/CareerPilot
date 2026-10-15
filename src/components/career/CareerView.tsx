import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import {
  CareerProfile,
  CareerDNA,
  UserSkill,
  SkillEvidence,
  CareerTimelineEvent,
  ResumeVersion,
  Opportunity,
  Application,
  MicroProject,
  Course,
  InterviewSession,
} from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import { CareerJourneyMap } from '../journey/CareerJourneyMap.js';
import { calculateDynamicCareerReadiness } from '../../lib/scoring.js';

interface CareerViewProps {
  profile: CareerProfile;
  timeline: CareerTimelineEvent[];
  resumes?: ResumeVersion[];
  opportunities?: Opportunity[];
  applications?: Application[];
  projects?: MicroProject[];
  courses?: Course[];
  interviews?: InterviewSession[];
  onNavigate?: (tab: string) => void;
  onUpdateProfile: (data: Partial<CareerProfile>) => void;
  onRegenerateDNA: () => Promise<void>;
  onRunDiscovery: (answers: Record<string, string>) => Promise<any>;
  onOpenLinkedInSync?: () => void;
  lang: 'en' | 'ar';
}

export const CareerView: React.FC<CareerViewProps> = ({
  profile,
  timeline,
  resumes = [],
  opportunities = [],
  applications = [],
  projects = [],
  courses = [],
  interviews = [],
  onNavigate = () => {},
  onUpdateProfile,
  onRegenerateDNA,
  onRunDiscovery,
  onOpenLinkedInSync,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'dna' | 'readiness' | 'skills' | 'discovery' | 'timeline'>('roadmap');
  const [isRegeneratingDNA, setIsRegeneratingDNA] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<UserSkill | null>(null);

  // Discovery interactive wizard
  const [discoveryAnswers, setDiscoveryAnswers] = useState({
    workStyle: 'building scalable software systems and autonomous agents',
    focus: 'deep technical architecture and developer tooling',
    collaboration: 'collaborative cross-functional teams with high engineering standards',
    motivation: 'shipping high-leverage products that eliminate developer toil',
  });
  const [discoveryResults, setDiscoveryResults] = useState<any>(null);
  const [isDiscovering, setIsDiscovering] = useState(false);

  const dna = profile.dna;
  const dynamicReadiness = calculateDynamicCareerReadiness(profile, {
    projects,
    interviews,
    resumes,
  });
  const readiness = (profile.readiness && profile.readiness.overallScore > 0)
    ? profile.readiness
    : dynamicReadiness;

  const handleRegenerateDNA = async () => {
    setIsRegeneratingDNA(true);
    try {
      await onRegenerateDNA();
    } finally {
      setIsRegeneratingDNA(false);
    }
  };

  const handleRunDiscovery = async () => {
    setIsDiscovering(true);
    try {
      const res = await onRunDiscovery(discoveryAnswers);
      setDiscoveryResults(res.discovery);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header with Segmented Navigation Tabs */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl surface-elevated border-hairline"
      >
        <div>
          <div className="type-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
            {lang === 'ar' ? 'نظام التحليل والاستكشاف' : 'Intelligence & Identity Engine'}
          </div>
          <h1 className="type-heading-lg" style={{ color: 'var(--text-primary)' }}>
            {lang === 'ar' ? 'هويتي المهنية والجاهزية' : 'Career DNA & Readiness'}
          </h1>
          <p className="type-caption" style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Target Trajectory: <span className="type-body-bold" style={{ color: 'var(--text-primary)' }}>{profile.targetRole}</span>
          </p>
        </div>

        {/* Segmented controls (allowed for interactive filter/tabs) */}
        <div className="flex items-center gap-1 p-1 rounded-lg shrink-0 overflow-x-auto" style={{ backgroundColor: 'var(--surface-secondary)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('roadmap')}
            className="px-3 py-1.5 type-label font-semibold rounded-md transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'roadmap' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'roadmap' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            }}
          >
            {lang === 'ar' ? '🗺️ مساري المهني (Roadmap)' : '🗺️ Career Roadmap'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dna')}
            className="px-3 py-1.5 type-label font-medium rounded-md transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'dna' ? 'var(--surface-primary)' : 'transparent',
              color: activeTab === 'dna' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Career DNA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('readiness')}
            className="px-3 py-1.5 type-label font-medium rounded-md transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'readiness' ? 'var(--surface-primary)' : 'transparent',
              color: activeTab === 'readiness' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Readiness ({readiness?.overallScore != null ? `${readiness.overallScore}%` : '—'})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skills')}
            className="px-3 py-1.5 type-label font-medium rounded-md transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'skills' ? 'var(--surface-primary)' : 'transparent',
              color: activeTab === 'skills' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Skills Matrix ({profile.skills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discovery')}
            className="px-3 py-1.5 type-label font-medium rounded-md transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'discovery' ? 'var(--surface-primary)' : 'transparent',
              color: activeTab === 'discovery' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Discovery Tool
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className="px-3 py-1.5 type-label font-medium rounded-md transition-colors whitespace-nowrap"
            style={{
              backgroundColor: activeTab === 'timeline' ? 'var(--surface-primary)' : 'transparent',
              color: activeTab === 'timeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            Timeline ({timeline.length})
          </button>
        </div>
      </div>

      {/* 0. CAREER ROADMAP TAB */}
      {activeTab === 'roadmap' && (
        <CareerJourneyMap
          profile={profile}
          resumes={resumes}
          opportunities={opportunities}
          applications={applications}
          projects={projects}
          courses={courses}
          interviews={interviews}
          mode="detailed"
          onNavigate={onNavigate}
          lang={lang}
        />
      )}

      {/* 1. CAREER DNA TAB */}
      {activeTab === 'dna' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl surface-elevated border-hairline">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>Career Identity Synthesis</h2>
                <p className="type-caption" style={{ color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                  Extracted from verified experience, credentials, and achievements
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenLinkedInSync}
                  className="button-secondary inline-flex items-center gap-1.5"
                >
                  <span
                    className="w-3.5 h-3.5 rounded text-[9px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#0077B5', color: 'white' }}
                  >
                    in
                  </span>
                  <span>{lang === 'ar' ? 'مزامنة لينكدإن' : 'Sync LinkedIn'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateDNA}
                  disabled={isRegeneratingDNA}
                  className="button-secondary inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingDNA ? 'animate-spin' : ''}`} />
                  <span>{isRegeneratingDNA ? 'Synthesizing...' : 'Regenerate DNA'}</span>
                </button>
              </div>
            </div>

            {dna ? (
              <div className="space-y-6">
                <div className="p-4 rounded-lg border-hairline" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                  <div className="type-mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                    EXECUTIVE SUMMARY
                  </div>
                  <p className="type-body" style={{ color: 'var(--text-secondary)' }}>{dna.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border-hairline">
                    <span className="type-mono-label" style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>
                      Current Seniority Level
                    </span>
                    <span className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>{dna.currentLevel}</span>
                  </div>
                  <div className="p-4 rounded-lg border-hairline">
                    <span className="type-mono-label" style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>
                      Primary Direction
                    </span>
                    <span className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>{dna.primaryDirection}</span>
                  </div>
                  <div className="p-4 rounded-lg border-hairline">
                    <span className="type-mono-label" style={{ color: 'var(--text-tertiary)', display: 'block', marginBottom: '0.25rem' }}>
                      Work Preference
                    </span>
                    <span className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>
                      {dna.workPreferences.workModel} · {dna.workPreferences.teamStyle}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Verified Strengths */}
                  <div className="p-5 rounded-lg border-hairline">
                    <h3 className="type-label" style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      Core Competitive Strengths
                    </h3>
                    <ul className="space-y-2 type-caption" style={{ color: 'var(--text-secondary)' }}>
                      {dna.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--text-primary)' }} />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Growth Areas */}
                  <div className="p-5 rounded-lg border-hairline">
                    <h3 className="type-label" style={{ color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                      Targeted Growth & Weakness Areas
                    </h3>
                    <ul className="space-y-2 type-caption" style={{ color: 'var(--text-secondary)' }}>
                      {dna.weaknesses.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: 'var(--border-primary)' }} />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center type-caption" style={{ color: 'var(--text-tertiary)' }}>
                Career DNA is not yet generated. Click Regenerate to invoke the Career DNA Agent.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. READINESS TAB */}
      {activeTab === 'readiness' && readiness && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl surface-elevated border-hairline">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>8-Pillar Career Readiness Breakdown</h2>
                <p className="type-caption" style={{ color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                  Calculated using transparent mathematical scoring weights, not arbitrary estimations
                </p>
              </div>
              <div className="text-3xl font-extrabold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {readiness.overallScore}%
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Skills & Tools', val: readiness.breakdown.skillsScore, desc: 'Density & verified projects' },
                { label: 'CV & ATS Quality', val: readiness.breakdown.cvScore, desc: 'Structure & quantified metrics' },
                { label: 'Experience Depth', val: readiness.breakdown.experienceScore, desc: 'Tenure & role responsibilities' },
                { label: 'Verified Projects', val: readiness.breakdown.projectsScore, desc: 'Evaluated micro-projects' },
                { label: 'Education & Degrees', val: readiness.breakdown.educationScore, desc: 'Academic credentials' },
                { label: 'Interview Readiness', val: readiness.breakdown.interviewReadinessScore, desc: 'Simulated practice score' },
                { label: 'Brand & Positioning', val: readiness.breakdown.brandingScore, desc: 'Industry keyword alignment' },
                { label: 'Application Pipeline', val: readiness.breakdown.applicationReadinessScore, desc: 'Cover letters & answers' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-lg border-hairline">
                  <div className="flex justify-between items-start mb-2">
                    <span className="type-caption font-medium" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                    <span className="type-body-bold font-mono tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {item.val}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${item.val}%`, backgroundColor: 'var(--text-primary)' }} />
                  </div>
                  <span className="type-mono-label" style={{ color: 'var(--text-tertiary)' }}>{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-hairline" style={{ borderTopWidth: '1px' }}>
              <h3 className="type-label" style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Prioritized Improvement Actions
              </h3>
              <div className="space-y-3">
                {readiness.improvementActions.map((action) => (
                  <div
                    key={action.id}
                    className="p-3.5 rounded-lg flex items-center justify-between gap-4 type-caption"
                    style={{ backgroundColor: 'var(--surface-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--text-primary)' }} />
                      <div>
                        <span className="type-body-bold" style={{ color: 'var(--text-primary)' }}>{action.title}</span>
                        <div className="type-mono-label" style={{ color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                          Category: {action.category} · Impact: {action.impact} · Est. Effort: {action.estimatedHours}h
                        </div>
                      </div>
                    </div>
                    <span
                      className="type-mono-label font-mono px-2 py-1 rounded border-hairline"
                      style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-secondary)' }}
                    >
                      READY TO START
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SKILLS MATRIX TAB */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl surface-elevated border-hairline">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>Canonical Skills & Verified Evidence</h2>
                <p className="type-caption" style={{ color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                  Every skill is canonicalized and tied to verifiable projects, assessments, or experience
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left type-caption">
                <thead>
                  <tr className="border-hairline font-medium" style={{ color: 'var(--text-tertiary)', borderBottomWidth: '1px' }}>
                    <th className="py-2.5 px-3">Canonical Skill</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Evidence Items</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--border-secondary)' }}>
                  {profile.skills.map((skill) => (
                    <tr key={skill.id} className="transition-colors" style={{ backgroundColor: 'transparent' }}>
                      <td className="py-3 px-3 type-body-bold" style={{ color: 'var(--text-primary)' }}>{skill.canonicalName}</td>
                      <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>{skill.category}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{skill.level}</span>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums font-medium" style={{ color: 'var(--text-primary)' }}>
                        {skill.confidence}%
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                          {skill.evidenceCount} verified
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedSkill(skill)}
                          className="type-caption font-medium hover:underline"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          View Evidence →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Evidence Modal / Drawer */}
            {selectedSkill && (
              <div className="mt-6 p-4 rounded-lg border-hairline" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="type-caption font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Verified Evidence for {selectedSkill.canonicalName}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedSkill(null)}
                    className="type-caption"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 type-caption">
                  {selectedSkill.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-md flex items-center justify-between border-hairline"
                      style={{ backgroundColor: 'var(--surface-primary)' }}
                    >
                      <div>
                        <div className="type-body-bold" style={{ color: 'var(--text-primary)' }}>{ev.title}</div>
                        <div className="type-mono-label" style={{ color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                          Type: {ev.type} · Date: {ev.date} {ev.score ? `· Score: ${ev.score}%` : ''}
                        </div>
                      </div>
                      <span
                        className="type-mono-label font-mono px-2 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}
                      >
                        VERIFIED
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. DISCOVERY TOOL TAB */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl surface-elevated border-hairline">
            <div className="mb-6">
              <h2 className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>Career Discovery Agent Wizard</h2>
              <p className="type-caption" style={{ color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                Answer meaningful behavioral questions to synthesize personalized high-potential career trajectories
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block type-caption font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  1. What kind of engineering or product problems do you enjoy solving most?
                </label>
                <input
                  type="text"
                  value={discoveryAnswers.workStyle}
                  onChange={(e) =>
                    setDiscoveryAnswers({ ...discoveryAnswers, workStyle: e.target.value })
                  }
                  className="input-primary w-full type-caption"
                />
              </div>

              <div>
                <label className="block type-caption font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  2. Do you prefer high-frequency frontend UX, distributed backend systems, or AI modeling?
                </label>
                <input
                  type="text"
                  value={discoveryAnswers.focus}
                  onChange={(e) =>
                    setDiscoveryAnswers({ ...discoveryAnswers, focus: e.target.value })
                  }
                  className="input-primary w-full type-caption"
                />
              </div>

              <div>
                <label className="block type-caption font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  3. What team pace and collaboration structure fits you best?
                </label>
                <input
                  type="text"
                  value={discoveryAnswers.collaboration}
                  onChange={(e) =>
                    setDiscoveryAnswers({ ...discoveryAnswers, collaboration: e.target.value })
                  }
                  className="input-primary w-full type-caption"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRunDiscovery}
                  disabled={isDiscovering}
                  className="button-primary inline-flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDiscovering ? 'Analyzing Profile & Discovery...' : 'Generate Career Recommendations'}</span>
                </button>
              </div>
            </div>

            {discoveryResults && (
              <div className="mt-8 pt-6 border-hairline" style={{ borderTopWidth: '1px' }}>
                <h3 className="type-body-bold" style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Discovery Recommendations</h3>
                <p className="type-caption" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{discoveryResults.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {discoveryResults.recommendedRoles?.map((rec: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg border-hairline" style={{ backgroundColor: 'var(--surface-secondary)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="type-caption font-bold" style={{ color: 'var(--text-primary)' }}>{rec.role}</h4>
                        <span
                          className="type-caption font-mono font-semibold px-2 py-0.5 rounded border-hairline"
                          style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)' }}
                        >
                          {rec.matchScore}%
                        </span>
                      </div>
                      <div className="type-mono-label space-y-2 mt-2" style={{ color: 'var(--text-secondary)' }}>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Strengths:</span>{' '}
                          {rec.strengths?.join(', ')}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Missing Skills:</span>{' '}
                          {rec.missingSkills?.join(', ')}
                        </div>
                        <div className="pt-2 font-medium" style={{ color: 'var(--text-primary)' }}>
                          Next Action: {rec.recommendedNextAction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          <div className="p-6 rounded-xl surface-elevated border-hairline">
            <div className="mb-6">
              <h2 className="type-heading-sm" style={{ color: 'var(--text-primary)' }}>Unified Career Timeline</h2>
              <p className="type-caption" style={{ color: 'var(--text-tertiary)', marginTop: '0.125rem' }}>
                Automatically updated from user actions, email events, applications, and micro-projects
              </p>
            </div>

            <div className="relative pl-6 border-hairline space-y-6" style={{ borderLeftWidth: '1px' }}>
              {timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <span
                    className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: 'var(--text-primary)', boxShadow: '0 0 0 4px var(--surface-primary)' }}
                  />
                  <div className="flex items-center gap-2 type-mono-label mb-1" style={{ color: 'var(--text-tertiary)' }}>
                    <span className="font-mono tabular-nums">{formatDate(evt.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{evt.source}</span>
                  </div>
                  <h4 className="type-caption font-semibold" style={{ color: 'var(--text-primary)' }}>{evt.title}</h4>
                  <p className="type-caption" style={{ color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
