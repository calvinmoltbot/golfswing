import { createMockPoseEstimationProvider } from '@/services/pose-estimation/mock';
import type { PoseEstimationProvider } from '@/types/analysis';

function resolveProvider(): PoseEstimationProvider {
  const provider = process.env.POSE_ESTIMATION_PROVIDER || 'mock';

  switch (provider) {
    case 'mock':
      return createMockPoseEstimationProvider();
    default:
      throw new Error(`Unsupported pose estimation provider: ${provider}`);
  }
}

export async function estimatePoseFromVideo(input: { videoPath: string }) {
  const provider = resolveProvider();
  return provider.estimate(input);
}
