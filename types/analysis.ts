import { z } from 'zod';

export const playerContextSchema = z.object({
  handedness: z.enum(['right', 'left']),
  cameraView: z.enum(['down-the-line', 'face-on']),
  club: z.string().min(1)
});

export const swingAnalysisRequestSchema = z.object({
  sessionId: z.string().min(1),
  notes: z.string().max(4000).optional().default(''),
  playerContext: playerContextSchema
});

export type SwingAnalysisRequest = z.infer<typeof swingAnalysisRequestSchema>;

export type PoseKeypoint = {
  name: string;
  x: number;
  y: number;
  confidence: number;
};

export type PoseKeypointFrame = {
  timestampMs: number;
  keypoints: PoseKeypoint[];
};

export type PoseMetrics = {
  sourceVideoPath: string;
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

export type PoseEstimationProviderInfo = {
  id: string;
  version: string;
};

export type PoseEstimationResult = {
  provider: PoseEstimationProviderInfo;
  metrics: PoseMetrics;
  keypointFrames: PoseKeypointFrame[];
};

export type PoseEstimationProvider = {
  id: string;
  estimate(input: { videoPath: string }): Promise<PoseEstimationResult>;
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
