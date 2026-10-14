import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { featureFlags } from '../config/featureFlags.js';

export interface AIAgentRunLog {
  id: string;
  agent: string;
  promptVersion: string;
  model: string;
  tokensEstimate: number;
  latencyMs: number;
  status: 'success' | 'error' | 'fallback' | 'cached';
  createdAt: string;
  userId?: string;
  error?: string;
}

export interface AIGatewayMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cachedRequests: number;
  totalEstimatedTokens: number;
  estimatedCostUsd: number;
  avgLatencyMs: number;
  activeConcurrency: number;
  circuitBreakerTripped: boolean;
  byAgent: Record<string, number>;
  byModel: Record<string, number>;
}

const MAX_PROMPT_CHARS = 35000;
const REQUEST_TIMEOUT_MS = 15000;

// Models are configurable: GEMINI_MODELS="model-a,model-b" (first = preferred).
// Original working order first (restored), then the *-latest aliases as safety nets.
const DEFAULT_MODELS = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-flash-latest'];

export function getCandidateModels(preferred?: string): string[] {
  const fromEnv = (process.env.GEMINI_MODELS || '')
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean);
  const list = fromEnv.length ? fromEnv : DEFAULT_MODELS;
  return Array.from(new Set(preferred ? [preferred, ...list] : list));
}

// Errors that will fail identically on every model: stop instead of burning time on fallbacks.
function isFatalConfigError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('api key') ||
    msg.includes('api_key') ||
    msg.includes('permission_denied') ||
    msg.includes('unauthenticated') ||
    msg.includes('"code":401') ||
    msg.includes('"code":403') ||
    msg.includes('fetch failed')
  );
}
const MAX_CONCURRENT_REQUESTS = 10;
const MAX_USER_CONCURRENT_REQUESTS = 2;
const MAX_USER_REQUESTS_PER_MINUTE = 25;
const CONSECUTIVE_ERRORS_THRESHOLD = 5;
const CIRCUIT_BREAKER_COOLDOWN_MS = 30000;
const DEDUP_CACHE_TTL_MS = 25000;

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

export class AIGateway {
  private client: GoogleGenAI | null = null;
  private logs: AIAgentRunLog[] = [];
  private activeConcurrency = 0;
  private userConcurrency = new Map<string, number>();
  private userRequestWindows = new Map<string, number[]>();
  private consecutiveErrors = 0;
  private circuitTrippedUntil: number | null = null;
  private dedupCache = new Map<string, CacheEntry>();
  private cachedRequestsCount = 0;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        this.client = new GoogleGenAI({ apiKey });
      }
    }
    if (!this.client) {
      throw new Error('AI Provider is not configured. Missing GEMINI_API_KEY.');
    }
    return this.client;
  }

  private checkBudgetAndCircuit(userId = 'guest'): void {
    if (!featureFlags.isEnabled('aiGateway')) {
      throw new Error('AI Gateway is currently disabled by administrator feature flag.');
    }

    if (this.circuitTrippedUntil && Date.now() < this.circuitTrippedUntil) {
      const remainingSecs = Math.ceil((this.circuitTrippedUntil - Date.now()) / 1000);
      throw new Error(`AI Gateway circuit breaker is active due to consecutive upstream failures. Cool down active for ${remainingSecs}s.`);
    }

    if (this.activeConcurrency >= MAX_CONCURRENT_REQUESTS) {
      throw new Error('Global AI Gateway capacity reached: maximum concurrent operations in progress. Please retry momentarily.');
    }

    // Per-user concurrency limit
    const currentActiveForUser = this.userConcurrency.get(userId) || 0;
    if (currentActiveForUser >= MAX_USER_CONCURRENT_REQUESTS) {
      throw new Error('You have another AI generation currently in progress. Please wait for it to complete.');
    }

    // Per-user rate limiting (sliding 60-second window)
    const now = Date.now();
    const timestamps = (this.userRequestWindows.get(userId) || []).filter((t) => now - t < 60000);
    if (timestamps.length >= MAX_USER_REQUESTS_PER_MINUTE) {
      throw new Error('AI request rate limit reached. Maximum 25 requests per minute allowed. Please wait 60 seconds.');
    }
    timestamps.push(now);
    this.userRequestWindows.set(userId, timestamps);
  }

  private acquireUserSlot(userId = 'guest'): void {
    this.activeConcurrency += 1;
    this.userConcurrency.set(userId, (this.userConcurrency.get(userId) || 0) + 1);
  }

  private releaseUserSlot(userId = 'guest'): void {
    this.activeConcurrency = Math.max(0, this.activeConcurrency - 1);
    const curr = this.userConcurrency.get(userId) || 0;
    if (curr <= 1) {
      this.userConcurrency.delete(userId);
    } else {
      this.userConcurrency.set(userId, curr - 1);
    }
  }

  private recordSuccess(): void {
    this.consecutiveErrors = 0;
    this.circuitTrippedUntil = null;
  }

  private recordFailure(): void {
    this.consecutiveErrors += 1;
    if (this.consecutiveErrors >= CONSECUTIVE_ERRORS_THRESHOLD) {
      this.circuitTrippedUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
      console.warn(`[AIGateway] Circuit breaker TRIPPED for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s due to ${this.consecutiveErrors} consecutive errors.`);
    }
  }

  public isConfigured(): boolean {
    return Boolean(this.client || process.env.GEMINI_API_KEY);
  }

  public getLogs(): AIAgentRunLog[] {
    return this.logs;
  }

  public getAggregatedMetrics(): AIGatewayMetrics {
    const total = this.logs.length;
    const successful = this.logs.filter((l) => l.status === 'success').length;
    const failed = this.logs.filter((l) => l.status === 'error').length;
    const totalTokens = this.logs.reduce((acc, l) => acc + (l.tokensEstimate || 0), 0);
    const totalLatency = this.logs.reduce((acc, l) => acc + (l.latencyMs || 0), 0);

    // Blended rate ~$0.15 per million tokens for Gemini Flash tier
    const estimatedCostUsd = Number(((totalTokens / 1_000_000) * 0.15).toFixed(4));

    const byAgent: Record<string, number> = {};
    const byModel: Record<string, number> = {};

    for (const log of this.logs) {
      byAgent[log.agent] = (byAgent[log.agent] || 0) + 1;
      byModel[log.model] = (byModel[log.model] || 0) + 1;
    }

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      cachedRequests: this.cachedRequestsCount,
      totalEstimatedTokens: totalTokens,
      estimatedCostUsd,
      avgLatencyMs: total > 0 ? Math.round(totalLatency / total) : 0,
      activeConcurrency: this.activeConcurrency,
      circuitBreakerTripped: Boolean(this.circuitTrippedUntil && Date.now() < this.circuitTrippedUntil),
      byAgent,
      byModel,
    };
  }

  private recordLog(log: Omit<AIAgentRunLog, 'id' | 'createdAt'>) {
    const entry: AIAgentRunLog = {
      ...log,
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.logs.unshift(entry);
    if (this.logs.length > 200) this.logs.pop();
  }

  /**
   * General text generation with multi-model failover, bounded retries & circuit protection
   */
  async generateText(options: {
    agentName: string;
    promptVersion: string;
    systemInstruction: string;
    prompt: string;
    userId?: string;
    model?: string;
  }): Promise<string> {
    const userId = options.userId || 'guest';
    this.checkBudgetAndCircuit(userId);

    if (options.prompt.length > MAX_PROMPT_CHARS) {
      throw new Error(`Input document exceeds maximum allowed size of ${MAX_PROMPT_CHARS} characters.`);
    }

    // Deduplication check
    const cacheKey = `txt_${options.agentName}_${Buffer.from(options.prompt).toString('base64').substring(0, 64)}`;
    const cached = this.dedupCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DEDUP_CACHE_TTL_MS) {
      this.cachedRequestsCount++;
      this.recordLog({
        agent: options.agentName,
        promptVersion: options.promptVersion,
        model: 'cache-hit',
        tokensEstimate: 0,
        latencyMs: 1,
        status: 'cached',
        userId,
      });
      return cached.data as string;
    }

    this.acquireUserSlot(userId);
    const startTime = Date.now();
    const candidateModels = getCandidateModels(options.model);

    try {
      const client = this.getClient();
      let lastError: unknown = null;

      for (const model of candidateModels) {
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI request timeout exceeded')), REQUEST_TIMEOUT_MS)
          );

          const generatePromise = client.models.generateContent({
            model,
            contents: [
              { role: 'user', parts: [{ text: `${options.systemInstruction}\n\n${options.prompt}` }] },
            ],
          });

          const response = await Promise.race([generatePromise, timeoutPromise]);
          const text = response.text ?? '';
          const latencyMs = Date.now() - startTime;
          const tokensEstimate = Math.round((options.prompt.length + text.length) / 4);

          this.recordSuccess();
          this.dedupCache.set(cacheKey, { data: text, timestamp: Date.now() });
          this.recordLog({
            agent: options.agentName,
            promptVersion: options.promptVersion,
            model,
            tokensEstimate,
            latencyMs,
            status: 'success',
            userId,
          });

          return text;
        } catch (err: unknown) {
          lastError = err;
          console.warn(`[AIGateway] Model ${model} encountered error:`, err instanceof Error ? err.message : err);
          if (isFatalConfigError(err)) break;
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      this.recordFailure();
      const latencyMs = Date.now() - startTime;
      const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
      this.recordLog({
        agent: options.agentName,
        promptVersion: options.promptVersion,
        model: candidateModels[0],
        tokensEstimate: 0,
        latencyMs,
        status: 'error',
        userId,
        error: errorMsg,
      });
      throw lastError;
    } finally {
      this.releaseUserSlot(userId);
    }
  }

  /**
   * Structured JSON generation with Zod validation, multi-model failover & circuit breaker
   */
  async generateStructured<T>(options: {
    agentName: string;
    promptVersion: string;
    systemInstruction: string;
    prompt: string;
    schema: z.ZodType<T>;
    userId?: string;
    model?: string;
  }): Promise<T> {
    const userId = options.userId || 'guest';
    this.checkBudgetAndCircuit(userId);

    if (options.prompt.length > MAX_PROMPT_CHARS) {
      throw new Error(`Input document exceeds maximum allowed size of ${MAX_PROMPT_CHARS} characters.`);
    }

    // Deduplication check
    const cacheKey = `struct_${options.agentName}_${Buffer.from(options.prompt).toString('base64').substring(0, 64)}`;
    const cached = this.dedupCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DEDUP_CACHE_TTL_MS) {
      this.cachedRequestsCount++;
      this.recordLog({
        agent: options.agentName,
        promptVersion: options.promptVersion,
        model: 'cache-hit',
        tokensEstimate: 0,
        latencyMs: 1,
        status: 'cached',
        userId,
      });
      return cached.data as T;
    }

    this.acquireUserSlot(userId);
    const startTime = Date.now();
    const candidateModels = getCandidateModels(options.model);

    try {
      const client = this.getClient();
      let lastError: unknown = null;

      for (const model of candidateModels) {
        try {
          const formattedPrompt = `${options.systemInstruction}\n\nIMPORTANT: Return strictly valid JSON conforming to the requested schema. Do NOT include markdown code fences or conversational text.\n\n${options.prompt}`;

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('AI structured request timeout exceeded')), REQUEST_TIMEOUT_MS)
          );

          const generatePromise = client.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: formattedPrompt }] }],
            config: {
              responseMimeType: 'application/json',
            },
          });

          const response = await Promise.race([generatePromise, timeoutPromise]);
          const rawText = response.text ?? '{}';
          const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          let validated: T;
          try {
            validated = options.schema.parse(parsed);
          } catch (firstErr) {
            if (Array.isArray(parsed)) {
              validated = options.schema.parse({
                domainTitle: 'AI Curated Track',
                rationale: 'Tailored development curriculum designed to accelerate your career readiness.',
                recommendedCourses: parsed,
                courses: parsed,
                items: parsed,
              } as unknown as T);
            } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as Record<string, unknown>).courses)) {
              validated = options.schema.parse({
                ...parsed,
                recommendedCourses: (parsed as Record<string, unknown>).courses,
              } as unknown as T);
            } else {
              throw firstErr;
            }
          }

          const latencyMs = Date.now() - startTime;
          const tokensEstimate = Math.round((options.prompt.length + rawText.length) / 4);

          this.recordSuccess();
          this.dedupCache.set(cacheKey, { data: validated, timestamp: Date.now() });
          this.recordLog({
            agent: options.agentName,
            promptVersion: options.promptVersion,
            model,
            tokensEstimate,
            latencyMs,
            status: 'success',
            userId,
          });

          return validated;
        } catch (err: unknown) {
          lastError = err;
          console.warn(`[AIGateway] Model ${model} structured generation error:`, err instanceof Error ? err.message : err);
          if (isFatalConfigError(err)) break;
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      this.recordFailure();
      const latencyMs = Date.now() - startTime;
      const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);

      this.recordLog({
        agent: options.agentName,
        promptVersion: options.promptVersion,
        model: candidateModels[0],
        tokensEstimate: 0,
        latencyMs,
        status: 'error',
        userId,
        error: errorMsg,
      });

      throw lastError;
    } finally {
      this.releaseUserSlot(userId);
    }
  }
}

export const aiGateway = new AIGateway();
