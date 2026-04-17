import { NextResponse } from 'next/server';
import { readStoredArtifact } from '@/lib/storage/artifacts';
import { readSession } from '@/lib/storage/sessions';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string; fileName: string }> }
) {
  const { sessionId, fileName } = await params;
  const session = await readSession(sessionId);

  if (!session) {
    return new NextResponse('Not found', { status: 404 });
  }

  const artifacts = session.pipeline.mediaArtifacts;
  const allArtifacts = [
    artifacts?.poster,
    ...(artifacts?.keyFrames || [])
  ].filter((artifact): artifact is NonNullable<typeof artifact> => Boolean(artifact));

  const artifact = allArtifacts.find((item) => item.fileName === fileName);

  if (!artifact) {
    return new NextResponse('Not found', { status: 404 });
  }

  try {
    const buffer = await readStoredArtifact(artifact);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': artifact.contentType,
        'Cache-Control': 'private, max-age=3600'
      }
    });
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return new NextResponse('Not found', { status: 404 });
    }

    throw error;
  }
}
