import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { deleteStoredArtifacts } from '@/lib/storage/artifacts';
import { ensureLocalStorage } from '@/lib/storage/local/upload-storage';
import {
  createSessionRecordFromUpload,
  normalizeSessionRecord,
  toUploadedSwingSession
} from '@/lib/storage/session-record';
import type { SessionRepository, StoredUpload } from '@/lib/storage/contracts';
import { deleteStoredUpload } from '@/lib/storage/uploads';
import type { SwingSessionRecord } from '@/types/session';

const sessionsRoot = path.join(process.cwd(), 'data', 'sessions');

function sessionPath(sessionId: string) {
  return path.join(sessionsRoot, `${sessionId}.json`);
}

function compareByCreatedAtDesc(left: SwingSessionRecord, right: SwingSessionRecord) {
  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

export const localSessionRepository: SessionRepository = {
  async createFromUpload(upload: StoredUpload): Promise<SwingSessionRecord> {
    await ensureLocalStorage();

    const session = createSessionRecordFromUpload(upload);

    await this.save(session);
    return session;
  },

  async save(session) {
    await ensureLocalStorage();
    await writeFile(sessionPath(session.id), JSON.stringify(session, null, 2), 'utf8');
  },

  async getById(sessionId) {
    try {
      const data = await readFile(sessionPath(sessionId), 'utf8');
      return normalizeSessionRecord(JSON.parse(data) as SwingSessionRecord);
    } catch {
      return null;
    }
  },

  async list() {
    await ensureLocalStorage();
    const entries = await readdir(sessionsRoot, { withFileTypes: true });
    const sessions = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map(async (entry) => {
          const data = await readFile(path.join(sessionsRoot, entry.name), 'utf8');
          return normalizeSessionRecord(JSON.parse(data) as SwingSessionRecord);
        })
    );

    return sessions.sort(compareByCreatedAtDesc);
  },

  async deleteById(sessionId) {
    const session = await this.getById(sessionId);

    if (!session) {
      return false;
    }

    await Promise.allSettled([
      deleteStoredUpload(session.file),
      deleteStoredArtifacts(sessionId, session.pipeline.mediaArtifacts),
      rm(sessionPath(sessionId), { force: true })
    ]);

    return true;
  },

  async deleteAll() {
    const sessions = await this.list();
    await Promise.all(sessions.map((session) => this.deleteById(session.id)));
  },

  toUploadedSession(session) {
    return toUploadedSwingSession(session);
  }
};
