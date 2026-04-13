import { NextResponse } from 'next/server';
import { swingAnalysisRequestSchema, type SwingAnalysisResponse } from '@/types/analysis';
import { detectSwingPhases } from '@/lib/phases';
import { buildMockSwingAnalysis } from '@/lib/mock-analysis';
import { readSession, writeSession } from '@/lib/storage/sessions';
import { extractMediaArtifacts } from '@/services/media-artifacts';
import { estimatePoseFromVideo } from '@/services/pose-estimation';

export async function POST(request: Request) {
  let sessionId: string | null = null;

  try {
    const body = await request.json();
    const parsed = swingAnalysisRequestSchema.parse(body);
    sessionId = parsed.sessionId;
    const session = await readSession(parsed.sessionId);

    if (!session) {
      throw new Error('Session not found.');
    }

    session.status = 'analyzing';
    session.updatedAt = new Date().toISOString();
    session.error = null;
    await writeSession(session);

    const poseEstimation = await estimatePoseFromVideo({ videoPath: session.file.absolutePath });
    const phases = detectSwingPhases(poseEstimation.metrics);
    const mediaArtifacts = await extractMediaArtifacts({
      sessionId: session.id,
      videoPath: session.file.absolutePath,
      keyFrames: poseEstimation.metrics.keyFrames
    });
    const result: SwingAnalysisResponse = buildMockSwingAnalysis({
      request: parsed,
      metrics: poseEstimation.metrics,
      phases
    });

    session.notes = parsed.notes;
    session.playerContext = parsed.playerContext;
    session.pipeline.poseEstimation = poseEstimation;
    session.pipeline.phases = phases;
    session.pipeline.mediaArtifacts = mediaArtifacts;
    session.analysis = result;
    session.status = 'complete';
    session.updatedAt = new Date().toISOString();
    await writeSession(session);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (sessionId) {
      const session = await readSession(sessionId);

      if (session) {
        session.status = 'failed';
        session.error = message;
        session.updatedAt = new Date().toISOString();
        await writeSession(session);
      }
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
