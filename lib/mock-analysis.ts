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
  const priorityFixes: SwingAnalysisResponse['priorityFixes'] = [];
  const drills: SwingAnalysisResponse['drills'] = [];

  if (metrics.measurements.pelvisShiftPx > 20) {
    priorityFixes.push({
      title: 'Reduce lateral slide in transition',
      detail: 'Keep the pelvis from shifting excessively toward the target so rotation can continue through impact.',
      evidence: `Transition shows ${metrics.measurements.pelvisShiftPx}px of pelvis shift around ${formatPhaseTime(phases.transitionMs)}.`
    });
    drills.push({
      name: 'Step-through transition drill',
      reason: 'Helps sequence pressure shift without letting the pelvis outrun rotation.',
      checkpoint: 'Film three swings and look for less hip slide before impact.'
    });
  }

  if (metrics.measurements.shaftLeanAtImpactDeg < 10) {
    priorityFixes.push({
      title: 'Improve forward shaft lean at impact',
      detail: 'Deliver the handle slightly more forward so strike quality and compression improve.',
      evidence: `Impact is measured at ${metrics.measurements.shaftLeanAtImpactDeg}° of shaft lean near ${formatPhaseTime(phases.impactMs)}.`
    });
    drills.push({
      name: 'Impact bag preset',
      reason: 'Builds awareness of handle-forward delivery and pressure into the lead side.',
      checkpoint: 'At setup rehearsals, keep the hands clearly ahead of the clubhead through impact.'
    });
  }

  if (metrics.measurements.tempoRatio > 2.7) {
    priorityFixes.push({
      title: 'Smooth the overall tempo',
      detail: 'Reduce the abrupt change from backswing to downswing so the motion stays easier to repeat.',
      evidence: `Tempo ratio is ${metrics.measurements.tempoRatio.toFixed(1)}, which suggests the transition is getting quick.`
    });
    drills.push({
      name: 'Three-to-one tempo swings',
      reason: 'Encourages a calmer transition and a more repeatable strike pattern.',
      checkpoint: 'Match backswing count to a calm three-count and downswing to one-count.'
    });
  }

  if (priorityFixes.length === 0) {
    priorityFixes.push({
      title: 'Repeat the current motion under control',
      detail: 'The pattern is functional enough that the next gain is consistency of centered contact.',
      evidence: 'No major outlier appeared in the current mock metric set.'
    });
    drills.push({
      name: 'Nine-ball contact ladder',
      reason: 'Reinforces centered strike while maintaining the current motion.',
      checkpoint: 'Track how many centered strikes you can hit in a row without changing swing intent.'
    });
  }

  const viewLabel = request.playerContext.cameraView === 'down-the-line' ? 'Down-the-line' : 'Face-on';
  const notesSuffix = request.notes ? ` Player notes mention: ${request.notes.trim()}.` : '';

  return {
    summary: `${viewLabel} mock analysis for a ${request.playerContext.club} swing. The clip shows a playable pattern, with the biggest gains available through transition control and cleaner impact alignments.${notesSuffix}`,
    confidence: 'medium',
    primaryFinding: {
      title: 'Transition is the main coaching priority',
      detail: 'The swing has enough turn to be playable, but excessive forward motion and modest impact alignments limit strike quality.',
      impact: 'This pattern is likely to make contact and start direction less reliable, especially under speed.',
      confidence: 'medium'
    },
    measurableCheckpoint: {
      label: 'Pelvis shift before impact',
      target: 'Reduce visible slide before impact and keep rotation moving through the strike.',
      whyItMatters: 'Better sequencing should improve contact quality and make face delivery easier to repeat.'
    },
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
