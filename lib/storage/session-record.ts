import type { StoredUpload } from '@/lib/storage/contracts';
import type { SwingSessionRecord, UploadedSwingSession } from '@/types/session';

export function normalizeSessionRecord(record: SwingSessionRecord): SwingSessionRecord {
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

export function createSessionRecordFromUpload(upload: StoredUpload): SwingSessionRecord {
  return {
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
}
