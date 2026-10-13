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
} from 'lucide-react';
import { CareerMemoryFact } from '../../types/index.js';
import { formatDate } from '../../lib/utils.js';

interface SettingsAndPrivacyViewProps {
  memoryFacts: CareerMemoryFact[];
  onAddMemory: (data: Omit<CareerMemoryFact, 'id' | 'updatedAt'>) => Promise<void>;
  onDeleteMemory: (id: string) => Promise<void>;
  onExportData: () => Promise<any>;
  onResetData: () => Promise<void>;
  lang: 'en' | 'ar';
}

export const SettingsAndPrivacyView: React.FC<SettingsAndPrivacyViewProps> = ({
  memoryFacts,
  onAddMemory,
  onDeleteMemory,
  onExportData,
  onResetData,
  lang,
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
        <h2 className="text-sm font-semibold text-neutral-900">Data Portability & Database Reset</h2>
        <p className="text-xs text-neutral-500">
          Download your complete profile, applications, and micro-projects as structured JSON or restore clean state.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 text-xs font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Complete JSON Archive</span>
          </button>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-300 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Restoring Seed...' : 'Restore Default Seed Data'}</span>
          </button>
        </div>

        {resetSuccess && (
          <div className="text-xs text-neutral-800 bg-neutral-50 p-2.5 rounded border border-neutral-200">
            Database state reset to default production seed.
          </div>
        )}
      </div>
    </div>
  );
};
