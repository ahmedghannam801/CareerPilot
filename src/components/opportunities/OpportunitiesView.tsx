import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Filter,
  Search,
  RefreshCw,
  SlidersHorizontal,
  X,
  Globe,
  Radio,
} from 'lucide-react';
import { Opportunity, JobMatchAnalysis, ResumeVersion } from '../../types/index.js';
import { TailoredCVModal } from './TailoredCVModal.js';

interface OpportunitiesViewProps {
  opportunities: Opportunity[];
  onAddOpportunity: (opp: Partial<Opportunity>) => Promise<void>;
  onDeleteOpportunity: (id: string) => Promise<void>;
  onParseJD: (rawText: string) => Promise<any>;
  onCalculateMatch: (opportunityId: string) => Promise<JobMatchAnalysis>;
  onPrepareApplication: (opportunityId: string) => void;
  onSyncFeeds?: () => Promise<any>;
  onGetPlatformsStatus?: () => Promise<any>;
  onTailorCV?: (opportunityId: string) => Promise<any>;
  onSaveResume?: (resume: ResumeVersion) => Promise<void>;
  onNavigateToCV?: () => void;
  lang: 'en' | 'ar';
}

export const OpportunitiesView: React.FC<OpportunitiesViewProps> = ({
  opportunities,
  onAddOpportunity,
  onDeleteOpportunity,
  onParseJD,
  onCalculateMatch,
  onPrepareApplication,
  onSyncFeeds,
  onGetPlatformsStatus,
  onTailorCV,
  onSaveResume,
  onNavigateToCV,
  lang,
}) => {
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(opportunities[0] || null);
  const [matchAnalysis, setMatchAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [tailoringOpp, setTailoringOpp] = useState<Opportunity | null>(null);
  const [isTailoringModalOpen, setIsTailoringModalOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [rawJDText, setRawJDText] = useState('');
  const [isParsingJD, setIsParsingJD] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWorkModel, setFilterWorkModel] = useState<'ALL' | 'Remote' | 'Hybrid' | 'On-site'>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
  const [filterMatchScore, setFilterMatchScore] = useState<'ALL' | '80' | '60' | '40'>('ALL');
  const [filterEmploymentType, setFilterEmploymentType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'match' | 'newest' | 'company'>('match');

  // Platform Feeds Sync States
  const [isSyncingFeeds, setIsSyncingFeeds] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [showPlatformsModal, setShowPlatformsModal] = useState(false);
  const [platformsStatusList, setPlatformsStatusList] = useState<any[]>([]);

  // Initial load match calculation
  const handleSelectOpp = async (opp: Opportunity) => {
    setSelectedOpp(opp);
    setIsCalculating(true);
    try {
      const match = await onCalculateMatch(opp.id);
      setMatchAnalysis(match);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleParseAndAddJD = async () => {
    if (!rawJDText.trim()) return;
    setIsParsingJD(true);
    try {
      const parsed = await onParseJD(rawJDText);
      await onAddOpportunity({
        title: parsed.parsed.title,
        company: parsed.parsed.company,
        location: parsed.parsed.location,
        workModel: parsed.parsed.workModel,
        employmentType: parsed.parsed.employmentType,
        salary: parsed.parsed.salary,
        description: parsed.parsed.description,
        requirements: parsed.parsed.requirements,
        preferredSkills: parsed.parsed.preferredSkills,
        isManual: true,
      });
      setShowAddModal(false);
      setRawJDText('');
    } finally {
      setIsParsingJD(false);
    }
  };

  const handleSyncFeeds = async () => {
    if (!onSyncFeeds) return;
    setIsSyncingFeeds(true);
    setSyncStatusMsg(null);
    try {
      const res = await onSyncFeeds();
      const count = res.addedCount ?? 0;
      setSyncStatusMsg(
        lang === 'ar'
          ? `تمت مزامنة ${count} فرصة جديدة بنجاح من منصات التوظيف الحية!`
          : `Successfully synchronized ${count} new opportunities from live feeds!`
      );
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } finally {
      setIsSyncingFeeds(false);
    }
  };

  const handleOpenPlatformsModal = async () => {
    if (onGetPlatformsStatus) {
      const res = await onGetPlatformsStatus();
      setPlatformsStatusList(res.platforms || []);
    }
    setShowPlatformsModal(true);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterWorkModel('ALL');
    setFilterPlatform('ALL');
    setFilterMatchScore('ALL');
    setFilterEmploymentType('ALL');
    setSortBy('match');
  };

  const handleOpenTailorModal = (opp: Opportunity) => {
    setTailoringOpp(opp);
    setIsTailoringModalOpen(true);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    filterWorkModel !== 'ALL' ||
    filterPlatform !== 'ALL' ||
    filterMatchScore !== 'ALL' ||
    filterEmploymentType !== 'ALL';

  // Multi-dimensional filtering logic
  const filteredOpps = useMemo(() => {
    return opportunities
      .filter((opp) => {
        // 1. Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = opp.title.toLowerCase().includes(q);
          const matchCompany = opp.company.toLowerCase().includes(q);
          const matchReqs = opp.requirements.some((r) => r.toLowerCase().includes(q));
          if (!matchTitle && !matchCompany && !matchReqs) return false;
        }

        // 2. Work Model
        if (filterWorkModel !== 'ALL' && opp.workModel !== filterWorkModel) {
          return false;
        }

        // 3. Platform
        if (filterPlatform !== 'ALL') {
          const plat = opp.sourcePlatform || 'Direct';
          if (plat.toLowerCase() !== filterPlatform.toLowerCase()) return false;
        }

        // 4. Match Score threshold
        if (filterMatchScore !== 'ALL') {
          const score = opp.matchScore ?? 75;
          const min = parseInt(filterMatchScore, 10);
          if (score < min) return false;
        }

        // 5. Employment Type
        if (filterEmploymentType !== 'ALL' && opp.employmentType !== filterEmploymentType) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') {
          return (b.matchScore ?? 0) - (a.matchScore ?? 0);
        }
        if (sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === 'company') {
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [
    opportunities,
    searchQuery,
    filterWorkModel,
    filterPlatform,
    filterMatchScore,
    filterEmploymentType,
    sortBy,
  ]);

  const isAr = lang === 'ar';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white border border-neutral-200 rounded-xl">
        <div>
          <div className="text-xs text-neutral-500 mb-1">
            {lang === 'ar' ? 'سوق الفرص والذكاء التنافسي' : 'Opportunity Discovery & Live Feeds'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            {lang === 'ar' ? 'الفرص والوظائف والتدريب' : 'Jobs & Internships Hub'}
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            {lang === 'ar'
              ? 'مزامنة حية مع LinkedIn وWuzzuf ومنصات التوظيف مع إمكانية التقديم الفوري وإنشاء سيرة ذاتية مخصصة لكل فرصة'
              : 'Live sync with LinkedIn, Wuzzuf & hiring portals with direct apply & tailored CV generation for every role'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Platform Status Button */}
          <button
            onClick={handleOpenPlatformsModal}
            className="px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-neutral-600" />
            <span>{lang === 'ar' ? 'حالة المنصات' : 'Platforms Status'}</span>
          </button>

          {/* Sync Feeds CTA Button */}
          <button
            onClick={handleSyncFeeds}
            disabled={isSyncingFeeds}
            className="px-3.5 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFeeds ? 'animate-spin' : ''}`} />
            <span>
              {isSyncingFeeds
                ? lang === 'ar'
                  ? 'جاري المزامنة مع المنصات...'
                  : 'Syncing Live Feeds...'
                : lang === 'ar'
                ? 'مزامنة مع منصات التوظيف (JSearch & LinkedIn)'
                : 'Sync Jobs & Internships'}
            </span>
          </button>

          {/* Add Opportunity / Parse JD */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-medium text-neutral-900 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ar' ? 'إضافة فرصة / لصق JD' : 'Add Opportunity / Paste JD'}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Toast/Banner */}
      {syncStatusMsg && (
        <div className="p-3 bg-neutral-900 text-white rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncStatusMsg}</span>
          </div>
          <button onClick={() => setSyncStatusMsg(null)} className="text-neutral-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ADVANCED MULTI-DIMENSIONAL FILTER TOOLBAR (الفلتر الشامل) */}
      <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-3.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-neutral-900">
            <SlidersHorizontal className="w-4 h-4 text-neutral-700" />
            <span>{lang === 'ar' ? 'فلتر وتصفية الوظائف والتدريب' : 'Filter & Refine Opportunities'}</span>
            <span className="text-neutral-400 font-mono tabular-nums text-[11px] font-normal">
              ({filteredOpps.length} of {opportunities.length})
            </span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-neutral-600 hover:text-neutral-900 font-medium underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>{lang === 'ar' ? 'إعادة ضبط الفلتر' : 'Reset Filters'}</span>
            </button>
          )}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder={lang === 'ar' ? 'بحث بالمسمى أو الشركة أو المهارة...' : 'Search title, company, skill...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50/50 outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {/* 2. Employment Type Filter (وظيفة / تدريب) */}
          <div>
            <select
              value={filterEmploymentType}
              onChange={(e) => setFilterEmploymentType(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-neutral-50/50 outline-none font-semibold text-neutral-800"
            >
              <option value="ALL">{lang === 'ar' ? 'النوع: الكل (وظائف وتدريب)' : 'Type: All (Jobs & Internships)'}</option>
              <option value="Full-time">{lang === 'ar' ? '💼 وظائف بدوام كامل' : '💼 Full-time Jobs'}</option>
              <option value="Internship">{lang === 'ar' ? '🎓 فرص تدريب وتأهيل' : '🎓 Internships'}</option>
              <option value="Contract">{lang === 'ar' ? '📄 تعاقد وعمل حر' : '📄 Contract'}</option>
              <option value="Part-time">{lang === 'ar' ? '⏱️ دوام جزئي' : '⏱️ Part-time'}</option>
            </select>
          </div>

          {/* 3. Work Model Filter */}
          <div>
            <select
              value={filterWorkModel}
              onChange={(e) => setFilterWorkModel(e.target.value as any)}
              className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-neutral-50/50 outline-none"
            >
              <option value="ALL">{lang === 'ar' ? 'طبيعة العمل: الكل' : 'Work Model: All'}</option>
              <option value="Remote">{lang === 'ar' ? 'عن بُعد (Remote)' : 'Remote Only'}</option>
              <option value="Hybrid">{lang === 'ar' ? 'هجين (Hybrid)' : 'Hybrid'}</option>
              <option value="On-site">{lang === 'ar' ? 'مقر العمل (On-site)' : 'On-site'}</option>
            </select>
          </div>

          {/* 4. Source Platform Filter */}
          <div>
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-neutral-50/50 outline-none"
            >
              <option value="ALL">{lang === 'ar' ? 'المنصة: الكل' : 'Source: All'}</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Wuzzuf">Wuzzuf</option>
              <option value="JSearch">JSearch Feed</option>
              <option value="RemoteOK">RemoteOK</option>
              <option value="Direct">Direct / Other</option>
            </select>
          </div>

          {/* 5. Match Score Threshold */}
          <div>
            <select
              value={filterMatchScore}
              onChange={(e) => setFilterMatchScore(e.target.value as any)}
              className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-neutral-50/50 outline-none"
            >
              <option value="ALL">{lang === 'ar' ? 'درجة التوافق: الكل' : 'Match Score: All'}</option>
              <option value="80">{lang === 'ar' ? '80%+ توافق عالي' : '80%+ High Fit'}</option>
              <option value="60">{lang === 'ar' ? '60%+ توافق جيد' : '60%+ Solid Fit'}</option>
              <option value="40">{lang === 'ar' ? '40%+ توافق مقبول' : '40%+ Moderate Fit'}</option>
            </select>
          </div>

          {/* 6. Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full text-xs p-2 border border-neutral-200 rounded-lg bg-neutral-50/50 outline-none"
            >
              <option value="match">{lang === 'ar' ? 'ترتيب: أعلى توافق' : 'Sort: Highest Match'}</option>
              <option value="newest">{lang === 'ar' ? 'ترتيب: الأحدث' : 'Sort: Newest'}</option>
              <option value="company">{lang === 'ar' ? 'ترتيب: اسم الشركة' : 'Sort: Company'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left List, Right Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Opportunity Cards */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1 py-0.5">
            <span data-testid="opportunities-count">
              {lang === 'ar'
                ? `عرض ${filteredOpps.length} من أصل ${opportunities.length} فرصة`
                : `Showing ${filteredOpps.length} of ${opportunities.length} opportunities`}
            </span>
            <span className="font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded text-[11px]" data-testid="sort-indicator">
              {lang === 'ar' ? 'الترتيب: ' : 'Sorted by: '}
              {sortBy === 'match'
                ? (lang === 'ar' ? 'أعلى توافق' : 'Highest Match')
                : sortBy === 'newest'
                ? (lang === 'ar' ? 'الأحدث' : 'Newest')
                : (lang === 'ar' ? 'اسم الشركة' : 'Company')}
            </span>
          </div>

          {filteredOpps.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 bg-white border border-neutral-200 rounded-xl space-y-2">
              <p>{lang === 'ar' ? 'لا توجد وظائف مطابقة للفلاتر المحددة.' : 'No opportunities match your active filters.'}</p>
              <button
                onClick={handleResetFilters}
                className="text-neutral-900 font-semibold underline text-xs"
              >
                {lang === 'ar' ? 'إعادة ضبط الفلتر' : 'Clear all filters'}
              </button>
            </div>
          ) : (
            filteredOpps.map((opp) => {
              const isSelected = selectedOpp?.id === opp.id;
              const matchScore = opp.matchScore ?? null;
              const platform = opp.sourcePlatform || 'Direct';
              const isIntern =
                opp.employmentType === 'Internship' ||
                opp.title.toLowerCase().includes('intern');

              return (
                <div
                  key={opp.id}
                  onClick={() => handleSelectOpp(opp)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'border-neutral-900 bg-white shadow-xs'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isIntern
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isIntern
                            ? lang === 'ar'
                              ? '🎓 تدريب وتأهيل'
                              : '🎓 Internship'
                            : lang === 'ar'
                            ? '💼 وظيفة'
                            : '💼 Job'}
                        </span>
                        <span className="font-mono text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                          {platform}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-neutral-900 truncate">{opp.title}</h3>
                      <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5 truncate">
                        <span>{opp.company}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {matchScore !== null ? (
                        <span className="text-xs font-bold font-mono tabular-nums text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                          {matchScore}% Match
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded">
                          {lang === 'ar' ? 'غير محلل' : 'Not analyzed'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-[11px] text-neutral-500 flex items-center gap-2 flex-wrap">
                    <span>{opp.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{opp.workModel}</span>
                    {opp.salary && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-semibold text-neutral-700">
                          {opp.salary}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions on every opportunity card: Apply + Tailor CV */}
                  <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-neutral-100 gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrepareApplication(opp.id);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        title={lang === 'ar' ? 'التقديم المباشر على هذه الفرصة' : 'Direct Apply'}
                      >
                        <CheckCircle2 className="w-3 h-3 text-white" />
                        <span>
                          {isIntern
                            ? (lang === 'ar' ? 'التقديم المباشر على التدريب' : 'Direct Apply')
                            : (lang === 'ar' ? 'التقديم المباشر على الوظيفة' : 'Direct Apply')}
                        </span>
                      </button>

                      {opp.sourceUrl && (
                        <a
                          href={opp.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors inline-flex items-center"
                          title={lang === 'ar' ? 'رابط الإعلان الخارجي' : 'External link'}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTailorModal(opp);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        title={lang === 'ar' ? 'توليد سيرة ذاتية مخصصة لهذه الوظيفة بالذكاء الاصطناعي' : 'Generate Tailored CV'}
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>{lang === 'ar' ? 'إنشاء CV مخصص' : 'Tailor CV'}</span>
                      </button>
                    </div>

                    <span className="text-neutral-500 text-[11px] font-medium inline-flex items-center gap-0.5">
                      {lang === 'ar' ? 'تحليل التوافق ←' : 'Analyze Fit →'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Detailed Match Inspector & Gap Analysis */}
        <div className="lg:col-span-7 space-y-6">
          {selectedOpp ? (
            <div className="p-6 bg-white border border-neutral-200 rounded-xl space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-neutral-500 mb-1 flex items-center gap-2">
                    <span>{selectedOpp.company}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-[10px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-700">
                      {selectedOpp.sourcePlatform || 'Direct Platform'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedOpp.employmentType === 'Internship'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {selectedOpp.employmentType === 'Internship'
                        ? lang === 'ar'
                          ? 'تدريب'
                          : 'Internship'
                        : lang === 'ar'
                        ? 'وظيفة'
                        : 'Job'}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900">{selectedOpp.title}</h2>
                  <div className="text-xs text-neutral-600 mt-1 flex items-center gap-2">
                    <span>{selectedOpp.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedOpp.workModel}</span>
                    {selectedOpp.salary && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-semibold">{selectedOpp.salary}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Primary in-app direct apply & prep button */}
                  <button
                    type="button"
                    onClick={() => onPrepareApplication(selectedOpp.id)}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {selectedOpp.employmentType === 'Internship'
                        ? (lang === 'ar' ? 'التقديم المباشر على التدريب' : 'Direct Apply & Prep')
                        : (lang === 'ar' ? 'التقديم المباشر على الوظيفة' : 'Direct Apply & Prep')}
                    </span>
                  </button>

                  {/* Secondary external posting link */}
                  {selectedOpp.sourceUrl && (
                    <a
                      href={selectedOpp.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg transition-colors inline-flex items-center gap-1.5"
                      title={lang === 'ar' ? 'رابط الإعلان الأصلي' : 'External Job Posting'}
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{lang === 'ar' ? 'رابط خارجي' : 'External Link'}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenTailorModal(selectedOpp)}
                    className="px-3.5 py-2 text-xs font-bold text-neutral-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'ar' ? 'إنشاء CV مخصص لهذه الوظيفة' : 'Generate Tailored CV'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrepareApplication(selectedOpp.id)}
                    className="px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {lang === 'ar' ? 'سجل التقديم' : 'Track App'}
                  </button>
                </div>
              </div>

              {/* Match Engine Verdict */}
              {matchAnalysis && (
                <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                        MATCH ENGINE VERDICT
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded font-mono ${
                            matchAnalysis.recommendation === 'APPLY'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {matchAnalysis.recommendation === 'APPLY' ? 'APPLY NOW' : "DON'T APPLY YET"}
                        </span>
                        <span className="text-xs font-mono tabular-nums font-bold text-neutral-900">
                          {matchAnalysis.overallMatch}% Overall Fit
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Skills</span>
                        <span className="font-mono tabular-nums text-xs font-semibold text-neutral-900">
                          {matchAnalysis.skillMatch}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 block">Experience</span>
                        <span className="font-mono tabular-nums text-xs font-semibold text-neutral-900">
                          {matchAnalysis.experienceMatch}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {matchAnalysis.recommendationReason}
                  </p>
                </div>
              )}

              {/* Skill Gap Matrix */}
              {matchAnalysis && (
                <div>
                  <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3">
                    Skill Gap Breakdown
                  </h3>
                  <div className="space-y-2">
                    {matchAnalysis.skillGaps.map((gap, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white border border-neutral-100 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              gap.status === 'MATCHED'
                                ? 'bg-neutral-900'
                                : gap.status === 'PARTIAL'
                                ? 'bg-neutral-400'
                                : 'bg-neutral-300'
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-neutral-900">{gap.skill}</span>
                            <span className="text-neutral-500 text-[11px] ml-2">
                              {gap.importance} · {gap.action}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                            gap.status === 'MATCHED'
                              ? 'bg-neutral-100 text-neutral-800'
                              : 'bg-neutral-50 text-neutral-500'
                          }`}
                        >
                          {gap.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Description Overview */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-2">
                  {lang === 'ar' ? 'نبذة عن الدور الوظيفي (Role Overview)' : 'Role Overview'}
                </h3>
                <p className="text-xs text-neutral-700 leading-relaxed">{selectedOpp.description}</p>
              </div>

              {/* Requirements & Qualifications Section */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{lang === 'ar' ? 'المتطلبات والمؤهلات (Requirements & Qualifications)' : 'Requirements & Qualifications'}</span>
                </h3>
                {selectedOpp.requirements && selectedOpp.requirements.length > 0 ? (
                  <ul className="space-y-1.5 list-disc list-inside text-xs text-neutral-700 bg-neutral-50/70 p-3 rounded-lg border border-neutral-200/70">
                    {selectedOpp.requirements.map((req, i) => (
                      <li key={i} className="leading-relaxed">
                        <span className="text-neutral-800">{req}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-neutral-500 italic bg-neutral-50 p-2.5 rounded-lg border border-neutral-100">
                    {lang === 'ar'
                      ? 'مذكورة ومفصلة في الوصف الوظيفي أعلاه.'
                      : 'Specified in the role overview and technical qualifications above.'}
                  </p>
                )}
              </div>

              {/* Responsibilities & Preferred Skills Section */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  {lang === 'ar' ? 'المسؤوليات والمهارات الإضافية (Responsibilities & Preferred Qualifications)' : 'Responsibilities & Preferred Qualifications'}
                </h4>
                {selectedOpp.preferredSkills && selectedOpp.preferredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOpp.preferredSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/70 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 italic">
                    {lang === 'ar' ? 'المسؤوليات والمهارات محددة ضمن إطار الوظيفة.' : 'Responsibilities and skills detailed within role scope.'}
                  </p>
                )}
              </div>

              {/* Source & Actions */}
              <div className="pt-4 border-t border-neutral-100 flex justify-between items-center text-xs">
                {selectedOpp.sourceUrl ? (
                  <a
                    href={selectedOpp.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1 font-medium"
                  >
                    <span>View original posting on {selectedOpp.sourcePlatform || 'platform'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <div />
                )}
                <button
                  onClick={() => onDeleteOpportunity(selectedOpp.id)}
                  className="text-neutral-400 hover:text-neutral-900 inline-flex items-center gap-1 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-neutral-500 bg-white border border-neutral-200 rounded-xl">
              No opportunity selected.
            </div>
          )}
        </div>
      </div>

      {/* PLATFORMS STATUS & COMPLIANCE MODAL */}
      {showPlatformsModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Hiring Platform Integration Feeds & Compliance
                </h3>
                <p className="text-xs text-neutral-500">
                  Status of live public feeds and partner API requirements
                </p>
              </div>
              <button
                onClick={() => setShowPlatformsModal(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {platformsStatusList.map((plat) => (
                <div
                  key={plat.id}
                  className="p-3.5 border border-neutral-200 rounded-lg bg-neutral-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900">{plat.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                        plat.status === 'active'
                          ? 'bg-neutral-900 text-white'
                          : 'bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {plat.status === 'active' ? 'LIVE & ACTIVE' : 'REQUIRES API KEY'}
                    </span>
                  </div>
                  <p className="text-neutral-600 text-[11px]">{plat.description}</p>

                  {plat.missingRequirement && (
                    <div className="p-2.5 bg-white border border-neutral-200 rounded font-mono text-[11px] text-neutral-600 space-y-1">
                      <div className="text-neutral-900 font-bold">Rule 1 & 6 Compliance Report:</div>
                      <div>Service: {plat.missingRequirement.service}</div>
                      <div>Required Key: {plat.missingRequirement.environmentVariable}</div>
                      <div>Action: {plat.missingRequirement.developerAction}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-100">
              <button
                onClick={() => setShowPlatformsModal(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Opportunity / Parse JD Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-neutral-900">Add Opportunity with AI Parser</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Paste any job description. The Job Description Agent will automatically extract title, company, requirements, and work model.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Paste Job Description Text
              </label>
              <textarea
                rows={8}
                value={rawJDText}
                onChange={(e) => setRawJDText(e.target.value)}
                placeholder="Paste the full job posting text here..."
                className="w-full text-xs p-3 border border-neutral-200 rounded-lg outline-none focus:ring-1 focus:ring-neutral-900 font-mono"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 text-xs text-neutral-600 hover:text-neutral-900"
              >
                Cancel
              </button>
              <button
                onClick={handleParseAndAddJD}
                disabled={isParsingJD || !rawJDText.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isParsingJD ? 'Parsing with AI Agent...' : 'Extract & Save Opportunity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAILORED CV GENERATOR MODAL (تخصيص السيرة الذاتية للوظيفة) */}
      <TailoredCVModal
        opportunity={tailoringOpp}
        isOpen={isTailoringModalOpen}
        onClose={() => {
          setIsTailoringModalOpen(false);
          setTailoringOpp(null);
        }}
        onTailorCV={onTailorCV || (async (id) => ({}))}
        onSaveResume={onSaveResume}
        onNavigateToCV={onNavigateToCV}
        onPrepareApplication={onPrepareApplication}
        lang={lang}
      />
    </div>
  );
};
