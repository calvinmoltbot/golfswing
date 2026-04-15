import type { SwingSessionRecord, UploadedSwingSession } from '@/types/session';
import type { MediaArtifact, MediaArtifactResult } from '@/types/media-artifacts';

export type StoredUpload = {
  sessionId: string;
  absolutePath: string;
  storedName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  storageKey?: string | null;
  publicUrl?: string | null;
};

export type StoredUploadRef = Pick<
  StoredUpload,
  'absolutePath' | 'storedName' | 'originalName' | 'mimeType' | 'sizeBytes' | 'storageKey' | 'publicUrl'
>;

export type UploadStorage = {
  persist(file: File): Promise<StoredUpload>;
  prepareForProcessing(upload: StoredUploadRef): Promise<string>;
  delete(upload: StoredUploadRef): Promise<void>;
  ensure(): Promise<void>;
};

export type GeneratedArtifactInput = {
  type: MediaArtifact['type'];
  label?: MediaArtifact['label'];
  fileName: string;
  sourcePath: string;
  contentType: string;
};

export type ArtifactStorage = {
  ensure(): Promise<void>;
  persistSessionArtifacts(input: {
    sessionId: string;
    artifacts: GeneratedArtifactInput[];
  }): Promise<MediaArtifact[]>;
  readArtifact(artifact: MediaArtifact): Promise<Buffer>;
  deleteSessionArtifacts(sessionId: string, artifacts?: MediaArtifactResult | null): Promise<void>;
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
