import type { SessionRepository } from '@/lib/storage/contracts';
import { deleteStoredUpload } from '@/lib/storage/uploads';
import type { SwingSessionRecord } from '@/types/session';

const defaultMaxRetainedRawVideos = 10;
const defaultRawVideoRetentionDays = 14;

function getPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hasRetainedRawVideo(session: SwingSessionRecord) {
  return session.file.videoStatus !== 'retired';
}

function shouldRetireVideo(params: {
  session: SwingSessionRecord;
  keptSessionIds: Set<string>;
  nowMs: number;
  rawVideoRetentionMs: number;
}) {
  const { session, keptSessionIds, nowMs, rawVideoRetentionMs } = params;

  if (!hasRetainedRawVideo(session)) {
    return false;
  }

  const sessionAgeMs = nowMs - new Date(session.createdAt).getTime();

  if (sessionAgeMs > rawVideoRetentionMs) {
    return true;
  }

  return !keptSessionIds.has(session.id);
}

export function sessionCanReanalyze(session: SwingSessionRecord) {
  return hasRetainedRawVideo(session);
}

export async function applyVideoRetentionPolicies(repository: SessionRepository) {
  const maxRetainedRawVideos = getPositiveInteger(
    process.env.MAX_RETAINED_RAW_VIDEOS,
    defaultMaxRetainedRawVideos
  );
  const rawVideoRetentionDays = getPositiveInteger(
    process.env.RAW_VIDEO_RETENTION_DAYS,
    defaultRawVideoRetentionDays
  );
  const rawVideoRetentionMs = rawVideoRetentionDays * 24 * 60 * 60 * 1000;
  const nowMs = Date.now();
  const sessions = await repository.list();
  const retainedCandidates = sessions.filter(hasRetainedRawVideo);
  const keptSessionIds = new Set(
    retainedCandidates
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, maxRetainedRawVideos)
      .map((session) => session.id)
  );

  for (const session of sessions) {
    if (
      !shouldRetireVideo({
        session,
        keptSessionIds,
        nowMs,
        rawVideoRetentionMs
      })
    ) {
      continue;
    }

    await deleteStoredUpload(session.file);

    await repository.save({
      ...session,
      updatedAt: new Date().toISOString(),
      file: {
        ...session.file,
        absolutePath: '',
        storageKey: null,
        publicUrl: null,
        videoStatus: 'retired',
        retiredAt: new Date().toISOString()
      }
    });
  }
}
