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
  const readiness = profile.readiness;

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-neutral-200 rounded-xl">
        <div>
          <div className="text-xs text-neutral-500 mb-1">
            {lang === 'ar' ? 'نظام التحليل والاستكشاف' : 'Intelligence & Identity Engine'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {lang === 'ar' ? 'هويتي المهنية والجاهزية' : 'Career DNA & Readiness'}
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            Target Trajectory: <span className="font-semibold text-neutral-900">{profile.targetRole}</span>
          </p>
        </div>

        {/* Segmented controls (allowed for interactive filter/tabs) */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'roadmap' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {lang === 'ar' ? '🗺️ مساري المهني (Roadmap)' : '🗺️ Career Roadmap'}
          </button>
          <button
            onClick={() => setActiveTab('dna')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'dna' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Career DNA
          </button>
          <button
            onClick={() => setActiveTab('readiness')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'readiness' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Readiness ({readiness?.overallScore ?? 84}%)
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'skills' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Skills Matrix ({profile.skills.length})
          </button>
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'discovery' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Discovery Tool
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'timeline' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600 hover:text-neutral-900'
            }`}
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
          <div className="p-6 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Career Identity Synthesis</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Extracted from verified experience, credentials, and achievements
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLinkedInSync}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors inline-flex items-center gap-1.5"
                >
                  <span className="w-3.5 h-3.5 rounded bg-[#0077B5] text-white text-[9px] font-bold flex items-center justify-center">
                    in
                  </span>
                  <span>{lang === 'ar' ? 'مزامنة لينكدإن' : 'Sync LinkedIn'}</span>
                </button>
                <button
                  onClick={handleRegenerateDNA}
                  disabled={isRegeneratingDNA}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors inline-flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingDNA ? 'animate-spin' : ''}`} />
                  <span>{isRegeneratingDNA ? 'Synthesizing...' : 'Regenerate DNA'}</span>
                </button>
              </div>
            </div>

            {dna ? (
              <div className="space-y-6">
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mb-1">
                    EXECUTIVE SUMMARY
                  </div>
                  <p className="text-sm text-neutral-800 leading-relaxed font-normal">{dna.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block mb-1">
                      Current Seniority Level
                    </span>
                    <span className="text-base font-semibold text-neutral-900">{dna.currentLevel}</span>
                  </div>
                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block mb-1">
                      Primary Direction
                    </span>
                    <span className="text-base font-semibold text-neutral-900">{dna.primaryDirection}</span>
                  </div>
                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <span className="text-[11px] text-neutral-500 uppercase tracking-wider block mb-1">
                      Work Preference
                    </span>
                    <span className="text-base font-semibold text-neutral-900">
                      {dna.workPreferences.workModel} · {dna.workPreferences.teamStyle}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Verified Strengths */}
                  <div className="p-5 border border-neutral-200 rounded-lg">
                    <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
                      Core Competitive Strengths
                    </h3>
                    <ul className="space-y-2 text-xs text-neutral-700">
                      {dna.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-900 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Growth Areas */}
                  <div className="p-5 border border-neutral-200 rounded-lg">
                    <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
                      Targeted Growth & Weakness Areas
                    </h3>
                    <ul className="space-y-2 text-xs text-neutral-700">
                      {dna.weaknesses.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full shrink-0 mt-1.5" />
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-neutral-500">
                Career DNA is not yet generated. Click Regenerate to invoke the Career DNA Agent.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. READINESS TAB */}
      {activeTab === 'readiness' && readiness && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">8-Pillar Career Readiness Breakdown</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Calculated using transparent mathematical scoring weights, not arbitrary estimations
                </p>
              </div>
              <div className="text-3xl font-extrabold font-mono tabular-nums text-neutral-900">
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
                <div key={idx} className="p-4 border border-neutral-200 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-neutral-700">{item.label}</span>
                    <span className="text-sm font-bold font-mono tabular-nums text-neutral-900">
                      {item.val}%
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mb-2">
                    <div className="bg-neutral-900 h-full rounded-full" style={{ width: `${item.val}%` }} />
                  </div>
                  <span className="text-[11px] text-neutral-500">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-neutral-100">
              <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">
                Prioritized Improvement Actions
              </h3>
              <div className="space-y-3">
                {readiness.improvementActions.map((action) => (
                  <div
                    key={action.id}
                    className="p-3.5 bg-neutral-50 rounded-lg flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-neutral-900" />
                      <div>
                        <span className="font-semibold text-neutral-900">{action.title}</span>
                        <div className="text-neutral-500 text-[11px] mt-0.5">
                          Category: {action.category} · Impact: {action.impact} · Est. Effort: {action.estimatedHours}h
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-600 bg-white px-2 py-1 rounded border border-neutral-200">
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
          <div className="p-6 bg-white border border-neutral-200 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-neutral-900">Canonical Skills & Verified Evidence</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Every skill is canonicalized and tied to verifiable projects, assessments, or experience
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-medium">
                    <th className="py-2.5 px-3">Canonical Skill</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3">Evidence Items</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {profile.skills.map((skill) => (
                    <tr key={skill.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-neutral-900">{skill.canonicalName}</td>
                      <td className="py-3 px-3 text-neutral-600">{skill.category}</td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-neutral-800">{skill.level}</span>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-neutral-900 font-medium">
                        {skill.confidence}%
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono tabular-nums text-neutral-700">
                          {skill.evidenceCount} verified
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => setSelectedSkill(skill)}
                          className="text-xs text-neutral-900 font-medium hover:underline"
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
              <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-neutral-900">
                    Verified Evidence for {selectedSkill.canonicalName}
                  </h4>
                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    Close
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {selectedSkill.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-white border border-neutral-200 rounded-md flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900">{ev.title}</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          Type: {ev.type} · Date: {ev.date} {ev.score ? `· Score: ${ev.score}%` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
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
          <div className="p-6 bg-white border border-neutral-200 rounded-xl">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-neutral-900">Career Discovery Agent Wizard</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Answer meaningful behavioral questions to synthesize personalized high-potential career trajectories
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  1. What kind of engineering or product problems do you enjoy solving most?
                </label>
                <input
                  type="text"
                  value={discoveryAnswers.workStyle}
                  onChange={(e) =>
                    setDiscoveryAnswers({ ...discoveryAnswers, workStyle: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  2. Do you prefer high-frequency frontend UX, distributed backend systems, or AI modeling?
                </label>
                <input
                  type="text"
                  value={discoveryAnswers.focus}
                  onChange={(e) =>
                    setDiscoveryAnswers({ ...discoveryAnswers, focus: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  3. What team pace and collaboration structure fits you best?
                </label>
                <input
                  type="text"
                  value={discoveryAnswers.collaboration}
                  onChange={(e) =>
                    setDiscoveryAnswers({ ...discoveryAnswers, collaboration: e.target.value })
                  }
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg focus:ring-1 focus:ring-neutral-900 outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunDiscovery}
                  disabled={isDiscovering}
                  className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDiscovering ? 'Analyzing Profile & Discovery...' : 'Generate Career Recommendations'}</span>
                </button>
              </div>
            </div>

            {discoveryResults && (
              <div className="mt-8 pt-6 border-t border-neutral-200">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">Discovery Recommendations</h3>
                <p className="text-xs text-neutral-600 mb-4">{discoveryResults.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {discoveryResults.recommendedRoles?.map((rec: any, idx: number) => (
                    <div key={idx} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/50">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-xs font-bold text-neutral-900">{rec.role}</h4>
                        <span className="text-xs font-mono font-semibold text-neutral-900 bg-white px-2 py-0.5 rounded border border-neutral-200">
                          {rec.matchScore}%
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-600 space-y-2 mt-2">
                        <div>
                          <span className="font-semibold text-neutral-800">Strengths:</span>{' '}
                          {rec.strengths?.join(', ')}
                        </div>
                        <div>
                          <span className="font-semibold text-neutral-800">Missing Skills:</span>{' '}
                          {rec.missingSkills?.join(', ')}
                        </div>
                        <div className="pt-2 text-neutral-900 font-medium">
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
          <div className="p-6 bg-white border border-neutral-200 rounded-xl">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-neutral-900">Unified Career Timeline</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Automatically updated from user actions, email events, applications, and micro-projects
              </p>
            </div>

            <div className="relative pl-6 border-l border-neutral-200 space-y-6">
              {timeline.map((evt) => (
                <div key={evt.id} className="relative">
                  <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 bg-neutral-900 rounded-full ring-4 ring-white" />
                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-1">
                    <span className="font-mono tabular-nums">{formatDate(evt.date)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-semibold text-neutral-700">{evt.source}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-neutral-900">{evt.title}</h4>
                  <p className="text-xs text-neutral-600 mt-0.5">{evt.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
