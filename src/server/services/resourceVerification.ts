import https from 'https';
import http from 'http';
import { URL } from 'url';

// ============================================================================
// Resource Verification Types (Inline)
// ============================================================================

export type VerificationStatus = 'VERIFIED' | 'NEEDS_REVIEW' | 'BROKEN' | 'ARCHIVED';
export type VerificationSource = 'MANUAL' | 'AUTO_VERIFIED' | 'SEED_RESOURCE' | 'AI_SUGGESTED' | 'EXTERNAL_PROVIDER';
export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNREACHABLE' | 'UNKNOWN';

export interface UrlHealthCheckResult {
  healthy: boolean;
  httpStatus: number | null;
  finalUrl: string | null;
  redirectCount: number;
  responseTime: number | null;
  error: string | null;
  checkedAt: string;
}

export interface ProviderValidationResult {
  valid: boolean;
  provider: string;
  domainMatch: boolean;
  urlPatternMatch: boolean;
  knownProvider: boolean;
  error: string | null;
}

export interface QualityFactors {
  urlVerified: boolean;
  officialProvider: boolean;
  recentVerification: boolean;
  completeMetadata: boolean;
  accessibilityConfirmed: boolean;
}

export interface QualityScore {
  score: number;
  factors: QualityFactors;
  calculation: string;
}

export interface VerificationMetadata {
  verificationStatus: VerificationStatus;
  verificationSource: VerificationSource;
  lastVerifiedAt: string | null;
  lastCheckedAt: string | null;
  healthStatus: HealthStatus;
  failureCount: number;
  failureReason: string | null;
  httpStatus: number | null;
  finalUrl: string | null;
  redirectCount: number;
}

export interface LearningResource {
  id: string;
  title: string;
  provider: string;
  url: string;
  canonicalUrl: string;
  level: string;
  description: string | null;
  duration: string | null;
  verification: VerificationMetadata;
  qualityScore: QualityScore | null;
}

// ============================================================================
// SSRF Protection
// ============================================================================

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS metadata
  'metadata.google.internal', // GCP metadata
];

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./,
  /^127\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

function isBlockedHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTS.includes(lower)) return true;
  return PRIVATE_IP_RANGES.some((regex) => regex.test(lower));
}

function isBlockedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return isBlockedHost(url.hostname);
  } catch {
    return true; // Invalid URL = blocked
  }
}

// ============================================================================
// Provider Validation
// ============================================================================

const KNOWN_PROVIDERS = {
  'youtube.com': { name: 'YouTube', patterns: [/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/] },
  'coursera.org': { name: 'Coursera', patterns: [/^https?:\/\/(www\.)?coursera\.org/] },
  'freecodecamp.org': { name: 'freeCodeCamp', patterns: [/^https?:\/\/(www\.)?freecodecamp\.org/] },
  'microsoft.com': { name: 'Microsoft Learn', patterns: [/^https?:\/\/(docs|learn)\.microsoft\.com/] },
  'developer.mozilla.org': { name: 'MDN', patterns: [/^https?:\/\/developer\.mozilla\.org/] },
  'udemy.com': { name: 'Udemy', patterns: [/^https?:\/\/(www\.)?udemy\.com/] },
  'edx.org': { name: 'edX', patterns: [/^https?:\/\/(www\.)?edx\.org/] },
  'github.com': { name: 'GitHub', patterns: [/^https?:\/\/(www\.)?github\.com/] },
  'aws.amazon.com': { name: 'AWS', patterns: [/^https?:\/\/aws\.amazon\.com/] },
  'cloud.google.com': { name: 'Google Cloud', patterns: [/^https?:\/\/cloud\.google\.com/] },
  'reactjs.org': { name: 'React', patterns: [/^https?:\/\/(www\.)?react(js)?\.org/] },
  'react.dev': { name: 'React', patterns: [/^https?:\/\/react\.dev/] },
  'python.org': { name: 'Python', patterns: [/^https?:\/\/(www\.)?python\.org/] },
};

export function validateProvider(url: string, claimedProvider: string): ProviderValidationResult {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.replace(/^www\./, '');

    // Check if provider matches known providers
    const providerInfo = Object.entries(KNOWN_PROVIDERS).find(([domain, info]) =>
      hostname.includes(domain) || info.patterns.some((p) => p.test(url))
    );

    if (!providerInfo) {
      return {
        valid: false,
        provider: claimedProvider,
        domainMatch: false,
        urlPatternMatch: false,
        knownProvider: false,
        error: 'Unknown provider',
      };
    }

    const [_, info] = providerInfo;
    const domainMatch = hostname.includes(Object.keys(KNOWN_PROVIDERS).find((k) => hostname.includes(k)) || '');
    const urlPatternMatch = info.patterns.some((p) => p.test(url));

    return {
      valid: domainMatch && urlPatternMatch,
      provider: info.name,
      domainMatch,
      urlPatternMatch,
      knownProvider: true,
      error: null,
    };
  } catch (err) {
    return {
      valid: false,
      provider: claimedProvider,
      domainMatch: false,
      urlPatternMatch: false,
      knownProvider: false,
      error: err instanceof Error ? err.message : 'Invalid URL',
    };
  }
}

// ============================================================================
// URL Health Check
// ============================================================================

const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_REDIRECTS = 5;
const MAX_RESPONSE_SIZE = 1024 * 100; // 100KB for HEAD/metadata

export async function checkUrlHealth(url: string): Promise<UrlHealthCheckResult> {
  const startTime = Date.now();

  // SSRF protection
  if (isBlockedUrl(url)) {
    return {
      healthy: false,
      httpStatus: null,
      finalUrl: null,
      redirectCount: 0,
      responseTime: null,
      error: 'SSRF protection: blocked host',
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const result = await makeRequest(url, 'HEAD', 0);
    const responseTime = Date.now() - startTime;

    return {
      healthy: result.httpStatus >= 200 && result.httpStatus < 400,
      httpStatus: result.httpStatus,
      finalUrl: result.finalUrl,
      redirectCount: result.redirectCount,
      responseTime,
      error: result.error,
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      healthy: false,
      httpStatus: null,
      finalUrl: null,
      redirectCount: 0,
      responseTime: Date.now() - startTime,
      error: err instanceof Error ? err.message : 'Unknown error',
      checkedAt: new Date().toISOString(),
    };
  }
}

interface RequestResult {
  httpStatus: number;
  finalUrl: string;
  redirectCount: number;
  error: string | null;
}

function makeRequest(
  url: string,
  method: 'HEAD' | 'GET',
  redirectCount: number
): Promise<RequestResult> {
  return new Promise((resolve, reject) => {
    if (redirectCount > MAX_REDIRECTS) {
      reject(new Error('Too many redirects'));
      return;
    }

    // SSRF protection on each redirect
    if (isBlockedUrl(url)) {
      reject(new Error('SSRF protection: redirect to blocked host'));
      return;
    }

    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      method,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': 'CareerPilot-ResourceVerifier/1.0',
      },
    };

    const req = protocol.request(url, options, (res) => {
      // Handle redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        makeRequest(redirectUrl, method, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      // Success
      resolve({
        httpStatus: res.statusCode || 0,
        finalUrl: url,
        redirectCount,
        error: null,
      });

      // Drain response
      res.resume();
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

// ============================================================================
// Resource Verification
// ============================================================================

export interface ResourceVerificationResult {
  urlHealth: UrlHealthCheckResult;
  providerValidation: ProviderValidationResult;
  qualityScore: QualityScore;
  verificationStatus: VerificationStatus;
  recommendations: string[];
}

export async function verifyResource(
  url: string,
  provider: string,
  title: string,
  description: string | null,
  duration: string | null,
  level: string,
  lastVerifiedAt: string | null
): Promise<ResourceVerificationResult> {
  // Step 1: URL health check
  const urlHealth = await checkUrlHealth(url);

  // Step 2: Provider validation
  const providerValidation = validateProvider(url, provider);

  // Step 3: Calculate quality score
  const qualityScore = calculateQualityScore(
    { title, description, provider, duration, level, lastVerifiedAt },
    urlHealth,
    providerValidation
  );

  // Step 4: Determine verification status
  let verificationStatus: VerificationStatus;
  const recommendations: string[] = [];

  if (urlHealth.healthy && providerValidation.valid && qualityScore.score >= 70) {
    verificationStatus = 'VERIFIED';
  } else if (!urlHealth.healthy || urlHealth.httpStatus === 404 || urlHealth.httpStatus === 410) {
    verificationStatus = 'BROKEN';
    recommendations.push('URL is unreachable or returns error status');
  } else if (!providerValidation.valid) {
    verificationStatus = 'NEEDS_REVIEW';
    recommendations.push('Provider validation failed');
  } else {
    verificationStatus = 'NEEDS_REVIEW';
    if (qualityScore.score < 70) recommendations.push('Quality score below threshold');
    if (!urlHealth.healthy) recommendations.push('URL health check failed');
  }

  return {
    urlHealth,
    providerValidation,
    qualityScore,
    verificationStatus,
    recommendations,
  };
}

// ============================================================================
// Quality Scoring
// ============================================================================

export function calculateQualityScore(
  resource: { title: string; description: string | null; provider: string; duration: string | null; level: string; lastVerifiedAt: string | null },
  urlHealth: UrlHealthCheckResult,
  providerValidation: ProviderValidationResult
): QualityScore {
  const factors: QualityFactors = {
    urlVerified: urlHealth.healthy && urlHealth.httpStatus !== null && urlHealth.httpStatus < 400,
    officialProvider: providerValidation.knownProvider && providerValidation.valid,
    recentVerification: resource.lastVerifiedAt
      ? Date.now() - new Date(resource.lastVerifiedAt).getTime() < 30 * 24 * 60 * 60 * 1000
      : false,
    completeMetadata: !!(
      resource.title &&
      resource.description &&
      resource.provider &&
      resource.duration &&
      resource.level
    ),
    accessibilityConfirmed: urlHealth.healthy,
  };

  // Calculate score (0-100)
  let score = 0;
  if (factors.urlVerified) score += 40;
  if (factors.officialProvider) score += 25;
  if (factors.recentVerification) score += 15;
  if (factors.completeMetadata) score += 10;
  if (factors.accessibilityConfirmed) score += 10;

  const calculation = [
    factors.urlVerified && 'URL verified (40 pts)',
    factors.officialProvider && 'Official provider (25 pts)',
    factors.recentVerification && 'Recent verification (15 pts)',
    factors.completeMetadata && 'Complete metadata (10 pts)',
    factors.accessibilityConfirmed && 'Accessibility confirmed (10 pts)',
  ]
    .filter(Boolean)
    .join(' + ');

  return { score, factors, calculation };
}

// ============================================================================
// URL Normalization (for deduplication)
// ============================================================================

export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Normalize trailing slash
    if (parsed.pathname.endsWith('/') && parsed.pathname !== '/') {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    return parsed.toString();
  } catch {
    return url;
  }
}

// ============================================================================
// Resource Deduplication
// ============================================================================

export function deduplicateResources<T extends { url: string }>(resources: T[]): T[] {
  const seen = new Map<string, T>();

  for (const resource of resources) {
    const canonical = normalizeUrl(resource.url);
    if (!seen.has(canonical)) {
      seen.set(canonical, resource);
    }
  }

  return Array.from(seen.values());
}
