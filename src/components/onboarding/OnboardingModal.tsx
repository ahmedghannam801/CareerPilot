import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { CareerProfile, CareerStatus } from '../../types/index.js';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: Partial<CareerProfile>) => Promise<void>;
  lang: 'en' | 'ar';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  lang,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: 'Mohamed Ghnnam',
    careerStatus: 'experienced_professional' as CareerStatus,
    targetRole: 'Senior Full-Stack AI Engineer',
    targetSalary: '$130,000 - $160,000',
    topSkills: 'TypeScript, React, Node.js, PostgreSQL, AI Agents',
    interests: 'Distributed systems, Generative AI agent orchestration, Developer tooling',
    workModel: 'Remote',
    teamStyle: 'Collaborative',
  });

  if (!isOpen) return null;

  const totalSteps = 4;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setIsSubmitting(true);
      try {
        const skillsArray = formData.topSkills.split(',').map((s, i) => ({
          id: `sk-onb-${i}`,
          canonicalName: s.trim(),
          category: 'Technical' as const,
          level: 'Advanced' as const,
          confidence: 85,
          evidenceCount: 1,
          lastAssessed: new Date().toISOString().split('T')[0],
          evidence: [
            {
              id: `ev-onb-${i}`,
              skillName: s.trim(),
              type: 'experience' as const,
              title: 'Self-reported in AI onboarding',
              date: new Date().toISOString().split('T')[0],
              verified: true,
            },
          ],
        }));

        await onComplete({
          fullName: formData.fullName,
          careerStatus: formData.careerStatus,
          targetRole: formData.targetRole,
          targetSalary: formData.targetSalary,
          skills: skillsArray,
          onboardingCompleted: true,
        });
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CareerPilot AI" className="w-6 h-6 rounded object-contain" />
            <h3 className="text-sm font-bold text-neutral-900">
              CareerPilot AI Progressive Onboarding
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>
            Step {step} of {totalSteps}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-6 h-1 rounded-full ${
                  i <= step ? 'bg-neutral-900' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Identity & Status */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Professional Stage</label>
              <select
                value={formData.careerStatus}
                onChange={(e) => setFormData({ ...formData, careerStatus: e.target.value as any })}
                className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none bg-white"
              >
                <option value="student">Student</option>
                <option value="fresh_graduate">Fresh Graduate</option>
                <option value="experienced_professional">Experienced Professional</option>
                <option value="career_changer">Career Changer</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Target Trajectory */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Target Primary Role</label>
              <input
                type="text"
                value={formData.targetRole}
                onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                placeholder="e.g. Senior Full-Stack AI Engineer, Data Scientist..."
                className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Target Compensation Range
              </label>
              <input
                type="text"
                value={formData.targetSalary}
                onChange={(e) => setFormData({ ...formData, targetSalary: e.target.value })}
                placeholder="e.g. $130,000 - $160,000"
                className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Skills & Domain Competencies */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Core Technical Skills (comma separated)
              </label>
              <input
                type="text"
                value={formData.topSkills}
                onChange={(e) => setFormData({ ...formData, topSkills: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Engineering Domains & Interests
              </label>
              <textarea
                rows={3}
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Work Preferences */}
        {step === 4 && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">
                Preferred Work Model
              </label>
              <select
                value={formData.workModel}
                onChange={(e) => setFormData({ ...formData, workModel: e.target.value })}
                className="w-full p-2.5 border border-neutral-300 rounded-lg outline-none bg-white"
              >
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="On-site">On-site</option>
              </select>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg text-neutral-600">
              Upon completion, the AI Career Readiness and Career DNA engines will automatically synthesize your personalized operating dashboard.
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>{step === totalSteps ? (isSubmitting ? 'Synthesizing...' : 'Complete & Generate DNA') : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
