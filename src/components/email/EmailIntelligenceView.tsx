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
  Filter,
  Check,
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
    id?: string;
  }) => Promise<any>;
  onMarkEmailRead?: (id: string) => void;
  lang: 'en' | 'ar';
}

export const EmailIntelligenceView: React.FC<EmailIntelligenceViewProps> = ({
  emailEvents,
  emailStatus,
  onClassifyEmail,
  onMarkEmailRead,
  lang,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(emailEvents[0]?.id || null);

  const [testSubject, setTestSubject] = useState(
    emailEvents[0]?.subject || 'Interview Confirmation: Senior AI Full-Stack Engineer at ScaleOps'
  );
  const [testSender, setTestSender] = useState(
    emailEvents[0]?.sender || 'recruiting@scaleops.example.com'
  );
  const [testSnippet, setTestSnippet] = useState(
    emailEvents[0]?.snippet ||
      'Dear Mohamed, We would like to confirm your technical interview session for Thursday at 14:00 UTC with our lead architect. Please review the attached preparation guide.'
  );
  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState<any>(null);

  // Stats
  const interviewInvites = emailEvents.filter((e) => e.category === 'interview_invitation').length;
  const confirmations = emailEvents.filter((e) => e.category === 'application_confirmation').length;
  const assessments = emailEvents.filter((e) => e.category === 'assessment').length;

  const currentSelected = emailEvents.find((e) => e.id === selectedEventId);
  const isSelectedProcessedOrRead = Boolean(
    currentSelected?.processed || currentSelected?.read || classificationResult
  );

  const handleSelectEvent = (evt: EmailEvent) => {
    setSelectedEventId(evt.id);
    setTestSubject(evt.subject);
    setTestSender(evt.sender);
    setTestSnippet(evt.snippet);
    setClassificationResult(null);
  };

  const handleTestClassify = async () => {
    setIsClassifying(true);
    try {
      const res = await onClassifyEmail({
        subject: testSubject,
        sender: testSender,
        snippet: testSnippet,
        id: selectedEventId || undefined,
      });
      setClassificationResult(res);
      if (selectedEventId && onMarkEmailRead) {
        onMarkEmailRead(selectedEventId);
      }
    } finally {
      setIsClassifying(false);
    }
  };

  const handleToggleRead = (evt: EmailEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkEmailRead) {
      onMarkEmailRead(evt.id);
    }
  };

  // Filtered stream by update category
  const filteredEvents = emailEvents.filter((evt) => {
    if (selectedCategory === 'all') return true;
    return evt.category === selectedCategory;
  });

  const categories = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All Updates', count: emailEvents.length },
    {
      id: 'interview_invitation',
      labelAr: 'دعوات المقابلات',
      labelEn: 'Interview Invitations',
      count: interviewInvites,
    },
    {
      id: 'application_confirmation',
      labelAr: 'تأكيدات التقديم',
      labelEn: 'Receipt Confirmations',
      count: confirmations,
    },
    {
      id: 'assessment',
      labelAr: 'التقييمات والاختبارات',
      labelEn: 'Assessments',
      count: assessments,
    },
    {
      id: 'recruiter_message',
      labelAr: 'رسائل التوظيف',
      labelEn: 'Recruiter Messages',
      count: emailEvents.filter((e) => e.category === 'recruiter_message').length,
    },
  ];

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

      {/* Daily Career Brief Stats — Clickable Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`p-4 rounded-xl text-start transition-all cursor-pointer border ${
            selectedCategory === 'all'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
          role="button"
          aria-pressed={selectedCategory === 'all'}
        >
          <span className="text-[11px] text-neutral-500 block">Total Career Emails</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {emailEvents.length}
          </span>
          <span className="text-[10px] text-blue-600 mt-1 font-medium block">
            {selectedCategory === 'all' ? '● Filtering active' : 'Click to show all'}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === 'interview_invitation' ? 'all' : 'interview_invitation')
          }
          className={`p-4 rounded-xl text-start transition-all cursor-pointer border ${
            selectedCategory === 'interview_invitation'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
          role="button"
          aria-pressed={selectedCategory === 'interview_invitation'}
        >
          <span className="text-[11px] text-neutral-500 block">Interview Invitations</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {interviewInvites}
          </span>
          <span className="text-[10px] text-blue-600 mt-1 font-medium block">
            {selectedCategory === 'interview_invitation' ? '● Filtering active' : 'Click to filter'}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedCategory(
              selectedCategory === 'application_confirmation' ? 'all' : 'application_confirmation'
            )
          }
          className={`p-4 rounded-xl text-start transition-all cursor-pointer border ${
            selectedCategory === 'application_confirmation'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
          role="button"
          aria-pressed={selectedCategory === 'application_confirmation'}
        >
          <span className="text-[11px] text-neutral-500 block">Receipt Confirmations</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {confirmations}
          </span>
          <span className="text-[10px] text-blue-600 mt-1 font-medium block">
            {selectedCategory === 'application_confirmation' ? '● Filtering active' : 'Click to filter'}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === 'assessment' ? 'all' : 'assessment')
          }
          className={`p-4 rounded-xl text-start transition-all cursor-pointer border ${
            selectedCategory === 'assessment'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-neutral-200 hover:border-neutral-300'
          }`}
          role="button"
          aria-pressed={selectedCategory === 'assessment'}
        >
          <span className="text-[11px] text-neutral-500 block">Assessments Detected</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-neutral-900 mt-1 block">
            {assessments}
          </span>
          <span className="text-[10px] text-blue-600 mt-1 font-medium block">
            {selectedCategory === 'assessment' ? '● Filtering active' : 'Click to filter'}
          </span>
        </button>
      </div>

      {/* MISSING REQUIREMENT CARD */}
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
        {/* Left: Email Events Feed with Category Chips Filter */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Career Email Event Stream</h2>
                <span className="text-xs text-neutral-500 font-mono tabular-nums">
                  Showing {filteredEvents.length} of {emailEvents.length} events
                </span>
              </div>

              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                >
                  {lang === 'ar' ? 'عرض الكل' : 'Clear Category Filter'}
                </button>
              )}
            </div>

            {/* Interactive Category Filter Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 pb-2 border-b border-neutral-100">
              <span className="text-[11px] text-neutral-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3" />
                <span>{lang === 'ar' ? 'الفلترة:' : 'Filter:'}</span>
              </span>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                const label = lang === 'ar' ? cat.labelAr : cat.labelEn;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-neutral-900 text-white font-bold shadow-xs'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    <span>{label}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Events List */}
            <div className="space-y-3">
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl space-y-2">
                  <p>
                    {lang === 'ar'
                      ? 'لا توجد رسائل مسجلة تحت هذا التصنيف حالياً.'
                      : 'No email events found under this category filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-neutral-900 font-semibold underline text-xs cursor-pointer"
                  >
                    {lang === 'ar' ? 'عرض جميع الرسائل' : 'Show all updates'}
                  </button>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const isSelected = selectedEventId === evt.id;
                  const isRead = Boolean(evt.read || evt.processed);

                  return (
                    <div
                      key={evt.id}
                      onClick={() => handleSelectEvent(evt)}
                      className={`p-4 border rounded-xl transition-all bg-white space-y-2 cursor-pointer ${
                        isSelected
                          ? 'border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 truncate">
                          {/* Read / Unread Indicator Badge */}
                          {isRead ? (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{lang === 'ar' ? 'مقروء' : 'Read'}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              <span>{lang === 'ar' ? 'جديد وغير مقروء' : 'Unread'}</span>
                            </span>
                          )}
                          <span className="font-semibold text-neutral-900 truncate">
                            {evt.sender}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-neutral-500 font-mono tabular-nums text-[11px]">
                            {formatDate(evt.date)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(evt, e)}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
                            title={isRead ? 'Mark as Unread' : 'Mark as Read'}
                          >
                            {isRead
                              ? lang === 'ar'
                                ? 'غير مقروء'
                                : 'Mark unread'
                              : lang === 'ar'
                              ? 'تحديد كمقروء'
                              : 'Mark as read'}
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-neutral-900">{evt.subject}</h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">{evt.snippet}</p>

                      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] gap-2">
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
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: Live Email Classification Agent Detail / Simulator */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Live Email Classifier & Pipeline Updater
                </h2>
                {isSelectedProcessedOrRead && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Read & Processed</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Inspect and process career updates with AI. Processing automatically correlates opportunities, marks items read, and decrements unread counts.
              </p>
            </div>

            {/* Prominent Read/Processed Banner */}
            {isSelectedProcessedOrRead && (
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {lang === 'ar'
                      ? 'تمت معالجة الرسالة وتصنيفها كمقروءة بنجاح'
                      : 'Processed with AI Agent & Marked as Read'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  {lang === 'ar'
                    ? 'تم تسجيل الحدث بنجاح وتحديث خط مسار التقديمات الخاص بك.'
                    : 'The event has been processed and your application timeline is up to date.'}
                </p>
              </div>
            )}

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

              {/* Action Buttons: Handle both first process and re-process */}
              {isSelectedProcessedOrRead ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg inline-flex items-center justify-center gap-2 opacity-90 cursor-default"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      {lang === 'ar'
                        ? 'تمت المعالجة بالذكاء الاصطناعي (مقروء)'
                        : 'Processed with AI Agent (Read)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestClassify}
                    disabled={isClassifying}
                    className="w-full py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isClassifying ? 'animate-spin' : ''}`} />
                    <span>{isClassifying ? 'Re-classifying...' : 'Re-process with AI Agent'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleTestClassify}
                  disabled={isClassifying}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isClassifying ? 'Classifying Email...' : 'Process with AI Agent'}</span>
                </button>
              )}
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
