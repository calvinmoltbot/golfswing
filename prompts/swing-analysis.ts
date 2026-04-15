import type { ChatMessage } from '@/lib/openrouter';
import type { PoseMetrics, SwingAnalysisRequest, SwingPhaseDetection } from '@/types/analysis';

function deriveClubCategory(club: string): 'driver' | 'fairway' | 'hybrid' | 'iron' | 'wedge' {
  const normalized = club.toLowerCase();

  if (normalized.includes('driver')) {
    return 'driver';
  }

  if (normalized.includes('wood')) {
    return 'fairway';
  }

  if (normalized.includes('hybrid')) {
    return 'hybrid';
  }

  if (normalized.includes('wedge')) {
    return 'wedge';
  }

  return 'iron';
}

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
  const clubCategory = deriveClubCategory(request.playerContext.club);
  const reportModeGuidance =
    request.reportMode === 'full'
      ? 'Use fuller explanations. Summary and primary finding detail may use up to 3 sentences each.'
      : 'Be concise. Summary and primary finding detail should stay to 1-2 sentences each.';
  const cameraViewGuidance =
    request.playerContext.cameraView === 'face-on'
      ? 'Prioritize pressure shift, sway, centered turn, and low-point or contact implications that are visible from face-on.'
      : 'Prioritize delivery, hand path, rotation depth, and strike-pattern implications that are visible from down-the-line.';
  const clubGuidance =
    clubCategory === 'driver'
      ? 'Bias the analysis toward tee-shot launch, face delivery, and speed-friendly sequencing. Do not over-focus on wedge-style shaft lean.'
      : clubCategory === 'fairway'
        ? 'Balance speed and strike. Fairway woods need centered contact and stable low point as much as speed.'
        : clubCategory === 'hybrid'
          ? 'Hybrid feedback should balance descending strike, face delivery, and stability through transition.'
          : clubCategory === 'wedge'
            ? 'Bias the analysis toward strike control, low point, and delivered loft. Wedge feedback should emphasize precision over speed.'
            : 'Iron feedback should emphasize strike quality, low point, compression, and face-to-path control.';

  const system = `You are a golf swing analysis assistant. You are given swing context, extracted swing metrics, and phase timings.
Return strict JSON only with this shape:
{
  "summary": string,
  "confidence": "low" | "medium" | "high",
  "issueTaxonomy": [
    {
      "code": "head_drift" | "excessive_slide" | "under_rotated_hips" | "low_shaft_lean" | "tempo_outlier" | "limited_lead_knee_flex",
      "label": string,
      "severity": "low" | "medium" | "high",
      "evidence": string
    }
  ],
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
  "phaseScores": {
    "address": { "score": 1-10, "reason": string },
    "backswing": { "score": 1-10, "reason": string },
    "top": { "score": 1-10, "reason": string },
    "transition": { "score": 1-10, "reason": string },
    "impact": { "score": 1-10, "reason": string },
    "finish": { "score": 1-10, "reason": string }
  },
  "drills": [{ "name": string, "reason": string, "checkpoint": string }],
  "warnings": string[]
}
Do not invent exact biomechanical certainty from weak evidence. Use cautious language where appropriate.
Prioritize actionable coaching over generic praise.
Every priority fix must cite specific evidence from metrics or phase timings.
Every issueTaxonomy item must use one of the allowed codes and include evidence.
Every phaseScores item must include a 1-10 score and a short reason tied to the observed evidence.
The primary finding should name the biggest problem and its likely ball-flight or contact consequence.
The measurable checkpoint should be something a player can track in the next session.
Avoid generic phrases such as "solid swing", "playable pattern", "looks good overall", "keep it up", or "minor tweaks".
If evidence quality is low, explicitly use uncertainty language like "likely", "may", or "could" and avoid claiming precise causal certainty.
If evidence quality is medium, balance caution with specificity.
If evidence quality is high, you can be more direct, but still tie claims to evidence.
Use player goal, usual miss, shot shape, and skill band to prioritize advice when those fields are present.
If the player's stated miss or goal conflicts with the raw evidence, acknowledge the uncertainty instead of forcing a false match.
${cameraViewGuidance}
${clubGuidance}
${reportModeGuidance}`;

  const user = JSON.stringify(
    {
      request,
      clubCategory,
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
