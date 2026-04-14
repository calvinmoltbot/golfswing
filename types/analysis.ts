import { z } from 'zod';

export const playerContextSchema = z.object({
  handedness: z.enum(['right', 'left']),
  cameraView: z.enum(['down-the-line', 'face-on']),
  club: z.string().min(1)
});

export const swingAnalysisRequestSchema = z.object({
  sessionId: z.string().min(1),
  notes: z.string().max(4000).optional().default(''),
  playerContext: playerContextSchema,
  reportMode: z.enum(['concise', 'full']).default('concise'),
  playerGoal: z.string().max(200).optional().default(''),
  usualMiss: z.string().max(120).optional().default(''),
  shotShape: z.string().max(120).optional().default(''),
  skillBand: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('intermediate')
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

export const swingAnalysisResponseSchema = z.object({
  summary: z.string().min(1),
  confidence: z.enum(['low', 'medium', 'high']),
  primaryFinding: z.object({
    title: z.string().min(1),
    detail: z.string().min(1),
    impact: z.string().min(1),
    confidence: z.enum(['low', 'medium', 'high'])
  }),
  measurableCheckpoint: z.object({
    label: z.string().min(1),
    target: z.string().min(1),
    whyItMatters: z.string().min(1)
  }),
  priorityFixes: z.array(
    z.object({
      title: z.string().min(1),
      detail: z.string().min(1),
      evidence: z.string().min(1)
    })
  ),
  phaseObservations: z.object({
    address: z.string().min(1),
    backswing: z.string().min(1),
    top: z.string().min(1),
    transition: z.string().min(1),
    impact: z.string().min(1),
    finish: z.string().min(1)
  }),
  drills: z.array(
    z.object({
      name: z.string().min(1),
      reason: z.string().min(1),
      checkpoint: z.string().min(1)
    })
  ),
  warnings: z.array(z.string())
});

export type SwingAnalysisResponse = z.infer<typeof swingAnalysisResponseSchema>;

export type CoachingAnalysisMetadata = {
  providerId: string;
  model: string;
  requestedAt: string;
  completedAt: string | null;
  validationError: string | null;
};

export type CoachingAnalysisResult = {
  metadata: CoachingAnalysisMetadata;
  response: SwingAnalysisResponse | null;
  error: string | null;
};

export type CoachingAnalysisProvider = {
  id: string;
  analyze(input: {
    request: SwingAnalysisRequest;
    metrics: PoseMetrics;
    phases: SwingPhaseDetection;
  }): Promise<CoachingAnalysisResult>;
};
