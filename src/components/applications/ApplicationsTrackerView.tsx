import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  FileText,
  MessageSquare,
  ArrowRight,
  Plus,
  ExternalLink,
  Briefcase,
  Award,
  Filter,
  Check,
  Send,
} from 'lucide-react';
import { Application, Opportunity, ApplicationStatus, ResumeVersion, ApplicationAttachment } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';

interface ApplicationsTrackerViewProps {
  applications: Application[];
  opportunities: Opportunity[];
  resumes?: ResumeVersion[];
  onSaveApplication: (app: Partial<Application>) => Promise<void>;
  onGenerateCoverLetter: (opportunityId: string) => Promise<any>;
  onEvaluateQuality: (id: string) => Promise<any>;
  onNavigateToCV?: () => void;
  lang: 'en' | 'ar';
}

export const ApplicationsTrackerView: React.FC<ApplicationsTrackerViewProps> = ({
  applications,
  opportunities,
  resumes = [],
  onSaveApplication,
  onGenerateCoverLetter,
  onEvaluateQuality,
  onNavigateToCV,
  lang,
}) => {
  const [selectedApp, setSelectedApp] = useState<Application | null>(applications[0] || null);
  const [filterStage, setFilterStage] = useState<'ALL' | ApplicationStatus>('ALL');
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New application form state
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Applied');

  const isAr = lang === 'ar';

  // Restore new application draft from localStorage
  useEffect(() => {
    const draftKey = 'app_new_application_draft';
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setNewTitle(parsed.title);
        if (parsed.company) setNewCompany(parsed.company);
        if (parsed.status) setNewStatus(parsed.status);
      } catch (e) {
        console.warn('Failed to parse new application draft:', e);
      }
    }
  }, []);

  // Autosave new application draft with debounce
  useEffect(() => {
    if (!showAddModal) return;

    const timer = setTimeout(() => {
      const draftKey = 'app_new_application_draft';
      localStorage.setItem(draftKey, JSON.stringify({
        title: newTitle,
        company: newCompany,
        status: newStatus,
        lastSaved: new Date().toISOString()
      }));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [newTitle, newCompany, newStatus, showAddModal]);

  const totalApps = applications.length;
  const interviewsCount = applications.filter((a) => a.status === 'Interview').length;
  const offersCount = applications.filter((a) => a.status === 'Offer').length;
  const appliedCount = applications.filter((a) => a.status === 'Applied').length;

  const handleStatusChange = async (app: Application, newStatus: ApplicationStatus) => {
    const updated = {
      ...app,
      status: newStatus,
      events: [
        ...app.events,
        {
          id: `evt-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'STATUS_CHANGED',
          description: `Application moved to status: ${newStatus}`,
        },
      ],
    };
    await onSaveApplication(updated);
    if (selectedApp?.id === app.id) {
      setSelectedApp(updated);
    }
  };

  const handleGenerateCoverLetter = async () => {
    const current = effectiveSelectedApp || selectedApp;
    if (!current) return;
    setIsGeneratingLetter(true);
    try {
      const res = await onGenerateCoverLetter(current.opportunityId);
      const updated = {
        ...current,
        coverLetter: res.letter.body,
      };
      await onSaveApplication(updated);
      setSelectedApp(updated);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleRunQualityAudit = async () => {
    const current = effectiveSelectedApp || selectedApp;
    if (!current) return;
    setIsEvaluating(true);
    try {
      const res = await onEvaluateQuality(current.id);
      const updated = {
        ...current,
        qualityScore: res.quality.score,
        qualityFeedback: res.quality.feedback,
      };
      setSelectedApp(updated);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleAddNewApp = async () => {
    if (!newTitle.trim() || !newCompany.trim()) return;
    const newApp: Partial<Application> = {
      id: `app-${Date.now()}`,
      jobTitle: newTitle,
      company: newCompany,
      status: newStatus,
      appliedDate: new Date().toISOString().split('T')[0],
      events: [
        {
          id: `evt-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'APPLICATION_SUBMITTED',
          description: 'Manually logged application in CareerPilot.',
        },
      ],
    };
    await onSaveApplication(newApp);
    setShowAddModal(false);
    setNewTitle('');
    setNewCompany('');

    // Clear the draft from localStorage after successful save
    localStorage.removeItem('app_new_application_draft');
  };

  const filteredApps: Application[] = useMemo(() => {
    if (filterStage === 'ALL') return applications;
    return applications.filter(
      (a: Application) => a.status.trim().toLowerCase() === filterStage.trim().toLowerCase()
    );
  }, [applications, filterStage]);

  // Derived effective selection so detail pane never surfaces an out-of-stage application
  const effectiveSelectedApp: Application | null = useMemo(() => {
    if (!selectedApp) return filteredApps[0] || null;
    const stillVisible = filteredApps.find((a: Application) => a.id === selectedApp.id);
    return stillVisible ?? (filteredApps[0] || null);
  }, [filteredApps, selectedApp]);

  // Auto-sync selected app: if current selection is filtered out, pick first visible
  useEffect(() => {
    if (effectiveSelectedApp && effectiveSelectedApp.id !== selectedApp?.id) {
      setSelectedApp(effectiveSelectedApp);
    } else if (filteredApps.length === 0 && selectedApp !== null) {
      setSelectedApp(null);
    }
  }, [effectiveSelectedApp, filteredApps.length, selectedApp]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl shadow-2xs border-hairline surface-elevated"
      >
        <div>
          <div
            className="text-xs font-semibold mb-1"
            style={{ color: 'var(--color-primary)' }}
          >
            {isAr ? 'متابعة مسار التوظيف والفرص' : 'End-to-End Pipeline'}
          </div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {isAr ? 'متابعة وتجهيز طلبات التوظيف' : 'Applications Tracker & Preparation'}
          </h1>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {isAr
              ? 'تتبع طلباتك، مواعيد المقابلات، وتوليد خطابات التقديم المخصصة بضغطة زر'
              : 'Track applications from submission to offer with AI cover letters and interview prep'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
          style={{
            color: 'var(--color-text-inverse)',
            backgroundColor: 'var(--color-primary)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAr ? 'إضافة طلب جديد' : 'Add Application'}</span>
        </button>
      </div>

      {/* 4 Metric Summary Cards - Clickable to filter by stage */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setFilterStage('ALL')}
          className="p-4 text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer border-hairline surface-elevated"
          style={{
            ...(filterStage === 'ALL' && {
              borderColor: 'var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-alpha-20)',
            }),
          }}
        >
          <span
            className="text-[11px] font-bold block uppercase"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            {isAr ? 'إجمالي الطلبات' : 'Total Applications'}
          </span>
          <span
            className="text-2xl font-black font-mono mt-1 block"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {totalApps}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage('Applied')}
          className="p-4 text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer border-hairline surface-elevated"
          style={{
            ...(filterStage === 'Applied' && {
              borderColor: 'var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-alpha-20)',
            }),
          }}
        >
          <span
            className="text-[11px] font-bold block uppercase"
            style={{ color: 'var(--color-primary)' }}
          >
            {isAr ? 'تم التقديم' : 'Applied'}
          </span>
          <span
            className="text-2xl font-black font-mono mt-1 block"
            style={{ color: 'var(--color-primary)' }}
          >
            {appliedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage('Interview')}
          className="p-4 text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer border-hairline surface-elevated"
          style={{
            ...(filterStage === 'Interview' && {
              borderColor: 'var(--color-accent)',
              boxShadow: '0 0 0 2px var(--color-accent-alpha-20)',
            }),
          }}
        >
          <span
            className="text-[11px] font-bold block uppercase"
            style={{ color: 'var(--color-accent)' }}
          >
            {isAr ? 'مرحلة المقابلة' : 'Interviews'}
          </span>
          <span
            className="text-2xl font-black font-mono mt-1 block"
            style={{ color: 'var(--color-accent)' }}
          >
            {interviewsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage('Offer')}
          className="p-4 text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer border-hairline surface-elevated"
          style={{
            ...(filterStage === 'Offer' && {
              borderColor: 'var(--color-success)',
              boxShadow: '0 0 0 2px var(--color-success-alpha-20)',
            }),
          }}
        >
          <span
            className="text-[11px] font-bold block uppercase"
            style={{ color: 'var(--color-success)' }}
          >
            {isAr ? 'عروض العمل' : 'Offers Received'}
          </span>
          <span
            className="text-2xl font-black font-mono mt-1 block"
            style={{ color: 'var(--color-success)' }}
          >
            {offersCount}
          </span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex flex-wrap items-center gap-2 pb-2"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        {(['ALL', 'Saved', 'Preparing', 'Applied', 'Interview', 'Offer'] as (ApplicationStatus | 'ALL')[]).map(
          (stage) => {
            const count = stage === 'ALL'
              ? applications.length
              : applications.filter((a) => a.status === stage).length;

            return (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border-hairline"
                style={{
                  ...(filterStage === stage
                    ? {
                        backgroundColor: 'var(--color-primary)',
                        color: 'var(--color-text-inverse)',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                        borderColor: 'transparent',
                      }
                    : {
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-secondary)',
                        borderColor: 'var(--color-border)',
                      }),
                }}
                onMouseEnter={(e) => {
                  if (filterStage !== stage) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (filterStage !== stage) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  }
                }}
              >
                <span>
                  {stage === 'ALL'
                    ? isAr ? 'الكل' : 'All'
                    : stage === 'Saved'
                    ? isAr ? 'محفوظة' : 'Saved'
                    : stage === 'Preparing'
                    ? isAr ? 'قيد التجهيز' : 'Preparing'
                    : stage === 'Applied'
                    ? isAr ? 'تم التقديم' : 'Applied'
                    : stage === 'Interview'
                    ? isAr ? 'مقابلة' : 'Interview'
                    : isAr ? 'عرض عمل' : 'Offer'}
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 rounded-full"
                  style={{
                    ...(filterStage === stage
                      ? { backgroundColor: 'rgba(255, 255, 255, 0.2)' }
                      : { backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text-secondary)' }),
                  }}
                >
                  {count}
                </span>
              </button>
            );
          }
        )}
      </div>

      {/* Main Grid: Left Applications List, Right Detail & Preparation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Applications */}
        <div className="lg:col-span-5 space-y-3">
          {filteredApps.length === 0 ? (
            <div
              className="p-8 text-center text-xs rounded-2xl border-hairline surface-elevated"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {isAr ? 'لا توجد طلبات في هذه المرحلة.' : 'No applications in this stage.'}
            </div>
          ) : (
            filteredApps.map((app) => {
              const isSelected = effectiveSelectedApp?.id === app.id;
              const matchedOpp = opportunities.find((o) => o.id === app.opportunityId);

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="p-4 rounded-2xl transition-all cursor-pointer space-y-2.5 border-hairline"
                  style={{
                    ...(isSelected
                      ? {
                          borderColor: 'var(--color-primary)',
                          backgroundColor: 'var(--color-primary-alpha-5)',
                          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }
                      : {
                          backgroundColor: 'var(--color-surface)',
                          borderColor: 'var(--color-border)',
                        }),
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--color-border)';
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3
                        className="text-xs font-bold truncate"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {app.jobTitle}
                      </h3>
                      <div
                        className="text-[11px] font-medium"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        {app.company}
                      </div>
                    </div>

                    {/* Status Changer Dropdown */}
                    <select
                      value={app.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                      className="text-[11px] py-1 px-2 rounded-lg font-bold outline-none cursor-pointer border-hairline"
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-text-primary)',
                        borderColor: 'var(--color-border)',
                      }}
                    >
                      <option value="Saved">{isAr ? '📌 محفوظة' : 'Saved'}</option>
                      <option value="Preparing">{isAr ? '⚙️ قيد التجهيز' : 'Preparing'}</option>
                      <option value="Applied">{isAr ? '📤 تم التقديم' : 'Applied'}</option>
                      <option value="Interview">{isAr ? '🎙️ مقابلة' : 'Interview'}</option>
                      <option value="Offer">{isAr ? '🎉 عرض عمل' : 'Offer'}</option>
                      <option value="Rejected">{isAr ? '❌ اعتذار' : 'Rejected'}</option>
                    </select>
                  </div>

                  <div
                    className="flex items-center justify-between text-[11px] pt-1"
                    style={{
                      borderTop: '1px solid var(--color-border-subtle)',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    <span>{app.appliedDate || formatDate(new Date().toISOString())}</span>
                    {matchedOpp?.sourceUrl && (
                      <a
                        href={matchedOpp.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold hover:underline inline-flex items-center gap-1"
                        style={{ color: 'var(--color-primary)' }}
                      >
                        <span>{isAr ? 'رابط الوظيفة' : 'Job Link'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Application Preparation Console */}
        <div className="lg:col-span-7 space-y-6">
          {effectiveSelectedApp ? (
            <div className="p-6 rounded-2xl space-y-6 shadow-2xs border-hairline surface-elevated">
              <div
                className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
              >
                <div>
                  <span
                    className="text-[11px] font-bold block uppercase"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {effectiveSelectedApp.status}
                  </span>
                  <h2
                    className="text-base font-bold"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {effectiveSelectedApp.jobTitle}
                  </h2>
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {effectiveSelectedApp.company}
                  </span>
                </div>

              </div>

              {/* Attached CV Section */}
              <div
                className="p-3.5 rounded-xl space-y-2 border-hairline"
                style={{ backgroundColor: 'var(--color-surface-secondary)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    <span
                      className="text-xs font-bold"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {isAr ? 'نسخة السيرة الذاتية المرفقة بالطلب:' : 'Attached CV Version:'}
                    </span>
                  </div>
                  {onNavigateToCV && (
                    <button
                      type="button"
                      onClick={onNavigateToCV}
                      className="text-[11px] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      <span>{isAr ? 'فتح في استوديو السيرة' : 'Open in CV Studio'}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={effectiveSelectedApp.tailoredResumeId || resumes.find((r) => r.isMaster)?.id || resumes[0]?.id || ''}
                    onChange={async (e) => {
                      const newResumeId = e.target.value;
                      const updated = { ...effectiveSelectedApp, tailoredResumeId: newResumeId };
                      await onSaveApplication(updated);
                      setSelectedApp(updated);
                    }}
                    className="w-full sm:flex-1 text-xs py-2 px-3 rounded-lg font-semibold outline-none cursor-pointer border-hairline"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      color: 'var(--color-text-primary)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} {r.isMaster ? (isAr ? '(النسخة الرئيسية)' : '(Master)') : ''} (ATS: {r.atsScore || 90}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supporting Materials File Upload */}
                <div
                  className="mt-2 pt-2 space-y-1.5"
                  style={{ borderTop: '1px solid var(--color-border-subtle)' }}
                >
                  <span
                    className="text-[11px] font-semibold block"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {isAr ? 'مرفقات ومواد داعمة:' : 'Supporting Materials:'}
                  </span>
                  <label
                    htmlFor={`app-file-upload-${effectiveSelectedApp.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg cursor-pointer transition-colors w-fit border-hairline"
                    style={{
                      color: 'var(--color-primary)',
                      backgroundColor: 'var(--color-primary-alpha-5)',
                      borderColor: 'var(--color-primary-alpha-20)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-alpha-10)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-alpha-5)'}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isAr ? 'رفع ملف مرفق (PDF، DOCX، TXT)' : 'Attach File (PDF, DOCX, TXT)'}</span>
                    <input
                      id={`app-file-upload-${effectiveSelectedApp.id}`}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const dataUrl = typeof reader.result === 'string' ? reader.result : '';
                          const newAtt: ApplicationAttachment = {
                            id: `att-${Date.now()}`,
                            fileName: file.name,
                            fileType: file.type || file.name.split('.').pop() || 'document',
                            fileSizeBytes: file.size,
                            uploadedAt: new Date().toISOString(),
                            dataUrl,
                          };
                          const existingAttachments = effectiveSelectedApp.attachments || [];
                          const updated = {
                            ...effectiveSelectedApp,
                            attachments: [...existingAttachments, newAtt],
                          };
                          await onSaveApplication(updated);
                          setSelectedApp(updated);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {effectiveSelectedApp.attachments && effectiveSelectedApp.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {effectiveSelectedApp.attachments.map((att: string | ApplicationAttachment, idx: number) => {
                        const isObj = typeof att === 'object' && att !== null;
                        const fileName = isObj ? att.fileName : String(att);
                        const dataUrl = isObj ? att.dataUrl : undefined;

                        return (
                          <div
                            key={isObj ? att.id : idx}
                            className="text-[11px] px-2 py-1 rounded-lg font-mono inline-flex items-center gap-1.5 shadow-2xs border-hairline"
                            style={{
                              backgroundColor: 'var(--color-surface)',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            <FileText className="w-3 h-3 shrink-0" style={{ color: 'var(--color-primary)' }} />
                            {dataUrl ? (
                              <a
                                href={dataUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline max-w-[150px] truncate font-medium"
                                style={{ color: 'var(--color-primary)' }}
                                title={isAr ? 'فتح أو تحميل الملف المرفق' : 'Reopen / Download file'}
                              >
                                {fileName}
                              </a>
                            ) : (
                              <span className="max-w-[150px] truncate">{fileName}</span>
                            )}
                            <button
                              type="button"
                              onClick={async () => {
                                const filtered = (effectiveSelectedApp.attachments || []).filter((_, i) => i !== idx);
                                const updated = { ...effectiveSelectedApp, attachments: filtered };
                                await onSaveApplication(updated);
                                setSelectedApp(updated);
                              }}
                              className="ml-0.5 text-xs font-bold cursor-pointer"
                              style={{ color: 'var(--color-text-tertiary)' }}
                              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-error)'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-tertiary)'}
                              title={isAr ? 'حذف المرفق' : 'Remove attachment'}
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Cover Letter Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {isAr ? 'خطاب التقديم (Cover Letter):' : 'Cover Letter:'}
                  </h3>
                </div>

                {effectiveSelectedApp.coverLetter ? (
                  <div
                    className="p-4 rounded-xl text-xs leading-relaxed font-sans whitespace-pre-wrap border-hairline"
                    style={{
                      backgroundColor: 'var(--color-surface-secondary)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {effectiveSelectedApp.coverLetter}
                  </div>
                ) : (
                  <div
                    className="p-6 text-center text-xs rounded-xl border space-y-2"
                    style={{
                      backgroundColor: 'var(--color-surface-secondary)',
                      borderColor: 'var(--color-border)',
                      borderStyle: 'dashed',
                      color: 'var(--color-text-tertiary)',
                    }}
                  >
                    <p>{isAr ? 'لم يتم توليد خطاب تقديم بعد لهذا الطلب.' : 'No cover letter generated yet.'}</p>
                    <button
                      type="button"
                      onClick={handleGenerateCoverLetter}
                      className="text-xs font-bold hover:underline cursor-pointer"
                      style={{ color: 'var(--color-primary)' }}
                    >
                      {isAr ? 'توليد خطاب تقديم مخصص بالذكاء الاصطناعي الآن' : 'Generate with AI'}
                    </button>
                  </div>
                )}
              </div>

              {/* Application Timeline Events */}
              <div className="space-y-3 pt-2">
                <h3
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {isAr ? 'سجل أحداث وتحديثات الطلب:' : 'Application Timeline:'}
                </h3>
                <div className="space-y-2">
                  {effectiveSelectedApp.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-xl text-xs flex items-start gap-2.5 border-hairline"
                      style={{ backgroundColor: 'var(--color-surface-secondary)' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
                      <div>
                        <span
                          className="font-bold"
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {evt.description}
                        </span>
                        <span
                          className="text-[10px] block mt-0.5"
                          style={{ color: 'var(--color-text-tertiary)' }}
                        >
                          {evt.date}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="p-12 text-center text-xs rounded-2xl border-hairline surface-elevated"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {isAr ? 'اختر طلباً من القائمة لعرض تفاصيله' : 'Select an application from the list.'}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="p-5 shrink-0"
              style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
            >
              <h3
                className="text-base font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {isAr ? 'إضافة طلب توظيف للمتابعة' : 'Add New Application'}
              </h3>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div>
                <label
                  className="text-xs font-bold block mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {isAr ? 'المسمى الوظيفي:' : 'Job Title:'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full text-xs p-2.5 rounded-xl outline-none border-hairline"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                />
              </div>

              <div>
                <label
                  className="text-xs font-bold block mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {isAr ? 'اسم الشركة:' : 'Company Name:'}
                </label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Microsoft / Remote Startup"
                  className="w-full text-xs p-2.5 rounded-xl outline-none border-hairline"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                  }}
                />
              </div>

              <div>
                <label
                  className="text-xs font-bold block mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {isAr ? 'حالة الطلب الحالية:' : 'Current Status:'}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                  className="w-full text-xs p-2.5 rounded-xl outline-none cursor-pointer font-bold border-hairline"
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <option value="Applied">{isAr ? 'تم التقديم (Applied)' : 'Applied'}</option>
                  <option value="Interview">{isAr ? 'مقابلة (Interview)' : 'Interview'}</option>
                  <option value="Saved">{isAr ? 'محفوظة (Saved)' : 'Saved'}</option>
                  <option value="Offer">{isAr ? 'عرض عمل (Offer)' : 'Offer'}</option>
                </select>
              </div>
            </div>

            {/* Sticky footer */}
            <div
              className="shrink-0 p-4 flex justify-end gap-2"
              style={{
                borderTop: '1px solid var(--color-border-subtle)',
                backgroundColor: 'var(--color-surface-secondary)',
              }}
            >
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold cursor-pointer"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddNewApp}
                disabled={!newTitle.trim() || !newCompany.trim()}
                className="px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-40"
                style={{
                  color: 'var(--color-text-inverse)',
                  backgroundColor: 'var(--color-primary)',
                }}
                onMouseEnter={(e) => {
                  if (newTitle.trim() && newCompany.trim()) {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
                  }
                }}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                {isAr ? 'حفظ الطلب' : 'Save Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
