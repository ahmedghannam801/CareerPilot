import React, { useState } from 'react';
import {
  ShieldCheck,
  Trash2,
  Download,
  RotateCcw,
  Plus,
  Eye,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Database,
  RefreshCw,
  Sun,
  Moon,
  MessageCircle,
  Linkedin,
  Code2,
  ExternalLink,
} from 'lucide-react';
import { CareerMemoryFact } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';
import { checkCloudDatabase } from '../../lib/supabaseClient.js';

interface SettingsAndPrivacyViewProps {
  memoryFacts: CareerMemoryFact[];
  onAddMemory: (data: Omit<CareerMemoryFact, 'id' | 'updatedAt'>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onExportData: () => Promise<any>;
  onResetData: () => Promise<void>;
  lang: 'en' | 'ar';
  theme?: 'light' | 'dark' | 'system';
  onSetTheme?: (theme: 'light' | 'dark' | 'system') => void;
}

export const SettingsAndPrivacyView: React.FC<SettingsAndPrivacyViewProps> = ({
  memoryFacts,
  onAddMemory,
  onDeleteMemory,
  onExportData,
  onResetData,
  lang,
  theme = 'light',
  onSetTheme,
}) => {
  const [newFactCategory, setNewFactCategory] = useState<
    'Career' | 'Skills' | 'Goals' | 'Applications' | 'Interviews' | 'Preferences'
  >('Goals');
  const [newFactText, setNewFactText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleAdd = async () => {
    if (!newFactText.trim()) return;
    setIsAdding(true);
    try {
      await onAddMemory({
        category: newFactCategory,
        fact: newFactText,
        confidence: 100,
      });
      setNewFactText('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleExport = async () => {
    const data = await onExportData();
    const blob = new Blob([JSON.stringify(data.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `careerpilot-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to restore initial seed data?')) {
      setIsResetting(true);
      try {
        await onResetData();
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="p-6 bg-white border border-neutral-200 rounded-xl">
        <div className="text-xs text-neutral-500 mb-1">
          {lang === 'ar' ? 'التحكم بالبيانات والخصوصية' : 'Data Governance & Observability'}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          {lang === 'ar' ? 'مركز الخصوصية وذاكرة الذكاء الاصطناعي' : 'Privacy Center & AI Memory'}
        </h1>
        <p className="text-xs text-neutral-600 mt-1">
          Complete transparency and user sovereignty over AI memory facts and data exports
        </p>
      </div>

      {/* Theme & Visual Appearance */}
      <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              {lang === 'ar' ? 'المظهر والسمة (Appearance)' : 'Appearance & Visual Theme'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {lang === 'ar'
                ? 'اختر وضع العرض المفضل للواجهة (الوضع الداكن الليلي أو الوضع الفاتح النهاري)'
                : 'Choose your preferred visual theme across all workspaces and dashboards'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onSetTheme?.('light')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                theme === 'light'
                  ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{lang === 'ar' ? 'نهاري (Light)' : 'Light Mode'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTheme?.('dark')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'bg-blue-600 border-blue-500 text-white shadow-xs'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              <Moon className="w-4 h-4 text-blue-200" />
              <span>{lang === 'ar' ? 'ليلي (Dark)' : 'Dark Mode'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTheme?.('system')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                theme === 'system'
                  ? 'bg-purple-50 border-purple-400 text-purple-700 shadow-xs'
                  : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-600'
              }`}
            >
              <Activity className="w-4 h-4 text-purple-500" />
              <span>{lang === 'ar' ? 'تلقائي (System)' : 'System'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Career Memory Manager */}
      <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Career Memory Store</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Explicit, user-controlled factual memory injected into agents. No implicit dark tracking.
          </p>
        </div>

        {/* Add Memory Fact */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg space-y-3">
          <span className="text-xs font-semibold text-neutral-900 block">Add Explicit Memory Fact</span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={newFactCategory}
              onChange={(e) => setNewFactCategory(e.target.value as any)}
              className="text-xs p-2 border border-neutral-300 rounded-lg outline-none bg-white"
            >
              <option value="Goals">Goals</option>
              <option value="Skills">Skills</option>
              <option value="Career">Career</option>
              <option value="Applications">Applications</option>
              <option value="Interviews">Interviews</option>
              <option value="Preferences">Preferences</option>
            </select>
            <input
              type="text"
              placeholder="e.g. Target salary range is $140k-$160k with flexible hours..."
              value={newFactText}
              onChange={(e) => setNewFactText(e.target.value)}
              className="sm:col-span-2 text-xs p-2 border border-neutral-300 rounded-lg outline-none"
            />
            <button
              onClick={handleAdd}
              disabled={isAdding || !newFactText.trim()}
              className="px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Fact</span>
            </button>
          </div>
        </div>

        {/* Facts List */}
        <div className="space-y-2">
          {memoryFacts.map((fact) => (
            <div
              key={fact.id}
              className="p-3 bg-white border border-neutral-200 rounded-lg flex items-center justify-between text-xs hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                  {fact.category}
                </span>
                <span className="text-neutral-900 font-medium">{fact.fact}</span>
              </div>
              <div className="flex items-center gap-3 text-neutral-400">
                <span className="text-[11px] font-mono tabular-nums">
                  Updated: {formatDate(fact.updatedAt)}
                </span>
                <button
                  onClick={() => onDeleteMemory(fact.id)}
                  title="Delete memory fact"
                  className="hover:text-neutral-900 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Export & System Reset */}
      <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">
          {lang === 'ar' ? 'تصدير البيانات وحذف الحساب (GDPR / سيادة البيانات)' : 'Data Portability & Account Lifecycle (GDPR)'}
        </h2>
        <p className="text-xs text-neutral-500">
          {lang === 'ar'
            ? 'يمكنك تنزيل أرشيف كامل لكافة بياناتك وسيرك الذاتية بصيغة JSON، أو طلب حذف حسابك نهائياً وحذف جميع سجلاتك.'
            : 'Download your complete profile, applications, and micro-projects as structured JSON or permanently purge your account and records.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير أرشيف البيانات الكامل (JSON)' : 'Export Complete JSON Archive'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-300 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? (lang === 'ar' ? 'جاري الاستعادة...' : 'Restoring Seed...') : (lang === 'ar' ? 'استعادة البيانات التجريبية' : 'Restore Default Seed Data')}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="text-xs text-neutral-800 bg-neutral-50 p-2.5 rounded border border-neutral-200">
            {lang === 'ar' ? 'تمت إعادة ضبط البيانات بنجاح.' : 'Database state reset to default production seed.'}
          </div>
        )}
      </div>

      {/* AI Telemetry & Budget Protection Status */}
      <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">
            {lang === 'ar' ? 'مراقبة الذكاء الاصطناعي وحدود الاستهلاك' : 'AI Gateway Observability & Circuit Breaker'}
          </h2>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {lang === 'ar' ? 'محمي بواسطة Circuit Breaker' : 'Protected by Circuit Breaker'}
          </span>
        </div>
        <p className="text-xs text-neutral-500">
          {lang === 'ar'
            ? 'النظام مزود بنظام حماية تلقائي ضد تجاوز الميزانية، ومراقبة زمن الاستجابة، وحد أقصى لحجم المستندات (35,000 حرف).'
            : 'Multi-model fallback active with bounded retries, maximum 35,000 document character limits, and 25-second query timeouts.'}
        </p>
      </div>

      {/* Developer Contact */}
      <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/60 rounded-xl space-y-4 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2.5 relative">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <Code2 className="w-4.5 h-4.5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {lang === 'ar' ? 'تواصل مع مطور التطبيق' : 'Contact the Developer'}
            </h2>
            <p className="text-[11px] text-slate-400">
              {lang === 'ar' ? 'أحمد إبراهيم — مطور CareerPilot AI' : 'Ahmed Ebrahim — CareerPilot AI Developer'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 relative">
          {/* WhatsApp */}
          <a
            href="https://wa.me/201027053876"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 rounded-xl text-xs font-semibold text-[#25D366] transition-all group"
          >
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <div className="text-start">
              <div className="text-[10px] text-white/50 leading-tight">{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</div>
              <div>01027053876</div>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/ahmed-ebrahim2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 border border-[#0A66C2]/30 rounded-xl text-xs font-semibold text-[#60A5FA] transition-all group"
          >
            <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <div className="text-start">
              <div className="text-[10px] text-white/50 leading-tight">LinkedIn</div>
              <div>ahmed-ebrahim2</div>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </div>

        <p className="text-[11px] text-slate-500 relative">
          {lang === 'ar'
            ? 'للإبلاغ عن مشاكل، اقتراح ميزات جديدة، أو أي استفسارات تقنية.'
            : 'For bug reports, feature suggestions, or any technical inquiries.'}
        </p>
      </div>
    </div>
  );
};
