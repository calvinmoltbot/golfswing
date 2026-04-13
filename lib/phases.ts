import type { PoseMetrics, SwingPhaseDetection } from '@/types/analysis';

export function detectSwingPhases(metrics: PoseMetrics): SwingPhaseDetection {
  const byLabel = Object.fromEntries(metrics.keyFrames.map((frame) => [frame.label, frame.timestampMs]));

  return {
    addressMs: byLabel.address ?? 0,
    takeawayMs: 350,
    topMs: byLabel.top ?? 950,
    transitionMs: 1100,
    impactMs: byLabel.impact ?? 1450,
    finishMs: byLabel.finish ?? 2100
  };
}
