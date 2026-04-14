import type { PoseMetrics, SwingAnalysisRequest, SwingAnalysisResponse, SwingPhaseDetection } from '@/types/analysis';

function formatPhaseTime(timestampMs: number) {
  return `${(timestampMs / 1000).toFixed(2)}s`;
}

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
  const clubCategory = deriveClubCategory(request.playerContext.club);
  const isFaceOn = request.playerContext.cameraView === 'face-on';

  const clubPriorityLabel =
    clubCategory === 'driver'
      ? 'tee-shot launch and speed delivery'
      : clubCategory === 'wedge'
        ? 'distance control and low-point precision'
        : clubCategory === 'fairway'
          ? 'centered contact from the turf'
          : clubCategory === 'hybrid'
            ? 'stable strike with enough shaft control'
            : 'compressed iron contact';
  const viewPriorityLabel = isFaceOn ? 'centered pressure shift' : 'delivery geometry';

  if (metrics.measurements.pelvisShiftPx > 20) {
    priorityFixes.push({
      title: 'Reduce lateral slide in transition',
      detail: isFaceOn
        ? 'Keep the pelvis and sternum more centered in transition so pressure shift does not turn into a visible sway.'
        : 'Keep the pelvis from shifting excessively toward the target so rotation can continue through impact.',
      evidence: `Transition shows ${metrics.measurements.pelvisShiftPx}px of pelvis shift around ${formatPhaseTime(phases.transitionMs)} from the ${isFaceOn ? 'face-on' : 'down-the-line'} view.`
    });
    drills.push({
      name: isFaceOn ? 'Centered pivot rehearsal' : 'Step-through transition drill',
      reason: isFaceOn
        ? 'Helps the player feel pressure shift without swaying away from center.'
        : 'Helps sequence pressure shift without letting the pelvis outrun rotation.',
      checkpoint: isFaceOn
        ? 'Film three face-on swings and look for the belt buckle staying more centered.'
        : 'Film three swings and look for less hip slide before impact.'
    });
  }

  if (metrics.measurements.shaftLeanAtImpactDeg < 10) {
    priorityFixes.push({
      title: 'Improve forward shaft lean at impact',
      detail:
        clubCategory === 'wedge'
          ? 'Deliver the handle slightly more forward so low point and distance control improve.'
          : clubCategory === 'driver'
            ? 'Improve delivered handle position without forcing a steep, wedge-like strike pattern.'
            : 'Deliver the handle slightly more forward so strike quality and compression improve.',
      evidence: `Impact is measured at ${metrics.measurements.shaftLeanAtImpactDeg}° of shaft lean near ${formatPhaseTime(phases.impactMs)} with a ${request.playerContext.club}.`
    });
    drills.push({
      name: clubCategory === 'driver' ? 'Tee-height delivery rehearsal' : 'Impact bag preset',
      reason:
        clubCategory === 'driver'
          ? 'Builds a better delivery pattern for driver without overdoing downward strike feels.'
          : 'Builds awareness of handle-forward delivery and pressure into the lead side.',
      checkpoint:
        clubCategory === 'driver'
          ? 'Rehearse driver impact with pressure moving forward and the chest still opening.'
          : 'At setup rehearsals, keep the hands clearly ahead of the clubhead through impact.'
    });
  }

  if (metrics.measurements.tempoRatio > 2.7) {
    priorityFixes.push({
      title: 'Smooth the overall tempo',
      detail: 'Reduce the abrupt change from backswing to downswing so the motion stays easier to repeat.',
      evidence: `Tempo ratio is ${metrics.measurements.tempoRatio.toFixed(1)}, which suggests the transition is getting quick for a ${request.playerContext.club} swing.`
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
  const goalSuffix = request.playerGoal ? ` The stated goal is ${request.playerGoal.trim()}.` : '';
  const missSuffix = request.usualMiss ? ` The usual miss is ${request.usualMiss.trim()}.` : '';
  const shotShapeSuffix = request.shotShape ? ` Typical shot shape is ${request.shotShape.trim()}.` : '';
  const skillBandLabel = request.skillBand === 'beginner' ? 'beginner' : request.skillBand === 'advanced' ? 'advanced' : 'intermediate';

  return {
    summary: `${viewLabel} mock analysis for a ${skillBandLabel} player hitting ${request.playerContext.club}. The biggest gains appear to come from ${viewPriorityLabel} and better ${clubPriorityLabel}.${notesSuffix}${goalSuffix}${missSuffix}${shotShapeSuffix}`,
    confidence: 'medium',
    primaryFinding: {
      title: isFaceOn ? 'Centered transition is the main coaching priority' : 'Delivery and transition are the main coaching priority',
      detail: request.usualMiss
        ? `The current motion suggests that transition control may be contributing to the player's usual miss of ${request.usualMiss.trim()}.`
        : isFaceOn
          ? 'The face-on view suggests that centered pressure shift and body control need attention before speed can be added.'
          : 'The down-the-line view suggests that delivery geometry and transition organization need attention before strike can improve.',
      impact: request.shotShape
        ? `If this pattern persists, it may exaggerate the player's typical ${request.shotShape.trim()} pattern and make contact less predictable.`
        : clubCategory === 'driver'
          ? 'This pattern is likely to make tee-shot start direction and strike location less reliable at speed.'
          : clubCategory === 'wedge'
            ? 'This pattern is likely to make low point and distance control less reliable.'
            : 'This pattern is likely to make contact and start direction less reliable, especially under speed.',
      confidence: 'medium'
    },
    measurableCheckpoint: {
      label: isFaceOn ? 'Centered body motion before impact' : 'Delivery shape into impact',
      target: request.playerGoal
        ? `Rehearse swings that support the goal of ${request.playerGoal.trim()} while reducing visible slide before impact.`
        : isFaceOn
          ? 'Keep the torso and pelvis more centered through transition while the chest keeps rotating.'
          : 'Keep the handle and body rotating together so delivery looks more organized into impact.',
      whyItMatters: request.usualMiss
        ? `Better sequencing should help reduce the player's usual miss of ${request.usualMiss.trim()}.`
        : 'Better sequencing should improve contact quality and make face delivery easier to repeat.'
    },
    priorityFixes,
    phaseObservations: {
      address: isFaceOn
        ? `From face-on, setup looks stable at ${formatPhaseTime(phases.addressMs)} with manageable head movement and a centered starting position.`
        : `From down-the-line, setup looks organized at ${formatPhaseTime(phases.addressMs)} with a neutral starting delivery picture.`,
      backswing: isFaceOn
        ? `Backswing pace remains functional through ${formatPhaseTime(phases.topMs)}, with ${metrics.measurements.shoulderTurnDeg} degrees of shoulder turn and a pressure shift that still needs to stay centered.`
        : `Backswing pace remains functional through ${formatPhaseTime(phases.topMs)}, with ${metrics.measurements.shoulderTurnDeg} degrees of shoulder turn and room for cleaner hand-path depth.`,
      top: isFaceOn
        ? 'At the top, the body has enough turn, but the next priority is staying centered before the downswing starts.'
        : 'At the top, the turn depth is usable, but the delivery needs to stay more organized before the club unwinds.',
      transition: isFaceOn
        ? `Transition begins around ${formatPhaseTime(phases.transitionMs)} and shows ${metrics.measurements.pelvisShiftPx}px of body shift, which can move pressure too far too early.`
        : `Transition begins around ${formatPhaseTime(phases.transitionMs)} and shows ${metrics.measurements.pelvisShiftPx}px of pelvis shift, which can distort the delivery pattern into impact.`,
      impact: clubCategory === 'driver'
        ? `Impact arrives near ${formatPhaseTime(phases.impactMs)} with ${metrics.measurements.shaftLeanAtImpactDeg} degrees of shaft lean, so driver delivery should improve through better rotation rather than a forced downward strike feel.`
        : clubCategory === 'wedge'
          ? `Impact arrives near ${formatPhaseTime(phases.impactMs)} with ${metrics.measurements.shaftLeanAtImpactDeg} degrees of shaft lean, leaving room for tighter low-point and distance control.`
          : `Impact arrives near ${formatPhaseTime(phases.impactMs)} with ${metrics.measurements.shaftLeanAtImpactDeg} degrees of shaft lean, leaving room for a stronger strike pattern.`,
      finish: isFaceOn
        ? `The finish reaches ${formatPhaseTime(phases.finishMs)} and suggests the swing can stay balanced if the centered pivot improves earlier.`
        : `The finish reaches ${formatPhaseTime(phases.finishMs)} and suggests the motion can stay balanced when delivery is cleaner earlier in the swing.`
    },
    drills,
    warnings: ['Mock analysis only. Replace with model-backed coaching before using for real instruction.']
  };
}
