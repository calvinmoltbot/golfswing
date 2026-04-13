import type { PoseEstimationProvider, PoseEstimationResult } from '@/types/analysis';

function buildMockFrames(durationMs: number) {
  return [
    {
      timestampMs: 0,
      keypoints: [
        { name: 'head', x: 320, y: 92, confidence: 0.98 },
        { name: 'lead_hip', x: 294, y: 242, confidence: 0.95 },
        { name: 'trail_hip', x: 344, y: 244, confidence: 0.95 },
        { name: 'lead_hand', x: 308, y: 188, confidence: 0.96 }
      ]
    },
    {
      timestampMs: 950,
      keypoints: [
        { name: 'head', x: 327, y: 91, confidence: 0.98 },
        { name: 'lead_hip', x: 304, y: 246, confidence: 0.94 },
        { name: 'trail_hip', x: 352, y: 238, confidence: 0.94 },
        { name: 'lead_hand', x: 360, y: 120, confidence: 0.95 }
      ]
    },
    {
      timestampMs: 1450,
      keypoints: [
        { name: 'head', x: 338, y: 95, confidence: 0.98 },
        { name: 'lead_hip', x: 319, y: 241, confidence: 0.95 },
        { name: 'trail_hip', x: 365, y: 246, confidence: 0.95 },
        { name: 'lead_hand', x: 292, y: 209, confidence: 0.96 }
      ]
    },
    {
      timestampMs: durationMs - 100,
      keypoints: [
        { name: 'head', x: 333, y: 92, confidence: 0.97 },
        { name: 'lead_hip', x: 312, y: 236, confidence: 0.94 },
        { name: 'trail_hip', x: 360, y: 248, confidence: 0.94 },
        { name: 'lead_hand', x: 280, y: 132, confidence: 0.95 }
      ]
    }
  ];
}

export function createMockPoseEstimationProvider(): PoseEstimationProvider {
  return {
    id: 'mock',
    async estimate({ videoPath }): Promise<PoseEstimationResult> {
      const durationMs = 2200;

      return {
        provider: {
          id: 'mock',
          version: '1.0.0'
        },
        metrics: {
          sourceVideoPath: videoPath,
          fps: 30,
          durationMs,
          keyFrames: [
            { label: 'address', timestampMs: 0 },
            { label: 'top', timestampMs: 950 },
            { label: 'impact', timestampMs: 1450 },
            { label: 'finish', timestampMs: 2100 }
          ],
          measurements: {
            headDriftPx: 18,
            pelvisShiftPx: 24,
            leadKneeFlexChangeDeg: 11,
            shaftLeanAtImpactDeg: 7,
            shoulderTurnDeg: 82,
            hipTurnDeg: 39,
            tempoRatio: 2.8
          }
        },
        keypointFrames: buildMockFrames(durationMs)
      };
    }
  };
}
