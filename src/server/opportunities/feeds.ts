import { Opportunity, CareerProfile } from '../../types/index.js';
import { calculateOpportunityMatch } from '../scoring/index.js';

export interface PlatformFeedStatus {
  id: string;
  name: string;
  type: 'public_live' | 'partner_oauth' | 'partner_api';
  status: 'active' | 'requires_api_key';
  description: string;
  lastSynced?: string;
  missingRequirement?: {
    service: string;
    reason: string;
    requiredAccount: string;
    environmentVariable: string;
    developerAction: string;
  };
}

export const PLATFORMS_CONFIG: PlatformFeedStatus[] = [
  {
    id: 'jsearch',
    name: 'JSearch Live Aggregator (LinkedIn, Indeed & Google Jobs)',
    type: 'partner_api',
    status: 'active',
    description: 'Real-time job & internship search covering LinkedIn, Indeed, Glassdoor & Egypt/MENA tech boards.',
    lastSynced: new Date().toISOString(),
  },
  {
    id: 'wuzzuf',
    name: 'Wuzzuf Egypt & MENA Jobs',
    type: 'public_live',
    status: 'active',
    description: 'Live job listings from Wuzzuf - Egypt and MENA region tech jobs.',
    lastSynced: new Date().toISOString(),
  },
  {
    id: 'remoteok',
    name: 'RemoteOK Live Feed API',
    type: 'public_live',
    status: 'active',
    description: 'Official real-time remote tech & software engineering job feed.',
    lastSynced: new Date().toISOString(),
  },
  {
    id: 'arbeitnow',
    name: 'Arbeitnow Global & EU Tech Feed',
    type: 'public_live',
    status: 'active',
    description: 'Permitted public tech board feed with visa & remote filter support.',
    lastSynced: new Date().toISOString(),
  },
  {
    id: 'indeed',
    name: 'Indeed Live Jobs & Internships',
    type: 'partner_api',
    status: 'active',
    description: 'Real-time job postings, graduate programs, and tech internships from Indeed.',
    lastSynced: new Date().toISOString(),
  },
  {
    id: 'linkedin_jobs',
    name: 'LinkedIn Jobs via JSearch Stream',
    type: 'partner_api',
    status: 'active',
    description: 'Live verified LinkedIn job postings extracted via JSearch enterprise gateway.',
    lastSynced: new Date().toISOString(),
  },
];

/**
 * Fetch and synchronize opportunities from permitted live platform feeds
 */
export async function fetchLivePlatformJobs(profile: CareerProfile): Promise<Opportunity[]> {
  const syncedOpportunities: Opportunity[] = [];

  // 1. Fetch RemoteOK Live Jobs
  try {
    const res = await fetch('https://remoteok.com/api', {
      headers: {
        'User-Agent': 'CareerPilot-AI-Client/1.0',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        // Skip first item which is legal notice
        const jobs = data.slice(1, 40);
        for (const j of jobs) {
          if (!j.position || !j.company) continue;

          // Map tags to requirements
          const rawTags: string[] = Array.isArray(j.tags) ? j.tags : [];
          const requirements = rawTags
            .filter((t) => typeof t === 'string' && t.length > 1)
            .map((t) => t.charAt(0).toUpperCase() + t.slice(1));

          let salaryText: string | undefined;
          if (j.salary_min && j.salary_max) {
            salaryText = `$${Math.round(j.salary_min / 1000)}k - $${Math.round(j.salary_max / 1000)}k`;
          }

          const opp: Opportunity = {
            id: `opp-rok-${j.id || Math.random().toString(36).substr(2, 8)}`,
            title: j.position,
            company: j.company,
            location: j.location || 'Remote Worldwide',
            workModel: 'Remote',
            employmentType: 'Full-time',
            salary: salaryText,
            description: j.description
              ? j.description.replace(/<[^>]*>?/gm, '').slice(0, 500) + '...'
              : `Remote engineering role at ${j.company}.`,
            requirements: requirements.length > 0 ? requirements.slice(0, 6) : ['TypeScript', 'Full-Stack'],
            preferredSkills: requirements.slice(6, 9),
            sourceUrl: j.url || `https://remoteok.com/remote-jobs/${j.id}`,
            sourcePlatform: 'RemoteOK',
            isManual: false,
            createdAt: j.date || new Date().toISOString(),
          };

          const match = calculateOpportunityMatch(profile, opp);
          opp.matchScore = match.overallMatch;

          syncedOpportunities.push(opp);
        }
      }
    }
  } catch (err) {
    console.warn('[Feeds] RemoteOK live fetch timeout or warning:', err);
  }

  // 2. Fetch Arbeitnow Live Tech Jobs
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.data)) {
        const jobs = json.data.slice(0, 25);
        for (const j of jobs) {
          if (!j.title || !j.company_name) continue;

          const tags: string[] = Array.isArray(j.tags) ? j.tags : [];
          const opp: Opportunity = {
            id: `opp-an-${j.slug || Math.random().toString(36).substr(2, 8)}`,
            title: j.title,
            company: j.company_name,
            location: j.location || 'Remote / Europe',
            workModel: j.remote ? 'Remote' : 'Hybrid',
            employmentType: 'Full-time',
            description: j.description
              ? j.description.replace(/<[^>]*>?/gm, '').slice(0, 500) + '...'
              : `Software position at ${j.company_name}.`,
            requirements: tags.length > 0 ? tags.slice(0, 5) : ['Software Engineering'],
            preferredSkills: tags.slice(5, 8),
            sourceUrl: j.url,
            sourcePlatform: 'Direct',
            isManual: false,
            createdAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
          };

          const match = calculateOpportunityMatch(profile, opp);
          opp.matchScore = match.overallMatch;

          syncedOpportunities.push(opp);
        }
      }
    }
  } catch (err) {
    console.warn('[Feeds] Arbeitnow live fetch timeout or warning:', err);
  }

  // 3. Fetch Wuzzuf Jobs via their public RSS feed
  try {
    const searchKeywords = encodeURIComponent(profile.targetRole || 'Software Engineer');
    const wuzzufRssUrl = `https://wuzzuf.net/search/jobs/rss?q=${searchKeywords}&a=hpb`;

    const res = await fetch(wuzzufRssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CareerPilot-AI/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      const xmlText = await res.text();
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/;
      const linkRegex = /<link>(.*?)<\/link>/;
      const descRegex = /<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/;
      const pubDateRegex = /<pubDate>(.*?)<\/pubDate>/;
      const categoryRegex = /<category><!\[CDATA\[(.*?)\]\]><\/category>|<category>(.*?)<\/category>/g;

      let itemMatch;
      let wuzzufCount = 0;
      while ((itemMatch = itemRegex.exec(xmlText)) !== null && wuzzufCount < 20) {
        const itemXml = itemMatch[1];
        const titleMatch = titleRegex.exec(itemXml);
        const linkMatch = linkRegex.exec(itemXml);
        const descMatch = descRegex.exec(itemXml);
        const pubDateMatch = pubDateRegex.exec(itemXml);

        const titleRaw = titleMatch ? (titleMatch[1] || titleMatch[2] || '') : '';
        if (!titleRaw) continue;

        // Parse "Job Title at Company Name" format used by Wuzzuf RSS
        const atIdx = titleRaw.lastIndexOf(' at ');
        const jobTitle = atIdx > 0 ? titleRaw.slice(0, atIdx).trim() : titleRaw.trim();
        const companyName = atIdx > 0 ? titleRaw.slice(atIdx + 4).trim() : 'Company';

        const sourceUrl = linkMatch ? linkMatch[1].trim() : 'https://wuzzuf.net';
        const description = descMatch
          ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>?/gm, '').slice(0, 500)
          : `${jobTitle} opportunity at ${companyName} in Egypt/MENA region.`;

        const cats: string[] = [];
        let catMatch;
        while ((catMatch = categoryRegex.exec(itemXml)) !== null) {
          const cat = catMatch[1] || catMatch[2] || '';
          if (cat && cat.length > 1) cats.push(cat);
        }
        categoryRegex.lastIndex = 0;

        const opp: Opportunity = {
          id: `opp-wz-${Date.now()}-${wuzzufCount}`,
          title: jobTitle,
          company: companyName,
          location: 'Egypt / MENA',
          workModel: 'Hybrid',
          employmentType: 'Full-time',
          description: description + '...',
          requirements: cats.length > 0 ? cats.slice(0, 5) : ['Communication', 'Problem Solving'],
          preferredSkills: cats.slice(5, 8),
          sourceUrl,
          sourcePlatform: 'Wuzzuf',
          isManual: false,
          createdAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
        };

        const matchResult = calculateOpportunityMatch(profile, opp);
        opp.matchScore = matchResult.overallMatch;

        syncedOpportunities.push(opp);
        wuzzufCount++;
      }
      console.log(`[Feeds] Wuzzuf: fetched ${wuzzufCount} jobs for "${profile.targetRole}"`);
    }
  } catch (err) {
    console.warn('[Feeds] Wuzzuf feed fetch warning:', err);
  }

  // 4. Fetch JSearch Live Jobs & Internships (LinkedIn, Indeed, Google Jobs, Egypt/MENA)
  const jsearchKey =
    process.env.JSEARCH_RAPIDAPI_KEY ||
    process.env.RAPIDAPI_KEY ||
    'e7e7907c0amshbb128f9a7510aa4p13152cjsnc1ff7f8eebfc';

  if (jsearchKey) {
    const targetRole = profile.targetRole || 'Software Engineer';
    const queries = [
      `${targetRole} Indeed`,
      `Software Engineering Internship Indeed`,
      `${targetRole} in Egypt`,
      `Tech Internships Remote`,
      `${targetRole} Remote`,
    ];

    for (const query of queries) {
      try {
        const res = await fetch(
          `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(query)}&page=1&num_pages=1`,
          {
            headers: {
              'x-rapidapi-key': jsearchKey,
              'x-rapidapi-host': 'jsearch.p.rapidapi.com',
            },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (res.ok) {
          const json = await res.json();
          const jobs: any[] = json.data?.jobs || [];
          for (const j of jobs) {
            if (!j.job_title || !j.employer_name) continue;

            const isIntern =
              Boolean(j.job_is_internship) ||
              j.job_title.toLowerCase().includes('intern') ||
              j.job_title.toLowerCase().includes('تدريب') ||
              (j.job_employment_type && j.job_employment_type.toLowerCase().includes('intern'));

            let empType: 'Full-time' | 'Contract' | 'Internship' | 'Part-time' = 'Full-time';
            if (isIntern) {
              empType = 'Internship';
            } else if (j.job_employment_type?.toLowerCase().includes('contract')) {
              empType = 'Contract';
            } else if (j.job_employment_type?.toLowerCase().includes('part')) {
              empType = 'Part-time';
            }

            const reqs: string[] = [];
            if (Array.isArray(j.job_required_skills) && j.job_required_skills.length > 0) {
              reqs.push(...j.job_required_skills);
            }
            if (Array.isArray(j.job_highlights?.Qualifications)) {
              for (const q of j.job_highlights.Qualifications) {
                if (typeof q === 'string' && q.length < 80) {
                  reqs.push(q);
                }
              }
            }
            if (reqs.length === 0) {
              reqs.push('Problem Solving', 'Communication', 'Technical Proficiency');
            }

            const isRemote = Boolean(j.job_is_remote);
            const descLower = (j.job_description || '').toLowerCase();
            const workModel: 'Remote' | 'Hybrid' | 'On-site' = isRemote
              ? 'Remote'
              : descLower.includes('hybrid')
              ? 'Hybrid'
              : 'On-site';

            const loc = [j.job_city, j.job_country].filter(Boolean).join(', ') || 'Egypt / Global';

            let salaryStr: string | undefined = undefined;
            if (j.job_min_salary && j.job_max_salary) {
              salaryStr = `${j.job_salary_currency || '$'}${j.job_min_salary} - ${j.job_max_salary} ${j.job_salary_period || ''}`.trim();
            }

            const publisherLower = (j.job_publisher || '').toLowerCase();
            let sourcePlatform: 'LinkedIn' | 'RemoteOK' | 'Wuzzuf' | 'Direct' | 'Indeed' = 'Indeed';
            if (publisherLower.includes('linkedin')) {
              sourcePlatform = 'LinkedIn';
            } else if (publisherLower.includes('wuzzuf')) {
              sourcePlatform = 'Wuzzuf';
            } else if (publisherLower.includes('indeed') || query.includes('Indeed')) {
              sourcePlatform = 'Indeed';
            }

            const directSearchQuery = encodeURIComponent(`${j.job_title} ${j.employer_name}`);
            const fallbackUrl = sourcePlatform === 'Indeed'
              ? `https://www.indeed.com/jobs?q=${directSearchQuery}`
              : sourcePlatform === 'LinkedIn'
              ? `https://www.linkedin.com/jobs/search/?keywords=${directSearchQuery}`
              : `https://www.google.com/search?q=${directSearchQuery}+job`;

            const validSourceUrl =
              j.job_apply_link && j.job_apply_link.startsWith('http')
                ? j.job_apply_link
                : j.job_google_link && j.job_google_link.startsWith('http')
                ? j.job_google_link
                : fallbackUrl;

            const opp: Opportunity = {
              id: `opp-js-${j.job_id || Math.random().toString(36).substr(2, 9)}`,
              title: j.job_title,
              company: j.employer_name,
              location: loc,
              workModel,
              employmentType: empType,
              salary: salaryStr,
              description: j.job_description
                ? j.job_description.slice(0, 600) + '...'
                : `${j.job_title} opportunity at ${j.employer_name}`,
              requirements: reqs.slice(0, 6),
              preferredSkills: reqs.slice(6, 10),
              sourceUrl: validSourceUrl,
              sourcePlatform,
              isManual: false,
              createdAt: j.job_posted_at_datetime_utc || new Date().toISOString(),
            };

            const match = calculateOpportunityMatch(profile, opp);
            opp.matchScore = match.overallMatch;

            const exists = syncedOpportunities.some(
              (o) =>
                o.title.toLowerCase() === opp.title.toLowerCase() &&
                o.company.toLowerCase() === opp.company.toLowerCase()
            );
            if (!exists) {
              syncedOpportunities.push(opp);
            }
          }
          console.log(`[Feeds] JSearch query "${query}": fetched ${jobs.length} jobs`);
        }
      } catch (err) {
        console.warn(`[Feeds] JSearch query "${query}" warning:`, err);
      }
    }
  }

  return syncedOpportunities;
}
