/**
 * CareerPilot AI - Enterprise Structured Logger & Telemetry Engine
 * Features: Correlation IDs, automatic PII/secret redaction, error metric aggregation.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface StructuredLog {
  timestamp: string;
  level: LogLevel;
  event: string;
  correlationId?: string;
  userId?: string;
  durationMs?: number;
  statusCode?: number;
  metadata?: Record<string, unknown>;
  error?: string;
  stack?: string;
}

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /cookie/i,
  /session/i,
  /private/i,
];

/**
 * Recursively deep-redacts sensitive fields from objects before serialization
 */
export function sanitizeMetadata(data: unknown, depth = 0): unknown {
  if (depth > 6) return '[MAX_DEPTH]';
  if (!data || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMetadata(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (key === 'prompt' || key === 'resumeContent' || key === 'fullText' || key === 'emailBody') {
      // Truncate long content to avoid logging PII or bloated CV contents
      if (typeof value === 'string') {
        sanitized[key] = `[TRUNCATED: ${value.length} chars]`;
      } else {
        sanitized[key] = '[CONTENT_TRUNCATED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMetadata(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface MetricSnapshot {
  totalRequests: number;
  errorCount: number;
  authFailures: number;
  aiFailures: number;
  storageFailures: number;
  p95LatencyMs: number;
  recentErrors: { time: string; event: string; error?: string }[];
}

class OperationalTelemetry {
  private totalRequests = 0;
  private errorCount = 0;
  private authFailures = 0;
  private aiFailures = 0;
  private storageFailures = 0;
  private latencies: number[] = [];
  private recentErrors: { time: string; event: string; error?: string }[] = [];

  public log(entry: Omit<StructuredLog, 'timestamp'>): void {
    const fullLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      ...entry,
      metadata: entry.metadata ? (sanitizeMetadata(entry.metadata) as Record<string, unknown>) : undefined,
    };

    if (entry.level === 'error') {
      this.errorCount++;
      this.recentErrors.unshift({
        time: fullLog.timestamp,
        event: fullLog.event,
        error: fullLog.error,
      });
      if (this.recentErrors.length > 50) this.recentErrors.pop();
    }

    if (entry.event.includes('AUTH_FAILED')) {
      this.authFailures++;
    }
    if (entry.event.includes('AI_FAILURE')) {
      this.aiFailures++;
    }
    if (entry.event.includes('STORAGE_ERROR')) {
      this.storageFailures++;
    }

    if (entry.durationMs !== undefined) {
      this.latencies.push(entry.durationMs);
      if (this.latencies.length > 500) this.latencies.shift();
    }

    const jsonStr = JSON.stringify(fullLog);
    if (entry.level === 'error') {
      console.error(jsonStr);
    } else if (entry.level === 'warn') {
      console.warn(jsonStr);
    } else if (process.env.NODE_ENV === 'production' || process.env.VERBOSE_LOGS === 'true') {
      console.log(jsonStr);
    }
  }

  public recordRequest(durationMs: number, statusCode: number): void {
    this.totalRequests++;
    this.latencies.push(durationMs);
    if (this.latencies.length > 500) this.latencies.shift();
    if (statusCode >= 400 && statusCode < 500 && (statusCode === 401 || statusCode === 403)) {
      this.authFailures++;
    } else if (statusCode >= 500) {
      this.errorCount++;
    }
  }

  public getSnapshot(): MetricSnapshot {
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95LatencyMs = sorted.length > 0 ? sorted[p95Index] : 0;

    return {
      totalRequests: this.totalRequests,
      errorCount: this.errorCount,
      authFailures: this.authFailures,
      aiFailures: this.aiFailures,
      storageFailures: this.storageFailures,
      p95LatencyMs,
      recentErrors: this.recentErrors.slice(0, 15),
    };
  }
}

export const logger = new OperationalTelemetry();
