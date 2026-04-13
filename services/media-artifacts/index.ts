import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createFfmpegMediaArtifactProvider } from '@/services/media-artifacts/ffmpeg';
import type { MediaArtifactProvider } from '@/types/media-artifacts';

async function canUseFfmpeg() {
  try {
    await access('/opt/homebrew/bin/ffmpeg', constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveProvider(): Promise<MediaArtifactProvider> {
  const configuredProvider = process.env.MEDIA_ARTIFACT_PROVIDER;

  if (configuredProvider === 'ffmpeg') {
    return createFfmpegMediaArtifactProvider();
  }

  if (!configuredProvider && (await canUseFfmpeg())) {
    return createFfmpegMediaArtifactProvider();
  }

  throw new Error('No supported media artifact provider is available. Install ffmpeg or set MEDIA_ARTIFACT_PROVIDER.');
}

export async function extractMediaArtifacts(input: {
  sessionId: string;
  videoPath: string;
  keyFrames: Array<{ label: 'address' | 'top' | 'impact' | 'finish'; timestampMs: number }>;
}) {
  const provider = await resolveProvider();
  return provider.extract(input);
}
