import type { ChatMessage } from '@/lib/openrouter';
import type { PoseMetrics, SwingAnalysisRequest, SwingPhaseDetection } from '@/types/analysis';

export function buildSwingAnalysisMessages({
  request,
  metrics,
  phases
}: {
  request: SwingAnalysisRequest;
  metrics: PoseMetrics;
  phases: SwingPhaseDetection;
}): ChatMessage[] {
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
The measurable checkpoint should be something a player can track in the next session.`;

  const user = JSON.stringify(
    {
      request,
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
