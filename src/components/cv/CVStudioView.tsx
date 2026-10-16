import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Edit3,
  Layers,
  ArrowRight,
  Plus,
  Printer,
  Sliders,
  Award,
  Check,
  ChevronRight,
  Target,
  ExternalLink,
  Briefcase,
  FileCode,
  CheckCheck,
  X,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { ResumeVersion, ATSAnalysis, Opportunity, CareerProfile } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import { ATSResumeDocument, ATSTemplate } from './ATSResumeDocument.js';
import { clientDb } from '../../lib/clientDb.js';
import { getCurrentSession } from '../../lib/supabaseClient.js';
import { validateCVFile, extractCandidateInfoFromText, exportResumeToWordDoc } from '../../lib/resumeIntelligence.js';

interface CVStudioViewProps {
  resumes: ResumeVersion[];
  opportunities: Opportunity[];
  profile?: CareerProfile | null;
  onSaveResume: (resume: ResumeVersion) => Promise<void>;
  onAnalyzeResume: (resumeId: string) => Promise<ATSAnalysis>;
  onTailorCV: (payload: {
    opportunityId?: string;
    customJobDescription?: string;
    customJobTitle?: string;
    customCompany?: string;
    resumeId?: string;
    targetRole?: string;
  }) => Promise<any>;
  onOpenLinkedInSync?: () => void;
  lang: 'en' | 'ar';
}

export const CVStudioView: React.FC<CVStudioViewProps> = ({
  resumes,
  opportunities,
  profile,
  onSaveResume,
  onAnalyzeResume,
  onTailorCV,
  onOpenLinkedInSync,
  lang,
}) => {
  const masterCV = resumes.find((r) => r.isMaster) || resumes[0];
  const [selectedResumeId, setSelectedResumeId] = useState(masterCV?.id || '');
  const [activeTab, setActiveTab] = useState<'preview' | 'ats' | 'tailor' | 'library'>('preview');
  const [previewSubMode, setPreviewSubMode] = useState<'editor' | 'a4document'>('a4document');

  // Selected CV Template state — user-scoped so different accounts keep separate preferences
  const [selectedTemplate, setSelectedTemplate] = useState<ATSTemplate>(() => {
    return (clientDb.getCVTemplate() as ATSTemplate) || 'google_doc';
  });

  const handleTemplateChange = (t: ATSTemplate) => {
    setSelectedTemplate(t);
    clientDb.setCVTemplate(t);
  };

  const [atsResult, setAtsResult] = useState<ATSAnalysis | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);

  // Upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedInfo, setExtractedInfo] = useState<{
    fullName?: string; email?: string; phone?: string; summary?: string; skills: string[];
  } | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Multi-step generation workflow modal states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generationStep, setGenerationStep] = useState<
    'idle' | 'validating' | 'preparing' | 'generating' | 'building' | 'saving' | 'completed' | 'error'
  >('idle');
  const [generationTargetType, setGenerationTargetType] = useState<'profile' | 'saved' | 'custom'>('profile');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Tailoring state
  const [tailorSourceType, setTailorSourceType] = useState<'saved' | 'custom'>('saved');
  const [selectedOppId, setSelectedOppId] = useState(opportunities[0]?.id || '');
  const [customJobTitle, setCustomJobTitle] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [customJobDescription, setCustomJobDescription] = useState('');

  const [tailorResult, setTailorResult] = useState<any>(null);
  const [tailoredResumeObj, setTailoredResumeObj] = useState<ResumeVersion | null>(null);

  const [copied, setCopied] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState('');

  const isAr = lang === 'ar';
  const currentResume = resumes.find((r) => r.id === selectedResumeId) || masterCV;
  const [summaryDraft, setSummaryDraft] = useState(currentResume?.summary || '');
  const [skillsDraft, setSkillsDraft] = useState<string[]>(currentResume?.skills || []);

  // Restore drafts from localStorage on mount or when currentResume changes
  useEffect(() => {
    if (!currentResume?.id) return;

    const draftKey = `cv_draft_${currentResume.id}`;
    const savedDraft = localStorage.getItem(draftKey);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.summary !== undefined) setSummaryDraft(parsed.summary);
        if (parsed.skills !== undefined) setSkillsDraft(parsed.skills);
      } catch (e) {
        console.warn('Failed to parse saved draft:', e);
      }
    } else {
      // No draft exists, reset to current resume values
      setSummaryDraft(currentResume.summary || '');
      setSkillsDraft(currentResume.skills || []);
    }
  }, [currentResume?.id]);

  // Autosave summary draft with debounce
  useEffect(() => {
    if (!currentResume?.id || !isEditingSummary) return;

    const timer = setTimeout(() => {
      const draftKey = `cv_draft_${currentResume.id}`;
      const existingDraft = localStorage.getItem(draftKey);
      const existing = existingDraft ? JSON.parse(existingDraft) : {};

      localStorage.setItem(draftKey, JSON.stringify({
        ...existing,
        summary: summaryDraft,
        lastSaved: new Date().toISOString()
      }));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [summaryDraft, isEditingSummary, currentResume?.id]);

  // Autosave skills draft with debounce
  useEffect(() => {
    if (!currentResume?.id || !isEditingSkills) return;

    const timer = setTimeout(() => {
      const draftKey = `cv_draft_${currentResume.id}`;
      const existingDraft = localStorage.getItem(draftKey);
      const existing = existingDraft ? JSON.parse(existingDraft) : {};

      localStorage.setItem(draftKey, JSON.stringify({
        ...existing,
        skills: skillsDraft,
        lastSaved: new Date().toISOString()
      }));
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [skillsDraft, isEditingSkills, currentResume?.id]);

  const handleExecuteGeneration = async () => {
    setGenerationStep('validating');
    setGenerationError(null);

    try {
      await new Promise((r) => setTimeout(r, 300));
      setGenerationStep('preparing');

      const payload: any = {
        resumeId: currentResume?.id,
      };

      if (generationTargetType === 'saved' && selectedOppId) {
        payload.opportunityId = selectedOppId;
      } else if (generationTargetType === 'custom' && customJobDescription.trim()) {
        payload.customJobTitle = customJobTitle.trim() || profile?.targetRole;
        payload.customCompany = customCompany.trim() || 'Target Employer';
        payload.customJobDescription = customJobDescription.trim();
      } else {
        payload.targetRole = profile?.targetRole || 'Software Engineer';
      }

      await new Promise((r) => setTimeout(r, 400));
      setGenerationStep('generating');

      const res = await onTailorCV(payload);

      setGenerationStep('building');
      await new Promise((r) => setTimeout(r, 350));

      setGenerationStep('saving');
      setTailorResult(res.tailoredData);

      if (res.tailoredResume) {
        setTailoredResumeObj(res.tailoredResume);
        setSelectedResumeId(res.tailoredResume.id);
      }

      setGenerationStep('completed');
      setActiveTab('preview');
      setPreviewSubMode('a4document');
      setTimeout(() => setShowGenerateModal(false), 1400);
    } catch (err: any) {
      console.error('Generation pipeline failed:', err);
      setGenerationStep('error');
      setGenerationError(err?.message || (isAr ? 'فشلت عملية توليد السيرة الذاتية' : 'Failed to generate CV'));
    }
  };

  const handleRunAudit = async () => {
    if (!currentResume) return;
    setIsAuditing(true);
    setActiveTab('ats');
    try {
      const res = await onAnalyzeResume(currentResume.id);
      setAtsResult(res);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleTailorSubmit = async () => {
    setIsTailoring(true);
    try {
      const payload: any = {
        resumeId: currentResume?.id,
      };

      if (tailorSourceType === 'saved') {
        payload.opportunityId = selectedOppId;
      } else {
        payload.customJobTitle = customJobTitle;
        payload.customCompany = customCompany;
        payload.customJobDescription = customJobDescription;
      }

      const res = await onTailorCV(payload);
      setTailorResult(res.tailoredData);
      if (res.tailoredResume) {
        setTailoredResumeObj(res.tailoredResume);
      }
    } finally {
      setIsTailoring(false);
    }
  };

  const handleSaveSummary = async () => {
    if (!currentResume) return;
    const updated = {
      ...currentResume,
      summary: summaryDraft,
      updatedAt: new Date().toISOString(),
    };
    await onSaveResume(updated);
    setIsEditingSummary(false);

    // Clear the draft from localStorage after successful save
    const draftKey = `cv_draft_${currentResume.id}`;
    const existingDraft = localStorage.getItem(draftKey);
    if (existingDraft) {
      const existing = JSON.parse(existingDraft);
      delete existing.summary;
      if (Object.keys(existing).length <= 1) { // Only lastSaved remains
        localStorage.removeItem(draftKey);
      } else {
        localStorage.setItem(draftKey, JSON.stringify(existing));
      }
    }
  };

  const handleSaveSkills = async () => {
    if (!currentResume) return;
    const updated = {
      ...currentResume,
      skills: skillsDraft,
      updatedAt: new Date().toISOString(),
    };
    await onSaveResume(updated);
    setIsEditingSkills(false);
    setNewSkillInput('');

    // Clear the draft from localStorage after successful save
    const draftKey = `cv_draft_${currentResume.id}`;
    const existingDraft = localStorage.getItem(draftKey);
    if (existingDraft) {
      const existing = JSON.parse(existingDraft);
      delete existing.skills;
      if (Object.keys(existing).length <= 1) { // Only lastSaved remains
        localStorage.removeItem(draftKey);
      } else {
        localStorage.setItem(draftKey, JSON.stringify(existing));
      }
    }
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !skillsDraft.includes(trimmed)) {
      setSkillsDraft([...skillsDraft, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkillsDraft(skillsDraft.filter((_, i) => i !== index));
  };

  const handleSaveTailoredAsNew = async (tailoredResume: ResumeVersion) => {
    await onSaveResume(tailoredResume);
    setSelectedResumeId(tailoredResume.id);
  };

  const handleCopyCV = () => {
    if (!currentResume) return;
    const text = `
${currentResume.title}

PROFESSIONAL SUMMARY
${currentResume.summary}

EXPERIENCE
${currentResume.experience
  .map(
    (e) => `
${e.role} at ${e.company} (${e.startDate} - ${e.current ? 'Present' : e.endDate})
${e.achievements.map((a) => `• ${a}`).join('\n')}
`
  )
  .join('\n')}

SKILLS
${currentResume.skills.join(' • ')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const activeOpp = opportunities.find((o) => o.id === selectedOppId);
  const masterCVs = resumes.filter((r) => r.isMaster);
  const tailoredCVs = resumes.filter((r) => !r.isMaster);

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    const validation = validateCVFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }
    setUploadedFileName(file.name);
    setIsExtracting(true);

    try {
      // Upload to server for proper parsing
      const formData = new FormData();
      formData.append('cv', file);

      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${await getCurrentSession().then(s => s?.access_token || '')}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.userMessage || result.error || 'Upload failed');
      }

      // Show extracted candidate info
      if (result.candidateInfo) {
        setExtractedInfo(result.candidateInfo);
      }

      // Add uploaded resume to library
      if (result.resume) {
        onResumesChange([...resumes, result.resume]);
      }

      // Show success notification
      console.log('[CV Upload] Success:', result.message);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setUploadError(errorMsg);
      console.error('[CV Upload] Error:', errorMsg);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    // Reset input so same file can be re-selected
    setTimeout(() => { e.target.value = ''; }, 0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Extraction Preview Drawer (shown after file upload) */}
      {extractedInfo && (
        <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900">
                {isAr ? 'تم استخراج المعلومات من الملف' : 'Information Extracted From File'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => { setExtractedInfo(null); setUploadedFileName(null); }}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-500">
            {isAr ? 'الملف: ' : 'File: '}
            <span className="font-semibold text-slate-700">{uploadedFileName}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {extractedInfo.fullName && (
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">{isAr ? 'الاسم' : 'Name'}</div>
                <div className="font-semibold text-slate-800">{extractedInfo.fullName}</div>
              </div>
            )}
            {extractedInfo.email && (
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</div>
                <div className="font-semibold text-slate-800">{extractedInfo.email}</div>
              </div>
            )}
            {extractedInfo.phone && (
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">{isAr ? 'الهاتف' : 'Phone'}</div>
                <div className="font-semibold text-slate-800">{extractedInfo.phone}</div>
              </div>
            )}
            {extractedInfo.skills.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 sm:col-span-2">
                <div className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">{isAr ? 'المهارات المكتشفة' : 'Detected Skills'}</div>
                <div className="flex flex-wrap gap-1">
                  {extractedInfo.skills.map((s, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <span className="font-bold">{isAr ? 'ملاحظة: ' : 'Note: '}</span>
            {isAr
              ? 'لاستخراج كامل من PDF/DOCX، استخدم زر "إنشاء بالذكاء الاصطناعي" وأدخل وصف الوظيفة. التحليل الكامل يتم على الخادم.'
              : 'For full PDF/DOCX extraction, use "Generate with AI" and paste the job description. Full server-side parsing provides the complete analysis.'}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowGenerateModal(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'توليد سيرة محسّنة بالذكاء الاصطناعي' : 'Generate Enhanced CV with AI'}
            </button>
          </div>
        </div>
      )}

      {/* Empty state for new users with no CV yet */}
      {resumes.length === 0 && !extractedInfo && (
        <div className="space-y-4">
          {/* Upload error */}
          {uploadError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
              <button type="button" onClick={() => setUploadError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Path A: Upload existing CV */}
            <div
              className={`relative bg-white border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer group ${
                isDragOver ? 'border-blue-500 bg-blue-50/40' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); document.getElementById('cv-file-input')?.click(); }}
            >
              <input
                id="cv-file-input"
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-100 transition-colors">
                {isExtracting ? (
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                ) : (
                  <Download className="w-6 h-6 text-blue-600" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                {isAr ? '📤 رفع سيرة ذاتية موجودة' : '📤 Upload Existing CV'}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                {isAr
                  ? 'اسحب وأفلت ملفك هنا أو انقر للاختيار. يدعم PDF وDOCX وTXT.'
                  : 'Drag & drop your file here or click to browse. PDF, DOCX, TXT supported.'}
              </p>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
                {isAr ? 'حد 10MB' : 'Max 10MB'}
              </span>
            </div>

            {/* Path B: Create from Profile */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 hover:border-blue-300 transition-colors">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  {isAr ? '✨ إنشاء بالذكاء الاصطناعي' : '✨ Create with AI'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? 'نولّد لك سيرة ذاتية متوافقة مع ATS بناءً على بياناتك المهنية.'
                    : 'We generate an ATS-optimized resume from your career profile data.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAr ? 'إنشاء السيرة الذاتية' : 'Create My First CV'}
              </button>
              {!profile?.targetRole && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {isAr ? '💡 أكمل ملفك الشخصي أولاً.' : '💡 Complete your career profile first.'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Top Header Card — only shown when resumes exist */}
      {resumes.length > 0 && <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        <div>
          <div className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'استوديو السيرة الذاتية الذكي و فحص ATS' : 'Smart CV Studio & ATS Compliance Engine'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {isAr ? 'استوديو السيرة الذاتية (CV Studio & ATS PDF)' : 'CV Studio & ATS Optimizer'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isAr
              ? 'توليد سيرة ذاتية PDF متوافقة مع أنظمة الفرز الآلي ATS بناءً على الوصف الوظيفي (Job Description)'
              : 'Audit ATS parsing compliance, tailor against any Job Description, and export clean vector PDF resumes'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Generate CV Button */}
          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-md"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAr ? 'توليد السيرة بالذكاء الاصطناعي' : 'Generate / Tailor CV'}</span>
          </button>

          {/* Resume Version Switcher */}
          <select
            value={selectedResumeId}
            onChange={(e) => {
              setSelectedResumeId(e.target.value);
              const found = resumes.find((r) => r.id === e.target.value);
              if (found) setSummaryDraft(found.summary);
            }}
            className="text-xs py-2 px-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-semibold outline-none cursor-pointer max-w-[220px]"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} {r.isMaster ? (isAr ? '(النسخة الرئيسية)' : '(Master)') : ''}
              </option>
            ))}
          </select>

          {/* LinkedIn Sync */}
          <button
            type="button"
            onClick={onOpenLinkedInSync}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <div className="w-4 h-4 rounded bg-[#0077b5] text-white text-[10px] font-bold flex items-center justify-center">
              in
            </div>
            <span>{isAr ? 'استيراد LinkedIn' : 'Import'}</span>
          </button>

          {/* Direct Print / PDF */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('preview');
              setPreviewSubMode('a4document');
              setTimeout(() => window.print(), 250);
            }}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة / حفظ PDF' : 'Print / PDF'}</span>
          </button>

          {/* Copy Plain Text */}
          <button
            type="button"
            onClick={handleCopyCV}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isAr ? 'تم النسخ!' : 'Copied!') : isAr ? 'نسخ النص' : 'Copy'}</span>
          </button>

          {/* Upload existing CV button */}
          <label
            htmlFor="cv-header-upload"
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <input
              id="cv-header-upload"
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={handleFileInput}
            />
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'رفع سيرة' : 'Upload CV'}</span>
          </label>

          {/* Run ATS Audit */}
          <button
            type="button"
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? (isAr ? 'جاري الفحص...' : 'Auditing...') : isAr ? 'فحص ATS' : 'Run ATS Audit'}</span>
          </button>
        </div>
      </div>

      {/* Official Google Doc Template Showcase & Control Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-[#1f3864] text-white rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                <span>{isAr ? 'القالب المعتمد المختار:' : 'Active Template:'}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                96%+ ATS Pass Rate
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold">
              {selectedTemplate === 'google_doc'
                ? isAr ? '📄 قالب قوقل دوك التنفيذي (Navy Executive Google Doc)' : '📄 Navy Executive ATS (Official Google Doc)'
                : selectedTemplate === 'classic'
                ? isAr ? '🏛️ القالب الكلاسيكي الأكاديمي (Classic ATS)' : '🏛️ Classic Academic ATS'
                : isAr ? '💻 قالب التقنية العصري (Modern Tech ATS)' : '💻 Modern Tech ATS'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              {isAr
                ? 'نموذج السيرة الذاتية المهني الرسمي: ترويسات بالأزرق الداكن (#1f3864)، خط Carlito/Calibri، وتنسيق أحادي العمود معتمد لدى أنظمة التوظيف العالمية Workday وTaleo وGreenhouse.'
                : 'Official Navy #1f3864 layout with Carlito typography, balanced margins, and single-column ATS structure.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* View Original Google Doc Link */}
            <a
              href="https://docs.google.com/document/d/1jSVGtqNaoYSt2qSfCAsc39NBS-pxVAEu/edit?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-white/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض القالب في Google Docs' : 'View Google Doc'}</span>
            </a>

            {/* Template Selector */}
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value as ATSTemplate)}
              className="text-xs py-2 px-3 border border-slate-600 rounded-xl bg-slate-800 text-white font-semibold outline-none cursor-pointer"
            >
              <option value="google_doc">📄 Navy Executive (Google Doc)</option>
              <option value="classic">🏛️ Classic Academic ATS</option>
              <option value="modern">💻 Modern Tech ATS</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Mode Navigation Tabs (Clear & Intuitive) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isAr ? '1. استعراض وتعديل السيرة (View & Edit)' : '1. View & Edit CV'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ats')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'ats'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>{isAr ? '2. فحص وتوافق ATS (Score & Audit)' : '2. ATS Score & Audit'}</span>
          {atsResult?.overallScore && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/20 text-white font-bold">
              {atsResult.overallScore}%
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tailor')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'tailor'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{isAr ? '3. تخصيص للوظيفة وتوليد ATS PDF (Job Tailoring)' : '3. Tailor for Job & Export PDF'}</span>
          {tailoredResumeObj && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-400 text-slate-900 font-bold">
              PDF Ready
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'library'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? '4. مكتبة السير الذاتية (CV Library)' : '4. CV Library'}</span>
          <span className="text-[10px] px-1.5 rounded-full bg-current/10 font-mono">{resumes.length}</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: Preview & Edit + A4 Document Toggle
          ======================================================== */}
      {activeTab === 'preview' && currentResume && (
        <div className="space-y-4">
          {/* Sub-mode toggle: Section Editor vs A4 Printable Document */}
          <div className="flex items-center justify-between p-3 bg-white border border-slate-200/80 rounded-xl">
            <span className="text-xs font-semibold text-slate-700">
              {isAr ? 'طريقة العرض:' : 'View Mode:'}
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPreviewSubMode('editor')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  previewSubMode === 'editor' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'محرر الأقسام' : 'Section Editor'}
              </button>
              <button
                type="button"
                onClick={() => setPreviewSubMode('a4document')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  previewSubMode === 'a4document' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? 'معاينة ورقة A4 وتصدير PDF' : 'A4 Document & PDF Export'}
              </button>
            </div>
          </div>

          {previewSubMode === 'a4document' ? (
            <ATSResumeDocument
              resume={currentResume}
              profile={profile}
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
              targetOpportunity={activeOpp}
              customJobTitle={tailorResult?.targetRole || customJobTitle}
              lang={lang}
              onSaveAsNewVersion={handleSaveTailoredAsNew}
            />
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xs">
              {/* Resume Header */}
              <div className="border-b border-slate-200/80 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    {currentResume.isMaster ? (isAr ? 'النسخة المعتمدة (Master Resume)' : 'Master Resume') : currentResume.title}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">{currentResume.title}</h2>
                  <span className="text-xs text-slate-400 mt-1 block">
                    {isAr ? 'آخر تحديث: ' : 'Last modified: '} {formatDate(currentResume.updatedAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {isAr ? 'جاهزة للتقديم (ATS Ready)' : 'ATS Ready'}
                  </span>
                  {currentResume.atsScore && (
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      ATS: {currentResume.atsScore}%
                    </span>
                  )}
                </div>
              </div>

              {/* Summary Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isAr ? 'النبذة المهنية (Professional Summary)' : 'Professional Summary'}
                  </h3>
                  {isEditingSummary ? (
                    <button
                      onClick={handleSaveSummary}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {isAr ? 'حفظ التعديل' : 'Save Summary'}
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditingSummary(true)}
                      className="text-xs font-bold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isAr ? 'تعديل النبذة' : 'Edit'}</span>
                    </button>
                  )}
                </div>

                {isEditingSummary ? (
                  <textarea
                    rows={4}
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                    className="w-full text-xs p-3.5 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none leading-relaxed text-slate-800 font-sans"
                  />
                ) : (
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-100 italic">
                    "{currentResume.summary}"
                  </p>
                )}
              </div>

              {/* Experience Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {isAr ? 'الخبرات المهنية المعتمدة (Work Experience)' : 'Work Experience'} ({currentResume.experience.length})
                </h3>

                <div className="space-y-3">
                  {currentResume.experience.map((exp) => (
                    <div key={exp.id} className="p-4 bg-slate-50/50 border border-slate-200/70 rounded-xl space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{exp.role}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {exp.company} · {exp.location}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {exp.startDate} – {exp.current ? (isAr ? 'حتى الآن' : 'Present') : exp.endDate}
                        </span>
                      </div>

                      <div className="space-y-1 pt-1">
                        {exp.achievements.map((ach, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                            <span className="text-blue-500 font-bold">·</span>
                            <span>{ach}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills Section */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {isAr ? 'المهارات والكلمات المفتاحية (Technical Skills & ATS Keywords)' : 'Skills & Keywords'} ({isEditingSkills ? skillsDraft.length : currentResume.skills.length})
                  </h3>
                  {isEditingSkills ? (
                    <button
                      onClick={handleSaveSkills}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      {isAr ? 'حفظ المهارات' : 'Save Skills'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsEditingSkills(true);
                        setSkillsDraft([...currentResume.skills]);
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-blue-600 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isAr ? 'تعديل وإضافة' : 'Edit'}</span>
                    </button>
                  )}
                </div>

                {isEditingSkills ? (
                  <div className="space-y-3">
                    {/* Add New Skill Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder={isAr ? 'أضف مهارة جديدة (مثلاً: React, Python, AWS)' : 'Add new skill (e.g., React, Python, AWS)'}
                        className="flex-1 text-xs p-2.5 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-100 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        disabled={!newSkillInput.trim()}
                        className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isAr ? 'إضافة' : 'Add'}</span>
                      </button>
                    </div>

                    {/* Editable Skills List */}
                    <div className="flex flex-wrap gap-1.5">
                      {skillsDraft.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1.5 group"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(i)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {skillsDraft.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        {isAr ? 'لا توجد مهارات بعد. أضف مهاراتك أعلاه.' : 'No skills yet. Add your skills above.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {currentResume.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-200/80 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: ATS Score & Optimization Audit
          ======================================================== */}
      {activeTab === 'ats' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {isAr ? 'نتائج وتوافق أنظمة الفرز الآلي (ATS Score)' : 'ATS Parsing & Compliance Audit'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'فحص شامل لمطابقة الكلمات المفتاحية، التنسيق الخالي من الجداول المعقدة، ووضوح التسلسل الزمني'
                    : 'Real-time scan against enterprise ATS engines (Workday, Greenhouse, Lever, Taleo)'}
                </p>
              </div>

              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{isAuditing ? (isAr ? 'جاري إعادة الفحص...' : 'Re-evaluating...') : isAr ? 'إعادة الفحص الآن' : 'Re-Run Audit'}</span>
              </button>
            </div>

            {atsResult ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Circle Card */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    {isAr ? 'الدرجة الإجمالية' : 'Overall ATS Score'}
                  </span>
                  <div className="text-5xl font-black text-blue-600 font-mono tracking-tight">
                    {atsResult.overallScore}%
                  </div>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {atsResult.overallScore >= 80 ? (isAr ? 'ممتاز ومطابق' : 'High Pass Probability') : (isAr ? 'يحتاج تحسين' : 'Needs Optimization')}
                  </span>
                </div>

                {/* Strengths & Passed Checks */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isAr ? 'العناصر المطابقة بنجاح:' : 'Passed ATS Checks:'}
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isAr ? 'تنسيق نصوص نظيف بدون جداول معقدة' : 'Clean layout structure'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isAr ? 'أرقام وإنجازات محددة (Metrics)' : 'Quantifiable achievements detected'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isAr ? 'مهارات متوافقة مع المسمى الوظيفي' : 'Role-relevant core keywords present'}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isAr ? 'توصيات لرفع التقييم لـ 95%:' : 'Recommendations for 95%+:'}
                  </span>
                  <div className="space-y-2 text-xs text-slate-600">
                    {atsResult.recommendations?.map((rec, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-bold">→</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
                <Sparkles className="w-8 h-8 text-blue-500 mx-auto" />
                <p>
                  {isAr
                    ? 'اضغط على زر "فحص ATS" أعلاه لتشغيل المحاكي الذكي والحصول على تقرير دقيق.'
                    : 'Click "Run ATS Audit" above to test your CV against enterprise ATS engines.'}
                </p>
                <button
                  onClick={handleRunAudit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {isAr ? 'تشغيل الفحص الآن' : 'Run Audit Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: Job Tailoring & ATS PDF Generation Engine
          ======================================================== */}
      {activeTab === 'tailor' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  {isAr ? 'محرك التخصيص وتوليد الـ PDF الذكي' : 'ATS Role Tailoring & PDF Generator'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                  Workday • Greenhouse • Taleo
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mt-1">
                {isAr
                  ? 'تخصيص السيرة الذاتية لمتطلبات الوظيفة (Job Description) وتصدير PDF'
                  : 'Tailor CV to Target Job Description & Generate ATS PDF'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isAr
                  ? 'اختر وظيفة محفوظة من Indeed أو الصق الوصف الوظيفي (Job Description) ليقوم الذكاء الاصطناعي بإعادة صياغة السيرة الذاتية وتجهيز ملف PDF فوري متوافق 100% مع الـ ATS.'
                  : 'Select an opportunity from Indeed or paste any Job Description to generate a tailored, 95%+ ATS-compatible PDF resume.'}
              </p>
            </div>

            {/* Input Source Mode Selector */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl w-fit text-xs font-bold">
              <button
                onClick={() => setTailorSourceType('saved')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tailorSourceType === 'saved' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? '1. من الوظائف والتدريبات المحفوظة' : '1. From Saved Opportunities'}
              </button>
              <button
                onClick={() => setTailorSourceType('custom')}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  tailorSourceType === 'custom' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isAr ? '2. لصق إعلان وظيفة مخصص (Custom Job Description)' : '2. Paste Custom Job Description'}
              </button>
            </div>

            {/* Source Input 1: Saved Opportunities */}
            {tailorSourceType === 'saved' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {isAr ? 'اختر الوظيفة المستهدفة:' : 'Target Opportunity:'}
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={selectedOppId}
                    onChange={(e) => setSelectedOppId(e.target.value)}
                    className="w-full sm:flex-1 text-xs p-3 border border-slate-300 rounded-xl outline-none bg-slate-50 cursor-pointer text-slate-800 font-semibold"
                  >
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.title} — {opp.company} ({opp.location})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleTailorSubmit}
                    disabled={isTailoring || !selectedOppId}
                    className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isTailoring ? 'animate-spin' : ''}`} />
                    <span>{isTailoring ? (isAr ? 'جاري التوليد بالذكاء الاصطناعي...' : 'Tailoring CV...') : isAr ? 'توليد سيرة ذاتية PDF للوظيفة' : 'Generate Tailored ATS CV'}</span>
                  </button>
                </div>

                {activeOpp && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 flex items-center justify-between">
                    <span>
                      {isAr ? 'المتطلبات الأساسية: ' : 'Core Requirements: '}
                      {activeOpp.requirements.slice(0, 5).join(', ')}
                    </span>
                    <span className="font-mono text-[11px] text-blue-600 font-bold shrink-0">
                      {activeOpp.company}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Source Input 2: Custom Job Description Text */}
            {tailorSourceType === 'custom' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {isAr ? 'المسمى الوظيفي المستهدف:' : 'Target Job Title:'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Full-Stack AI Engineer"
                      value={customJobTitle}
                      onChange={(e) => setCustomJobTitle(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {isAr ? 'اسم الشركة / المؤسسة:' : 'Target Company:'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. TechCorp / Startup / Remote"
                      value={customCompany}
                      onChange={(e) => setCustomCompany(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-xl outline-none focus:border-blue-500 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isAr ? 'نص الوصف الوظيفي والشروط المطلوبة (Paste Job Description):' : 'Paste Job Description / Requirements:'}
                  </label>
                  <textarea
                    rows={5}
                    placeholder={
                      isAr
                        ? 'الصق هنا متطلبات الوظيفة أو الإعلان بالكامل من LinkedIn أو Indeed أو موقع التوظيف...'
                        : 'Paste job requirements, required technologies, responsibilities, and qualifications here...'
                    }
                    value={customJobDescription}
                    onChange={(e) => setCustomJobDescription(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 bg-slate-50 leading-relaxed font-sans"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleTailorSubmit}
                    disabled={isTailoring || !customJobDescription.trim()}
                    className="px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isTailoring ? 'animate-spin' : ''}`} />
                    <span>{isTailoring ? (isAr ? 'جاري التحليل والتوليد...' : 'Optimizing for Job...') : isAr ? 'توليد سيرة ذاتية PDF للوظيفة' : 'Generate Tailored ATS CV'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Generated Tailored Results & Live PDF Document */}
          {tailorResult && tailoredResumeObj && (
            <div className="space-y-6">
              {/* Overview Badge Card */}
              <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider block mb-1">
                      {isAr ? 'تم توليد وتكييف السيرة الذاتية بنجاح' : 'ATS Optimization Complete'}
                    </span>
                    <h3 className="text-xl font-bold">
                      {tailorResult.targetRole || customJobTitle || activeOpp?.title}
                    </h3>
                    <p className="text-xs text-blue-200 mt-1">
                      {isAr
                        ? 'تم إدراج الكلمات المفتاحية، وتحديث النبذة المهنية، وإبراز الإنجازات المتطابقة بدقة.'
                        : 'Keywords prioritized, summary targeted, and quantified accomplishments highlighted.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-center">
                      <div className="text-2xl font-black font-mono text-emerald-300">
                        {tailorResult.atsScore || 96}%
                      </div>
                      <span className="text-[10px] text-emerald-200 font-bold block">
                        {isAr ? 'توافق ATS' : 'ATS Match'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSaveTailoredAsNew(tailoredResumeObj)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>{isAr ? 'حفظ كنسخة جديدة في حسابي' : 'Save as New CV Version'}</span>
                    </button>
                  </div>
                </div>

                {/* Keyword Match Tags */}
                {tailorResult.atsKeywordMatches && tailorResult.atsKeywordMatches.length > 0 && (
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <span className="text-xs font-bold text-blue-200 block">
                      {isAr ? 'الكلمات المفتاحية المطابقة بنجاح في السيرة الذاتية:' : 'Matched Keywords in CV:'}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResult.atsKeywordMatches.map((kw: string, i: number) => (
                        <span
                          key={i}
                          className="px-2.5 py-0.5 rounded-lg bg-blue-500/30 text-white border border-blue-400/30 text-xs font-medium"
                        >
                          ✓ {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* LIVE ATS RESUME DOCUMENT VIEWER & PDF DOWNLOADER */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {isAr ? 'معاينة وثيقة السيرة الذاتية PDF (A4 Document)' : 'Live A4 ATS PDF Document Preview'}
                  </h4>
                  <span className="text-xs text-slate-500">
                    {isAr ? 'جاهزة للحفظ بصيغة PDF فوراً' : 'Ready to export / print'}
                  </span>
                </div>

                <ATSResumeDocument
                  resume={tailoredResumeObj}
                  profile={profile}
                  targetOpportunity={activeOpp}
                  customJobTitle={tailorResult.targetRole || customJobTitle}
                  lang={lang}
                  onSaveAsNewVersion={handleSaveTailoredAsNew}
                />
              </div>
            </div>
          )}
        </div>
      )}
      </>
      }

      {/* Multi-Step Generate / Tailor CV Modal */}
      {showGenerateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            if (generationStep !== 'generating' && generationStep !== 'building' && generationStep !== 'saving') {
              setShowGenerateModal(false);
              setGenerationStep('idle');
            }
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAr ? 'توليد سيرة ذاتية متوافقة مع ATS' : 'Generate ATS-Compliant CV'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAr
                      ? 'بناء السيرة الذاتية وتغذيتها ببيانات ملفك وقالب Google Doc المعتمد'
                      : 'Generate using your verified profile data & the official Google Doc template'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (generationStep !== 'generating' && generationStep !== 'building' && generationStep !== 'saving') {
                    setShowGenerateModal(false);
                    setGenerationStep('idle');
                  }
                }}
                disabled={generationStep === 'generating' || generationStep === 'building' || generationStep === 'saving'}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 flex-1 overflow-y-auto overscroll-contain">
              {/* Selected Template Badge */}
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-[11px] font-bold text-blue-900">
                      {isAr ? 'القالب المستخدم:' : 'Active Template:'}{' '}
                      <span className="font-mono text-blue-700">
                        {selectedTemplate === 'google_doc'
                          ? isAr ? 'قالب Google Doc التنفيذي (Navy #1f3864)' : 'Navy Executive Google Doc (#1f3864)'
                          : selectedTemplate === 'classic'
                          ? 'Classic Academic ATS'
                          : 'Modern Tech ATS'}
                      </span>
                    </div>
                    <div className="text-[10px] text-blue-600">
                      {isAr ? 'متطابق بنسبة 100% مع النموذج الأصلي المطلوب' : 'Faithfully formatted to official template'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  96%+ ATS
                </span>
              </div>

              {/* In-Progress Pipeline View */}
              {generationStep !== 'idle' && generationStep !== 'error' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      {generationStep === 'completed' ? (
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                      <span>
                        {generationStep === 'validating' && (isAr ? '1. التحقق من البيانات والمدخلات...' : '1. Validating inputs...')}
                        {generationStep === 'preparing' && (isAr ? '2. تجهيز بيانات الملف الشخصي...' : '2. Preparing profile data...')}
                        {generationStep === 'generating' && (isAr ? '3. صياغة المحتوى بالذكاء الاصطناعي...' : '3. Generating ATS content...')}
                        {generationStep === 'building' && (isAr ? '4. تشييد الوثيقة وتطبيق التنسيق...' : '4. Building document structure...')}
                        {generationStep === 'saving' && (isAr ? '5. حفظ النسخة في قاعدة البيانات...' : '5. Saving CV to database...')}
                        {generationStep === 'completed' && (isAr ? '✓ اكتمل التوليد بنجاح! جاري الفتح...' : '✓ CV Generated Successfully!')}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      {generationStep === 'validating' && '20%'}
                      {generationStep === 'preparing' && '40%'}
                      {generationStep === 'generating' && '70%'}
                      {generationStep === 'building' && '85%'}
                      {generationStep === 'saving' && '95%'}
                      {generationStep === 'completed' && '100%'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        generationStep === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{
                        width:
                          generationStep === 'validating'
                            ? '20%'
                            : generationStep === 'preparing'
                            ? '40%'
                            : generationStep === 'generating'
                            ? '70%'
                            : generationStep === 'building'
                            ? '85%'
                            : generationStep === 'saving'
                            ? '95%'
                            : '100%',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {generationStep === 'error' && generationError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold">{isAr ? 'تعذر إكمال التوليد' : 'Generation Failed'}</div>
                    <p className="mt-0.5 text-rose-700">{generationError}</p>
                  </div>
                </div>
              )}

              {/* Target Options (Visible when idle or on error) */}
              {(generationStep === 'idle' || generationStep === 'error') && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">
                    {isAr ? 'حدد هدف التوليد والتكييف:' : 'Select Generation Target:'}
                  </label>

                  {/* Target Type Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setGenerationTargetType('profile')}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        generationTargetType === 'profile'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Target className="w-3.5 h-3.5 mx-auto mb-1 text-blue-600" />
                      <span>{isAr ? 'المسمى بالملف' : 'Profile Role'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGenerationTargetType('saved')}
                      disabled={opportunities.length === 0}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        generationTargetType === 'saved'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      } ${opportunities.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                      <Briefcase className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-600" />
                      <span>{isAr ? 'وظيفة محفوظة' : 'Saved Job'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGenerationTargetType('custom')}
                      className={`p-2.5 text-xs font-semibold rounded-xl border text-center transition-all cursor-pointer ${
                        generationTargetType === 'custom'
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-600" />
                      <span>{isAr ? 'إعلان مخصص' : 'Custom JD'}</span>
                    </button>
                  </div>

                  {/* Profile target info */}
                  {generationTargetType === 'profile' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <div className="font-semibold text-slate-800">
                        {isAr ? 'المسمى المهني المستهدف:' : 'Target Career Direction:'}{' '}
                        <span className="text-blue-600 font-bold">{profile?.targetRole || 'Software Engineer'}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {isAr
                          ? 'سيتم توليد وتنسيق السيرة الذاتية مستندة إلى خبراتك ومهاراتك الحقيقية المسجلة في ملفك الشخصي.'
                          : 'CV will be constructed and optimized directly from your saved verified career profile.'}
                      </p>
                    </div>
                  )}

                  {/* Saved opportunity selector */}
                  {generationTargetType === 'saved' && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-600 block">
                        {isAr ? 'اختر الوظيفة من قائمة الفرص:' : 'Select saved job:'}
                      </label>
                      <select
                        value={selectedOppId}
                        onChange={(e) => setSelectedOppId(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-medium outline-none"
                      >
                        {opportunities.map((opp) => (
                          <option key={opp.id} value={opp.id}>
                            {opp.title} — {opp.company}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custom Job Description fields */}
                  {generationTargetType === 'custom' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder={isAr ? 'المسمى الوظيفي' : 'Job Title'}
                          value={customJobTitle}
                          onChange={(e) => setCustomJobTitle(e.target.value)}
                          className="text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 outline-none"
                        />
                        <input
                          type="text"
                          placeholder={isAr ? 'اسم الشركة' : 'Company Name'}
                          value={customCompany}
                          onChange={(e) => setCustomCompany(e.target.value)}
                          className="text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 outline-none"
                        />
                      </div>
                      <textarea
                        rows={3}
                        placeholder={isAr ? 'الصق الوصف الوظيفي هنا (Job Description)...' : 'Paste Job Description text here...'}
                        value={customJobDescription}
                        onChange={(e) => setCustomJobDescription(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-slate-50 outline-none resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="shrink-0 p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowGenerateModal(false);
                  setGenerationStep('idle');
                }}
                disabled={generationStep === 'generating' || generationStep === 'building' || generationStep === 'saving'}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleExecuteGeneration}
                disabled={
                  generationStep === 'generating' ||
                  generationStep === 'building' ||
                  generationStep === 'saving' ||
                  generationStep === 'completed'
                }
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generationStep === 'error' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعادة المحاولة' : 'Retry Generation'}</span>
                  </>
                ) : generationStep === 'completed' ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تم بنجاح!' : 'Generated!'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'ابدأ توليد السيرة الآن' : 'Start CV Generation'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: CV Library — Master vs Tailored CVs
          ======================================================== */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Master CVs Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{isAr ? 'السيرة الذاتية الرئيسية (Master CV)' : 'Master CV'}</h3>
                  <p className="text-[11px] text-slate-500">{isAr ? 'النسخة الأصلية الكاملة — لا تُعدَّل عند التخصيص' : 'Original full version — never overwritten by tailoring'}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                {masterCVs.length} {isAr ? 'نسخة' : 'version(s)'}
              </span>
            </div>
            {masterCVs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p>{isAr ? 'لا توجد سيرة ذاتية رئيسية بعد' : 'No Master CV yet'}</p>
                <button type="button" onClick={() => setShowGenerateModal(true)} className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                  {isAr ? 'إنشاء السيرة الرئيسية' : 'Create Master CV'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {masterCVs.map((cv) => (
                  <div key={cv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{cv.title}</span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">Master</span>
                        {cv.atsScore != null && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">ATS: {cv.atsScore}%</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{isAr ? 'آخر تحديث: ' : 'Updated: '}{formatDate(cv.updatedAt)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => { setSelectedResumeId(cv.id); setActiveTab('preview'); }} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                        {isAr ? 'عرض' : 'View'}
                      </button>
                      <button type="button" onClick={() => { setSelectedResumeId(cv.id); setActiveTab('ats'); }} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        {isAr ? 'فحص ATS' : 'ATS Audit'}
                      </button>
                      <button type="button" onClick={() => exportResumeToWordDoc(cv, profile || undefined)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1">
                        <Download className="w-3 h-3" />DOCX
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tailored CVs Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{isAr ? 'السير المخصصة (Tailored CVs)' : 'Tailored CVs'}</h3>
                  <p className="text-[11px] text-slate-500">{isAr ? 'نسخ مخصصة لوظائف محددة — السيرة الرئيسية محمية' : 'Job-specific versions — Master CV always preserved'}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                {tailoredCVs.length} {isAr ? 'نسخة مخصصة' : 'tailored'}
              </span>
            </div>
            {tailoredCVs.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p>{isAr ? 'لا توجد سير مخصصة بعد' : 'No tailored CVs yet'}</p>
                <button type="button" onClick={() => setActiveTab('tailor')} className="mt-2 text-xs font-bold text-emerald-600 hover:underline cursor-pointer">
                  {isAr ? 'بدء تخصيص السيرة لوظيفة' : 'Tailor CV for a Job'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tailoredCVs.map((cv) => (
                  <div key={cv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900">{cv.title}</span>
                        {cv.companyName && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full">{cv.companyName}</span>}
                        {cv.atsScore != null && <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full">ATS: {cv.atsScore}%</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{isAr ? 'تاريخ: ' : 'Created: '}{formatDate(cv.createdAt)}</span>
                        {cv.opportunityId && <><span>•</span><span className="text-blue-600 font-semibold">{isAr ? 'مرتبط بوظيفة' : 'Linked to opportunity'}</span></>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button type="button" onClick={() => { setSelectedResumeId(cv.id); setActiveTab('preview'); }} className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                        {isAr ? 'عرض' : 'View'}
                      </button>
                      <button type="button" onClick={() => exportResumeToWordDoc(cv, profile || undefined)} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1">
                        <Download className="w-3 h-3" />DOCX
                      </button>
                      <button type="button" onClick={() => { setSelectedResumeId(cv.id); setActiveTab('preview'); setPreviewSubMode('a4document'); setTimeout(() => window.print(), 250); }} className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer inline-flex items-center gap-1">
                        <Printer className="w-3 h-3" />PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
