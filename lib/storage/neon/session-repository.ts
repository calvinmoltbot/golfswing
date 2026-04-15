import {
  createSessionRecordFromUpload,
  normalizeSessionRecord,
  toUploadedSwingSession
} from '@/lib/storage/session-record';
import { deleteStoredArtifacts } from '@/lib/storage/artifacts';
import type { SessionRepository, StoredUpload } from '@/lib/storage/contracts';
import { deleteStoredUpload } from '@/lib/storage/uploads';
import { getNeonSql } from '@/lib/storage/neon/client';
import type { SwingSessionRecord } from '@/types/session';

type SessionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: SwingSessionRecord['status'];
  notes: string;
  player_context: unknown;
  report_mode: SwingSessionRecord['reportMode'];
  player_goal: string;
  usual_miss: string;
  shot_shape: string;
  skill_band: SwingSessionRecord['skillBand'];
  pipeline: unknown;
  analysis: unknown;
  error: string | null;
  file: unknown;
};

function parseJsonField<T>(value: unknown): T {
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }

  return value as T;
}

function mapRowToSession(row: SessionRow): SwingSessionRecord {
  return normalizeSessionRecord({
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    notes: row.notes,
    playerContext: row.player_context ? parseJsonField(row.player_context) : null,
    reportMode: row.report_mode,
    playerGoal: row.player_goal,
    usualMiss: row.usual_miss,
    shotShape: row.shot_shape,
    skillBand: row.skill_band,
    pipeline: parseJsonField(row.pipeline),
    analysis: row.analysis ? parseJsonField(row.analysis) : null,
    error: row.error,
    file: parseJsonField(row.file)
  });
}

async function querySessions(strings: TemplateStringsArray, ...values: unknown[]): Promise<SessionRow[]> {
  const sql = getNeonSql();
  const rows = await sql(strings, ...values);
  return rows as SessionRow[];
}

export const neonSessionRepository: SessionRepository = {
  async createFromUpload(upload: StoredUpload) {
    const session = createSessionRecordFromUpload(upload);
    await this.save(session);
    return session;
  },

  async save(session) {
    await querySessions`
      INSERT INTO swing_sessions (
        id,
        created_at,
        updated_at,
        status,
        notes,
        player_context,
        report_mode,
        player_goal,
        usual_miss,
        shot_shape,
        skill_band,
        pipeline,
        analysis,
        error,
        file
      )
      VALUES (
        ${session.id},
        ${session.createdAt}::timestamptz,
        ${session.updatedAt}::timestamptz,
        ${session.status},
        ${session.notes},
        ${JSON.stringify(session.playerContext)}::jsonb,
        ${session.reportMode},
        ${session.playerGoal},
        ${session.usualMiss},
        ${session.shotShape},
        ${session.skillBand},
        ${JSON.stringify(session.pipeline)}::jsonb,
        ${JSON.stringify(session.analysis)}::jsonb,
        ${session.error},
        ${JSON.stringify(session.file)}::jsonb
      )
      ON CONFLICT (id)
      DO UPDATE SET
        updated_at = EXCLUDED.updated_at,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        player_context = EXCLUDED.player_context,
        report_mode = EXCLUDED.report_mode,
        player_goal = EXCLUDED.player_goal,
        usual_miss = EXCLUDED.usual_miss,
        shot_shape = EXCLUDED.shot_shape,
        skill_band = EXCLUDED.skill_band,
        pipeline = EXCLUDED.pipeline,
        analysis = EXCLUDED.analysis,
        error = EXCLUDED.error,
        file = EXCLUDED.file
    `;
  },

  async getById(sessionId) {
    const rows = await querySessions`
      SELECT *
      FROM swing_sessions
      WHERE id = ${sessionId}
      LIMIT 1
    `;

    if (!rows[0]) {
      return null;
    }

    return mapRowToSession(rows[0]);
  },

  async list() {
    const rows = await querySessions`
      SELECT *
      FROM swing_sessions
      ORDER BY created_at DESC
    `;

    return rows.map(mapRowToSession);
  },

  async deleteById(sessionId) {
    const session = await this.getById(sessionId);

    if (!session) {
      return false;
    }

    await querySessions`
      DELETE FROM swing_sessions
      WHERE id = ${sessionId}
    `;

    await Promise.allSettled([
      deleteStoredUpload(session.file),
      deleteStoredArtifacts(sessionId, session.pipeline.mediaArtifacts)
    ]);

    return true;
  },

  async deleteAll() {
    const sessions = await this.list();
    await querySessions`
      DELETE FROM swing_sessions
    `;

    await Promise.allSettled(
      sessions.flatMap((session) => [
        deleteStoredUpload(session.file),
        deleteStoredArtifacts(session.id, session.pipeline.mediaArtifacts)
      ])
    );
  },

  toUploadedSession(session) {
    return toUploadedSwingSession(session);
  }
};
