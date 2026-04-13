import { z } from 'zod';

export const swingAnalysisRequestSchema = z.object({
  videoUrl: z.string().url(),
  notes: z.string().max(4000).optional().default(''),
  playerContext: z.object({
    handedness: z.enum(['right', 'left']),
    cameraView: z.enum(['down-the-line', 'face-on']),
    club: z.string().min(1)
  })
});

export type SwingAnalysisRequest = z.infer<typeof swingAnalysisRequestSchema>;

export type PoseMetrics = {
  sourceVideoUrl: string;
  fps: number;
  durationMs: number;
  keyFrames: Array<{
    label: 'address' | 'top' | 'impact' | 'finish';
    timestampMs: number;
  }>;
  measurements: {
    headDriftPx: number;
    pelvisShiftPx: number;
    leadKneeFlexChangeDeg: number;
    shaftLeanAtImpactDeg: number;
    shoulderTurnDeg: number;
    hipTurnDeg: number;
    tempoRatio: number;
  };
};

export type SwingPhaseDetection = {
  addressMs: number;
  takeawayMs: number;
  topMs: number;
  transitionMs: number;
  impactMs: number;
  finishMs: number;
};

export type SwingAnalysisResponse = {
  summary: string;
  confidence: 'low' | 'medium' | 'high';
  priorityFixes: string[];
  phaseObservations: {
    address: string;
    backswing: string;
    top: string;
    transition: string;
    impact: string;
    finish: string;
  };
  drills: Array<{
    name: string;
    reason: string;
  }>;
  warnings: string[];
};
