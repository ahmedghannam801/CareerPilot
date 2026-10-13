import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full p-6 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0077B5] text-white flex items-center justify-center font-bold text-sm">
              in
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                {lang === 'ar' ? 'مزامنة السيرة الذاتية مع LinkedIn' : 'LinkedIn Profile & CV Sync'}
              </h2>
              <p className="text-xs text-neutral-500">
                {lang === 'ar'
                  ? 'طريقة تنزيل الـ CV من لينكدإن واستخراج البيانات تلقائيًا بواسطة الذكاء الاصطناعي'
                  : 'Download your official LinkedIn CV and automatically import verified experience into CareerPilot'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Direct OAuth 2.0 Connection Option */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                {lang === 'ar' ? 'معرّف العميل نشط (Client ID Active)' : 'Client ID Active'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                78dga0bel1vivt
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900">
              {lang === 'ar' ? 'الربط الفوري المباشر عبر LinkedIn OAuth' : '1-Click Direct LinkedIn OAuth Connect'}
            </h3>
            <p className="text-[11px] text-slate-600">
              {lang === 'ar'
                ? 'تسجيل الدخول ومزامنة بيانات الملف الشخصي تلقائيًا بنقرة واحدة عبر حسابك الرسمي.'
                : 'Directly authenticate with LinkedIn to synchronize your official profile in real time.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/api/auth/linkedin';
            }}
            className="shrink-0 px-4 py-2 bg-[#0077b5] hover:bg-[#005f93] text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-3.5 h-3.5 bg-white text-[#0077b5] rounded-xs font-bold text-[10px] flex items-center justify-center">
              in
            </div>
            <span>{lang === 'ar' ? 'ربط الحساب بـ LinkedIn' : 'Connect with LinkedIn'}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <div className="h-px bg-neutral-200 flex-1" />
          <span>{lang === 'ar' ? 'أو عبر استيراد السيرة الذاتية يدويًا بالذكاء الاصطناعي' : 'OR import resume manually with AI parser'}</span>
          <div className="h-px bg-neutral-200 flex-1" />
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs">
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors ${
              activeTab === 'guide'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {lang === 'ar' ? '1. كيفية تنزيل الـ CV من لينكدإن' : '1. How to Download from LinkedIn'}
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-1.5 px-3 rounded-md font-medium transition-colors ${
              activeTab === 'paste'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            {lang === 'ar' ? '2. استخراج البيانات بالذكاء الاصطناعي' : '2. Paste & Extract Data'}
          </button>
        </div>

        {/* TAB 1: Step-by-Step LinkedIn CV Download Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-6 text-xs">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                {lang === 'ar'
                  ? 'خطوات تنزيل سيرتك الذاتية الرسمية بنقرة واحدة من LinkedIn:'
                  : 'Steps to download your official resume from LinkedIn in 1 click:'}
              </h3>

              <div className="space-y-3.5">
                {/* Step 1 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-neutral-900">
                      {lang === 'ar' ? 'افتح صفحة حسابك الشخصي على LinkedIn' : 'Open your LinkedIn Profile'}
                    </h4>
                    <p className="text-neutral-600 mt-0.5 leading-relaxed">
                      {lang === 'ar'
                        ? 'انتقل إلى ملفك الشخصي عبر الضغط على صورتك في أعلى الصفحة ثم "View Profile" (عرض الملف الشخصي).'
                        : 'Navigate to your LinkedIn profile page by clicking your avatar and selecting "View Profile".'}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-neutral-900">
                      {lang === 'ar' ? 'اضغط على زر "More" (المزيد)' : 'Click on the "More" button'}
                    </h4>
                    <p className="text-neutral-600 mt-0.5 leading-relaxed">
                      {lang === 'ar'
                        ? 'ستجد زر "More" بجوار زر "Open to" (متاح للعمل) وأسفل المسمى الوظيفي والصورة مباشرة.'
                        : 'Locate the "More" button located directly beneath your headline and next to the "Open to" button.'}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-neutral-900">
                      {lang === 'ar'
                        ? 'اختر "Save to PDF" (حفظ كـ PDF)'
                        : 'Select "Save to PDF"'}
                    </h4>
                    <p className="text-neutral-600 mt-0.5 leading-relaxed">
                      {lang === 'ar'
                        ? 'سيقوم لينكدإن فورًا بإنشاء وتنزيل ملف PDF رسمي يحتوي على كافة خبراتك، تعليمك، مهاراتك، ونبذتك الشخصية.'
                        : 'LinkedIn instantly generates a complete PDF document containing your full career history, skills, and summary.'}
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center shrink-0 font-mono text-[11px] font-bold">
                    4
                  </span>
                  <div>
                    <h4 className="font-semibold text-neutral-900">
                      {lang === 'ar' ? 'ارفع الملف أو انسخ محتواه هنا' : 'Upload or Paste the text here'}
                    </h4>
                    <p className="text-neutral-600 mt-0.5 leading-relaxed">
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
                className="text-neutral-600 hover:text-neutral-900 font-medium underline text-xs"
              >
                {lang === 'ar'
                  ? 'تجربة فورية: ملء نموذج حقيقي مسبق للتجربة'
                  : 'Quick Test: Load Sample LinkedIn Profile Data'}
              </button>

              <button
                onClick={() => setActiveTab('paste')}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg inline-flex items-center gap-1.5"
              >
                <span>{lang === 'ar' ? 'الانتقال للاستخراج والمزامنة' : 'Proceed to Extraction'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Paste / Upload & Extract */}
        {activeTab === 'paste' && (
          <div className="space-y-5 text-xs">
            {/* Upload or Paste Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-medium text-neutral-700">
                  {lang === 'ar'
                    ? 'محتوى السيرة الذاتية من LinkedIn (نص منسوخ أو ملف)'
                    : 'LinkedIn CV Content (Pasted text or Uploaded file)'}
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-neutral-600 hover:text-neutral-900 font-medium cursor-pointer inline-flex items-center gap-1">
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
                    className="text-neutral-600 hover:text-neutral-900 font-medium underline"
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
                className="w-full p-3 text-xs border border-neutral-300 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono leading-relaxed"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleExtract}
                disabled={isExtracting || !rawText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
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
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200/60 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-neutral-900">
                      {extractedData.fullName || 'Extracted Candidate'}
                    </h4>
                    <p className="text-neutral-600 text-xs mt-0.5">{extractedData.headline}</p>
                    <span className="text-[11px] text-neutral-500">{extractedData.location}</span>
                  </div>
                  <span className="text-xs font-mono bg-neutral-900 text-white px-2 py-0.5 rounded">
                    AI Parsed
                  </span>
                </div>

                {/* Summary */}
                {extractedData.summary && (
                  <div>
                    <span className="font-semibold text-neutral-900 block mb-1">
                      Professional Summary:
                    </span>
                    <p className="text-neutral-700 italic leading-relaxed">{extractedData.summary}</p>
                  </div>
                )}

                {/* Experience */}
                <div>
                  <span className="font-semibold text-neutral-900 block mb-2">
                    Work Experience ({extractedData.experience?.length || 0} positions found):
                  </span>
                  <div className="space-y-2">
                    {extractedData.experience?.map((exp: any, i: number) => (
                      <div key={i} className="p-2.5 bg-white border border-neutral-200 rounded-md">
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-neutral-900">{exp.role}</span>
                          <span className="font-mono text-[11px] text-neutral-500">
                            {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                          </span>
                        </div>
                        <span className="text-neutral-600 text-[11px]">{exp.company}</span>
                        {exp.achievements?.length > 0 && (
                          <div className="mt-1.5 space-y-0.5 text-neutral-700 text-[11px]">
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
                    <span className="font-semibold text-neutral-900 block mb-1.5">
                      Canonical Skills Identified ({extractedData.skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {extractedData.skills.map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[11px] font-mono text-neutral-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmation Action */}
                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
                  <div className="text-[11px] text-neutral-500">
                    Rule 4: Review data before synchronizing to your profile.
                  </div>
                  <button
                    onClick={handleConfirmSync}
                    disabled={isSyncing}
                    className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
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
                  <div className="p-3 bg-neutral-900 text-white rounded-lg text-center text-xs">
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
  );
};
