import type {
  PoseMetrics,
  SwingAnalysisRequest,
  SwingAnalysisResponse,
  SwingIssueCode,
  SwingPhaseDetection
} from '@/types/analysis';

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
  const issueTaxonomy: SwingAnalysisResponse['issueTaxonomy'] = [];
  const clubCategory = deriveClubCategory(request.playerContext.club);
  const isFaceOn = request.playerContext.cameraView === 'face-on';

  function pushIssue(code: SwingIssueCode, label: string, severity: 'low' | 'medium' | 'high', evidence: string) {
    if (issueTaxonomy.some((item) => item.code === code)) {
      return;
    }

    issueTaxonomy.push({ code, label, severity, evidence });
  }

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
    pushIssue(
      'excessive_slide',
      'Excessive lateral slide',
      metrics.measurements.pelvisShiftPx > 26 ? 'high' : 'medium',
      `Pelvis shift reaches ${metrics.measurements.pelvisShiftPx}px around ${formatPhaseTime(phases.transitionMs)}.`
    );
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
    pushIssue(
      'low_shaft_lean',
      clubCategory === 'driver' ? 'Limited delivered handle control' : 'Low shaft lean at impact',
      metrics.measurements.shaftLeanAtImpactDeg < 7 ? 'high' : 'medium',
      `Impact is measured at ${metrics.measurements.shaftLeanAtImpactDeg}° of shaft lean near ${formatPhaseTime(phases.impactMs)}.`
    );
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
    pushIssue(
      'tempo_outlier',
      'Tempo running quick in transition',
      metrics.measurements.tempoRatio > 3 ? 'high' : 'medium',
      `Tempo ratio is ${metrics.measurements.tempoRatio.toFixed(1)} through the full motion.`
    );
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

  if (metrics.measurements.hipTurnDeg < 45) {
    pushIssue(
      'under_rotated_hips',
      'Hip turn is under-rotated',
      metrics.measurements.hipTurnDeg < 38 ? 'high' : 'medium',
      `Hip turn is ${metrics.measurements.hipTurnDeg}° versus ${metrics.measurements.shoulderTurnDeg}° shoulder turn by ${formatPhaseTime(phases.topMs)}.`
    );
  }

  if (metrics.measurements.leadKneeFlexChangeDeg < 14) {
    pushIssue(
      'limited_lead_knee_flex',
      'Lead knee flexion is limited',
      metrics.measurements.leadKneeFlexChangeDeg < 10 ? 'high' : 'medium',
      `Lead knee flex changes only ${metrics.measurements.leadKneeFlexChangeDeg}° through transition and impact.`
    );
  }

  if (metrics.measurements.headDriftPx > 16) {
    pushIssue(
      'head_drift',
      'Head drift is elevated',
      metrics.measurements.headDriftPx > 22 ? 'high' : 'medium',
      `Head drift measures ${metrics.measurements.headDriftPx}px across the swing.`
    );
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
  const addressScore = Math.max(4, 8 - (metrics.measurements.headDriftPx > 18 ? 1 : 0));
  const backswingScore = Math.max(
    3,
    8 -
      (metrics.measurements.hipTurnDeg < 45 ? 2 : 0) -
      (metrics.measurements.tempoRatio > 2.8 ? 1 : 0)
  );
  const topScore = Math.max(3, 8 - (metrics.measurements.hipTurnDeg < 42 ? 2 : 1));
  const transitionScore = Math.max(
    2,
    8 -
      (metrics.measurements.pelvisShiftPx > 20 ? 2 : 0) -
      (metrics.measurements.tempoRatio > 2.8 ? 2 : 0)
  );
  const impactScore = Math.max(
    3,
    8 -
      (metrics.measurements.shaftLeanAtImpactDeg < 10 ? 2 : 0) -
      (metrics.measurements.pelvisShiftPx > 24 ? 1 : 0)
  );
  const finishScore = Math.max(5, 8 - (metrics.measurements.headDriftPx > 20 ? 1 : 0));

  return {
    summary: `${viewLabel} mock analysis for a ${skillBandLabel} player hitting ${request.playerContext.club}. The biggest gains appear to come from ${viewPriorityLabel} and better ${clubPriorityLabel}.${notesSuffix}${goalSuffix}${missSuffix}${shotShapeSuffix}`,
    confidence: 'medium',
    issueTaxonomy,
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
    phaseScores: {
      address: {
        score: addressScore,
        reason:
          metrics.measurements.headDriftPx > 18
            ? `Setup is usable, but ${metrics.measurements.headDriftPx}px of head drift suggests the address pattern is not fully stable.`
            : 'Setup looks stable enough to start the motion without a major address penalty.'
      },
      backswing: {
        score: backswingScore,
        reason:
          metrics.measurements.hipTurnDeg < 45
            ? `Shoulder turn is solid, but hip turn reaches only ${metrics.measurements.hipTurnDeg}°, limiting coil quality.`
            : 'Backswing turn depth is functional and gives the player enough room to create speed.'
      },
      top: {
        score: topScore,
        reason:
          metrics.measurements.hipTurnDeg < 42
            ? `The top position loses quality because lower-body turn lags behind the ${metrics.measurements.shoulderTurnDeg}° shoulder turn.`
            : 'The top position remains serviceable, though it could organize more cleanly before transition.'
      },
      transition: {
        score: transitionScore,
        reason:
          metrics.measurements.pelvisShiftPx > 20
            ? `Transition is dragged down by ${metrics.measurements.pelvisShiftPx}px of pelvis shift and a ${metrics.measurements.tempoRatio.toFixed(1)} tempo ratio.`
            : 'Transition stays reasonably organized without a major slide pattern.'
      },
      impact: {
        score: impactScore,
        reason:
          metrics.measurements.shaftLeanAtImpactDeg < 10
            ? `Impact quality is limited by ${metrics.measurements.shaftLeanAtImpactDeg}° of shaft lean, which leaves room for a stronger strike pattern.`
            : 'Impact delivery is reasonably functional and does not show a major strike penalty.'
      },
      finish: {
        score: finishScore,
        reason:
          metrics.measurements.headDriftPx > 20
            ? 'The finish stays mostly intact, but earlier movement patterns reduce how balanced it looks.'
            : 'The finish position stays balanced and suggests the player can hold the motion together through the end.'
      }
    },
    drills,
    warnings: ['Mock analysis only. Replace with model-backed coaching before using for real instruction.']
  };
}
