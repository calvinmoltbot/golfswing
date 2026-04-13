import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { MediaArtifact, MediaArtifactProvider, MediaArtifactResult } from '@/types/media-artifacts';

const execFileAsync = promisify(execFile);
const ffmpegPath = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';

async function runFfmpeg(args: string[]) {
  await execFileAsync(ffmpegPath, args);
}

function artifactUrl(sessionId: string, fileName: string) {
  return `/api/sessions/${sessionId}/artifacts/${fileName}`;
}

function buildArtifact(sessionId: string, fileName: string, absolutePath: string, type: MediaArtifact['type'], label?: MediaArtifact['label']): MediaArtifact {
  return {
    type,
    label,
    fileName,
    absolutePath,
    contentType: 'image/jpeg',
    urlPath: artifactUrl(sessionId, fileName)
  };
}

export function createFfmpegMediaArtifactProvider(): MediaArtifactProvider {
  return {
    id: 'ffmpeg',
    async extract({ sessionId, videoPath, keyFrames }): Promise<MediaArtifactResult> {
      const sessionArtifactRoot = path.join(process.cwd(), 'data', 'artifacts', sessionId);
      await mkdir(sessionArtifactRoot, { recursive: true });

      const posterFileName = 'poster.jpg';
      const posterPath = path.join(sessionArtifactRoot, posterFileName);
      await runFfmpeg([
        '-y',
        '-ss',
        '0.2',
        '-i',
        videoPath,
        '-frames:v',
        '1',
        '-q:v',
        '2',
        posterPath
      ]);

      const keyFrameArtifacts: MediaArtifact[] = [];

      for (const frame of keyFrames) {
        const seconds = Math.max(frame.timestampMs / 1000, 0).toFixed(3);
        const fileName = `${frame.label}.jpg`;
        const absolutePath = path.join(sessionArtifactRoot, fileName);

        await runFfmpeg([
          '-y',
          '-ss',
          seconds,
          '-i',
          videoPath,
          '-frames:v',
          '1',
          '-q:v',
          '2',
          absolutePath
        ]);

        keyFrameArtifacts.push(buildArtifact(sessionId, fileName, absolutePath, 'key-frame', frame.label));
      }

      return {
        provider: {
          id: 'ffmpeg',
          version: 'local'
        },
        poster: buildArtifact(sessionId, posterFileName, posterPath, 'poster'),
        keyFrames: keyFrameArtifacts
      };
    }
  };
}
