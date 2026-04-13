import type {
  PoseEstimationResult,
  SwingAnalysisResponse,
  SwingAnalysisRequest,
  SwingPhaseDetection
} from '@/types/analysis';
import type { MediaArtifactResult } from '@/types/media-artifacts';

export type SwingSessionStatus = 'uploaded' | 'analyzing' | 'complete' | 'failed';
export type SwingSessionPipelineStage =
  | 'uploaded'
  | 'pose-estimation'
  | 'phase-detection'
  | 'media-artifacts'
  | 'coaching-analysis'
  | 'complete'
  | 'failed';

export type UploadedSwingSession = {
  id: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: SwingSessionStatus;
};

export type SwingSessionRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: SwingSessionStatus;
  notes: string;
  playerContext: SwingAnalysisRequest['playerContext'] | null;
  pipeline: {
    currentStage: SwingSessionPipelineStage;
    failedStage: SwingSessionPipelineStage | null;
    poseEstimation: PoseEstimationResult | null;
    phases: SwingPhaseDetection | null;
    mediaArtifacts: MediaArtifactResult | null;
  };
  analysis: SwingAnalysisResponse | null;
  error: string | null;
  file: {
    absolutePath: string;
    storedName: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
};
