import { mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { persistSessionArtifacts } from '@/lib/storage/artifacts';
import type { GeneratedArtifactInput } from '@/lib/storage/contracts';
import type { MediaArtifactProvider, MediaArtifactResult } from '@/types/media-artifacts';

const execFileAsync = promisify(execFile);
const ffmpegPath = process.env.FFMPEG_PATH || '/opt/homebrew/bin/ffmpeg';

async function runFfmpeg(args: string[]) {
  await execFileAsync(ffmpegPath, args);
}

export function createFfmpegMediaArtifactProvider(): MediaArtifactProvider {
  return {
    id: 'ffmpeg',
    async extract({ sessionId, videoPath, keyFrames }): Promise<MediaArtifactResult> {
      const tempArtifactRoot = path.join(os.tmpdir(), `golfswing-artifacts-${sessionId}`);
      await mkdir(tempArtifactRoot, { recursive: true });

      const posterFileName = 'poster.jpg';
      const posterPath = path.join(tempArtifactRoot, posterFileName);
      await runFfmpeg([
        '-y',
        '-i',
        videoPath,
        '-ss',
        '0.2',
        '-frames:v',
        '1',
        '-q:v',
        '2',
        posterPath
      ]);

      const generatedArtifacts: GeneratedArtifactInput[] = [
        {
          type: 'poster' as const,
          fileName: posterFileName,
          sourcePath: posterPath,
          contentType: 'image/jpeg'
        }
      ];

      for (const frame of keyFrames) {
        const seconds = Math.max(frame.timestampMs / 1000, 0).toFixed(3);
        const fileName = `${frame.label}.jpg`;
        const absolutePath = path.join(tempArtifactRoot, fileName);

        await runFfmpeg([
          '-y',
          '-i',
          videoPath,
          '-ss',
          seconds,
          '-frames:v',
          '1',
          '-q:v',
          '2',
          absolutePath
        ]);

        generatedArtifacts.push({
          type: 'key-frame',
          label: frame.label,
          fileName,
          sourcePath: absolutePath,
          contentType: 'image/jpeg'
        });
      }

      const storedArtifacts = await persistSessionArtifacts({
        sessionId,
        artifacts: generatedArtifacts
      });

      await rm(tempArtifactRoot, { recursive: true, force: true });

      const poster = storedArtifacts.find((artifact) => artifact.type === 'poster') || null;
      const keyFrameArtifacts = storedArtifacts.filter((artifact) => artifact.type === 'key-frame');

      return {
        provider: {
          id: 'ffmpeg',
          version: 'local'
        },
        poster,
        keyFrames: keyFrameArtifacts
      };
    }
  };
}
