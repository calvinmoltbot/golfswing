import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { ensureLocalStorage, localUploadStorage } from '@/lib/storage/local/upload-storage';
import type { SessionRepository, StoredUpload } from '@/lib/storage/contracts';
import type { SwingSessionRecord, UploadedSwingSession } from '@/types/session';

const sessionsRoot = path.join(process.cwd(), 'data', 'sessions');

function sessionPath(sessionId: string) {
  return path.join(sessionsRoot, `${sessionId}.json`);
}

function normalizeSessionRecord(record: SwingSessionRecord): SwingSessionRecord {
  return {
    ...record,
    reportMode: record.reportMode || 'concise',
    playerGoal: record.playerGoal || '',
    usualMiss: record.usualMiss || '',
    shotShape: record.shotShape || '',
    skillBand: record.skillBand || 'intermediate',
    pipeline: {
      currentStage:
        record.pipeline?.currentStage ||
        (record.status === 'complete' ? 'complete' : record.status === 'failed' ? 'failed' : 'uploaded'),
      failedStage: record.pipeline?.failedStage || null,
      poseEstimation: record.pipeline?.poseEstimation || null,
      phases: record.pipeline?.phases || null,
      mediaArtifacts: record.pipeline?.mediaArtifacts || null,
      coachingAnalysis: record.pipeline?.coachingAnalysis || null
    }
  };
}

function toUploadedSwingSession(session: SwingSessionRecord): UploadedSwingSession {
  return {
    id: session.id,
    createdAt: session.createdAt,
    fileName: session.file.originalName,
    mimeType: session.file.mimeType,
    sizeBytes: session.file.sizeBytes,
    status: session.status
  };
}

export const localSessionRepository: SessionRepository = {
  async createFromUpload(upload: StoredUpload): Promise<SwingSessionRecord> {
    await ensureLocalStorage();

    const session: SwingSessionRecord = {
      id: upload.sessionId,
      createdAt: upload.createdAt,
      updatedAt: upload.createdAt,
      status: 'uploaded',
      notes: '',
      playerContext: null,
      reportMode: 'concise',
      playerGoal: '',
      usualMiss: '',
      shotShape: '',
      skillBand: 'intermediate',
      pipeline: {
        currentStage: 'uploaded',
        failedStage: null,
        poseEstimation: null,
        phases: null,
        mediaArtifacts: null,
        coachingAnalysis: null
      },
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

    return sessions.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  },

  async deleteById(sessionId) {
    const session = await this.getById(sessionId);

    if (!session) {
      return false;
    }

    await Promise.allSettled([
      localUploadStorage.delete({ absolutePath: session.file.absolutePath }),
      rm(path.join(process.cwd(), 'data', 'artifacts', sessionId), { recursive: true, force: true }),
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
