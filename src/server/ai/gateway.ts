import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

export interface AIAgentRunLog {
  id: string;
  agent: string;
  promptVersion: string;
  model: string;
  tokensEstimate: number;
  latencyMs: number;
  status: 'success' | 'error' | 'fallback';
  createdAt: string;
  error?: string;
}

export class AIGateway {
  private client: GoogleGenAI | null = null;
  private logs: AIAgentRunLog[] = [];

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

  public getLogs(): AIAgentRunLog[] {
    return this.logs;
  }

  private recordLog(log: Omit<AIAgentRunLog, 'id' | 'createdAt'>) {
    const entry: AIAgentRunLog = {
      ...log,
      id: `run-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.logs.unshift(entry);
    if (this.logs.length > 100) this.logs.pop();
  }

  /**
   * General text generation with multi-model failover
   */
  async generateText(options: {
    agentName: string;
    promptVersion: string;
    systemInstruction: string;
    prompt: string;
    model?: string;
  }): Promise<string> {
    const startTime = Date.now();
    const candidateModels = [
      options.model || 'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ];

    let client: GoogleGenAI;
    try {
      client = this.getClient();
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      this.recordLog({
        agent: options.agentName,
        promptVersion: options.promptVersion,
        model: candidateModels[0],
        tokensEstimate: 0,
        latencyMs: 1,
        status: 'error',
        error: errorMsg,
      });
      throw e;
    }

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model,
          contents: [
            { role: 'user', parts: [{ text: `${options.systemInstruction}\n\n${options.prompt}` }] },
          ],
        });

        const text = response.text || '';
        const latencyMs = Date.now() - startTime;
        const tokensEstimate = Math.round((options.prompt.length + text.length) / 4);

        this.recordLog({
          agent: options.agentName,
          promptVersion: options.promptVersion,
          model,
          tokensEstimate,
          latencyMs,
          status: 'success',
        });

        return text;
      } catch (err: unknown) {
        lastError = err;
        console.warn(`[AIGateway] Model ${model} encountered error, trying next candidate:`, err);
        // Wait before fallback
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    const latencyMs = Date.now() - startTime;
    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);
    this.recordLog({
      agent: options.agentName,
      promptVersion: options.promptVersion,
      model: candidateModels[0],
      tokensEstimate: 0,
      latencyMs,
      status: 'error',
      error: errorMsg,
    });
    throw lastError;
  }

  /**
   * Structured JSON generation with Zod validation and multi-model failover
   */
  async generateStructured<T>(options: {
    agentName: string;
    promptVersion: string;
    systemInstruction: string;
    prompt: string;
    schema: z.ZodType<T>;
    model?: string;
  }): Promise<T> {
    const startTime = Date.now();
    const candidateModels = [
      options.model || 'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
    ];

    const client = this.getClient();

    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const formattedPrompt = `${options.systemInstruction}\n\nIMPORTANT: Return strictly valid JSON conforming to the requested schema. Do NOT include markdown code fences or conversational text.\n\n${options.prompt}`;

        const response = await client.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: formattedPrompt }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        let parsed = JSON.parse(cleanJson);

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
            } as any);
          } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as any).courses)) {
            validated = options.schema.parse({
              ...parsed,
              recommendedCourses: (parsed as any).courses,
            } as any);
          } else {
            throw firstErr;
          }
        }

        const latencyMs = Date.now() - startTime;
        const tokensEstimate = Math.round((options.prompt.length + rawText.length) / 4);

        this.recordLog({
          agent: options.agentName,
          promptVersion: options.promptVersion,
          model,
          tokensEstimate,
          latencyMs,
          status: 'success',
        });

        return validated;
      } catch (err: unknown) {
        lastError = err;
        console.warn(`[AIGateway] Model ${model} structured generation error, trying fallback:`, err);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    const latencyMs = Date.now() - startTime;
    const errorMsg = lastError instanceof Error ? lastError.message : String(lastError);

    this.recordLog({
      agent: options.agentName,
      promptVersion: options.promptVersion,
      model: candidateModels[0],
      tokensEstimate: 0,
      latencyMs,
      status: 'error',
      error: errorMsg,
    });

    throw lastError;
  }
}

export const aiGateway = new AIGateway();
