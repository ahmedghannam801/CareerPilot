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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1">
            {isAr ? 'متابعة مسار التوظيف والفرص' : 'End-to-End Pipeline'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAr ? 'متابعة وتجهيز طلبات التوظيف' : 'Applications Tracker & Preparation'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'تتبع طلباتك، مواعيد المقابلات، وتوليد خطابات التقديم المخصصة بضغطة زر'
              : 'Track applications from submission to offer with AI cover letters and interview prep'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
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
          className={`p-4 bg-white border text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer ${
            filterStage === 'ALL'
              ? 'border-blue-600 ring-2 ring-blue-500/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-slate-500 block uppercase">
            {isAr ? 'إجمالي الطلبات' : 'Total Applications'}
          </span>
          <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">
            {totalApps}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage('Applied')}
          className={`p-4 bg-white border text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer ${
            filterStage === 'Applied'
              ? 'border-blue-600 ring-2 ring-blue-500/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-blue-600 block uppercase">
            {isAr ? 'تم التقديم' : 'Applied'}
          </span>
          <span className="text-2xl font-black font-mono text-blue-600 mt-1 block">
            {appliedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage('Interview')}
          className={`p-4 bg-white border text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer ${
            filterStage === 'Interview'
              ? 'border-indigo-600 ring-2 ring-indigo-500/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-indigo-600 block uppercase">
            {isAr ? 'مرحلة المقابلة' : 'Interviews'}
          </span>
          <span className="text-2xl font-black font-mono text-indigo-600 mt-1 block">
            {interviewsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStage('Offer')}
          className={`p-4 bg-white border text-left rtl:text-right rounded-2xl shadow-2xs transition-all cursor-pointer ${
            filterStage === 'Offer'
              ? 'border-emerald-600 ring-2 ring-emerald-500/20'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold text-emerald-600 block uppercase">
            {isAr ? 'عروض العمل' : 'Offers Received'}
          </span>
          <span className="text-2xl font-black font-mono text-emerald-600 mt-1 block">
            {offersCount}
          </span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {(['ALL', 'Saved', 'Preparing', 'Applied', 'Interview', 'Offer'] as (ApplicationStatus | 'ALL')[]).map(
          (stage) => {
            const count = stage === 'ALL'
              ? applications.length
              : applications.filter((a) => a.status === stage).length;

            return (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterStage === stage
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
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
                <span className={`text-[10px] font-mono px-1.5 rounded-full ${filterStage === stage ? 'bg-white/20' : 'bg-slate-100 text-slate-700'}`}>
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
            <div className="p-8 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
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
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                      : 'border-slate-200/80 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{app.jobTitle}</h3>
                      <div className="text-[11px] text-slate-500 font-medium">{app.company}</div>
                    </div>

                    {/* Status Changer Dropdown */}
                    <select
                      value={app.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(app, e.target.value as ApplicationStatus)}
                      className="text-[11px] py-1 px-2 rounded-lg font-bold border border-slate-200 bg-white text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="Saved">{isAr ? '📌 محفوظة' : 'Saved'}</option>
                      <option value="Preparing">{isAr ? '⚙️ قيد التجهيز' : 'Preparing'}</option>
                      <option value="Applied">{isAr ? '📤 تم التقديم' : 'Applied'}</option>
                      <option value="Interview">{isAr ? '🎙️ مقابلة' : 'Interview'}</option>
                      <option value="Offer">{isAr ? '🎉 عرض عمل' : 'Offer'}</option>
                      <option value="Rejected">{isAr ? '❌ اعتذار' : 'Rejected'}</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                    <span>{app.appliedDate || formatDate(new Date().toISOString())}</span>
                    {matchedOpp?.sourceUrl && (
                      <a
                        href={matchedOpp.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
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
            <div className="p-6 bg-white border border-slate-200/80 rounded-2xl space-y-6 shadow-2xs">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 block uppercase">
                    {effectiveSelectedApp.status}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{effectiveSelectedApp.jobTitle}</h2>
                  <span className="text-xs text-slate-500 font-medium">{effectiveSelectedApp.company}</span>
                </div>

              </div>

              {/* Attached CV Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      {isAr ? 'نسخة السيرة الذاتية المرفقة بالطلب:' : 'Attached CV Version:'}
                    </span>
                  </div>
                  {onNavigateToCV && (
                    <button
                      type="button"
                      onClick={onNavigateToCV}
                      className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
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
                    className="w-full sm:flex-1 text-xs py-2 px-3 border border-slate-300 rounded-lg bg-white text-slate-800 font-semibold outline-none cursor-pointer"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} {r.isMaster ? (isAr ? '(النسخة الرئيسية)' : '(Master)') : ''} (ATS: {r.atsScore || 90}%)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Supporting Materials File Upload */}
                <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    {isAr ? 'مرفقات ومواد داعمة:' : 'Supporting Materials:'}
                  </span>
                  <label
                    htmlFor={`app-file-upload-${effectiveSelectedApp.id}`}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors w-fit"
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
                            className="text-[11px] px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-slate-700 inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <FileText className="w-3 h-3 text-blue-500 shrink-0" />
                            {dataUrl ? (
                              <a
                                href={dataUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline max-w-[150px] truncate font-medium"
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
                              className="text-slate-400 hover:text-red-500 ml-0.5 text-xs font-bold cursor-pointer"
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
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isAr ? 'خطاب التقديم (Cover Letter):' : 'Cover Letter:'}
                  </h3>
                </div>

                {effectiveSelectedApp.coverLetter ? (
                  <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                    {effectiveSelectedApp.coverLetter}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <p>{isAr ? 'لم يتم توليد خطاب تقديم بعد لهذا الطلب.' : 'No cover letter generated yet.'}</p>
                    <button
                      type="button"
                      onClick={handleGenerateCoverLetter}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {isAr ? 'توليد خطاب تقديم مخصص بالذكاء الاصطناعي الآن' : 'Generate with AI'}
                    </button>
                  </div>
                )}
              </div>

              {/* Application Timeline Events */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {isAr ? 'سجل أحداث وتحديثات الطلب:' : 'Application Timeline:'}
                </h3>
                <div className="space-y-2">
                  {effectiveSelectedApp.events.map((evt) => (
                    <div key={evt.id} className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-200/60 flex items-start gap-2.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">{evt.description}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{evt.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-2xl">
              {isAr ? 'اختر طلباً من القائمة لعرض تفاصيله' : 'Select an application from the list.'}
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 shrink-0">
              <h3 className="text-base font-bold text-slate-900">
                {isAr ? 'إضافة طلب توظيف للمتابعة' : 'Add New Application'}
              </h3>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'المسمى الوظيفي:' : 'Job Title:'}
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'اسم الشركة:' : 'Company Name:'}
                </label>
                <input
                  type="text"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  placeholder="e.g. Microsoft / Remote Startup"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {isAr ? 'حالة الطلب الحالية:' : 'Current Status:'}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none bg-white cursor-pointer font-bold"
                >
                  <option value="Applied">{isAr ? 'تم التقديم (Applied)' : 'Applied'}</option>
                  <option value="Interview">{isAr ? 'مقابلة (Interview)' : 'Interview'}</option>
                  <option value="Saved">{isAr ? 'محفوظة (Saved)' : 'Saved'}</option>
                  <option value="Offer">{isAr ? 'عرض عمل (Offer)' : 'Offer'}</option>
                </select>
              </div>
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAddNewApp}
                disabled={!newTitle.trim() || !newCompany.trim()}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-40"
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
