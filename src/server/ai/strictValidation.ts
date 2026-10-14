import { z } from 'zod';
import { aiGateway } from './gateway.js';

/**
 * CareerPilot AI — Strict Response Validation Wrapper
 *
 * Ensures AI responses meet strict validation requirements.
 * No .catch() fallbacks. Fails fast on invalid data.
 */

export async function generateStructuredStrict<T>(options: {
  agentName: string;
  promptVersion: string;
  systemInstruction: string;
  prompt: string;
  schema: z.ZodType<T>;
  userId?: string;
  model?: string;
}): Promise<T> {
  console.log(`[STRICT_VALIDATION] Requesting ${options.agentName}...`);

  try {
    // Get raw response from gateway
    const rawResponse = await aiGateway.generateStructured({
      agentName: options.agentName,
      promptVersion: options.promptVersion,
      systemInstruction: options.systemInstruction,
      prompt: options.prompt,
      schema: z.any(), // First pass: accept anything
      userId: options.userId,
      model: options.model,
    });

    // Now validate STRICTLY against the actual schema
    console.log(`[STRICT_VALIDATION] Validating ${options.agentName} response...`);

    try {
      const validated = options.schema.parse(rawResponse);
      console.log(`[STRICT_VALIDATION] ✓ ${options.agentName} passed strict validation`);
      return validated;
    } catch (validationErr: any) {
      if (validationErr instanceof z.ZodError) {
        const errorDetails = (validationErr as z.ZodError).issues
          .map((e: any) => `${e.path.join('.') || 'root'}: ${e.message}`)
          .join('; ');

        console.error(`[STRICT_VALIDATION] ✗ ${options.agentName} FAILED strict validation:`, errorDetails);
        console.error(`[STRICT_VALIDATION] Raw response was:`, JSON.stringify(rawResponse, null, 2));

        throw new Error(
          `AI response validation FAILED for ${options.agentName}\n` +
          `The AI returned data that does not conform to required structure.\n` +
          `Errors: ${errorDetails}\n` +
          `This is a system issue, not user data. Please retry or contact support.`
        );
      }
      throw validationErr;
    }
  } catch (err) {
    console.error(`[STRICT_VALIDATION] ${options.agentName} error:`, err);
    throw err;
  }
}

/**
 * Helper to validate AI response with strict schema
 */
export function strictValidateResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  agentName: string
): { valid: true; data: T } | { valid: false; error: string; details: string[] } {
  try {
    const validated = schema.parse(data);
    return { valid: true, data: validated };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const details = (err as z.ZodError).issues.map((e: any) => `${e.path.join('.') || 'root'}: ${e.message}`);
      return {
        valid: false,
        error: `${agentName} response failed strict validation`,
        details,
      };
    }
    return {
      valid: false,
      error: `${agentName} validation error: ${err instanceof Error ? err.message : String(err)}`,
      details: [],
    };
  }
}