import React, { useState } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { ResumeVersion, CareerProfile, Opportunity } from '../../types/index.js';

import { exportResumeToWordDoc } from '../../lib/resumeIntelligence.js';

interface ATSResumeDocumentProps {
  resume: ResumeVersion;
  profile?: CareerProfile | null;
  targetOpportunity?: Opportunity | null;
  customJobTitle?: string;
  selectedTemplate?: ATSTemplate;
  onTemplateChange?: (template: ATSTemplate) => void;
  lang: 'en' | 'ar';
  onSaveAsNewVersion?: (resume: ResumeVersion) => void;
}

export type ATSTemplate = 'google_doc' | 'classic' | 'modern';

// helpers
function fmtDate(d?: string) {
  if (!d) return '';
  const [y, m] = d.split('-');
  if (!m) return y;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

const GOOGLE_DOC_PRINT_CSS = `
  @page { size: A4 portrait; margin: 14mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Carlito','Calibri',Arial,sans-serif;
    color: #222; font-size: 10pt; line-height: 1.15;
    margin: 0; padding: 12mm 16mm; background: #fff;
  }
  .doc-header { text-align: center; margin-bottom: 6px; }
  .doc-name { font-size: 20pt; font-weight: 700; color: #1f3864; margin: 0 0 3px 0; }
  .doc-tagline { font-size: 10.5pt; font-weight: 700; color: #222; margin: 0 0 4px 0; }
  .doc-contact { font-size: 9pt; color: #333; margin: 0 0 1px 0; }
  .doc-contact a { color: #1f4e9e; text-decoration: none; }
  .section { margin-bottom: 11px; page-break-inside: avoid; }
  .section-title {
    font-size: 9.5pt; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.8px; color: #1f3864;
    border-bottom: 0.8pt solid #1f3864;
    padding-bottom: 1px; margin: 10px 0 6px 0;
  }
  p.summary { font-size: 9.5pt; color: #111; line-height: 1.4; margin: 0; text-align: justify; }
  .skills-block { font-size: 9.5pt; line-height: 1.5; color: #111; }
  .skills-block strong { color: #1f3864; }
  .exp-item { margin-bottom: 10px; page-break-inside: avoid; }
  .row-sb { display: flex; justify-content: space-between; align-items: baseline; }
  .job-title { font-size: 10pt; font-weight: 700; color: #111; }
  .job-dates { font-size: 9pt; color: #444; white-space: nowrap; }
  .job-co { font-size: 9pt; font-style: italic; color: #444; }
  ul.blist { margin: 3px 0 0 0; padding-left: 16px; }
  ul.blist li { font-size: 9pt; color: #111; line-height: 1.4; margin-bottom: 2px; }
  .edu-degree { font-size: 9.5pt; font-weight: 700; color: #111; }
  .cert-item { font-size: 9.5pt; color: #111; line-height: 1.5; }
  .lang-item { font-size: 9.5pt; color: #111; line-height: 1.5; }
  @media print { body { padding: 0; } }
`;

function classicPrintCss(modern: boolean) {
  const blue = modern ? '#2563eb' : '#111827';
  const blueH = modern ? '#1d4ed8' : '#111827';
  const ff = modern
    ? "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif"
    : "Georgia,'Times New Roman',serif";
  return `
  @page { size: A4 portrait; margin: 12mm 15mm; }
  * { box-sizing: border-box; }
  body { font-family: ${ff}; color: #111827; line-height: 1.45; font-size: 10.5pt; margin: 0; padding: 15mm; background: #fff; }
  .header { text-align:center; margin-bottom:16px; border-bottom:1.5px solid ${blue}; padding-bottom:12px; }
  .name { font-size:22pt; font-weight:700; margin:0 0 4px 0; letter-spacing:-0.5px; color:#111827; }
  .title { font-size:12pt; font-weight:600; color:${blue}; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:0.5px; }
  .contact { font-size:9pt; color:#4b5563; }
  .contact span { margin:0 6px; }
  .section { margin-bottom:14px; page-break-inside:avoid; }
  .section-title { font-size:11pt; font-weight:700; text-transform:uppercase; letter-spacing:0.8px; color:${blueH}; border-bottom:1px solid #d1d5db; padding-bottom:2px; margin:12px 0 8px 0; }
  .summary { font-size:9.5pt; color:#1f2937; line-height:1.5; text-align:justify; margin:0; }
  .skills-list { font-size:9.5pt; line-height:1.5; color:#1f2937; }
  .exp-item { margin-bottom:12px; page-break-inside:avoid; }
  .exp-head { display:flex; justify-content:space-between; font-size:10pt; font-weight:700; color:#111827; }
  .exp-subhead { display:flex; justify-content:space-between; font-size:9pt; font-style:italic; color:#4b5563; margin-bottom:4px; }
  ul.bullets { margin:4px 0 0 0; padding-left:18px; }
  ul.bullets li { font-size:9pt; color:#1f2937; line-height:1.45; margin-bottom:3px; }
  .edu-item { margin-bottom:8px; page-break-inside:avoid; }
  @media print { body { padding:0; } }
  `;
}

export const ATSResumeDocument: React.FC<ATSResumeDocumentProps> = ({
  resume, profile, targetOpportunity, customJobTitle, selectedTemplate, onTemplateChange, lang, onSaveAsNewVersion,
}) => {
  const isAr = lang === 'ar';
  const [internalTemplate, setInternalTemplate] = useState<ATSTemplate>(() => {
    return (localStorage.getItem('careerpilot_cv_template') as ATSTemplate) || 'google_doc';
  });
  const template = selectedTemplate || internalTemplate;
  const setTemplate = (t: ATSTemplate) => {
    localStorage.setItem('careerpilot_cv_template', t);
    setInternalTemplate(t);
    onTemplateChange?.(t);
  };
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fullName     = profile?.fullName || resume.title || (isAr ? 'المرشح' : 'Candidate');
  const email        = profile?.email    || '';
  const location     = profile?.location || '';
  const phone        = (profile as any)?.phone || '';
  const linkedin     = (profile as any)?.linkedin || '';
  const github       = (profile as any)?.github || '';
  const portfolio    = (profile as any)?.portfolio || '';
  const displayTitle = customJobTitle || targetOpportunity?.title || resume.targetRole || resume.title || (isAr ? 'مهندس برمجيات' : 'Software Professional');

  const skillCategories = (() => {
    const all = resume.skills;
    if (!all.length) return [];
    const mid = Math.ceil(all.length / 2);
    return [
      { label: 'Technical', skills: all.slice(0, mid) },
      { label: 'Tools & Platforms', skills: all.slice(mid) },
    ].filter(g => g.skills.length > 0);
  })();

  const handleExportPDF = () => {
    const pw = window.open('', '_blank', 'width=900,height=1100');
    if (!pw) { window.print(); return; }
    const isGD  = template === 'google_doc';
    const isMod = template === 'modern';

    let bodyHtml = '';
    if (isGD) {
      const skHtml = skillCategories
        .map(g => `<strong>${g.label}:</strong> ${g.skills.join(' \xB7 ')}`)
        .join('<br/>');
      const expHtml = resume.experience.map(e => `
        <div class="exp-item">
          <div class="row-sb">
            <span class="job-title">${e.role}</span>
            <span class="job-dates">${fmtDate(e.startDate)} \u2013 ${e.current ? 'Present' : fmtDate(e.endDate)}</span>
          </div>
          <div class="row-sb"><span class="job-co">${e.company}, ${e.location}</span></div>
          <ul class="blist">${e.achievements.map(a => `<li>${a}</li>`).join('')}</ul>
        </div>`).join('');
      const eduHtml = (resume.education || []).map(e => `
        <div class="exp-item">
          <div class="row-sb">
            <span class="edu-degree">${e.degree} in ${e.field}</span>
            <span class="job-dates">${fmtDate(e.startDate)} \u2013 ${e.current ? 'Present' : fmtDate(e.endDate)}</span>
          </div>
          <div class="row-sb">
            <span class="job-co">${e.institution}</span>
            ${e.gpa ? `<span class="job-co">GPA: ${e.gpa}</span>` : ''}
          </div>
        </div>`).join('');
      const certHtml = (resume.certifications || []).map(c => `<div class="cert-item">\u2022 ${c}</div>`).join('');
      bodyHtml = `
        <div class="doc-header">
          <div class="doc-name">${fullName}</div>
          <div class="doc-tagline">${displayTitle}</div>
          <div class="doc-contact">${location} | ${phone} | <a href="mailto:${email}">${email}</a></div>
          <div class="doc-contact">
            <a href="https://${linkedin}">${linkedin}</a> |
            <a href="https://${github}">${github}</a> |
            <a href="https://${portfolio}">${portfolio}</a>
          </div>
        </div>
        <div class="section"><div class="section-title">Professional Summary</div><p class="summary">${resume.summary}</p></div>
        <div class="section"><div class="section-title">Core Skills</div><div class="skills-block">${skHtml}</div></div>
        <div class="section"><div class="section-title">Professional Experience</div>${expHtml}</div>
        ${eduHtml ? `<div class="section"><div class="section-title">Education</div>${eduHtml}</div>` : ''}
        ${certHtml ? `<div class="section"><div class="section-title">Training &amp; Certifications</div>${certHtml}</div>` : ''}
        <div class="section"><div class="section-title">Languages</div>
          <div class="lang-item"><strong>Arabic</strong> \u2014 Native &nbsp;|&nbsp; <strong>English</strong> \u2014 Professional / Fluent</div>
        </div>`;
    } else {
      bodyHtml = `
        <div class="header">
          <h1 class="name">${fullName}</h1>
          <div class="title">${displayTitle}</div>
          <div class="contact">${email}<span>&bull;</span>${location}<span>&bull;</span>${linkedin}<span>&bull;</span>${github}</div>
        </div>
        <div class="section"><div class="section-title">Professional Summary</div><p class="summary">${resume.summary}</p></div>
        <div class="section"><div class="section-title">Core Competencies &amp; Technical Skills</div>
          <div class="skills-list">${resume.skills.join(' \u2022 ')}</div>
        </div>
        <div class="section"><div class="section-title">Professional Experience</div>
          ${resume.experience.map(e => `
          <div class="exp-item">
            <div class="exp-head"><span>${e.role}</span><span>${fmtDate(e.startDate)} \u2013 ${e.current ? 'Present' : fmtDate(e.endDate)}</span></div>
            <div class="exp-subhead"><span>${e.company}</span><span>${e.location}</span></div>
            <ul class="bullets">${e.achievements.map(a => `<li>${a}</li>`).join('')}</ul>
          </div>`).join('')}
        </div>
        ${(resume.education || []).length ? `
        <div class="section"><div class="section-title">Education</div>
          ${resume.education.map(e => `
          <div class="edu-item">
            <div class="exp-head"><span>${e.degree} in ${e.field}</span><span>${fmtDate(e.startDate)} \u2013 ${e.current ? 'Present' : fmtDate(e.endDate)}</span></div>
            <div class="exp-subhead"><span>${e.institution}</span>${e.gpa ? `<span>GPA: ${e.gpa}</span>` : ''}</div>
          </div>`).join('')}
        </div>` : ''}
        ${(resume.certifications || []).length ? `
        <div class="section"><div class="section-title">Certifications &amp; Credentials</div>
          <div class="skills-list">${resume.certifications.join(' \u2022 ')}</div>
        </div>` : ''}`;
    }

    const css = isGD ? GOOGLE_DOC_PRINT_CSS : classicPrintCss(isMod);
    const html = `<!DOCTYPE html><html lang="${isAr?'ar':'en'}" dir="${isAr?'rtl':'ltr'}">
<head><meta charset="utf-8"/><title>${fullName} \u2014 ${displayTitle}</title>
<style>${css}</style></head>
<body>${bodyHtml}
<script>window.onload=function(){setTimeout(function(){window.print();},450);};<\/script>
</body></html>`;
    pw.document.open(); pw.document.write(html); pw.document.close();
  };

  const handleCopyPlainText = () => {
    const expTxt = resume.experience.map(e =>
      `${e.role} | ${e.company} (${e.location})\n${fmtDate(e.startDate)} - ${e.current ? 'Present' : fmtDate(e.endDate)}\n${e.achievements.map(a => `\u2022 ${a}`).join('\n')}`
    ).join('\n\n');
    const eduTxt = (resume.education || []).map(e =>
      `${e.degree} in ${e.field} \u2014 ${e.institution} (${fmtDate(e.startDate)} - ${e.current ? 'Present' : fmtDate(e.endDate)})${e.gpa ? `\nGPA: ${e.gpa}` : ''}`
    ).join('\n');
    const certTxt = (resume.certifications || []).join('\n');
    const plain = [
      fullName, displayTitle,
      `${location} | ${phone} | ${email}`,
      `${linkedin} | ${github} | ${portfolio}`,
      '', 'PROFESSIONAL SUMMARY', '='.repeat(50), resume.summary,
      '', 'CORE SKILLS', '='.repeat(50), resume.skills.join(' \xB7 '),
      '', 'PROFESSIONAL EXPERIENCE', '='.repeat(50), expTxt,
      '', 'EDUCATION', '='.repeat(50), eduTxt,
      ...(certTxt ? ['', 'TRAINING & CERTIFICATIONS', '='.repeat(50), certTxt] : []),
      '', 'LANGUAGES', '='.repeat(50), 'Arabic \u2014 Native | English \u2014 Professional / Fluent',
    ].join('\n').trim();
    navigator.clipboard.writeText(plain);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveCopy = () => {
    if (onSaveAsNewVersion) {
      onSaveAsNewVersion(resume);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const GDHeading: React.FC<{ title: string }> = ({ title }) => (
    <h2 style={{
      fontSize: '9.5pt', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.8px', color: '#1f3864',
      borderBottom: '0.8pt solid #1f3864', paddingBottom: '1px',
      marginBottom: '6px', marginTop: '12px',
      fontFamily: "'Carlito','Calibri',Arial,sans-serif",
    }}>
      {title}
    </h2>
  );

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                {isAr ? 'معاينة الـ CV الاحترافي' : 'Professional CV Preview'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                ATS: {resume.atsScore || 95}%
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {isAr ? 'تنسيق متوافق مع Workday · Taleo · Greenhouse' : 'ATS-compliant · Workday · Taleo · Greenhouse'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            {([
              { id: 'google_doc' as const, en: '📄 Google Doc', ar: 'قوقل دوك' },
              { id: 'classic'    as const, en: 'Classic ATS',   ar: 'كلاسيك' },
              { id: 'modern'     as const, en: 'Modern Tech',   ar: 'تيك عصري' },
            ]).map(t => (
              <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${template === t.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          <a
            href="https://docs.google.com/document/d/1jSVGtqNaoYSt2qSfCAsc39NBS-pxVAEu/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
            title={isAr ? 'فتح القالب الأصلي في Google Docs' : 'Open template in Google Docs'}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAr ? 'القالب الأصلي' : 'Original Doc'}</span>
          </a>

          <button type="button" onClick={handleExportPDF}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
          </button>

          <button type="button" onClick={() => exportResumeToWordDoc(resume, profile)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer">
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحميل Word (DOCX)' : 'Download Word'}</span>
          </button>

          <button type="button" onClick={() => window.print()}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer">
            <Printer className="w-3.5 h-3.5" />
            <span>{isAr ? 'طباعة' : 'Print'}</span>
          </button>

          <button type="button" onClick={handleCopyPlainText}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (isAr ? 'تم!' : 'Copied!') : isAr ? 'نسخ نص' : 'Copy Text'}</span>
          </button>

          {onSaveAsNewVersion && (
            <button type="button" onClick={handleSaveCopy}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer">
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{savedSuccess ? (isAr ? 'تم الحفظ!' : 'Saved!') : isAr ? 'حفظ نسخة' : 'Save Version'}</span>
            </button>
          )}
        </div>
      </div>

      {/* A4 Document */}
      <div className="flex justify-center bg-slate-100 p-4 sm:p-8 rounded-2xl border border-slate-200 overflow-x-auto">
        <div id="ats-resume-print-document"
          className="w-full max-w-[800px] bg-white text-slate-900 shadow-xl border border-slate-200/80 rounded-xl transition-all overflow-hidden"
          style={{ minHeight: '1050px', padding: '40px 48px', fontFamily: template === 'classic' ? "Georgia,'Times New Roman',serif" : "'Carlito','Calibri',Arial,sans-serif" }}>

          {/* GOOGLE DOC TEMPLATE */}
          {template === 'google_doc' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '20pt', fontWeight: 700, color: '#1f3864', lineHeight: 1.2 }}>{fullName}</div>
                <div style={{ fontSize: '10.5pt', fontWeight: 700, color: '#222', margin: '3px 0' }}>{displayTitle}</div>
                <div style={{ fontSize: '9pt', color: '#333', marginBottom: '2px' }}>{location} | {phone} | {email}</div>
                <div style={{ fontSize: '9pt', color: '#1f4e9e' }}>{linkedin} &middot; {github} &middot; {portfolio}</div>
              </div>

              <GDHeading title="Professional Summary" />
              <p style={{ fontSize: '9.5pt', color: '#111', lineHeight: 1.4, margin: 0, textAlign: 'justify' }}>{resume.summary}</p>

              <GDHeading title="Core Skills" />
              <div style={{ fontSize: '9.5pt', lineHeight: 1.5, color: '#111' }}>
                {skillCategories.length > 0
                  ? skillCategories.map(g => (
                      <div key={g.label}><strong style={{ color: '#1f3864' }}>{g.label}:</strong> {g.skills.join(' \xB7 ')}</div>
                    ))
                  : <span>{resume.skills.join(' \xB7 ')}</span>
                }
              </div>

              <GDHeading title="Professional Experience" />
              <div className="space-y-3">
                {resume.experience.map(exp => (
                  <div key={exp.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '10pt', fontWeight: 700, color: '#111' }}>{exp.role}</span>
                      <span style={{ fontSize: '9pt', color: '#444', whiteSpace: 'nowrap' }}>
                        {fmtDate(exp.startDate)} &ndash; {exp.current ? 'Present' : fmtDate(exp.endDate)}
                      </span>
                    </div>
                    <div style={{ fontSize: '9pt', fontStyle: 'italic', color: '#555', marginBottom: '3px' }}>
                      {exp.company}, {exp.location}
                    </div>
                    <ul style={{ margin: '2px 0 0 0', paddingLeft: '16px' }}>
                      {exp.achievements.map((ach, i) => (
                        <li key={i} style={{ fontSize: '9pt', color: '#111', lineHeight: 1.4, marginBottom: '2px' }}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {resume.education && resume.education.length > 0 && (
                <>
                  <GDHeading title="Education" />
                  <div className="space-y-2">
                    {resume.education.map(edu => (
                      <div key={edu.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontSize: '9.5pt', fontWeight: 700, color: '#111' }}>{edu.degree} in {edu.field}</span>
                          <span style={{ fontSize: '9pt', color: '#444', whiteSpace: 'nowrap' }}>
                            {fmtDate(edu.startDate)} &ndash; {edu.current ? 'Present' : fmtDate(edu.endDate)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', fontStyle: 'italic', color: '#555' }}>
                          <span>{edu.institution}</span>
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {resume.certifications && resume.certifications.length > 0 && (
                <>
                  <GDHeading title="Training & Certifications" />
                  <div style={{ fontSize: '9.5pt', lineHeight: 1.6, color: '#111' }}>
                    {resume.certifications.map((c, i) => <div key={i}>&bull; {c}</div>)}
                  </div>
                </>
              )}

              <GDHeading title="Languages" />
              <div style={{ fontSize: '9.5pt', color: '#111', lineHeight: 1.5 }}>
                <strong>Arabic</strong> &mdash; Native &nbsp;|&nbsp; <strong>English</strong> &mdash; Professional / Fluent
              </div>
            </>
          )}

          {/* CLASSIC / MODERN */}
          {(template === 'classic' || template === 'modern') && (
            <>
              <div className={`text-center pb-4 mb-5 border-b-2 ${template === 'modern' ? 'border-blue-600' : 'border-slate-900'}`}>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">{fullName}</h1>
                <div className={`text-sm font-bold uppercase tracking-wider mb-2 ${template === 'modern' ? 'text-blue-600' : 'text-slate-700'}`}>{displayTitle}</div>
                <div className="text-xs text-slate-600 flex flex-wrap justify-center items-center gap-2">
                  <span>{email}</span><span>&bull;</span>
                  <span>{location}</span><span>&bull;</span>
                  <span className="font-mono text-[11px]">{linkedin}</span><span>&bull;</span>
                  <span className="font-mono text-[11px]">{github}</span>
                </div>
              </div>

              <div className="mb-5">
                <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b ${template === 'modern' ? 'text-blue-700 border-blue-200' : 'text-slate-900 border-slate-300'}`}>
                  {isAr ? 'النبذة المهنية' : 'Professional Summary'}
                </h2>
                <p className="text-xs text-slate-800 leading-relaxed text-justify">{resume.summary}</p>
              </div>

              <div className="mb-5">
                <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b ${template === 'modern' ? 'text-blue-700 border-blue-200' : 'text-slate-900 border-slate-300'}`}>
                  {isAr ? 'المهارات الأساسية' : 'Core Competencies & Technical Skills'}
                </h2>
                <div className="text-xs text-slate-800 leading-relaxed">{resume.skills.join('  \u2022  ')}</div>
              </div>

              <div className="mb-5">
                <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-3 border-b ${template === 'modern' ? 'text-blue-700 border-blue-200' : 'text-slate-900 border-slate-300'}`}>
                  {isAr ? 'الخبرات المهنية' : 'Professional Experience'}
                </h2>
                <div className="space-y-4">
                  {resume.experience.map(exp => (
                    <div key={exp.id} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-900">{exp.role}</span>
                        <span className="text-[11px] font-mono text-slate-600">
                          {fmtDate(exp.startDate)} &ndash; {exp.current ? (isAr ? 'حتى الآن' : 'Present') : fmtDate(exp.endDate)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between text-[11px] text-slate-600 italic">
                        <span>{exp.company}</span><span>{exp.location}</span>
                      </div>
                      <ul className="list-disc list-outside pl-4 space-y-1 pt-1">
                        {exp.achievements.map((ach, idx) => (
                          <li key={idx} className="text-xs text-slate-800 leading-relaxed">{ach}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {resume.education && resume.education.length > 0 && (
                <div className="mb-5">
                  <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b ${template === 'modern' ? 'text-blue-700 border-blue-200' : 'text-slate-900 border-slate-300'}`}>
                    {isAr ? 'التعليم' : 'Education'}
                  </h2>
                  <div className="space-y-2">
                    {resume.education.map(edu => (
                      <div key={edu.id}>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-bold text-slate-900">{edu.degree} in {edu.field}</span>
                          <span className="text-[11px] font-mono text-slate-600">
                            {fmtDate(edu.startDate)} &ndash; {edu.current ? 'Present' : fmtDate(edu.endDate)}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-[11px] text-slate-600 italic">
                          <span>{edu.institution}</span>
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {resume.certifications && resume.certifications.length > 0 && (
                <div>
                  <h2 className={`text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b ${template === 'modern' ? 'text-blue-700 border-blue-200' : 'text-slate-900 border-slate-300'}`}>
                    {isAr ? 'الشهادات المعتمدة' : 'Certifications & Credentials'}
                  </h2>
                  <div className="text-xs text-slate-800 leading-relaxed">{resume.certifications.join('  \u2022  ')}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
