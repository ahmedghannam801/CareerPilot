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
  onMarkEmailRead?: (id: string, explicitReadState?: boolean) => void;
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
      // Explicitly mark as read (never toggle back to unread)
      if (selectedEventId && onMarkEmailRead) {
        onMarkEmailRead(selectedEventId, true);
      }
    } finally {
      setIsClassifying(false);
    }
  };

  const handleToggleRead = (evt: EmailEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkEmailRead) {
      const isCurrentlyRead = Boolean(evt.read || evt.processed);
      onMarkEmailRead(evt.id, !isCurrentlyRead);
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
      <div
        className="surface-elevated border-hairline rounded-xl"
        style={{
          padding: 'var(--spacing-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <div>
            <div
              className="text-overline"
              style={{
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              {lang === 'ar' ? 'ذكاء ومراقبة البريد المهني' : 'Career Inbox Intelligence'}
            </div>
            <h1
              className="text-display-sm"
              style={{
                color: 'var(--text-primary)',
                fontWeight: 600,
              }}
            >
              {lang === 'ar' ? 'ذكاء البريد وتحديث الطلبات' : 'Email Intelligence Agent'}
            </h1>
            <p
              className="text-caption"
              style={{
                color: 'var(--text-secondary)',
                marginTop: 'var(--spacing-1)',
              }}
            >
              Privacy-first monitoring: only processes career communications with human-in-the-loop validation
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
            <div
              className="text-caption"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)',
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--surface-secondary)',
                padding: '6px var(--spacing-3)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--text-primary)',
                }}
              />
              <span>AI Classifier Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Career Brief Stats — Clickable Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className="border-hairline rounded-xl text-start transition-all cursor-pointer"
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: selectedCategory === 'all' ? 'var(--primary-50)' : 'var(--surface-primary)',
            borderColor: selectedCategory === 'all' ? 'var(--primary-500)' : 'var(--border-primary)',
            boxShadow: selectedCategory === 'all' ? '0 0 0 2px var(--primary-100)' : 'none',
          }}
          role="button"
          aria-pressed={selectedCategory === 'all'}
        >
          <span
            className="text-overline"
            style={{
              color: 'var(--text-secondary)',
              display: 'block',
            }}
          >
            Total Career Emails
          </span>
          <span
            className="text-display-sm font-mono tabular-nums"
            style={{
              color: 'var(--text-primary)',
              marginTop: 'var(--spacing-1)',
              display: 'block',
              fontWeight: 700,
            }}
          >
            {emailEvents.length}
          </span>
          <span
            className="text-caption"
            style={{
              color: 'var(--primary-600)',
              marginTop: 'var(--spacing-1)',
              fontWeight: 500,
              display: 'block',
            }}
          >
            {selectedCategory === 'all' ? '● Filtering active' : 'Click to show all'}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === 'interview_invitation' ? 'all' : 'interview_invitation')
          }
          className="border-hairline rounded-xl text-start transition-all cursor-pointer"
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: selectedCategory === 'interview_invitation' ? 'var(--primary-50)' : 'var(--surface-primary)',
            borderColor: selectedCategory === 'interview_invitation' ? 'var(--primary-500)' : 'var(--border-primary)',
            boxShadow: selectedCategory === 'interview_invitation' ? '0 0 0 2px var(--primary-100)' : 'none',
          }}
          role="button"
          aria-pressed={selectedCategory === 'interview_invitation'}
        >
          <span
            className="text-overline"
            style={{
              color: 'var(--text-secondary)',
              display: 'block',
            }}
          >
            Interview Invitations
          </span>
          <span
            className="text-display-sm font-mono tabular-nums"
            style={{
              color: 'var(--text-primary)',
              marginTop: 'var(--spacing-1)',
              display: 'block',
              fontWeight: 700,
            }}
          >
            {interviewInvites}
          </span>
          <span
            className="text-caption"
            style={{
              color: 'var(--primary-600)',
              marginTop: 'var(--spacing-1)',
              fontWeight: 500,
              display: 'block',
            }}
          >
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
          className="border-hairline rounded-xl text-start transition-all cursor-pointer"
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: selectedCategory === 'application_confirmation' ? 'var(--primary-50)' : 'var(--surface-primary)',
            borderColor: selectedCategory === 'application_confirmation' ? 'var(--primary-500)' : 'var(--border-primary)',
            boxShadow: selectedCategory === 'application_confirmation' ? '0 0 0 2px var(--primary-100)' : 'none',
          }}
          role="button"
          aria-pressed={selectedCategory === 'application_confirmation'}
        >
          <span
            className="text-overline"
            style={{
              color: 'var(--text-secondary)',
              display: 'block',
            }}
          >
            Receipt Confirmations
          </span>
          <span
            className="text-display-sm font-mono tabular-nums"
            style={{
              color: 'var(--text-primary)',
              marginTop: 'var(--spacing-1)',
              display: 'block',
              fontWeight: 700,
            }}
          >
            {confirmations}
          </span>
          <span
            className="text-caption"
            style={{
              color: 'var(--primary-600)',
              marginTop: 'var(--spacing-1)',
              fontWeight: 500,
              display: 'block',
            }}
          >
            {selectedCategory === 'application_confirmation' ? '● Filtering active' : 'Click to filter'}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedCategory(selectedCategory === 'assessment' ? 'all' : 'assessment')
          }
          className="border-hairline rounded-xl text-start transition-all cursor-pointer"
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: selectedCategory === 'assessment' ? 'var(--primary-50)' : 'var(--surface-primary)',
            borderColor: selectedCategory === 'assessment' ? 'var(--primary-500)' : 'var(--border-primary)',
            boxShadow: selectedCategory === 'assessment' ? '0 0 0 2px var(--primary-100)' : 'none',
          }}
          role="button"
          aria-pressed={selectedCategory === 'assessment'}
        >
          <span
            className="text-overline"
            style={{
              color: 'var(--text-secondary)',
              display: 'block',
            }}
          >
            Assessments Detected
          </span>
          <span
            className="text-display-sm font-mono tabular-nums"
            style={{
              color: 'var(--text-primary)',
              marginTop: 'var(--spacing-1)',
              display: 'block',
              fontWeight: 700,
            }}
          >
            {assessments}
          </span>
          <span
            className="text-caption"
            style={{
              color: 'var(--primary-600)',
              marginTop: 'var(--spacing-1)',
              fontWeight: 500,
              display: 'block',
            }}
          >
            {selectedCategory === 'assessment' ? '● Filtering active' : 'Click to filter'}
          </span>
        </button>
      </div>

      {/* MISSING REQUIREMENT CARD */}
      {!emailStatus.hasOAuthCredentials && emailStatus.missingRequirement && (
        <div
          className="rounded-xl"
          style={{
            padding: 'var(--spacing-6)',
            backgroundColor: 'var(--text-primary)',
            color: 'var(--surface-primary)',
          }}
        >
          <div style={{ marginBottom: 'var(--spacing-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
              <span
                className="text-overline font-mono"
                style={{
                  color: 'var(--neutral-400)',
                  letterSpacing: '0.1em',
                }}
              >
                NON-NEGOTIABLE RULE 1 & 6 COMPLIANCE REPORT
              </span>
            </div>
          </div>

          <div
            className="border-hairline rounded-lg font-mono text-caption"
            style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--neutral-950)',
              borderColor: 'var(--neutral-800)',
              color: 'var(--neutral-300)',
            }}
          >
            <div
              className="text-body-sm"
              style={{
                color: 'var(--surface-primary)',
                fontWeight: 700,
                marginBottom: 'var(--spacing-2)',
              }}
            >
              MISSING REQUIREMENT
            </div>
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              <span style={{ color: 'var(--neutral-500)' }}>Service: </span>
              {emailStatus.missingRequirement.service}
            </div>
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              <span style={{ color: 'var(--neutral-500)' }}>Why it is required: </span>
              {emailStatus.missingRequirement.reason}
            </div>
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              <span style={{ color: 'var(--neutral-500)' }}>Required account: </span>
              {emailStatus.missingRequirement.requiredAccount}
            </div>
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              <span style={{ color: 'var(--neutral-500)' }}>Environment variables: </span>
              {emailStatus.missingRequirement.environmentVariables.join(', ')}
            </div>
            <div style={{ marginBottom: 'var(--spacing-2)' }}>
              <span style={{ color: 'var(--neutral-500)' }}>OAuth scopes: </span>
              {emailStatus.missingRequirement.oauthScopes.join(', ')}
            </div>
            <div style={{ color: 'var(--neutral-200)', paddingTop: 'var(--spacing-1)' }}>
              <span style={{ color: 'var(--neutral-500)' }}>Developer action required: </span>
              {emailStatus.missingRequirement.developerAction}
            </div>
          </div>

          <p
            className="text-caption"
            style={{
              color: 'var(--neutral-400)',
              marginTop: 'var(--spacing-4)',
              lineHeight: 1.6,
            }}
          >
            CareerPilot operates transparently. While external OAuth credentials are not attached, the multi-agent classification engine below is fully operational in live simulation mode.
          </p>
        </div>
      )}

      {/* Grid: Left Feed, Right Live Classifier Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Email Events Feed with Category Chips Filter */}
        <div className="lg:col-span-7 space-y-4">
          <div
            className="surface-elevated border-hairline rounded-xl"
            style={{ padding: 'var(--spacing-6)' }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 'var(--spacing-2)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <div>
                <h2
                  className="text-body-sm"
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  Career Email Event Stream
                </h2>
                <span
                  className="text-caption font-mono tabular-nums"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Showing {filteredEvents.length} of {emailEvents.length} events
                </span>
              </div>

              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-caption cursor-pointer"
                  style={{
                    color: 'var(--primary-600)',
                    fontWeight: 500,
                    textDecoration: 'underline',
                  }}
                >
                  {lang === 'ar' ? 'عرض الكل' : 'Clear Category Filter'}
                </button>
              )}
            </div>

            {/* Interactive Category Filter Chips */}
            <div
              className="border-hairline"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                paddingTop: 'var(--spacing-1)',
                paddingBottom: 'var(--spacing-2)',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <span
                className="text-caption"
                style={{
                  color: 'var(--neutral-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-1)',
                  marginRight: 'var(--spacing-1)',
                }}
              >
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
                    className="text-caption rounded-lg transition-all cursor-pointer"
                    style={{
                      padding: '4px 10px',
                      fontWeight: isActive ? 700 : 500,
                      backgroundColor: isActive ? 'var(--text-primary)' : 'var(--surface-secondary)',
                      color: isActive ? 'var(--surface-primary)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{label}</span>
                    <span
                      className="text-caption"
                      style={{
                        padding: '0 4px',
                        borderRadius: '9999px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.2)' : 'var(--neutral-200)',
                        color: isActive ? 'var(--surface-primary)' : 'var(--text-secondary)',
                      }}
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
                <div
                  className="text-caption rounded-xl text-center"
                  style={{
                    padding: 'var(--spacing-8)',
                    color: 'var(--text-secondary)',
                    backgroundColor: 'var(--surface-secondary)',
                  }}
                >
                  <p style={{ marginBottom: 'var(--spacing-2)' }}>
                    {lang === 'ar'
                      ? 'لا توجد رسائل مسجلة تحت هذا التصنيف حالياً.'
                      : 'No email events found under this category filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className="text-caption cursor-pointer"
                    style={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      textDecoration: 'underline',
                    }}
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
                      className="border-hairline rounded-xl transition-all cursor-pointer"
                      style={{
                        padding: 'var(--spacing-4)',
                        backgroundColor: 'var(--surface-primary)',
                        borderColor: isSelected ? 'var(--text-primary)' : 'var(--border-primary)',
                        boxShadow: isSelected ? '0 0 0 2px var(--neutral-100)' : 'none',
                      }}
                    >
                      <div
                        className="text-caption"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--spacing-2)',
                          marginBottom: 'var(--spacing-2)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Read / Unread Indicator Badge */}
                          {isRead ? (
                            <span
                              className="text-caption border-hairline"
                              style={{
                                fontWeight: 600,
                                color: 'var(--success-700)',
                                backgroundColor: 'var(--success-50)',
                                borderColor: 'var(--success-200)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-1)',
                                flexShrink: 0,
                              }}
                            >
                              <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success-600)' }} />
                              <span>{lang === 'ar' ? 'مقروء' : 'Read'}</span>
                            </span>
                          ) : (
                            <span
                              className="text-caption border-hairline"
                              style={{
                                fontWeight: 700,
                                color: 'var(--primary-700)',
                                backgroundColor: 'var(--primary-50)',
                                borderColor: 'var(--primary-200)',
                                padding: '2px 8px',
                                borderRadius: '9999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-1)',
                                flexShrink: 0,
                              }}
                            >
                              <span
                                className="animate-pulse"
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  backgroundColor: 'var(--primary-600)',
                                }}
                              />
                              <span>{lang === 'ar' ? 'جديد وغير مقروء' : 'Unread'}</span>
                            </span>
                          )}
                          <span
                            style={{
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {evt.sender}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            className="text-caption font-mono tabular-nums"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {formatDate(evt.date)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleRead(evt, e)}
                            className="text-caption cursor-pointer"
                            style={{
                              color: 'var(--primary-600)',
                              fontWeight: 500,
                              textDecoration: 'underline',
                            }}
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

                      <h3
                        className="text-caption"
                        style={{
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-2)',
                        }}
                      >
                        {evt.subject}
                      </h3>
                      <p
                        className="text-caption"
                        style={{
                          color: 'var(--text-secondary)',
                          lineHeight: 1.6,
                          marginBottom: 'var(--spacing-2)',
                        }}
                      >
                        {evt.snippet}
                      </p>

                      <div
                        className="text-caption border-hairline"
                        style={{
                          paddingTop: 'var(--spacing-2)',
                          borderTop: '1px solid var(--border-secondary)',
                          borderLeft: 'none',
                          borderRight: 'none',
                          borderBottom: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 'var(--spacing-2)',
                        }}
                      >
                        <span
                          className="font-mono"
                          style={{
                            color: 'var(--text-secondary)',
                            backgroundColor: 'var(--surface-secondary)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {evt.category.replace('_', ' ')}
                        </span>
                        {evt.detectedAction && (
                          <span
                            style={{
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '260px',
                            }}
                          >
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
          <div
            className="surface-elevated border-hairline rounded-xl"
            style={{ padding: 'var(--spacing-6)' }}
          >
            <div style={{ marginBottom: 'var(--spacing-4)' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--spacing-1)',
                }}
              >
                <h2
                  className="text-body-sm"
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}
                >
                  Live Email Classifier & Pipeline Updater
                </h2>
                {isSelectedProcessedOrRead && (
                  <span
                    className="text-caption border-hairline"
                    style={{
                      fontWeight: 700,
                      color: 'var(--success-700)',
                      backgroundColor: 'var(--success-50)',
                      borderColor: 'var(--success-200)',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-1)',
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" style={{ color: 'var(--success-600)' }} />
                    <span>Read & Processed</span>
                  </span>
                )}
              </div>
              <p
                className="text-caption"
                style={{ color: 'var(--text-secondary)' }}
              >
                Inspect and process career updates with AI. Processing automatically correlates opportunities, marks items read, and decrements unread counts.
              </p>
            </div>

            {/* Prominent Read/Processed Banner */}
            {isSelectedProcessedOrRead && (
              <div
                className="text-caption border-hairline rounded-lg"
                style={{
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--success-50)',
                  borderColor: 'var(--success-200)',
                  color: 'var(--success-800)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 700,
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success-600)', flexShrink: 0 }} />
                  <span>
                    {lang === 'ar'
                      ? 'تمت معالجة الرسالة وتصنيفها كمقروءة بنجاح'
                      : 'Processed with AI Agent & Marked as Read'}
                  </span>
                </div>
                <p
                  className="text-caption"
                  style={{
                    color: 'var(--success-700)',
                    lineHeight: 1.5,
                  }}
                >
                  {lang === 'ar'
                    ? 'تم تسجيل الحدث بنجاح وتحديث خط مسار التقديمات الخاص بك.'
                    : 'The event has been processed and your application timeline is up to date.'}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label
                  className="text-caption"
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  Sender
                </label>
                <input
                  type="text"
                  value={testSender}
                  onChange={(e) => setTestSender(e.target.value)}
                  className="text-caption border-hairline rounded-lg"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2)',
                    outline: 'none',
                    backgroundColor: 'var(--surface-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label
                  className="text-caption"
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  Subject
                </label>
                <input
                  type="text"
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="text-caption border-hairline rounded-lg"
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-2)',
                    outline: 'none',
                    backgroundColor: 'var(--surface-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <label
                  className="text-caption"
                  style={{
                    display: 'block',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-1)',
                  }}
                >
                  Snippet / Body
                </label>
                <textarea
                  rows={4}
                  value={testSnippet}
                  onChange={(e) => setTestSnippet(e.target.value)}
                  className="text-caption border-hairline rounded-lg"
                  style={{
                    width: '100%',
                    padding: '10px',
                    outline: 'none',
                    backgroundColor: 'var(--surface-primary)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Action Buttons: Handle both first process and re-process */}
              {isSelectedProcessedOrRead ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled
                    className="text-caption border-hairline rounded-lg cursor-default"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontWeight: 700,
                      color: 'var(--success-700)',
                      backgroundColor: 'var(--success-50)',
                      borderColor: 'var(--success-300)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 'var(--spacing-2)',
                      opacity: 0.9,
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success-600)' }} />
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
                    className="text-caption rounded-lg transition-colors cursor-pointer"
                    style={{
                      width: '100%',
                      padding: '6px',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface-secondary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
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
                  className="text-caption rounded-lg transition-colors cursor-pointer"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontWeight: 600,
                    color: 'var(--surface-primary)',
                    backgroundColor: 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 'var(--spacing-2)',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    opacity: isClassifying ? 0.5 : 1,
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isClassifying ? 'Classifying Email...' : 'Process with AI Agent'}</span>
                </button>
              )}
            </div>

            {classificationResult && (
              <div
                className="text-caption border-hairline rounded-lg"
                style={{
                  padding: 'var(--spacing-4)',
                  backgroundColor: 'var(--surface-secondary)',
                  borderColor: 'var(--border-primary)',
                  marginTop: 'var(--spacing-4)',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    display: 'block',
                    marginBottom: 'var(--spacing-2)',
                  }}
                >
                  Classification Output
                </span>
                <div style={{ color: 'var(--text-secondary)' }}>
                  <div style={{ marginBottom: 'var(--spacing-1)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Category: </span>
                    {classificationResult.classification.category}
                  </div>
                  <div style={{ marginBottom: 'var(--spacing-1)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Priority: </span>
                    {classificationResult.classification.priority}
                  </div>
                  <div style={{ marginBottom: 'var(--spacing-1)' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Detected Action: </span>
                    {classificationResult.classification.detectedAction}
                  </div>
                  <div>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Associated Company: </span>
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
