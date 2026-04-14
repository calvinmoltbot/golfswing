import type { SwingAnalysisRequest, SwingAnalysisResponse } from '@/types/analysis';
import type { SwingSessionPipelineStage, SwingSessionRecord } from '@/types/session';
import { detectSwingPhases } from '@/lib/phases';
import { writeSession } from '@/lib/storage/sessions';
import { extractMediaArtifacts } from '@/services/media-artifacts';
import { analyzeSwingCoaching } from '@/services/coaching-analysis';
import { estimatePoseFromVideo } from '@/services/pose-estimation';

type PersistableSession = SwingSessionRecord & {
  id: string;
};

async function saveStage(
  session: PersistableSession,
  stage: SwingSessionPipelineStage,
  updates?: Partial<PersistableSession>
) {
  Object.assign(session, updates);
  session.updatedAt = new Date().toISOString();
  session.pipeline.currentStage = stage;
  await writeSession(session);
}

export async function runSwingAnalysis({
  session,
  request
}: {
  session: PersistableSession;
  request: SwingAnalysisRequest;
}): Promise<SwingAnalysisResponse> {
  await saveStage(session, 'pose-estimation', {
    status: 'analyzing',
    error: null,
    notes: request.notes,
    playerContext: request.playerContext,
    reportMode: request.reportMode,
    pipeline: {
      ...session.pipeline,
      failedStage: null
    }
  });

  const poseEstimation = await estimatePoseFromVideo({ videoPath: session.file.absolutePath });

  await saveStage(session, 'phase-detection', {
    pipeline: {
      ...session.pipeline,
      poseEstimation
    }
  });

  const phases = detectSwingPhases(poseEstimation.metrics);

  await saveStage(session, 'media-artifacts', {
    pipeline: {
      ...session.pipeline,
      phases
    }
  });

  const mediaArtifacts = await extractMediaArtifacts({
    sessionId: session.id,
    videoPath: session.file.absolutePath,
    keyFrames: poseEstimation.metrics.keyFrames
  });

  await saveStage(session, 'coaching-analysis', {
    pipeline: {
      ...session.pipeline,
      mediaArtifacts
    }
  });

  const coachingAnalysis = await analyzeSwingCoaching({
    request,
    metrics: poseEstimation.metrics,
    phases
  });

  await saveStage(session, 'coaching-analysis', {
    pipeline: {
      ...session.pipeline,
      coachingAnalysis: coachingAnalysis.metadata
    }
  });

  if (coachingAnalysis.error || !coachingAnalysis.response) {
    throw new Error(coachingAnalysis.error || 'Coaching analysis returned no response.');
  }

  await saveStage(session, 'complete', {
    analysis: coachingAnalysis.response,
    status: 'complete'
  });

  return coachingAnalysis.response;
}

export async function markSwingAnalysisFailure({
  session,
  stage,
  error
}: {
  session: PersistableSession;
  stage: SwingSessionPipelineStage;
  error: string;
}) {
  await saveStage(session, 'failed', {
    status: 'failed',
    error,
    pipeline: {
      ...session.pipeline,
      failedStage: stage
    }
  });
}
