import React, { useState, useMemo, useEffect } from 'react';
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

  // Pagination state for job list
  const [visibleCount, setVisibleCount] = useState(10);
  const ITEMS_PER_PAGE = 10;

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
    setVisibleCount(ITEMS_PER_PAGE);
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
        if (filterWorkModel !== 'ALL') {
          const model = (opp.workModel || '').trim().toLowerCase();
          const target = filterWorkModel.trim().toLowerCase();
          if (model !== target) return false;
        }

        // 3. Platform
        if (filterPlatform !== 'ALL') {
          const plat = (opp.sourcePlatform || 'Direct').trim().toLowerCase();
          if (plat !== filterPlatform.trim().toLowerCase()) return false;
        }

        // 4. Match Score threshold
        if (filterMatchScore !== 'ALL') {
          const score = opp.matchScore ?? 75;
          const min = parseInt(filterMatchScore, 10);
          if (score < min) return false;
        }

        // 5. Employment Type
        if (filterEmploymentType !== 'ALL') {
          const emp = (opp.employmentType || '').trim().toLowerCase();
          const target = filterEmploymentType.trim().toLowerCase();
          if (emp !== target) return false;
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

  // Auto-sync detail pane: if active filters exclude the current selection, use first visible item
  const effectiveSelectedOpp = useMemo(() => {
    if (!selectedOpp) return filteredOpps[0] || null;
    const stillVisible = filteredOpps.find((o) => o.id === selectedOpp.id);
    return stillVisible ?? (filteredOpps[0] || null);
  }, [filteredOpps, selectedOpp]);

  // Commit the auto-selected item back into state (clears stale match analysis too)
  useEffect(() => {
    if (effectiveSelectedOpp && effectiveSelectedOpp.id !== selectedOpp?.id) {
      setSelectedOpp(effectiveSelectedOpp);
      setMatchAnalysis(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSelectedOpp]);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, filterWorkModel, filterPlatform, filterMatchScore, filterEmploymentType, sortBy]);

  const isAr = lang === 'ar';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="surface-elevated border-hairline rounded-xl" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <div className="label-xs" style={{ marginBottom: 'var(--space-1)', color: 'var(--text-secondary)' }}>
              {lang === 'ar' ? 'سوق الفرص والذكاء التنافسي' : 'Opportunity Discovery & Live Feeds'}
            </div>
            <h1 className="heading-2xl" style={{ color: 'var(--text-primary)' }}>
              {lang === 'ar' ? 'الفرص والوظائف والتدريب' : 'Jobs & Internships Hub'}
            </h1>
            <p className="body-xs" style={{ marginTop: 'var(--space-1)', color: 'var(--text-secondary)' }}>
              {lang === 'ar'
                ? 'مزامنة حية مع LinkedIn وWuzzuf ومنصات التوظيف مع إمكانية التقديم الفوري وإنشاء سيرة ذاتية مخصصة لكل فرصة'
                : 'Live sync with LinkedIn, Wuzzuf & hiring portals with direct apply & tailored CV generation for every role'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)', flexWrap: 'wrap' }}>
            {/* Platform Status Button */}
            <button
              onClick={handleOpenPlatformsModal}
              className="btn-secondary"
              style={{
                padding: 'var(--space-2) var(--space-3)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1-5)'
              }}
            >
              <Globe style={{ width: '14px', height: '14px', color: 'var(--text-secondary)' }} />
              <span>{lang === 'ar' ? 'حالة المنصات' : 'Platforms Status'}</span>
            </button>

            {/* Sync Feeds CTA Button */}
            <button
              onClick={handleSyncFeeds}
              disabled={isSyncingFeeds}
              className="btn-primary"
              style={{
                padding: 'var(--space-2) var(--space-3-5)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1-5)'
              }}
            >
              <RefreshCw style={{ width: '14px', height: '14px' }} className={isSyncingFeeds ? 'animate-spin' : ''} />
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
              className="btn-secondary"
              style={{
                padding: 'var(--space-2) var(--space-3-5)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 500,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-1-5)'
              }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              <span>{lang === 'ar' ? 'إضافة فرصة / لصق JD' : 'Add Opportunity / Paste JD'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Toast/Banner */}
      {syncStatusMsg && (
        <div className="surface-elevated" style={{
          padding: 'var(--space-3)',
          backgroundColor: 'var(--accent-primary)',
          color: 'var(--text-inverse)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--font-size-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CheckCircle2 style={{ width: '16px', height: '16px', color: '#10b981' }} />
            <span>{syncStatusMsg}</span>
          </div>
          <button onClick={() => setSyncStatusMsg(null)} style={{ color: 'rgba(255, 255, 255, 0.7)' }} className="icon-button">
            <X style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {/* ADVANCED MULTI-DIMENSIONAL FILTER TOOLBAR */}
      <div className="surface-elevated border-hairline rounded-xl" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-size-xs)' }}>
              <SlidersHorizontal style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
              <span>{lang === 'ar' ? 'فلتر وتصفية الوظائف والتدريب' : 'Filter & Refine Opportunities'}</span>
              <span style={{
                color: 'var(--text-tertiary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: 'normal'
              }}>
                ({filteredOpps.length} of {opportunities.length})
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="link-button"
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)'
                }}
              >
                <X style={{ width: '12px', height: '12px' }} />
                <span>{lang === 'ar' ? 'إعادة ضبط الفلتر' : 'Reset Filters'}</span>
              </button>
            )}
          </div>

          {/* Filter Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
            {/* 1. Keyword Search */}
            <div style={{ position: 'relative' }}>
              <Search style={{
                width: '14px',
                height: '14px',
                position: 'absolute',
                left: 'var(--space-3)',
                top: '10px',
                color: 'var(--text-tertiary)'
              }} />
              <input
                type="text"
                placeholder={lang === 'ar' ? 'بحث بالمسمى أو الشركة أو المهارة...' : 'Search title, company, skill...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-xs)',
                  paddingLeft: 'var(--space-8)',
                  paddingRight: 'var(--space-3)',
                  paddingTop: 'var(--space-2)',
                  paddingBottom: 'var(--space-2)'
                }}
              />
            </div>

            {/* 2. Employment Type Filter */}
            <div>
              <select
                value={filterEmploymentType}
                onChange={(e) => setFilterEmploymentType(e.target.value)}
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--space-2)',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}
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
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--space-2)'
                }}
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
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--space-2)'
                }}
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
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--space-2)'
                }}
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
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--space-2)'
                }}
              >
                <option value="match">{lang === 'ar' ? 'ترتيب: أعلى توافق' : 'Sort: Highest Match'}</option>
                <option value="newest">{lang === 'ar' ? 'ترتيب: الأحدث' : 'Sort: Newest'}</option>
                <option value="company">{lang === 'ar' ? 'ترتيب: اسم الشركة' : 'Sort: Company'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left List, Right Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }} className="lg:grid-cols-12">
        {/* Left: Opportunity Cards */}
        <div className="lg:col-span-5" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-tertiary)',
            padding: '0 var(--space-1)'
          }}>
            <span data-testid="opportunities-count">
              {lang === 'ar'
                ? `عرض ${filteredOpps.length} من أصل ${opportunities.length} فرصة`
                : `Showing ${filteredOpps.length} of ${opportunities.length} opportunities`}
            </span>
            <span className="label-xs" style={{
              fontWeight: 500,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--surface-secondary)',
              padding: '2px var(--space-2)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11px'
            }} data-testid="sort-indicator">
              {lang === 'ar' ? 'الترتيب: ' : 'Sorted by: '}
              {sortBy === 'match'
                ? (lang === 'ar' ? 'أعلى توافق' : 'Highest Match')
                : sortBy === 'newest'
                ? (lang === 'ar' ? 'الأحدث' : 'Newest')
                : (lang === 'ar' ? 'اسم الشركة' : 'Company')}
            </span>
          </div>

          {filteredOpps.length === 0 ? (
            <div className="surface-elevated border-hairline rounded-xl" style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                <p>{lang === 'ar' ? 'لا توجد وظائف مطابقة للفلاتر المحددة.' : 'No opportunities match your active filters.'}</p>
                <button
                  onClick={handleResetFilters}
                  className="link-button"
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  {lang === 'ar' ? 'إعادة ضبط الفلتر' : 'Clear all filters'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {filteredOpps.slice(0, visibleCount).map((opp) => {
              const isSelected = effectiveSelectedOpp?.id === opp.id;
              const matchScore = opp.matchScore ?? null;
              const platform = opp.sourcePlatform || 'Direct';
              const isIntern =
                opp.employmentType === 'Internship' ||
                opp.title.toLowerCase().includes('intern');

              return (
                <div
                  key={opp.id}
                  onClick={() => handleSelectOpp(opp)}
                  className={`surface-elevated border-hairline rounded-xl cursor-pointer transition-all ${
                    isSelected ? 'shadow-xs' : ''
                  }`}
                  style={{
                    padding: 'var(--space-4)',
                    borderColor: isSelected ? 'var(--accent-primary)' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', flexWrap: 'wrap', marginBottom: 'var(--space-1)' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px var(--space-2)',
                            borderRadius: '9999px',
                            backgroundColor: isIntern ? '#fef3c7' : '#d1fae5',
                            color: isIntern ? '#92400e' : '#065f46',
                            border: isIntern ? '1px solid #fde68a' : '1px solid #a7f3d0'
                          }}
                        >
                          {isIntern
                            ? lang === 'ar'
                              ? '🎓 تدريب وتأهيل'
                              : '🎓 Internship'
                            : lang === 'ar'
                            ? '💼 وظيفة'
                            : '💼 Job'}
                        </span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          backgroundColor: 'var(--surface-secondary)',
                          color: 'var(--text-secondary)',
                          padding: '2px var(--space-1-5)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {platform}
                        </span>
                      </div>
                      <h3 className="body-xs" style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.title}</h3>
                      <div className="body-xs" style={{ marginTop: '2px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span>{opp.company}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      {matchScore !== null ? (
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--surface-secondary)',
                          padding: '2px var(--space-2)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {matchScore}% Match
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-tertiary)',
                          backgroundColor: 'var(--surface-secondary)',
                          padding: '2px var(--space-2)',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          {lang === 'ar' ? 'غير محلل' : 'Not analyzed'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{
                    marginTop: 'var(--space-2)',
                    fontSize: '11px',
                    color: 'var(--text-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap'
                  }}>
                    <span>{opp.location}</span>
                    <span aria-hidden="true">·</span>
                    <span>{opp.workModel}</span>
                    {opp.salary && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {opp.salary}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Actions on every opportunity card */}
                  <div style={{
                    marginTop: 'var(--space-3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 'var(--space-2-5)',
                    borderTop: '1px solid var(--border-subtle)',
                    gap: 'var(--space-2)',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrepareApplication(opp.id);
                        }}
                        style={{
                          padding: 'var(--space-1) var(--space-2-5)',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'white',
                          backgroundColor: '#2563eb',
                          borderRadius: 'var(--radius-lg)',
                          border: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                        title={lang === 'ar' ? 'التقديم المباشر على هذه الفرصة' : 'Direct Apply'}
                      >
                        <CheckCircle2 style={{ width: '12px', height: '12px', color: 'white' }} />
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
                          className="icon-button"
                          style={{
                            padding: 'var(--space-1)',
                            color: 'var(--text-tertiary)',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                          title={lang === 'ar' ? 'رابط الإعلان الخارجي' : 'External link'}
                        >
                          <ExternalLink style={{ width: '14px', height: '14px' }} />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenTailorModal(opp);
                        }}
                        className="btn-secondary"
                        style={{
                          padding: 'var(--space-1) var(--space-2-5)',
                          fontSize: '11px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1)'
                        }}
                        title={lang === 'ar' ? 'توليد سيرة ذاتية مخصصة لهذه الوظيفة بالذكاء الاصطناعي' : 'Generate Tailored CV'}
                      >
                        <Sparkles style={{ width: '12px', height: '12px', color: '#f59e0b' }} />
                        <span>{lang === 'ar' ? 'إنشاء CV مخصص' : 'Tailor CV'}</span>
                      </button>
                    </div>

                    <span style={{
                      color: 'var(--text-tertiary)',
                      fontSize: '11px',
                      fontWeight: 500,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      {lang === 'ar' ? 'تحليل التوافق ←' : 'Analyze Fit →'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* View More Button */}
            {visibleCount < filteredOpps.length && (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
                  className="btn-secondary"
                  style={{
                    padding: 'var(--space-2-5) var(--space-6)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)'
                  }}
                >
                  <ChevronRight style={{ width: '16px', height: '16px' }} />
                  <span>
                    {lang === 'ar'
                      ? `عرض المزيد (${Math.min(ITEMS_PER_PAGE, filteredOpps.length - visibleCount)} من ${filteredOpps.length})`
                      : `View More (${Math.min(ITEMS_PER_PAGE, filteredOpps.length - visibleCount)} of ${filteredOpps.length})`
                    }
                  </span>
                </button>
              </div>
            )}
          </>
          )}
        </div>

        {/* Right: Detailed Match Inspector & Gap Analysis */}
        <div className="lg:col-span-7" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {effectiveSelectedOpp ? (
            <div className="surface-elevated border-hairline rounded-xl" style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                {/* Header Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} className="sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="label-xs" style={{ marginBottom: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span>{effectiveSelectedOpp.company}</span>
                      <span aria-hidden="true">·</span>
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        backgroundColor: 'var(--surface-secondary)',
                        padding: '2px var(--space-1-5)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-secondary)'
                      }}>
                        {effectiveSelectedOpp.sourcePlatform || 'Direct Platform'}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px var(--space-2)',
                          borderRadius: '9999px',
                          backgroundColor: effectiveSelectedOpp.employmentType === 'Internship' ? '#fef3c7' : '#d1fae5',
                          color: effectiveSelectedOpp.employmentType === 'Internship' ? '#92400e' : '#065f46'
                        }}
                      >
                        {effectiveSelectedOpp.employmentType === 'Internship'
                          ? lang === 'ar'
                            ? 'تدريب'
                            : 'Internship'
                          : lang === 'ar'
                          ? 'وظيفة'
                          : 'Job'}
                      </span>
                    </div>
                    <h2 className="heading-lg" style={{ color: 'var(--text-primary)' }}>{effectiveSelectedOpp.title}</h2>
                    <div className="body-xs" style={{ marginTop: 'var(--space-1)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <span>{effectiveSelectedOpp.location}</span>
                      <span aria-hidden="true">·</span>
                      <span>{effectiveSelectedOpp.workModel}</span>
                      {effectiveSelectedOpp.salary && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{effectiveSelectedOpp.salary}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {/* Primary in-app direct apply button */}
                    <button
                      type="button"
                      onClick={() => onPrepareApplication(effectiveSelectedOpp.id)}
                      style={{
                        padding: 'var(--space-2) var(--space-3-5)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 700,
                        color: 'white',
                        backgroundColor: '#2563eb',
                        borderRadius: 'var(--radius-lg)',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1-5)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                      <CheckCircle2 style={{ width: '14px', height: '14px' }} />
                      <span>
                        {effectiveSelectedOpp.employmentType === 'Internship'
                          ? (lang === 'ar' ? 'التقديم المباشر على التدريب' : 'Direct Apply & Prep')
                          : (lang === 'ar' ? 'التقديم المباشر على الوظيفة' : 'Direct Apply & Prep')}
                      </span>
                    </button>

                    {/* Secondary external posting link */}
                    {effectiveSelectedOpp.sourceUrl && (
                      <a
                        href={effectiveSelectedOpp.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 'var(--space-1-5)',
                          textDecoration: 'none'
                        }}
                        title={lang === 'ar' ? 'رابط الإعلان الأصلي' : 'External Job Posting'}
                      >
                        <ExternalLink style={{ width: '14px', height: '14px', color: 'var(--text-tertiary)' }} />
                        <span>{lang === 'ar' ? 'رابط خارجي' : 'External Link'}</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenTailorModal(effectiveSelectedOpp!)}
                      style={{
                        padding: 'var(--space-2) var(--space-3-5)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: 'var(--radius-lg)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1-5)',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fde68a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                    >
                      <Sparkles style={{ width: '14px', height: '14px', color: '#d97706' }} />
                      <span>{lang === 'ar' ? 'إنشاء CV مخصص لهذه الوظيفة' : 'Generate Tailored CV'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPrepareApplication(effectiveSelectedOpp.id)}
                      className="btn-secondary"
                      style={{
                        padding: 'var(--space-2) var(--space-3)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {lang === 'ar' ? 'سجل التقديم' : 'Track App'}
                    </button>
                  </div>
                </div>

                {/* Match Engine Verdict */}
                {matchAnalysis && (
                  <div style={{
                    padding: 'var(--space-4)',
                    backgroundColor: 'var(--surface-secondary)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-default)'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <span className="label-xs" style={{
                            fontFamily: 'var(--font-mono)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-tertiary)',
                            fontSize: '11px'
                          }}>
                            MATCH ENGINE VERDICT
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
                            <span
                              style={{
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: 600,
                                padding: '2px var(--space-2)',
                                borderRadius: 'var(--radius-sm)',
                                fontFamily: 'var(--font-mono)',
                                backgroundColor: matchAnalysis.recommendation === 'APPLY' ? 'var(--accent-primary)' : 'var(--surface-tertiary)',
                                color: matchAnalysis.recommendation === 'APPLY' ? 'var(--text-inverse)' : 'var(--text-primary)'
                              }}
                            >
                              {matchAnalysis.recommendation === 'APPLY' ? 'APPLY NOW' : "DON'T APPLY YET"}
                            </span>
                            <span className="body-xs" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {matchAnalysis.overallMatch}% Overall Fit
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textAlign: 'right' }}>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Skills</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {matchAnalysis.skillMatch}%
                            </span>
                          </div>
                          <div>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', display: 'block' }}>Experience</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {matchAnalysis.experienceMatch}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="body-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        {matchAnalysis.recommendationReason}
                      </p>
                    </div>
                  </div>
                )}

                {/* Skill Gap Matrix */}
                {matchAnalysis && (
                  <div>
                    <h3 className="label-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
                      Skill Gap Breakdown
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {matchAnalysis.skillGaps.map((gap, i) => (
                        <div
                          key={i}
                          className="surface-elevated border-hairline rounded-lg"
                          style={{
                            padding: 'var(--space-3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 'var(--font-size-xs)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2-5)' }}>
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: gap.status === 'MATCHED'
                                  ? 'var(--accent-primary)'
                                  : gap.status === 'PARTIAL'
                                  ? 'var(--text-tertiary)'
                                  : 'var(--border-default)'
                              }}
                            />
                            <div>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{gap.skill}</span>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginLeft: 'var(--space-2)' }}>
                                {gap.importance} · {gap.action}
                              </span>
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              padding: '2px var(--space-2)',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: gap.status === 'MATCHED' ? 'var(--surface-secondary)' : 'var(--surface-tertiary)',
                              color: gap.status === 'MATCHED' ? 'var(--text-primary)' : 'var(--text-tertiary)'
                            }}
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
                  <h3 className="label-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-2)' }}>
                    {lang === 'ar' ? 'نبذة عن الدور الوظيفي (Role Overview)' : 'Role Overview'}
                  </h3>
                  <p className="body-xs" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{effectiveSelectedOpp.description}</p>
                </div>

                {/* Requirements & Qualifications Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                  <h3 className="label-xs" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 'var(--space-1-5)' }}>
                    <CheckCircle2 style={{ width: '14px', height: '14px', color: '#2563eb' }} />
                    <span>{lang === 'ar' ? 'المتطلبات والمؤهلات (Requirements & Qualifications)' : 'Requirements & Qualifications'}</span>
                  </h3>
                  {effectiveSelectedOpp.requirements && effectiveSelectedOpp.requirements.length > 0 ? (
                    <ul style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-1-5)',
                      listStyleType: 'disc',
                      listStylePosition: 'inside',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      backgroundColor: 'var(--surface-secondary)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {effectiveSelectedOpp.requirements.map((req, i) => (
                        <li key={i} style={{ lineHeight: 1.6 }}>
                          <span style={{ color: 'var(--text-primary)' }}>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="body-xs" style={{
                      fontStyle: 'italic',
                      color: 'var(--text-tertiary)',
                      backgroundColor: 'var(--surface-secondary)',
                      padding: 'var(--space-2-5)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      {lang === 'ar'
                        ? 'مذكورة ومفصلة في الوصف الوظيفي أعلاه.'
                        : 'Specified in the role overview and technical qualifications above.'}
                    </p>
                  )}
                </div>

                {/* Responsibilities & Preferred Skills Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-subtle)' }}>
                  <h4 className="label-xs" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {lang === 'ar' ? 'المسؤوليات والمهارات الإضافية (Responsibilities & Preferred Qualifications)' : 'Responsibilities & Preferred Qualifications'}
                  </h4>
                  {effectiveSelectedOpp.preferredSkills && effectiveSelectedOpp.preferredSkills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1-5)' }}>
                      {effectiveSelectedOpp.preferredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          style={{
                            padding: 'var(--space-1) var(--space-2-5)',
                            fontSize: '11px',
                            fontWeight: 500,
                            backgroundColor: '#dbeafe',
                            color: '#1e40af',
                            border: '1px solid #bfdbfe',
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="body-xs" style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>
                      {lang === 'ar' ? 'المسؤوليات والمهارات محددة ضمن إطار الوظيفة.' : 'Responsibilities and skills detailed within role scope.'}
                    </p>
                  )}
                </div>

                {/* Source & Actions */}
                <div style={{
                  paddingTop: 'var(--space-4)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 'var(--font-size-xs)'
                }}>
                  {effectiveSelectedOpp.sourceUrl ? (
                    <a
                      href={effectiveSelectedOpp.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="link-button"
                      style={{
                        color: 'var(--text-secondary)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)',
                        fontWeight: 500,
                        textDecoration: 'none'
                      }}
                    >
                      <span>View original posting on {effectiveSelectedOpp.sourcePlatform || 'platform'}</span>
                      <ExternalLink style={{ width: '14px', height: '14px' }} />
                    </a>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() => onDeleteOpportunity(effectiveSelectedOpp.id)}
                    className="icon-button"
                    style={{
                      color: 'var(--text-tertiary)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      marginLeft: 'auto'
                    }}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="surface-elevated border-hairline rounded-xl" style={{
              padding: 'var(--space-12)',
              textAlign: 'center',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-tertiary)'
            }}>
              No opportunity selected.
            </div>
          )}
        </div>
      </div>

      {/* PLATFORMS STATUS & COMPLIANCE MODAL */}
      {showPlatformsModal && (
        <div className="modal-overlay" onClick={() => setShowPlatformsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="heading-sm" style={{ color: 'var(--text-primary)' }}>
                  Hiring Platform Integration Feeds &amp; Compliance
                </h3>
                <p className="body-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Status of live public feeds and partner API requirements
                </p>
              </div>
              <button type="button" onClick={() => setShowPlatformsModal(false)} className="icon-button">
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div className="modal-body">
              {platformsStatusList.map((plat) => (
                <div key={plat.id} style={{
                  padding: 'var(--space-3-5)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface-secondary)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span className="body-sm" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{plat.name}</span>
                      <span style={{
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        padding: '2px var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 500,
                        backgroundColor: plat.status === 'active' ? 'var(--accent-primary)' : 'var(--surface-tertiary)',
                        color: plat.status === 'active' ? 'var(--text-inverse)' : 'var(--text-primary)'
                      }}>
                        {plat.status === 'active' ? 'LIVE & ACTIVE' : 'REQUIRES API KEY'}
                      </span>
                    </div>
                    <p className="body-xs" style={{ color: 'var(--text-secondary)' }}>{plat.description}</p>
                    {plat.missingRequirement && (
                      <div style={{
                        padding: 'var(--space-2-5)',
                        backgroundColor: 'var(--surface-primary)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--text-secondary)'
                      }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Rule 1 &amp; 6 Compliance Report:</div>
                          <div>Service: {plat.missingRequirement.service}</div>
                          <div>Required Key: {plat.missingRequirement.environmentVariable}</div>
                          <div>Action: {plat.missingRequirement.developerAction}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowPlatformsModal(false)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Opportunity / Parse JD Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <div>
                <h3 className="heading-base" style={{ color: 'var(--text-primary)' }}>Add Opportunity with AI Parser</h3>
                <p className="body-xs" style={{ color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  Paste any job description. The Job Description Agent will automatically extract title, company, requirements, and work model.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body">
              <label className="label-xs" style={{ display: 'block', marginBottom: 'var(--space-1)' }}>
                Paste Job Description Text
              </label>
              <textarea
                rows={8}
                value={rawJDText}
                onChange={(e) => setRawJDText(e.target.value)}
                placeholder="Paste the full job posting text here..."
                className="input-field"
                style={{
                  width: '100%',
                  fontSize: 'var(--font-size-xs)',
                  padding: 'var(--space-3)',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleParseAndAddJD}
                disabled={isParsingJD || !rawJDText.trim()}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Sparkles style={{ width: '14px', height: '14px' }} />
                <span>{isParsingJD ? 'Parsing with AI Agent...' : 'Extract & Save Opportunity'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAILORED CV GENERATOR MODAL */}
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
