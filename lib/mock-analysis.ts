import type { PoseMetrics, SwingAnalysisRequest, SwingAnalysisResponse, SwingPhaseDetection } from '@/types/analysis';

function formatPhaseTime(timestampMs: number) {
  return `${(timestampMs / 1000).toFixed(2)}s`;
}

export function buildMockSwingAnalysis({
  request,
  metrics,
  phases
}: {
  request: SwingAnalysisRequest;
  metrics: PoseMetrics;
  phases: SwingPhaseDetection;
}): SwingAnalysisResponse {
  const priorityFixes: string[] = [];
  const drills: SwingAnalysisResponse['drills'] = [];

  if (metrics.measurements.pelvisShiftPx > 20) {
    priorityFixes.push('Reduce lateral slide in transition so the chest and pelvis can keep rotating through impact.');
    drills.push({
      name: 'Step-through transition drill',
      reason: 'Helps sequence pressure shift without letting the pelvis outrun rotation.'
    });
  }

  if (metrics.measurements.shaftLeanAtImpactDeg < 10) {
    priorityFixes.push('Train a more forward-leaning impact alignments so strike and compression improve.');
    drills.push({
      name: 'Impact bag preset',
      reason: 'Builds awareness of handle-forward delivery and pressure into the lead side.'
    });
  }

  if (metrics.measurements.tempoRatio > 2.7) {
    priorityFixes.push('Smooth the transition to keep backswing and downswing tempo from getting too abrupt.');
    drills.push({
      name: 'Three-to-one tempo swings',
      reason: 'Encourages a calmer transition and a more repeatable strike pattern.'
    });
  }

  if (priorityFixes.length === 0) {
    priorityFixes.push('Keep the current movement pattern and focus on repeating center-face contact.');
    drills.push({
      name: 'Nine-ball contact ladder',
      reason: 'Reinforces centered strike while maintaining the current motion.'
    });
  }

  const viewLabel = request.playerContext.cameraView === 'down-the-line' ? 'Down-the-line' : 'Face-on';
  const notesSuffix = request.notes ? ` Player notes mention: ${request.notes.trim()}.` : '';

  return {
    summary: `${viewLabel} mock analysis for a ${request.playerContext.club} swing. The clip shows a playable pattern, with the biggest gains available through transition control and cleaner impact alignments.${notesSuffix}`,
    confidence: 'medium',
    priorityFixes,
    phaseObservations: {
      address: `Setup is stable at ${formatPhaseTime(phases.addressMs)} with manageable head movement and a neutral starting position.`,
      backswing: `Backswing pace remains functional through ${formatPhaseTime(phases.topMs)}, with ${metrics.measurements.shoulderTurnDeg} degrees of shoulder turn.`,
      top: 'At the top, the turn depth looks adequate, but the body needs to stay organized before unwinding.',
      transition: `Transition begins around ${formatPhaseTime(phases.transitionMs)} and shows ${metrics.measurements.pelvisShiftPx}px of pelvis shift, which can push the downswing forward too early.`,
      impact: `Impact arrives near ${formatPhaseTime(phases.impactMs)} with ${metrics.measurements.shaftLeanAtImpactDeg} degrees of shaft lean, leaving room for a stronger strike pattern.`,
      finish: `The finish reaches ${formatPhaseTime(phases.finishMs)} and suggests the motion can stay balanced when the sequencing is cleaner earlier in the swing.`
    },
    drills,
    warnings: ['Mock analysis only. Replace with model-backed coaching before using for real instruction.']
  };
}
