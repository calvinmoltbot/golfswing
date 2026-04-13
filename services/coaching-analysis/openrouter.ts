import { callOpenRouterJson } from '@/lib/openrouter';
import { buildSwingAnalysisMessages } from '@/prompts/swing-analysis';
import type { CoachingAnalysisProvider } from '@/types/analysis';
import { swingAnalysisResponseSchema } from '@/types/analysis';

const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4.1-mini';
const OPENROUTER_TIMEOUT_MS = 20_000;
const OPENROUTER_RETRIES = 2;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`Coaching analysis timed out after ${timeoutMs}ms`)), timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

export const openRouterCoachingAnalysisProvider: CoachingAnalysisProvider = {
  id: 'openrouter',
  async analyze({ request, metrics, phases }) {
    const model = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    const requestedAt = new Date().toISOString();

    try {
      let rawPayload: unknown;

      for (let attempt = 1; attempt <= OPENROUTER_RETRIES; attempt += 1) {
        try {
          rawPayload = await withTimeout(
            callOpenRouterJson<unknown>({
              model,
              messages: buildSwingAnalysisMessages({
                request,
                metrics,
                phases
              })
            }),
            OPENROUTER_TIMEOUT_MS
          );
          break;
        } catch (error) {
          if (attempt === OPENROUTER_RETRIES) {
            throw error;
          }
        }
      }

      const parsed = swingAnalysisResponseSchema.safeParse(rawPayload);

      if (!parsed.success) {
        const validationError = parsed.error.issues.map((issue) => issue.message).join('; ');

        return {
          metadata: {
            providerId: 'openrouter',
            model,
            requestedAt,
            completedAt: new Date().toISOString(),
            validationError
          },
          response: null,
          error: `OpenRouter response failed validation: ${validationError}`
        };
      }

      return {
        metadata: {
          providerId: 'openrouter',
          model,
          requestedAt,
          completedAt: new Date().toISOString(),
          validationError: null
        },
        response: parsed.data,
        error: null
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown OpenRouter error';

      return {
        metadata: {
          providerId: 'openrouter',
          model,
          requestedAt,
          completedAt: new Date().toISOString(),
          validationError: message
        },
        response: null,
        error: message
      };
    }
  }
};
