import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureLocalStorage, type StoredUpload } from '@/lib/storage/uploads';
import type { SwingSessionRecord, UploadedSwingSession } from '@/types/session';

const sessionsRoot = path.join(process.cwd(), 'data', 'sessions');

function sessionPath(sessionId: string) {
  return path.join(sessionsRoot, `${sessionId}.json`);
}

export function toUploadedSwingSession(session: SwingSessionRecord): UploadedSwingSession {
  return {
    id: session.id,
    createdAt: session.createdAt,
    fileName: session.file.originalName,
    mimeType: session.file.mimeType,
    sizeBytes: session.file.sizeBytes,
    status: session.status
  };
}

export async function createUploadedSession(upload: StoredUpload): Promise<SwingSessionRecord> {
  await ensureLocalStorage();

  const session: SwingSessionRecord = {
    id: upload.sessionId,
    createdAt: upload.createdAt,
    updatedAt: upload.createdAt,
    status: 'uploaded',
    notes: '',
    playerContext: null,
    analysis: null,
    error: null,
    file: {
      absolutePath: upload.absolutePath,
      storedName: upload.storedName,
      originalName: upload.originalName,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes
    }
  };

  await writeSession(session);

  return session;
}

export async function writeSession(session: SwingSessionRecord) {
  await ensureLocalStorage();
  await writeFile(sessionPath(session.id), JSON.stringify(session, null, 2), 'utf8');
}

export async function readSession(sessionId: string): Promise<SwingSessionRecord | null> {
  try {
    const data = await readFile(sessionPath(sessionId), 'utf8');
    return JSON.parse(data) as SwingSessionRecord;
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<SwingSessionRecord[]> {
  await ensureLocalStorage();
  const entries = await readdir(sessionsRoot, { withFileTypes: true });
  const sessions = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map(async (entry) => {
        const data = await readFile(path.join(sessionsRoot, entry.name), 'utf8');
        return JSON.parse(data) as SwingSessionRecord;
      })
  );

  return sessions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}
