import { callOpenRouterJson } from '@/lib/openrouter';
import { buildSwingAnalysisMessages } from '@/prompts/swing-analysis';
import type { CoachingAnalysisProvider } from '@/types/analysis';
import { swingAnalysisResponseSchema } from '@/types/analysis';

const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4.1-mini';
const OPENROUTER_TIMEOUT_MS = 20_000;
const OPENROUTER_RETRIES = 2;
const GENERIC_PHRASES = ['solid swing', 'playable pattern', 'looks good overall', 'keep it up', 'minor tweaks'];

function validateCoachingQuality(response: ReturnType<typeof swingAnalysisResponseSchema.parse>): string | null {
  const genericHit = GENERIC_PHRASES.find((phrase) => {
    const haystacks = [
      response.summary,
      response.primaryFinding.title,
      response.primaryFinding.detail,
      ...Object.values(response.phaseObservations)
    ];

    return haystacks.some((value) => value.toLowerCase().includes(phrase));
  });

  if (genericHit) {
    return `Response contained generic coaching language: "${genericHit}"`;
  }

  const weakEvidence = response.priorityFixes.find((item) => !/[0-9]/.test(item.evidence) && !/(address|backswing|top|transition|impact|finish|head|pelvis|tempo|shaft|shoulder|hip)/i.test(item.evidence));

  if (weakEvidence) {
    return `Priority fix "${weakEvidence.title}" did not include concrete evidence.`;
  }

  const weakIssueEvidence = response.issueTaxonomy.find(
    (item) =>
      !/[0-9]/.test(item.evidence) &&
      !/(address|backswing|top|transition|impact|finish|head|pelvis|tempo|shaft|shoulder|hip|knee)/i.test(item.evidence)
  );

  if (weakIssueEvidence) {
    return `Issue taxonomy item "${weakIssueEvidence.code}" did not include concrete evidence.`;
  }

  return null;
}

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

      const qualityError = validateCoachingQuality(parsed.data);

      if (qualityError) {
        return {
          metadata: {
            providerId: 'openrouter',
            model,
            requestedAt,
            completedAt: new Date().toISOString(),
            validationError: qualityError
          },
          response: null,
          error: qualityError
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
