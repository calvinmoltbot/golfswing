import type { SessionRepository, StoredUpload } from '@/lib/storage/contracts';
import { localSessionRepository } from '@/lib/storage/local/session-repository';
import { neonSessionRepository } from '@/lib/storage/neon/session-repository';
import { applyVideoRetentionPolicies } from '@/lib/storage/retention';
import type { SwingSessionRecord, UploadedSwingSession } from '@/types/session';

let retentionRun: Promise<void> | null = null;

function resolveSessionRepository(): SessionRepository {
  const provider = process.env.SESSION_REPOSITORY_PROVIDER || 'local';

  switch (provider) {
    case 'local':
      return localSessionRepository;
    case 'neon':
      return neonSessionRepository;
    default:
      throw new Error(`Unsupported session repository provider: ${provider}`);
  }
}

export function toUploadedSwingSession(session: SwingSessionRecord): UploadedSwingSession {
  return resolveSessionRepository().toUploadedSession(session);
}

async function ensureRetentionPolicies() {
  if (!retentionRun) {
    retentionRun = applyVideoRetentionPolicies(resolveSessionRepository()).finally(() => {
      retentionRun = null;
    });
  }

  await retentionRun;
}

export async function createUploadedSession(upload: StoredUpload): Promise<SwingSessionRecord> {
  const session = await resolveSessionRepository().createFromUpload(upload);
  await ensureRetentionPolicies();
  return session;
}

export async function writeSession(session: SwingSessionRecord) {
  return resolveSessionRepository().save(session);
}

export async function readSession(sessionId: string): Promise<SwingSessionRecord | null> {
  await ensureRetentionPolicies();
  return resolveSessionRepository().getById(sessionId);
}

export async function listSessions(): Promise<SwingSessionRecord[]> {
  await ensureRetentionPolicies();
  return resolveSessionRepository().list();
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  return resolveSessionRepository().deleteById(sessionId);
}

export async function deleteAllSessions() {
  return resolveSessionRepository().deleteAll();
}
