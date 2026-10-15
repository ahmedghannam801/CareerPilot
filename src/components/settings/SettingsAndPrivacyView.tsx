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
      <div
        className="p-6 surface-elevated border-hairline rounded-xl"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div
          className="text-xs mb-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar' ? 'التحكم بالبيانات والخصوصية' : 'Data Governance & Observability'}
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {lang === 'ar' ? 'مركز الخصوصية وذاكرة الذكاء الاصطناعي' : 'Privacy Center & AI Memory'}
        </h1>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          Complete transparency and user sovereignty over AI memory facts and data exports
        </p>
      </div>

      {/* Theme & Visual Appearance */}
      <div
        className="p-6 surface-elevated border-hairline rounded-xl space-y-3"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              {lang === 'ar' ? 'المظهر والسمة (Appearance)' : 'Appearance & Visual Theme'}
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {lang === 'ar'
                ? 'اختر وضع العرض المفضل للواجهة (الوضع الداكن الليلي أو الوضع الفاتح النهاري)'
                : 'Choose your preferred visual theme across all workspaces and dashboards'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onSetTheme?.('light')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={
                theme === 'light'
                  ? {
                      backgroundColor: 'var(--accent-blue-50)',
                      borderColor: 'var(--accent-blue-400)',
                      color: 'var(--accent-blue-700)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }
                  : {
                      backgroundColor: 'var(--surface-muted)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              <Sun className="w-4 h-4" style={{ color: 'var(--accent-amber-500)' }} />
              <span>{lang === 'ar' ? 'نهاري (Light)' : 'Light Mode'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTheme?.('dark')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={
                theme === 'dark'
                  ? {
                      backgroundColor: 'var(--accent-blue-600)',
                      borderColor: 'var(--accent-blue-500)',
                      color: '#ffffff',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }
                  : {
                      backgroundColor: 'var(--surface-muted)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              <Moon className="w-4 h-4" style={{ color: 'var(--accent-blue-200)' }} />
              <span>{lang === 'ar' ? 'ليلي (Dark)' : 'Dark Mode'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSetTheme?.('system')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={
                theme === 'system'
                  ? {
                      backgroundColor: 'var(--accent-purple-50)',
                      borderColor: 'var(--accent-purple-400)',
                      color: 'var(--accent-purple-700)',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }
                  : {
                      backgroundColor: 'var(--surface-muted)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-secondary)',
                    }
              }
            >
              <Activity className="w-4 h-4" style={{ color: 'var(--accent-purple-500)' }} />
              <span>{lang === 'ar' ? 'تلقائي (System)' : 'System'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Career Memory Manager */}
      <div
        className="p-6 surface-elevated border-hairline rounded-xl space-y-6"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div>
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Career Memory Store
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--text-secondary)' }}
          >
            Explicit, user-controlled factual memory injected into agents. No implicit dark tracking.
          </p>
        </div>

        {/* Add Memory Fact */}
        <div
          className="p-4 border-hairline rounded-lg space-y-3"
          style={{
            backgroundColor: 'var(--surface-muted)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <span
            className="text-xs font-semibold block"
            style={{ color: 'var(--text-primary)' }}
          >
            Add Explicit Memory Fact
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select
              value={newFactCategory}
              onChange={(e) => setNewFactCategory(e.target.value as any)}
              className="text-xs p-2 border-hairline rounded-lg outline-none"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
              }}
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
              className="sm:col-span-2 text-xs p-2 border-hairline rounded-lg outline-none"
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--surface-elevated)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding || !newFactText.trim()}
              className="px-3 py-2 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
              style={{
                color: '#ffffff',
                backgroundColor: 'var(--text-primary)',
              }}
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
              className="p-3 border-hairline rounded-lg flex items-center justify-between text-xs transition-colors"
              style={{
                backgroundColor: 'var(--surface-elevated)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-[11px] px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--text-primary)',
                    backgroundColor: 'var(--surface-muted)',
                  }}
                >
                  {fact.category}
                </span>
                <span
                  className="font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {fact.fact}
                </span>
              </div>
              <div
                className="flex items-center gap-3"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <span className="text-[11px] font-mono tabular-nums">
                  Updated: {formatDate(fact.updatedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteMemory(fact.id)}
                  title="Delete memory fact"
                  className="transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Export & System Reset */}
      <div
        className="p-6 surface-elevated border-hairline rounded-xl space-y-4"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <h2
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {lang === 'ar' ? 'تصدير البيانات وحذف الحساب (GDPR / سيادة البيانات)' : 'Data Portability & Account Lifecycle (GDPR)'}
        </h2>
        <p
          className="text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar'
            ? 'يمكنك تنزيل أرشيف كامل لكافة بياناتك وسيرك الذاتية بصيغة JSON، أو طلب حذف حسابك نهائياً وحذف جميع سجلاتك.'
            : 'Download your complete profile, applications, and micro-projects as structured JSON or permanently purge your account and records.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 text-xs font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-muted)',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'تصدير أرشيف البيانات الكامل (JSON)' : 'Export Complete JSON Archive'}</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-medium border-hairline rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-elevated)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border-default)',
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? (lang === 'ar' ? 'جاري الاستعادة...' : 'Restoring Seed...') : (lang === 'ar' ? 'استعادة البيانات التجريبية' : 'Restore Default Seed Data')}</span>
          </button>
        </div>

        {resetSuccess && (
          <div
            className="text-xs p-2.5 rounded border-hairline"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-muted)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'var(--border-hairline)',
            }}
          >
            {lang === 'ar' ? 'تمت إعادة ضبط البيانات بنجاح.' : 'Database state reset to default production seed.'}
          </div>
        )}
      </div>

      {/* AI Telemetry & Budget Protection Status */}
      <div
        className="p-6 surface-elevated border-hairline rounded-xl space-y-3"
        style={{
          backgroundColor: 'var(--surface-elevated)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {lang === 'ar' ? 'مراقبة الذكاء الاصطناعي وحدود الاستهلاك' : 'AI Gateway Observability & Circuit Breaker'}
          </h2>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
            style={{
              backgroundColor: 'var(--accent-emerald-50)',
              color: 'var(--accent-emerald-700)',
              borderColor: 'var(--accent-emerald-200)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--accent-emerald-500)' }}
            />
            {lang === 'ar' ? 'محمي بواسطة Circuit Breaker' : 'Protected by Circuit Breaker'}
          </span>
        </div>
        <p
          className="text-xs"
          style={{ color: 'var(--text-secondary)' }}
        >
          {lang === 'ar'
            ? 'النظام مزود بنظام حماية تلقائي ضد تجاوز الميزانية، ومراقبة زمن الاستجابة، وحد أقصى لحجم المستندات (35,000 حرف).'
            : 'Multi-model fallback active with bounded retries, maximum 35,000 document character limits, and 25-second query timeouts.'}
        </p>
      </div>

      {/* Developer Contact */}
      <div
        className="p-6 border rounded-xl space-y-4 relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, var(--surface-slate-900), var(--surface-slate-800))',
          borderColor: 'var(--border-slate-700-60)',
        }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
        />
        <div className="flex items-center gap-2.5 relative">
          <div
            className="w-9 h-9 rounded-xl border flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              borderColor: 'rgba(59, 130, 246, 0.3)',
            }}
          >
            <Code2 className="w-4.5 h-4.5" style={{ color: 'var(--accent-blue-400)' }} />
          </div>
          <div>
            <h2
              className="text-sm font-bold"
              style={{ color: '#ffffff' }}
            >
              {lang === 'ar' ? 'تواصل مع مطور التطبيق' : 'Contact the Developer'}
            </h2>
            <p
              className="text-[11px]"
              style={{ color: 'var(--surface-slate-400)' }}
            >
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
            className="inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all group"
            style={{
              backgroundColor: 'rgba(37, 211, 102, 0.15)',
              borderColor: 'rgba(37, 211, 102, 0.3)',
              color: '#25D366',
            }}
          >
            <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <div className="text-start">
              <div className="text-[10px] leading-tight" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {lang === 'ar' ? 'واتساب' : 'WhatsApp'}
              </div>
              <div>01027053876</div>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/ahmed-ebrahim2"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold transition-all group"
            style={{
              backgroundColor: 'rgba(10, 102, 194, 0.15)',
              borderColor: 'rgba(10, 102, 194, 0.3)',
              color: '#60A5FA',
            }}
          >
            <Linkedin className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <div className="text-start">
              <div className="text-[10px] leading-tight" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                LinkedIn
              </div>
              <div>ahmed-ebrahim2</div>
            </div>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        </div>

        <p
          className="text-[11px] relative"
          style={{ color: 'var(--surface-slate-500)' }}
        >
          {lang === 'ar'
            ? 'للإبلاغ عن مشاكل، اقتراح ميزات جديدة، أو أي استفسارات تقنية.'
            : 'For bug reports, feature suggestions, or any technical inquiries.'}
        </p>
      </div>
    </div>
  );
};
