import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { StoredUpload, UploadStorage } from '@/lib/storage/contracts';

const dataRoot = path.join(process.cwd(), 'data');
const uploadsRoot = path.join(dataRoot, 'uploads');
const sessionsRoot = path.join(dataRoot, 'sessions');
const artifactsRoot = path.join(dataRoot, 'artifacts');

export async function ensureLocalStorage() {
  await Promise.all([
    mkdir(dataRoot, { recursive: true }),
    mkdir(uploadsRoot, { recursive: true }),
    mkdir(sessionsRoot, { recursive: true }),
    mkdir(artifactsRoot, { recursive: true })
  ]);
}

export const localUploadStorage: UploadStorage = {
  async ensure() {
    await ensureLocalStorage();
  },

  async persist(file: File): Promise<StoredUpload> {
    await ensureLocalStorage();

    const sessionId = randomUUID();
    const extension = path.extname(file.name) || '.mp4';
    const storedName = `${sessionId}${extension.toLowerCase()}`;
    const absolutePath = path.join(uploadsRoot, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    const createdAt = new Date().toISOString();

    await writeFile(absolutePath, buffer);

    return {
      sessionId,
      absolutePath,
      storedName,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: buffer.byteLength,
      createdAt,
      storageKey: null,
      publicUrl: null
    };
  },

  async delete(upload) {
    if (!upload.absolutePath) {
      return;
    }

    await rm(upload.absolutePath, { force: true });
  },

  async prepareForProcessing(upload) {
    return upload.absolutePath;
  }
};
