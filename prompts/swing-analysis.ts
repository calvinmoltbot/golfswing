import type { ChatMessage } from '@/lib/openrouter';
import type { PoseMetrics, SwingAnalysisRequest, SwingPhaseDetection } from '@/types/analysis';

function deriveEvidenceQuality(metrics: PoseMetrics): 'low' | 'medium' | 'high' {
  const signals = [
    metrics.measurements.headDriftPx > 0,
    metrics.measurements.pelvisShiftPx > 0,
    metrics.measurements.shaftLeanAtImpactDeg > 0,
    metrics.measurements.shoulderTurnDeg > 0,
    metrics.measurements.hipTurnDeg > 0,
    metrics.measurements.tempoRatio > 0
  ].filter(Boolean).length;

  if (metrics.durationMs < 1800 || signals < 4) {
    return 'low';
  }

  if (metrics.durationMs < 3500 || signals < 6) {
    return 'medium';
  }

  return 'high';
}

export function buildSwingAnalysisMessages({
  request,
  metrics,
  phases
}: {
  request: SwingAnalysisRequest;
  metrics: PoseMetrics;
  phases: SwingPhaseDetection;
}): ChatMessage[] {
  const evidenceQuality = deriveEvidenceQuality(metrics);
  const reportModeGuidance =
    request.reportMode === 'full'
      ? 'Use fuller explanations. Summary and primary finding detail may use up to 3 sentences each.'
      : 'Be concise. Summary and primary finding detail should stay to 1-2 sentences each.';

  const system = `You are a golf swing analysis assistant. You are given swing context, extracted swing metrics, and phase timings.
Return strict JSON only with this shape:
{
  "summary": string,
  "confidence": "low" | "medium" | "high",
  "primaryFinding": {
    "title": string,
    "detail": string,
    "impact": string,
    "confidence": "low" | "medium" | "high"
  },
  "measurableCheckpoint": {
    "label": string,
    "target": string,
    "whyItMatters": string
  },
  "priorityFixes": [
    {
      "title": string,
      "detail": string,
      "evidence": string
    }
  ],
  "phaseObservations": {
    "address": string,
    "backswing": string,
    "top": string,
    "transition": string,
    "impact": string,
    "finish": string
  },
  "drills": [{ "name": string, "reason": string, "checkpoint": string }],
  "warnings": string[]
}
Do not invent exact biomechanical certainty from weak evidence. Use cautious language where appropriate.
Prioritize actionable coaching over generic praise.
Every priority fix must cite specific evidence from metrics or phase timings.
The primary finding should name the biggest problem and its likely ball-flight or contact consequence.
The measurable checkpoint should be something a player can track in the next session.
Avoid generic phrases such as "solid swing", "playable pattern", "looks good overall", "keep it up", or "minor tweaks".
If evidence quality is low, explicitly use uncertainty language like "likely", "may", or "could" and avoid claiming precise causal certainty.
If evidence quality is medium, balance caution with specificity.
If evidence quality is high, you can be more direct, but still tie claims to evidence.
${reportModeGuidance}`;

  const user = JSON.stringify(
    {
      request,
      evidenceQuality,
      metrics,
      phases
    },
    null,
    2
  );

  return [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];
}
