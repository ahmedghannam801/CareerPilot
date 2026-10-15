import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  ArrowRight,
  ExternalLink,
  X,
  HelpCircle,
  Copy,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { signInWithLinkedIn } from '../../lib/supabaseClient.js';

interface LinkedInSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParseProfile: (rawText: string) => Promise<any>;
  onSyncProfile: (extracted: any) => Promise<any>;
  lang: 'en' | 'ar';
}

export const LinkedInSyncModal: React.FC<LinkedInSyncModalProps> = ({
  isOpen,
  onClose,
  onParseProfile,
  onSyncProfile,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'paste' | 'upload'>('guide');
  const [rawText, setRawText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setRawText(content);
        setActiveTab('paste');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    const sample = `Mohamed Ghnnam
Senior Full-Stack Software Engineer & AI Systems Architect
London, United Kingdom · Contact info

Summary
Senior Full-Stack Engineer with over 5 years of experience architecting distributed cloud systems, real-time event-driven applications, and generative AI multi-agent orchestration layers. Led microservices serving 4M+ daily requests.

Experience
Senior Full-Stack Engineer
Synthetix Platforms · Full-time
Jul 2023 - Present · 1 yr 4 mos
Remote
- Built and optimized event-driven microservices processing 4M+ requests daily with Node.js and TypeScript.
- Architected AI orchestration layer with strict Zod schema validation and streaming outputs.
- Reduced p95 response times from 340ms to 78ms through query tuning and Redis caching.

Software Engineer
CoreStack Solutions · Full-time
Aug 2021 - Jun 2023 · 1 yr 11 mos
Hybrid · London
- Developed REST and GraphQL APIs with Express, TypeScript, and PostgreSQL.
- Led migration of legacy frontend to modular React components, boosting test coverage to 85%.

Education
University of Technology
Bachelor of Science (B.Sc.), Computer Science & Software Engineering
2019 - 2023
Grade: 3.8 / 4.0

Skills
TypeScript · React.js · Node.js · Next.js · PostgreSQL · Docker · Generative AI · System Architecture · Tailwind CSS · Drizzle ORM

Certifications
AWS Certified Developer Associate
Advanced Relational Database Design & Performance Tuning`;

    setRawText(sample);
    setActiveTab('paste');
  };

  const handleExtract = async () => {
    if (!rawText.trim()) return;
    setIsExtracting(true);
    try {
      const res = await onParseProfile(rawText);
      setExtractedData(res.extracted);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleConfirmSync = async () => {
    if (!extractedData) return;
    setIsSyncing(true);
    try {
      await onSyncProfile(extractedData);
      setSyncSuccess(true);
      setTimeout(() => {
        setSyncSuccess(false);
        onClose();
      }, 2000);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  return (
    <div className="glass-surface fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }} onClick={onClose}>
      <div className="card-surface rounded-2xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2.5rem)] overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-start justify-between border-hairline p-5 sm:p-6 shrink-0" style={{ borderBottomColor: 'var(--border-subtle)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm" style={{ backgroundColor: '#0077B5', color: 'white' }}>
              in
            </div>
            <div>
              <h2 className="text-headline-lg" style={{ color: 'var(--on-surface)' }}>
                {lang === 'ar' ? 'مزامنة السيرة الذاتية مع LinkedIn' : 'LinkedIn Profile & CV Sync'}
              </h2>
              <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                {lang === 'ar'
                  ? 'طريقة تنزيل الـ CV من لينكدإن واستخراج البيانات تلقائيًا بواسطة الذكاء الاصطناعي'
                  : 'Download your official LinkedIn CV and automatically import verified experience into CareerPilot'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary p-1.5 rounded-lg cursor-pointer"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">

        {/* Direct OAuth 2.0 Connection Option */}
        <div className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ background: 'linear-gradient(to right, var(--primary-container), var(--secondary-container))', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--primary)' }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="badge-pill inline-flex items-center gap-1 text-label-caps" style={{ backgroundColor: 'var(--primary)', color: 'var(--on-primary)' }}>
                <CheckCircle2 className="w-3 h-3" />
                {lang === 'ar' ? 'معرّف العميل نشط (Client ID Active)' : 'Client ID Active'}
              </span>
              <span className="text-label-caps font-mono" style={{ color: 'var(--on-surface-variant)' }}>
                78dga0bel1vivt
              </span>
            </div>
            <h3 className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>
              {lang === 'ar' ? 'الربط الفوري المباشر عبر LinkedIn OAuth' : '1-Click Direct LinkedIn OAuth Connect'}
            </h3>
            <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
              {lang === 'ar'
                ? 'تسجيل الدخول ومزامنة بيانات الملف الشخصي تلقائيًا بنقرة واحدة عبر حسابك الرسمي.'
                : 'Directly authenticate with LinkedIn to synchronize your official profile in real time.'}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await signInWithLinkedIn();
            }}
            className="btn-primary shrink-0 px-4 py-2 text-body-sm font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            style={{ backgroundColor: '#0077b5', color: 'white' }}
          >
            <div className="w-3.5 h-3.5 rounded-xs font-bold text-[10px] flex items-center justify-center" style={{ backgroundColor: 'white', color: '#0077b5' }}>
              in
            </div>
            <span>{lang === 'ar' ? 'ربط الحساب بـ LinkedIn' : 'Connect with LinkedIn'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
          <span>{lang === 'ar' ? 'أو عبر استيراد السيرة الذاتية يدويًا بالذكاء الاصطناعي' : 'OR import resume manually with AI parser'}</span>
          <div className="h-px flex-1" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 rounded-lg text-body-sm" style={{ backgroundColor: 'var(--surface-container)' }}>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors ${
              activeTab === 'guide'
                ? 'shadow-xs'
                : ''
            }`}
            style={activeTab === 'guide' ? { backgroundColor: 'var(--surface)', color: 'var(--on-surface)' } : { color: 'var(--on-surface-variant)' }}
          >
            {lang === 'ar' ? '1. كيفية تنزيل الـ CV من لينكدإن' : '1. How to Download from LinkedIn'}
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors ${
              activeTab === 'paste'
                ? 'shadow-xs'
                : ''
            }`}
            style={activeTab === 'paste' ? { backgroundColor: 'var(--surface)', color: 'var(--on-surface)' } : { color: 'var(--on-surface-variant)' }}
          >
            {lang === 'ar' ? '2. استخراج البيانات بالذكاء الاصطناعي' : '2. Paste & Extract Data'}
          </button>
        </div>

        {/* TAB 1: Step-by-Step LinkedIn CV Download Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-6 text-body-sm">
            <div className="card-surface p-4 rounded-xl space-y-4" style={{ backgroundColor: 'var(--surface-container)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
              <h3 className="text-headline-sm text-label-caps" style={{ color: 'var(--on-surface)' }}>
                {lang === 'ar'
                  ? 'خطوات تنزيل سيرتك الذاتية الرسمية بنقرة واحدة من LinkedIn:'
                  : 'Steps to download your official resume from LinkedIn in 1 click:'}
              </h3>

              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-mono text-label-caps font-bold" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--surface)' }}>
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-body-base" style={{ color: 'var(--on-surface)' }}>
                      {lang === 'ar' ? 'افتح صفحة حسابك الشخصي على LinkedIn' : 'Open your LinkedIn Profile'}
                    </h4>
                    <p className="mt-0.5 leading-relaxed text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      {lang === 'ar'
                        ? 'انتقل إلى ملفك الشخصي عبر الضغط على صورتك في أعلى الصفحة ثم "View Profile" (عرض الملف الشخصي).'
                        : 'Navigate to your LinkedIn profile page by clicking your avatar and selecting "View Profile".'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-mono text-label-caps font-bold" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--surface)' }}>
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-body-base" style={{ color: 'var(--on-surface)' }}>
                      {lang === 'ar' ? 'اضغط على زر "More" (المزيد)' : 'Click on the "More" button'}
                    </h4>
                    <p className="mt-0.5 leading-relaxed text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      {lang === 'ar'
                        ? 'ستجد زر "More" بجوار زر "Open to" (متاح للعمل) وأسفل المسمى الوظيفي والصورة مباشرة.'
                        : 'Locate the "More" button located directly beneath your headline and next to the "Open to" button.'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-mono text-label-caps font-bold" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--surface)' }}>
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-body-base" style={{ color: 'var(--on-surface)' }}>
                      {lang === 'ar'
                        ? 'اختر "Save to PDF" (حفظ كـ PDF)'
                        : 'Select "Save to PDF"'}
                    </h4>
                    <p className="mt-0.5 leading-relaxed text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      {lang === 'ar'
                        ? 'سيقوم لينكدإن فورًا بإنشاء وتنزيل ملف PDF رسمي يحتوي على كافة خبراتك، تعليمك، مهاراتك، ونبذتك الشخصية.'
                        : 'LinkedIn instantly generates a complete PDF document containing your full career history, skills, and summary.'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-mono text-label-caps font-bold" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--surface)' }}>
                    4
                  </span>
                  <div>
                    <h4 className="font-semibold text-body-base" style={{ color: 'var(--on-surface)' }}>
                      {lang === 'ar' ? 'ارفع الملف أو انسخ محتواه هنا' : 'Upload or Paste the text here'}
                    </h4>
                    <p className="mt-0.5 leading-relaxed text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      {lang === 'ar'
                        ? 'افتح الملف أو انسخ نصوصه وضعها في الخطوة الثانية، وسيتولى عميل LinkedIn Agent استخراج كل البيانات وبناء نسخة CV وتحديث مهاراتك تلقائيًا.'
                        : 'Drop your downloaded file or paste its content in Step 2. The LinkedIn Agent will parse and synchronize everything automatically.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleLoadSample}
                className="font-medium underline text-body-sm"
                style={{ color: 'var(--on-surface-variant)' }}
              >
                {lang === 'ar'
                  ? 'تجربة فورية: ملء نموذج حقيقي مسبق للتجربة'
                  : 'Quick Test: Load Sample LinkedIn Profile Data'}
              </button>

              <button
                onClick={() => setActiveTab('paste')}
                className="btn-primary px-4 py-2 text-body-sm font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <span>{lang === 'ar' ? 'الانتقال للاستخراج والمزامنة' : 'Proceed to Extraction'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Paste / Upload & Extract */}
        {activeTab === 'paste' && (
          <div className="space-y-5 text-body-sm">
            {/* Upload or Paste Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-body-base" style={{ color: 'var(--on-surface-variant)' }}>
                  {lang === 'ar'
                    ? 'محتوى السيرة الذاتية من LinkedIn (نص منسوخ أو ملف)'
                    : 'LinkedIn CV Content (Pasted text or Uploaded file)'}
                </label>
                <div className="flex items-center gap-2">
                  <label className="font-medium cursor-pointer inline-flex items-center gap-1 text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    <Upload className="w-3 h-3" />
                    <span>{fileName ? `File: ${fileName}` : 'Upload File'}</span>
                    <input
                      type="file"
                      accept=".txt,.pdf,.json"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={handleLoadSample}
                    className="font-medium underline text-body-sm"
                    style={{ color: 'var(--on-surface-variant)' }}
                  >
                    Load Sample
                  </button>
                </div>
              </div>
              <textarea
                rows={7}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={
                  lang === 'ar'
                    ? 'الصق هنا نص ملف الـ PDF أو النصوص المنسوخة من صفحتك على لينكدإن...'
                    : 'Paste the exported text from your LinkedIn PDF or profile page here...'
                }
                className="input-field w-full p-3 text-body-sm rounded-lg outline-none font-mono leading-relaxed"
                style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleExtract}
                disabled={isExtracting || !rawText.trim()}
                className="btn-primary px-4 py-2 text-body-sm font-semibold rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                <span>
                  {isExtracting
                    ? lang === 'ar'
                      ? 'جاري استخراج البيانات بالذكاء الاصطناعي...'
                      : 'Extracting with AI Agent...'
                    : lang === 'ar'
                    ? 'استخراج البيانات تلقائيًا'
                    : 'Extract Profile Data'}
                </span>
              </button>
            </div>

            {/* Structured Preview After Extraction */}
            {extractedData && (
              <div className="card-surface p-4 rounded-xl space-y-4" style={{ backgroundColor: 'var(--surface-container)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between border-hairline pb-3" style={{ borderBottomColor: 'var(--border-subtle)' }}>
                  <div>
                    <h4 className="text-headline-sm" style={{ color: 'var(--on-surface)' }}>
                      {extractedData.fullName || 'Extracted Candidate'}
                    </h4>
                    <p className="text-body-sm mt-0.5" style={{ color: 'var(--on-surface-variant)' }}>{extractedData.headline}</p>
                    <span className="text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>{extractedData.location}</span>
                  </div>
                  <span className="badge-pill text-body-xs font-mono" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--surface)' }}>
                    AI Parsed
                  </span>
                </div>

                {/* Summary */}
                {extractedData.summary && (
                  <div>
                    <span className="font-semibold block mb-1 text-body-base" style={{ color: 'var(--on-surface)' }}>
                      Professional Summary:
                    </span>
                    <p className="italic leading-relaxed text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{extractedData.summary}</p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <span className="font-semibold block mb-2 text-body-base" style={{ color: 'var(--on-surface)' }}>
                    Work Experience ({extractedData.experience?.length || 0} positions found):
                  </span>
                  <div className="space-y-2">
                    {extractedData.experience?.map((exp: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-md" style={{ backgroundColor: 'var(--surface)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)' }}>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-body-base" style={{ color: 'var(--on-surface)' }}>{exp.role}</span>
                          <span className="font-mono text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
                            {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        <span className="text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>{exp.company}</span>
                        {exp.achievements?.length > 0 && (
                          <div className="mt-1.5 space-y-0.5 text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
                            {exp.achievements.map((ach: string, j: number) => (
                              <div key={j}>· {ach}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                {extractedData.skills?.length > 0 && (
                  <div>
                    <span className="font-semibold block mb-1.5 text-body-base" style={{ color: 'var(--on-surface)' }}>
                      Canonical Skills Identified ({extractedData.skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {extractedData.skills.map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="badge-pill px-2 py-0.5 rounded text-body-xs font-mono"
                          style={{ backgroundColor: 'var(--surface)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmation Action */}
                <div className="pt-3 border-hairline flex items-center justify-between" style={{ borderTopColor: 'var(--border)' }}>
                  <div className="text-body-xs" style={{ color: 'var(--on-surface-variant)' }}>
                    Rule 4: Review data before synchronizing to your profile.
                  </div>
                  <button
                    onClick={handleConfirmSync}
                    disabled={isSyncing}
                    className="btn-primary px-4 py-2 text-body-sm font-semibold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isSyncing
                        ? lang === 'ar'
                          ? 'جاري المزامنة...'
                          : 'Synchronizing...'
                        : lang === 'ar'
                        ? 'اعتماد ومزامنة البيانات مع CareerPilot'
                        : 'Confirm & Synchronize with CareerPilot'}
                    </span>
                  </button>
                </div>

                {syncSuccess && (
                  <div className="p-3 rounded-lg text-center text-body-sm" style={{ backgroundColor: 'var(--on-surface)', color: 'var(--surface)' }}>
                    {lang === 'ar'
                      ? 'تمت المزامنة بنجاح! تم تحديث بياناتك وإنشاء سيرة ذاتية خاصة بلينكدإن.'
                      : 'Successfully synchronized! Profile updated and new LinkedIn resume created.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
