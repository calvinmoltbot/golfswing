import type {
  CoachingAnalysisProvider,
  CoachingAnalysisResult,
  PoseMetrics,
  SwingAnalysisRequest,
  SwingPhaseDetection
} from '@/types/analysis';
import { mockCoachingAnalysisProvider } from '@/services/coaching-analysis/mock';
import { openRouterCoachingAnalysisProvider } from '@/services/coaching-analysis/openrouter';

function resolveProvider(): CoachingAnalysisProvider {
  const configuredProvider = process.env.COACHING_ANALYSIS_PROVIDER;

  if (configuredProvider === 'openrouter') {
    return openRouterCoachingAnalysisProvider;
  }

  if (configuredProvider === 'mock') {
    return mockCoachingAnalysisProvider;
  }

  if (process.env.OPENROUTER_API_KEY) {
    return openRouterCoachingAnalysisProvider;
  }

  return mockCoachingAnalysisProvider;
}

export async function analyzeSwingCoaching(input: {
  request: SwingAnalysisRequest;
  metrics: PoseMetrics;
  phases: SwingPhaseDetection;
}): Promise<CoachingAnalysisResult> {
  const provider = resolveProvider();
  return provider.analyze(input);
}
