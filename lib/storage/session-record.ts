import type { StoredUpload } from '@/lib/storage/contracts';
import type { SwingAnalysisResponse } from '@/types/analysis';
import type { SwingSessionRecord, UploadedSwingSession } from '@/types/session';

function createFallbackPhaseScores(analysis: Partial<SwingAnalysisResponse>): SwingAnalysisResponse['phaseScores'] {
  const observations = analysis.phaseObservations;

  return {
    address: {
      score: 6,
      reason: observations?.address || 'Address quality looks serviceable based on the saved session data.'
    },
    backswing: {
      score: 6,
      reason: observations?.backswing || 'Backswing quality looks serviceable based on the saved session data.'
    },
    top: {
      score: 6,
      reason: observations?.top || 'Top-of-swing quality looks serviceable based on the saved session data.'
    },
    transition: {
      score: 6,
      reason: observations?.transition || 'Transition quality looks serviceable based on the saved session data.'
    },
    impact: {
      score: 6,
      reason: observations?.impact || 'Impact quality looks serviceable based on the saved session data.'
    },
    finish: {
      score: 6,
      reason: observations?.finish || 'Finish quality looks serviceable based on the saved session data.'
    }
  };
}

function normalizeAnalysisResponse(analysis: SwingSessionRecord['analysis']): SwingSessionRecord['analysis'] {
  if (!analysis) {
    return null;
  }

  return {
    ...analysis,
    issueTaxonomy: analysis.issueTaxonomy || [],
    phaseScores: analysis.phaseScores || createFallbackPhaseScores(analysis)
  };
}

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
    },
    analysis: normalizeAnalysisResponse(record.analysis),
    file: {
      ...record.file,
      storageKey: record.file.storageKey || null,
      publicUrl: record.file.publicUrl || null,
      videoStatus: record.file.videoStatus || 'available',
      retiredAt: record.file.retiredAt || null
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
      sizeBytes: upload.sizeBytes,
      storageKey: upload.storageKey || null,
      publicUrl: upload.publicUrl || null,
      videoStatus: 'available',
      retiredAt: null
    }
  };
}
