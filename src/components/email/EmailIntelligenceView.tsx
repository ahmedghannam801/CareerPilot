import React, { useState } from 'react';
import {
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Clock,
  ArrowRight,
  Send,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { EmailEvent } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';

interface EmailIntelligenceViewProps {
  emailEvents: EmailEvent[];
  emailStatus: {
    connected: boolean;
    hasOAuthCredentials: boolean;
    missingRequirement: any;
  };
  onClassifyEmail: (data: {
    subject: string;
    sender: string;
    snippet: string;
  }) => Promise<any>;
  lang: 'en' | 'ar';
}

export const EmailIntelligenceView: React.FC<EmailIntelligenceViewProps> = ({
  emailEvents,
  emailStatus,
  onClassifyEmail,
  lang,
}) => {
  const [testSubject, setTestSubject] = useState(
    'Interview Confirmation: Senior AI Full-Stack Engineer at ScaleOps'
  );
  const [testSender, setTestSender] = useState('recruiting@scaleops.example.com');
  const [testSnippet, setTestSnippet] = useState(
    'Dear Mohamed, We would like to confirm your technical interview session for Thursday at 14:00 UTC with our lead architect. Please review the attached preparation guide.'
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any>(null);

  // Stats
  const interviewInvites = emailEvents.filter((e) => e.category === 'interview_invitation').length;
  const confirmations = emailEvents.filter((e) => e.category === 'application_confirmation').length;
  const assessments = emailEvents.filter((e) => e.category === 'assessment').length;

  const handleTestClassify = async () => {
    setIsClassifying(true);
    try {
      const res = await onClassifyEmail({
        subject: testSubject,
        sender: testSender,
        snippet: testSnippet,
      });
      setClassificationResult(res);
    } finally {
      setIsClassifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-neutral-200 rounded-xl">
        <div>
          <div className="text-xs text-neutral-500 mb-1">
            {lang === 'ar' ? 'ذكاء ومراقبة البريد المهني' : 'Career Inbox Intelligence'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {lang === 'ar' ? 'ذكاء البريد وتحديث الطلبات' : 'Email Intelligence Agent'}
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            Privacy-first monitoring: only processes career communications with human-in-the-loop validation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-neutral-600 bg-neutral-100 px-3 py-1.5 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-neutral-900" />
            <span>AI Classifier Active</span>
          </div>
        </div>
      </div>

      {/* Daily Career Brief Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-neutral-200 rounded-xl">
          <span className="text-[11px] text-neutral-500 block">Total Career Emails</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {emailEvents.length}
          </span>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-xl">
          <span className="text-[11px] text-neutral-500 block">Interview Invitations</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {interviewInvites}
          </span>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-xl">
          <span className="text-[11px] text-neutral-500 block">Receipt Confirmations</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {confirmations}
          </span>
        </div>
        <div className="p-4 bg-white border border-neutral-200 rounded-xl">
          <span className="text-[11px] text-neutral-500 block">Assessments Detected</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {assessments}
          </span>
        </div>
      </div>

      {/* MISSING REQUIREMENT CARD (Strict Rule 1 & Rule 6 Compliance) */}
      {!emailStatus.hasOAuthCredentials && emailStatus.missingRequirement && (
        <div className="p-6 bg-neutral-900 text-white rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
              NON-NEGOTIABLE RULE 1 & 6 COMPLIANCE REPORT
            </span>
          </div>

          <div className="border border-neutral-800 p-4 rounded-lg bg-neutral-950 font-mono text-xs space-y-2 text-neutral-300">
            <div className="text-white font-bold text-sm">MISSING REQUIREMENT</div>
            <div>
              <span className="text-neutral-500">Service: </span>
              {emailStatus.missingRequirement.service}
            </div>
            <div>
              <span className="text-neutral-500">Why it is required: </span>
              {emailStatus.missingRequirement.reason}
            </div>
            <div>
              <span className="text-neutral-500">Required account: </span>
              {emailStatus.missingRequirement.requiredAccount}
            </div>
            <div>
              <span className="text-neutral-500">Environment variables: </span>
              {emailStatus.missingRequirement.environmentVariables.join(', ')}
            </div>
            <div>
              <span className="text-neutral-500">OAuth scopes: </span>
              {emailStatus.missingRequirement.oauthScopes.join(', ')}
            </div>
            <div className="text-neutral-200 pt-1">
              <span className="text-neutral-500">Developer action required: </span>
              {emailStatus.missingRequirement.developerAction}
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            CareerPilot operates transparently. While external OAuth credentials are not attached, the multi-agent classification engine below is fully operational in live simulation mode.
          </p>
        </div>
      )}

      {/* Grid: Left Feed, Right Live Classifier Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Email Events Feed */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Career Email Event Stream</h2>
              <span className="text-xs text-neutral-500 font-mono tabular-nums">
                {emailEvents.length} events logged
              </span>
            </div>

            <div className="space-y-3">
              {emailEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors bg-white space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-900 truncate max-w-[280px]">
                      {evt.sender}
                    </span>
                    <span className="text-neutral-500 font-mono tabular-nums text-[11px]">
                      {formatDate(evt.date)}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-neutral-900">{evt.subject}</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">{evt.snippet}</p>

                  <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                      {evt.category.replace('_', ' ')}
                    </span>
                    {evt.detectedAction && (
                      <span className="text-neutral-900 font-medium truncate max-w-[260px]">
                        Action: {evt.detectedAction}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Email Classification Agent Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Live Email Classifier & Pipeline Updater
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Test incoming messages. The agent extracts company names, identifies priority, and updates tracked applications.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Sender</label>
                <input
                  type="text"
                  value={testSender}
                  onChange={(e) => setTestSender(e.target.value)}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Snippet / Body</label>
                <textarea
                  rows={4}
                  value={testSnippet}
                  onChange={(e) => setTestSnippet(e.target.value)}
                  className="w-full text-xs p-2.5 border border-neutral-300 rounded-lg outline-none"
                />
              </div>

              <button
                onClick={handleTestClassify}
                disabled={isClassifying}
                className="w-full py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isClassifying ? 'Classifying Email...' : 'Process with AI Agent'}</span>
              </button>
            </div>

            {classificationResult && (
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg text-xs space-y-2 mt-4">
                <span className="font-semibold text-neutral-900 block">Classification Output</span>
                <div className="space-y-1 text-neutral-700">
                  <div>
                    <span className="font-medium text-neutral-900">Category: </span>
                    {classificationResult.classification.category}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">Priority: </span>
                    {classificationResult.classification.priority}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">Detected Action: </span>
                    {classificationResult.classification.detectedAction}
                  </div>
                  <div>
                    <span className="font-medium text-neutral-900">Associated Company: </span>
                    {classificationResult.classification.relatedCompany || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
