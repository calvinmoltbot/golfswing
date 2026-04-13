import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const dataRoot = path.join(process.cwd(), 'data');
const uploadsRoot = path.join(dataRoot, 'uploads');
const sessionsRoot = path.join(dataRoot, 'sessions');

export type StoredUpload = {
  sessionId: string;
  absolutePath: string;
  storedName: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export async function ensureLocalStorage() {
  await Promise.all([
    mkdir(dataRoot, { recursive: true }),
    mkdir(uploadsRoot, { recursive: true }),
    mkdir(sessionsRoot, { recursive: true })
  ]);
}

export async function persistUpload(file: File): Promise<StoredUpload> {
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
    createdAt
  };
}
