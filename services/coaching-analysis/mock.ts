import { buildMockSwingAnalysis } from '@/lib/mock-analysis';
import type { CoachingAnalysisProvider } from '@/types/analysis';

export const mockCoachingAnalysisProvider: CoachingAnalysisProvider = {
  id: 'mock',
  async analyze({ request, metrics, phases }) {
    const requestedAt = new Date().toISOString();

    return {
      metadata: {
        providerId: 'mock',
        model: 'mock-v1',
        requestedAt,
        completedAt: new Date().toISOString(),
        validationError: null
      },
      response: buildMockSwingAnalysis({ request, metrics, phases }),
      error: null
    };
  }
};
