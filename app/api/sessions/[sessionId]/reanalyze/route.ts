import { NextResponse } from 'next/server';
import { swingAnalysisRequestSchema } from '@/types/analysis';
import { readSession } from '@/lib/storage/sessions';
import { markSwingAnalysisFailure, runSwingAnalysis } from '@/services/analysis/run-swing-analysis';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  try {
    const body = await request.json();
    const parsed = swingAnalysisRequestSchema.parse({
      ...body,
      sessionId
    });
    const session = await readSession(sessionId);

    if (!session) {
      throw new Error('Session not found.');
    }

    const result = await runSwingAnalysis({
      session,
      request: parsed
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const session = await readSession(sessionId);

    if (session) {
      await markSwingAnalysisFailure({
        session,
        stage: session.pipeline.currentStage,
        error: message
      });
    }

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
