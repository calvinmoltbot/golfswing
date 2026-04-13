import type { PoseMetrics, SwingPhaseDetection } from '@/types/analysis';

function clampBetween(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function detectSwingPhases(metrics: PoseMetrics): SwingPhaseDetection {
  const byLabel = Object.fromEntries(metrics.keyFrames.map((frame) => [frame.label, frame.timestampMs]));
  const addressMs = byLabel.address ?? 0;
  const topMs = byLabel.top ?? Math.round(metrics.durationMs * 0.42);
  const impactMs = byLabel.impact ?? Math.round(metrics.durationMs * 0.68);
  const finishMs = byLabel.finish ?? Math.round(metrics.durationMs * 0.9);
  const takeawayMs = clampBetween(
    Math.round(addressMs + (topMs - addressMs) * 0.35),
    addressMs,
    Math.max(topMs - 1, addressMs)
  );
  const transitionMs = clampBetween(
    Math.round(topMs + (impactMs - topMs) * 0.35),
    topMs,
    Math.max(impactMs - 1, topMs)
  );

  return {
    addressMs,
    takeawayMs,
    topMs,
    transitionMs,
    impactMs,
    finishMs
  };
}
