import type { SwingSessionRecord, UploadedSwingSession } from '@/types/session';

export type StoredUpload = {
  sessionId: string;
  absolutePath: string;
  storedName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type UploadStorage = {
  persist(file: File): Promise<StoredUpload>;
  delete(upload: { absolutePath: string }): Promise<void>;
  ensure(): Promise<void>;
};

export type SessionRepository = {
  createFromUpload(upload: StoredUpload): Promise<SwingSessionRecord>;
  save(session: SwingSessionRecord): Promise<void>;
  getById(sessionId: string): Promise<SwingSessionRecord | null>;
  list(): Promise<SwingSessionRecord[]>;
  deleteById(sessionId: string): Promise<boolean>;
  deleteAll(): Promise<void>;
  toUploadedSession(session: SwingSessionRecord): UploadedSwingSession;
};
