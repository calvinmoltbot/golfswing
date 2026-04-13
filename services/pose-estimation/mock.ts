import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { PoseEstimationProvider, PoseEstimationResult } from '@/types/analysis';

const execFileAsync = promisify(execFile);
const ffprobePath = process.env.FFPROBE_PATH || '/opt/homebrew/bin/ffprobe';

async function getVideoDurationMs(videoPath: string) {
  try {
    const { stdout } = await execFileAsync(ffprobePath, [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      videoPath
    ]);
    const seconds = Number.parseFloat(stdout.trim());

    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.round(seconds * 1000);
    }
  } catch {
    // Fall back to the previous fixed mock duration when ffprobe is unavailable.
  }

  return 2200;
}

function buildKeyFrameTimestamps(durationMs: number) {
  const addressMs = Math.max(Math.round(durationMs * 0.08), 0);
  const topMs = Math.max(Math.round(durationMs * 0.42), addressMs + 1);
  const impactMs = Math.max(Math.round(durationMs * 0.68), topMs + 1);
  const finishMs = Math.max(Math.round(durationMs * 0.9), impactMs + 1);

  return { addressMs, topMs, impactMs, finishMs };
}

function buildMockFrames(durationMs: number) {
  const timestamps = buildKeyFrameTimestamps(durationMs);

  return [
    {
      timestampMs: timestamps.addressMs,
      keypoints: [
        { name: 'head', x: 320, y: 92, confidence: 0.98 },
        { name: 'lead_hip', x: 294, y: 242, confidence: 0.95 },
        { name: 'trail_hip', x: 344, y: 244, confidence: 0.95 },
        { name: 'lead_hand', x: 308, y: 188, confidence: 0.96 }
      ]
    },
    {
      timestampMs: timestamps.topMs,
      keypoints: [
        { name: 'head', x: 327, y: 91, confidence: 0.98 },
        { name: 'lead_hip', x: 304, y: 246, confidence: 0.94 },
        { name: 'trail_hip', x: 352, y: 238, confidence: 0.94 },
        { name: 'lead_hand', x: 360, y: 120, confidence: 0.95 }
      ]
    },
    {
      timestampMs: timestamps.impactMs,
      keypoints: [
        { name: 'head', x: 338, y: 95, confidence: 0.98 },
        { name: 'lead_hip', x: 319, y: 241, confidence: 0.95 },
        { name: 'trail_hip', x: 365, y: 246, confidence: 0.95 },
        { name: 'lead_hand', x: 292, y: 209, confidence: 0.96 }
      ]
    },
    {
      timestampMs: timestamps.finishMs,
      keypoints: [
        { name: 'head', x: 333, y: 92, confidence: 0.97 },
        { name: 'lead_hip', x: 312, y: 236, confidence: 0.94 },
        { name: 'trail_hip', x: 360, y: 248, confidence: 0.94 },
        { name: 'lead_hand', x: 280, y: 132, confidence: 0.95 }
      ]
    }
  ];
}

export function createMockPoseEstimationProvider(): PoseEstimationProvider {
  return {
    id: 'mock',
    async estimate({ videoPath }): Promise<PoseEstimationResult> {
      const durationMs = await getVideoDurationMs(videoPath);
      const timestamps = buildKeyFrameTimestamps(durationMs);

      return {
        provider: {
          id: 'mock',
          version: '1.0.0'
        },
        metrics: {
          sourceVideoPath: videoPath,
          fps: 30,
          durationMs,
          keyFrames: [
            { label: 'address', timestampMs: timestamps.addressMs },
            { label: 'top', timestampMs: timestamps.topMs },
            { label: 'impact', timestampMs: timestamps.impactMs },
            { label: 'finish', timestampMs: timestamps.finishMs }
          ],
          measurements: {
            headDriftPx: 18,
            pelvisShiftPx: 24,
            leadKneeFlexChangeDeg: 11,
            shaftLeanAtImpactDeg: 7,
            shoulderTurnDeg: 82,
            hipTurnDeg: 39,
            tempoRatio: 2.8
          }
        },
        keypointFrames: buildMockFrames(durationMs)
      };
    }
  };
}
